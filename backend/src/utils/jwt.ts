import * as jwt from 'jsonwebtoken';
import { prisma } from './prisma';

// Enhanced JWT payload with multi-tier support
export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  userType: 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZATION' | 'USER';
  organizationId?: string;
  permissions?: string[];
  hierarchy?: number;
}

// Token pair interface
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Role hierarchy for access control
export const ROLE_HIERARCHY = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  ORGANIZATION: 2,
  DRIVER: 1,
  PASSENGER: 1
} as const;

// Token expiration times per user type
const TOKEN_EXPIRATION = {
  SUPER_ADMIN: { access: '30m', refresh: '7d' },
  ADMIN: { access: '1h', refresh: '7d' },
  ORGANIZATION: { access: '2h', refresh: '14d' },
  USER: { access: '4h', refresh: '30d' }
} as const;

/**
 * Generate access and refresh tokens with enhanced payload
 */
export const generateTokens = (payload: JWTPayload): TokenPair => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtSecret || !jwtRefreshSecret) {
    throw new Error('JWT secrets not configured');
  }

  // Enhance payload with hierarchy and permissions
  const enhancedPayload: JWTPayload = {
    ...payload,
    userType: payload.userType,
    organizationId: payload.organizationId,
    hierarchy: ROLE_HIERARCHY[payload.role as keyof typeof ROLE_HIERARCHY] || ROLE_HIERARCHY.PASSENGER,
    permissions: getPermissionsForRole(payload.role, payload.userType)
  };

  // Get expiration times based on user type
  const expiration = TOKEN_EXPIRATION[payload.userType] || TOKEN_EXPIRATION.USER;

  const accessToken = jwt.sign(enhancedPayload, jwtSecret, {
    expiresIn: expiration.access
  });

  const refreshToken = jwt.sign(
    { 
      id: payload.id, 
      userType: payload.userType,
      organizationId: payload.organizationId 
    }, 
    jwtRefreshSecret, 
    {
      expiresIn: expiration.refresh
    }
  );

  return { accessToken, refreshToken };
};

/**
 * Verify access token and return decoded payload
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT secret not configured');
  }
  
  try {
    return jwt.verify(token, jwtSecret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify refresh token and return decoded payload
 */
export const verifyRefreshToken = (token: string): { id: string; userType: string; organizationId?: string } => {
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!jwtRefreshSecret) {
    throw new Error('JWT refresh secret not configured');
  }
  
  try {
    return jwt.verify(token, jwtRefreshSecret) as { id: string; userType: string; organizationId?: string };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Refresh tokens using a valid refresh token
 */
export const refreshTokens = async (refreshToken: string): Promise<TokenPair> => {
  try {
    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Fetch user data from appropriate table based on userType
    const userData = await getUserDataByType(decoded.id, decoded.userType);
    
    if (!userData) {
      throw new Error('User not found or inactive');
    }

    // Verify the refresh token matches the stored one
    if (userData.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Generate new tokens
    const newTokens = generateTokens({
      id: userData.id,
      email: userData.email,
      role: userData.role,
      userType: decoded.userType as 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZATION' | 'USER',
      organizationId: decoded.organizationId
    });

    // Update the refresh token in the database
    await updateRefreshToken(decoded.id, decoded.userType, newTokens.refreshToken);

    return newTokens;
  } catch (error) {
    throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Validate token and verify user type matches expected type
 */
export const validateTokenWithUserType = async (
  token: string, 
  expectedUserType?: string
): Promise<JWTPayload> => {
  try {
    const decoded = verifyAccessToken(token);
    
    // Verify user type if specified
    if (expectedUserType && decoded.userType !== expectedUserType) {
      throw new Error(`Invalid user type. Expected: ${expectedUserType}, Got: ${decoded.userType}`);
    }

    // Verify user still exists and is active
    const userData = await getUserDataByType(decoded.id, decoded.userType);
    if (!userData || !userData.isActive) {
      throw new Error('User not found or inactive');
    }

    return decoded;
  } catch (error) {
    throw new Error(`Token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Revoke refresh token for a user
 */
export const revokeRefreshToken = async (userId: string, userType: string): Promise<void> => {
  await updateRefreshToken(userId, userType, null);
};

/**
 * Get user data from appropriate table based on user type
 */
async function getUserDataByType(id: string, userType: string) {
  switch (userType) {
    case 'SUPER_ADMIN':
      return await prisma.superAdmin.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          refreshToken: true
        }
      }).then(user => user ? { ...user, role: 'SUPER_ADMIN' } : null);

    case 'ADMIN':
      return await prisma.admin.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          refreshToken: true
        }
      }).then(user => user ? { ...user, role: 'ADMIN' } : null);

    case 'ORGANIZATION':
      return await prisma.organization.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          refreshToken: true
        }
      }).then(user => user ? { ...user, role: 'ORGANIZATION' } : null);

    case 'USER':
      return await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          refreshToken: true,
          organizationId: true
        }
      });

    default:
      return null;
  }
}

/**
 * Update refresh token in appropriate table
 */
async function updateRefreshToken(id: string, userType: string, refreshToken: string | null): Promise<void> {
  const updateData = { refreshToken };

  switch (userType) {
    case 'SUPER_ADMIN':
      await prisma.superAdmin.update({
        where: { id },
        data: updateData
      });
      break;

    case 'ADMIN':
      await prisma.admin.update({
        where: { id },
        data: updateData
      });
      break;

    case 'ORGANIZATION':
      await prisma.organization.update({
        where: { id },
        data: updateData
      });
      break;

    case 'USER':
      await prisma.user.update({
        where: { id },
        data: updateData
      });
      break;

    default:
      throw new Error(`Invalid user type: ${userType}`);
  }
}

/**
 * Get permissions array based on role and user type
 */
function getPermissionsForRole(role: string, userType: string): string[] {
  const permissions: string[] = [];

  switch (userType) {
    case 'SUPER_ADMIN':
      permissions.push('*'); // All permissions
      break;

    case 'ADMIN':
      permissions.push(
        'organizations:read',
        'organizations:write',
        'users:read',
        'users:write',
        'routes:read',
        'routes:write',
        'vehicles:read',
        'vehicles:write'
      );
      break;

    case 'ORGANIZATION':
      permissions.push(
        'drivers:read',
        'drivers:write',
        'vehicles:read',
        'vehicles:write',
        'routes:read',
        'trips:read',
        'organization:read',
        'organization:write'
      );
      break;

    case 'USER':
      if (role === 'DRIVER') {
        permissions.push(
          'profile:read',
          'profile:write',
          'vehicle:read',
          'routes:read',
          'trips:read',
          'trips:write'
        );
      } else if (role === 'PASSENGER') {
        permissions.push(
          'profile:read',
          'profile:write',
          'trips:read',
          'trips:write',
          'routes:read',
          'discounts:read',
          'discounts:write'
        );
      }
      break;
  }

  return permissions;
}