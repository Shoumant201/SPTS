# Implementation Plan

- [x] 1. Update database schema with new authentication tables
  - Create SuperAdmin, Admin models in Prisma schema
  - Update Organization model to include authentication fields and hierarchy
  - Update User model to remove admin/organization roles and add organization relationship
  - Add necessary indexes and constraints for security
  - _Requirements: 7.1, 7.2, 7.6_

- [x] 2. Create database migration and seed scripts
  - Write Prisma migration for new schema structure
  - Create seed script to migrate existing users to appropriate tables
  - Implement data validation during migration process
  - _Requirements: 7.1, 7.2_

- [x] 3. Implement core authentication service layer
  - [x] 3.1 Create AuthService interface and base implementation
    - Define AuthService interface with methods for each user type
    - Implement base authentication logic with password validation
    - Create token payload structure and generation logic
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

  - [x] 3.2 Implement user type-specific authentication methods
    - Create authenticateSuperAdmin method with SuperAdmin table queries
    - Create authenticateAdmin method with Admin table queries
    - Create authenticateOrganization method with Organization table queries
    - Create authenticateUser method for drivers and passengers
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [x] 4. Update JWT token service for multi-tier support
  - Modify token payload to include userType and organizationId
  - Update token generation to include role hierarchy information
  - Implement token validation with user type verification
  - Add refresh token logic for each authentication table
  - _Requirements: 6.2, 10.2_

- [x] 5. Create enhanced authentication middleware
  - [x] 5.1 Update base authentication middleware
    - Modify authenticate middleware to determine user type from token
    - Query appropriate authentication table based on user type
    - Update AuthRequest interface to include userType
    - _Requirements: 6.1, 6.3_

  - [x] 5.2 Implement hierarchical authorization middleware
    - Create authorizeRole middleware with role hierarchy support
    - Implement authorizeOrganization middleware for boundary enforcement
    - Create authorizeContext middleware for web vs mobile validation
    - _Requirements: 6.1, 6.2, 6.3, 8.1, 9.3_

- [x] 6. Update authentication controllers
  - [x] 6.1 Create SuperAdminAuthController
    - Implement login method for super admin authentication
    - Add profile management and password change functionality
    - Create admin account creation endpoints
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 6.2 Create AdminAuthController
    - Implement login method for admin authentication
    - Add organization creation and management endpoints
    - Implement admin dashboard data retrieval
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 6.3 Create OrganizationAuthController
    - Implement login method for organization authentication
    - Add fleet and driver management endpoints
    - Implement organization dashboard data with boundary enforcement
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 6.4 Update UserAuthController for drivers and passengers
    - Modify existing login to work with updated User table
    - Add role-based validation for driver vs passenger access
    - Implement mobile app context validation
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2_

- [x] 7. Implement authentication routing and context determination
  - Create unified auth router with context-aware routing
  - Implement determineAuthContext middleware for login requests
  - Add separate endpoints for web dashboard vs mobile app authentication
  - Update existing routes to use new authentication structure
  - _Requirements: 8.1, 8.2, 9.1, 9.2_

- [x] 8. Update access control and authorization logic
  - [x] 8.1 Implement access control matrix
    - Create ACCESS_CONTROL_MATRIX configuration
    - Implement permission checking logic based on user type and role
    - Add organization boundary validation for applicable user types
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 8.2 Update existing protected routes
    - Apply new authorization middleware to all protected endpoints
    - Update organization-specific routes with boundary enforcement
    - Modify admin routes to use hierarchical access control
    - _Requirements: 6.4, 8.3, 8.4, 8.5_

- [x] 9. Implement error handling and security measures
  - Create AuthErrorType enum and error response structure
  - Implement security logging for authentication attempts
  - Add rate limiting per user type
  - Implement account lockout policies for each authentication table
  - _Requirements: 10.1, 10.3, 10.4, 10.5_

- [x] 10. Update client-side authentication integration
  - [x] 10.1 Update web dashboard authentication
    - Modify login forms to work with new authentication endpoints
    - Update token storage and management for different user types
    - Implement role-based UI rendering for dashboard components
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

  - [x] 10.2 Update mobile app authentication services
    - Update driver app authentication to use new User table structure
    - Update passenger app authentication with role validation
    - Implement proper error handling for mobile authentication flows
    - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [x] 11. Create comprehensive test suite
  - [x] 11.1 Write unit tests for authentication services
    - Test each authentication method with valid and invalid credentials
    - Test token generation and validation for all user types
    - Test role hierarchy and permission checking logic
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

  - [x] 11.2 Write integration tests for authentication flows
    - Test end-to-end authentication for each user type
    - Test cross-tier access control and boundary enforcement
    - Test token refresh and revocation flows
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [x] 11.3 Write security tests
    - Test brute force protection and rate limiting
    - Test privilege escalation prevention
    - Test organization data isolation
    - _Requirements: 10.1, 10.4, 10.5_

- [x] 12. Implement data migration and deployment scripts
  - Create production-safe migration scripts for existing data
  - Implement rollback procedures for failed migrations
  - Create deployment scripts with zero-downtime migration strategy
  - Add data validation scripts to verify migration integrity
  - _Requirements: 7.1, 7.2, 7.5, 7.6_