# Multi-Tier Authentication & Authorization System

## Introduction

This specification defines a comprehensive multi-tier authentication and authorization system for the Smart Public Transport Management (SPTM) platform. The system separates different user types into distinct authentication flows and access levels, ensuring proper security boundaries and role-based access control.

The current single-table User model needs to be restructured into separate authentication entities for different user types: Super Admins, Admins, Organizations, Drivers, and Passengers. Each tier has specific responsibilities and access levels within the system.

## Requirements

### Requirement 1: Super Admin Authentication & Management

**User Story:** As a Super Admin, I want to have the highest level of system access so that I can manage all aspects of the SPTM platform including creating and managing admin accounts.

#### Acceptance Criteria

1. WHEN a Super Admin logs in THEN the system SHALL authenticate them against a separate SuperAdmin table
2. WHEN a Super Admin is authenticated THEN the system SHALL provide access to all system functionalities
3. WHEN a Super Admin creates an Admin account THEN the system SHALL store admin credentials in a separate Admin table
4. WHEN a Super Admin views the dashboard THEN the system SHALL display global system metrics, all organizations, and all admin accounts
5. IF a Super Admin attempts to access any resource THEN the system SHALL grant access without organization-level restrictions

### Requirement 2: Admin Authentication & Organization Management

**User Story:** As an Admin, I want to authenticate with admin-specific credentials so that I can manage organizations and their operations within my assigned scope.

#### Acceptance Criteria

1. WHEN an Admin logs in THEN the system SHALL authenticate them against the Admin table
2. WHEN an Admin is authenticated THEN the system SHALL provide access to organization management features
3. WHEN an Admin creates an Organization account THEN the system SHALL store organization credentials in the Organization table
4. WHEN an Admin views the dashboard THEN the system SHALL display organization metrics, route management, and fleet oversight
5. IF an Admin attempts to access Super Admin functions THEN the system SHALL deny access with appropriate error message

### Requirement 3: Organization Authentication & Fleet Management

**User Story:** As an Organization, I want to authenticate with organization-specific credentials so that I can manage my fleet, drivers, and routes effectively.

#### Acceptance Criteria

1. WHEN an Organization logs in THEN the system SHALL authenticate them against the Organization table
2. WHEN an Organization is authenticated THEN the system SHALL provide access only to their own fleet and driver data
3. WHEN an Organization views the dashboard THEN the system SHALL display their fleet status, driver management, route performance, and earnings
4. WHEN an Organization manages drivers THEN the system SHALL only show drivers assigned to their organization
5. IF an Organization attempts to access other organizations' data THEN the system SHALL deny access with organization boundary enforcement

### Requirement 4: Driver Authentication & Mobile Access

**User Story:** As a Driver, I want to authenticate through the mobile driver app so that I can access my assigned routes and vehicle information.

#### Acceptance Criteria

1. WHEN a Driver logs in through the mobile app THEN the system SHALL authenticate them against the User table with role DRIVER
2. WHEN a Driver is authenticated THEN the system SHALL provide access only to their assigned vehicle and routes
3. WHEN a Driver views their dashboard THEN the system SHALL display their current assignments, earnings, and schedule
4. WHEN a Driver updates their status THEN the system SHALL notify their assigned organization
5. IF a Driver attempts to access admin functions THEN the system SHALL deny access with role-based restrictions

### Requirement 5: Passenger Authentication & Service Access

**User Story:** As a Passenger, I want to authenticate through the mobile passenger app so that I can book trips and manage my discount profile.

#### Acceptance Criteria

1. WHEN a Passenger logs in through the mobile app THEN the system SHALL authenticate them against the User table with role PASSENGER
2. WHEN a Passenger is authenticated THEN the system SHALL provide access to trip booking and discount management
3. WHEN a Passenger views their profile THEN the system SHALL display their trip history, discount status, and account information
4. WHEN a Passenger applies for discounts THEN the system SHALL create verification requests for admin approval
5. IF a Passenger attempts to access driver or admin functions THEN the system SHALL deny access with appropriate restrictions

### Requirement 6: Hierarchical Access Control

**User Story:** As a system architect, I want to implement proper access control hierarchy so that each user type can only access appropriate system resources.

#### Acceptance Criteria

1. WHEN any user authenticates THEN the system SHALL determine their access level based on their authentication table and role
2. WHEN access control is enforced THEN the system SHALL follow the hierarchy: SuperAdmin > Admin > Organization > Driver/Passenger
3. WHEN a user attempts to access resources THEN the system SHALL validate permissions based on their tier and organizational boundaries
4. WHEN organization-level data is accessed THEN the system SHALL enforce organization isolation except for higher-tier users
5. IF cross-tier access is attempted THEN the system SHALL log the attempt and deny access with detailed error messages

### Requirement 7: Separate Authentication Tables

**User Story:** As a database architect, I want to separate authentication credentials into appropriate tables so that we maintain proper data isolation and security boundaries.

#### Acceptance Criteria

1. WHEN the system is implemented THEN it SHALL have separate tables: SuperAdmin, Admin, Organization, and User (for drivers/passengers)
2. WHEN credentials are stored THEN each table SHALL have appropriate fields for their specific authentication needs including organization hierarchy relationships
3. WHEN authentication occurs THEN the system SHALL query the correct table based on the login context (web dashboard vs mobile apps)
4. WHEN user data is retrieved THEN the system SHALL join with appropriate related tables while maintaining security boundaries
5. WHEN Organization credentials are created THEN they SHALL be provisioned by Admin users only
6. WHEN Admin credentials are created THEN they SHALL be provisioned by Super Admin users only
7. IF authentication fails THEN the system SHALL not reveal which table was queried to prevent enumeration attacks

### Requirement 8: Web Dashboard Access Control

**User Story:** As a web dashboard user, I want the system to automatically determine my access level so that I see only the appropriate interface and functionality.

#### Acceptance Criteria

1. WHEN a user accesses the web dashboard THEN the system SHALL present appropriate login options based on user type
2. WHEN a SuperAdmin logs in THEN the dashboard SHALL display global management interface
3. WHEN an Admin logs in THEN the dashboard SHALL display organization management interface
4. WHEN an Organization logs in THEN the dashboard SHALL display fleet management interface
5. IF an unauthorized user attempts web dashboard access THEN the system SHALL redirect to appropriate login page

### Requirement 9: Mobile App Role Enforcement

**User Story:** As a mobile app user, I want the system to enforce proper role boundaries so that I can only access features appropriate to my role.

#### Acceptance Criteria

1. WHEN a Driver uses the driver app THEN the system SHALL only allow driver-related functionality
2. WHEN a Passenger uses the passenger app THEN the system SHALL only allow passenger-related functionality
3. WHEN mobile authentication occurs THEN the system SHALL validate the user's role matches the app type
4. WHEN role mismatch is detected THEN the system SHALL deny access and provide appropriate error message
5. IF a user has multiple roles THEN the system SHALL handle authentication based on the app context

### Requirement 10: Credential Management & Security

**User Story:** As a security administrator, I want proper credential management across all user tiers so that the system maintains high security standards.

#### Acceptance Criteria

1. WHEN credentials are created THEN the system SHALL enforce strong password policies for all user types
2. WHEN authentication tokens are issued THEN they SHALL include appropriate role and organization information
3. WHEN password resets are requested THEN the system SHALL use tier-appropriate reset mechanisms
4. WHEN account lockouts occur THEN the system SHALL implement tier-specific lockout policies
5. IF suspicious activity is detected THEN the system SHALL log and alert appropriate administrators based on user tier 