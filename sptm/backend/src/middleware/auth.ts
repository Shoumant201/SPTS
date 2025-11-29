import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';
import { 
  ACCESS_CONTROL_MATRIX, 
  ROLE_HIERARCHY, 
  CONTEXT_ACCESS_CONTROL,
  hasPermission,
  canAccessResource,
  hasOrganizationBoundary,
  getRequiredPermissions,
  canAccessContext
} from '../config/accessControl';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    userType: 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZATION' | 'USER';
    organizationId?: string;
    hierarchy?: number;
    permissions?: string[];
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Verify and decode the token
    const decoded = verifyAccessToken(token);
    
    // Query appropriate authentication table based on user type
    const userData = await getUserDataByType(decoded.id, decoded.userType);
    
    if (!userData) {
      return res.status(401).json({ error: 'Invalid token or user not found.' });
    }
    
    // Check if user is active (all user types have isActive field)
    const isActive = 'isActive' in userData ? userData.isActive : true;
    if (!isActive) {
      return res.status(401).json({ error: 'User account is inactive.' });
    }

    // Get permissions from access control matrix
    const accessConfig = ACCESS_CONTROL_MATRIX[decoded.userType];
    const permissions = accessConfig ? accessConfig.permissions : [];
    
    // Set user data in request with enhanced information
    req.user = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      userType: decoded.userType,
      organizationId: userData.organizationId,
      hierarchy: ROLE_HIERARCHY[userData.role as keyof typeof ROLE_HIERARCHY] || 0,
      permissions: permissions
    };
    
    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid token';
    res.status(401).json({ error: errorMessage });
  }
};

/**
 * Get user data from appropriate table based on user type
 */
async function getUserDataByType(id: string, userType: string) {
  switch (userType) {
    case 'SUPER_ADMIN':
      const superAdmin = await prisma.superAdmin.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true
        }
      });
      return superAdmin ? { ...superAdmin, role: 'SUPER_ADMIN', organizationId: undefined } : null;

    case 'ADMIN':
      const admin = await prisma.admin.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true
        }
      });
      return admin ? { ...admin, role: 'ADMIN', organizationId: undefined } : null;

    case 'ORGANIZATION':
      const organization = await prisma.organization.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true
        }
      });
      return organization ? { ...organization, role: 'ORGANIZATION', organizationId: id } : null;

    case 'USER':
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          organizationId: true
        }
      });
      return user ? { ...user, role: user.role, organizationId: user.organizationId || undefined } : null;

    default:
      return null;
  }
}



/**
 * Hierarchical role authorization middleware
 * Allows access if user's role hierarchy is >= minimum required hierarchy
 */
export const authorizeRole = (minRole: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied. User not authenticated.' });
    }

    const userHierarchy = req.user.hierarchy || ROLE_HIERARCHY[req.user.role as keyof typeof ROLE_HIERARCHY] || 0;
    const minHierarchy = ROLE_HIERARCHY[minRole as keyof typeof ROLE_HIERARCHY] || 0;

    if (userHierarchy < minHierarchy) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        required: minRole,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Organization boundary enforcement middleware
 * Enforces data isolation between organizations using access control matrix
 */
export const authorizeOrganization = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Access denied. User not authenticated.' });
  }

  // Check if user type must respect organization boundaries
  if (!hasOrganizationBoundary(req.user.userType)) {
    return next();
  }

  // Get requested organization ID from various sources
  const requestedOrgId = req.params.organizationId || 
                        req.body.organizationId || 
                        req.query.organizationId as string;
  
  if (req.user.userType === 'ORGANIZATION') {
    // Organization can only access their own data
    if (requestedOrgId && requestedOrgId !== req.user.organizationId) {
      return res.status(403).json({ 
        error: 'Access denied. Organization boundary violation.',
        message: 'Cannot access data from other organizations',
        code: 'ORGANIZATION_BOUNDARY_VIOLATION'
      });
    }
    return next();
  }

  if (req.user.userType === 'USER') {
    // Users (drivers/passengers) can only access data from their organization
    if (requestedOrgId && req.user.organizationId && requestedOrgId !== req.user.organizationId) {
      return res.status(403).json({ 
        error: 'Access denied. Organization boundary violation.',
        message: 'Cannot access data from other organizations',
        code: 'ORGANIZATION_BOUNDARY_VIOLATION'
      });
    }
    return next();
  }

  return res.status(403).json({ error: 'Access denied. Invalid user type.' });
};

/**
 * Context-aware authorization middleware
 * Validates that user type matches the expected application context using access control matrix
 */
export const authorizeContext = (allowedContexts: ('web' | 'mobile-driver' | 'mobile-passenger')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied. User not authenticated.' });
    }

    // Determine context based on user type and role
    let userContext: string;
    
    switch (req.user.userType) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
      case 'ORGANIZATION':
        userContext = 'web';
        break;
      case 'USER':
        if (req.user.role === 'DRIVER') {
          userContext = 'mobile-driver';
        } else if (req.user.role === 'PASSENGER') {
          userContext = 'mobile-passenger';
        } else {
          return res.status(403).json({ 
            error: 'Access denied. Invalid user role.',
            code: 'INVALID_USER_ROLE'
          });
        }
        break;
      default:
        return res.status(403).json({ 
          error: 'Access denied. Invalid user type.',
          code: 'INVALID_USER_TYPE'
        });
    }

    // Validate context using access control matrix
    if (!canAccessContext(req.user.userType, userContext)) {
      return res.status(403).json({ 
        error: 'Access denied. Context mismatch.',
        message: `User type ${req.user.userType} cannot access ${userContext} context`,
        code: 'CONTEXT_MISMATCH'
      });
    }

    if (!allowedContexts.includes(userContext as any)) {
      return res.status(403).json({ 
        error: 'Access denied. Context not allowed.',
        message: `This endpoint is not available for ${userContext} users`,
        allowedContexts,
        userContext,
        code: 'CONTEXT_NOT_ALLOWED'
      });
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 * Checks if user has specific permissions using access control matrix
 */
export const authorizePermission = (requiredPermissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied. User not authenticated.' });
    }

    const userPermissions = req.user.permissions || [];
    
    // Super admin has all permissions
    if (userPermissions.includes('*')) {
      return next();
    }

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(permission => 
      hasPermission(req.user!.userType, permission)
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(permission => 
        !hasPermission(req.user!.userType, permission)
      );
      
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        required: requiredPermissions,
        missing: missingPermissions,
        userType: req.user.userType,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * Resource-based authorization middleware
 * Checks if user can access a specific resource using access control matrix
 */
export const authorizeResource = (resource: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied. User not authenticated.' });
    }

    if (!canAccessResource(req.user.userType, resource)) {
      return res.status(403).json({ 
        error: 'Access denied. Cannot access resource.',
        resource,
        userType: req.user.userType,
        code: 'RESOURCE_ACCESS_DENIED'
      });
    }

    next();
  };
};

/**
 * HTTP method-based authorization middleware
 * Checks permissions based on the HTTP method and resource path
 */
export const authorizeMethod = (resourcePath: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied. User not authenticated.' });
    }

    const method = req.method;
    const requiredPermissions = getRequiredPermissions(resourcePath, method);
    
    if (requiredPermissions.length === 0) {
      // No specific permissions required for this resource/method combination
      return next();
    }

    // Check if user has required permissions
    const hasAllPermissions = requiredPermissions.every(permission => 
      hasPermission(req.user!.userType, permission)
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(permission => 
        !hasPermission(req.user!.userType, permission)
      );
      
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions for this operation.',
        method,
        resource: resourcePath,
        required: requiredPermissions,
        missing: missingPermissions,
        userType: req.user.userType,
        code: 'METHOD_NOT_ALLOWED'
      });
    }

    next();
  };
};

/**
 * Legacy authorize function for backward compatibility
 * @deprecated Use authorizeRole instead
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied. User not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};