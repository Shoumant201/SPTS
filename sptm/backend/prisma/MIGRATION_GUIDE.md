# Multi-Tier Authentication System Migration Guide

This guide provides comprehensive instructions for migrating to the new multi-tier authentication system.

## Overview

The migration transforms the single-table User model into separate authentication entities:
- **SuperAdmin** - System administrators with highest privileges
- **Admin** - Platform administrators who manage organizations
- **Organization** - Transport companies with fleet management capabilities
- **User** - Drivers and passengers with role-based access

## Migration Files

### 1. Database Migration
- **File**: `migrations/20251129074248_multi_tier_auth_system/migration.sql`
- **Purpose**: Creates new database schema with separate authentication tables
- **Generated**: Automatically by Prisma based on schema changes

### 2. Data Seed Script
- **File**: `prisma/seed.ts`
- **Purpose**: Populates database with initial data and sample accounts
- **Features**:
  - Creates default super admin and admin accounts
  - Generates sample organizations and users
  - Sets up discount configurations
  - Includes comprehensive data validation

### 3. Migration Validator
- **File**: `prisma/validate-migration.ts`
- **Purpose**: Validates migration integrity and data quality
- **Checks**:
  - Table structure and data presence
  - Referential integrity between tables
  - Data quality and constraints
  - Authentication credentials validity
  - Discount configuration completeness

## Migration Steps

### Step 1: Run Database Migration
```bash
cd backend
npm run db:migrate
```

This will:
- Create new authentication tables
- Set up proper indexes and constraints
- Establish foreign key relationships

### Step 2: Seed Initial Data
```bash
npm run db:seed
```

This will:
- Create default super admin account
- Create default admin account
- Generate sample organizations
- Create sample drivers and passengers
- Set up discount configurations

### Step 3: Validate Migration
```bash
npm run db:validate
```

This will:
- Verify all tables are properly created
- Check referential integrity
- Validate data quality
- Confirm authentication setup

## Default Accounts Created

After running the seed script, the following accounts will be available:

### Super Admin
- **Email**: `superadmin@sptm.com`
- **Password**: `SuperAdmin123!`
- **Access**: Full system access

### Admin
- **Email**: `admin@sptm.com`
- **Password**: `Admin123!`
- **Access**: Organization management

### Organizations
1. **City Bus Transport**
   - **Email**: `citybus@sptm.com`
   - **Password**: `CityBus123!`
   - **License**: `CBT-2024-001`

2. **Metro Transport Services**
   - **Email**: `metrotrans@sptm.com`
   - **Password**: `MetroTrans123!`
   - **License**: `MTS-2024-002`

### Sample Users
1. **Driver 1**
   - **Email**: `driver1@sptm.com`
   - **Password**: `Driver123!`
   - **Organization**: City Bus Transport

2. **Driver 2**
   - **Email**: `driver2@sptm.com`
   - **Password**: `Driver123!`
   - **Organization**: Metro Transport Services

3. **Passenger 1**
   - **Email**: `passenger1@sptm.com`
   - **Password**: `Passenger123!`

4. **Passenger 2**
   - **Email**: `passenger2@sptm.com`
   - **Password**: `Passenger123!`

## Database Schema Changes

### New Tables Created

#### super_admins
- Primary authentication table for system administrators
- Fields: id, email, password, name, isActive, lastLoginAt, refreshToken, createdAt, updatedAt, createdBy

#### admins
- Authentication table for platform administrators
- Fields: id, email, password, name, phone, isActive, lastLoginAt, refreshToken, createdAt, updatedAt, createdBy
- Foreign Key: createdBy → super_admins.id

#### Updated organizations
- Now includes authentication fields
- Fields: id, email, password, name, phone, address, licenseNumber, isActive, lastLoginAt, refreshToken, createdAt, updatedAt, createdBy
- Foreign Key: createdBy → admins.id

#### Updated users
- Simplified to only handle drivers and passengers
- Fields: id, email, password, name, phone, role, isActive, isEmailVerified, emailVerifiedAt, lastLoginAt, passwordResetToken, passwordResetExpires, refreshToken, createdAt, updatedAt, organizationId
- Foreign Key: organizationId → organizations.id (for drivers)

### Indexes Added
- Email indexes on all authentication tables for fast lookups
- Composite indexes for foreign key relationships
- Role-based indexes for efficient queries

## Data Validation Features

The migration includes comprehensive validation:

### Email Validation
- Proper email format checking
- Cross-table uniqueness validation
- Duplicate detection across all auth tables

### Password Security
- Minimum length requirements
- Bcrypt hash validation
- Empty password detection

### Referential Integrity
- Admin → SuperAdmin relationships
- Organization → Admin relationships
- Driver → Organization relationships

### Data Quality Checks
- Role validation for users
- Organization assignment for drivers
- Account status verification

## Rollback Procedure

If you need to rollback the migration:

```bash
# Reset database to previous state
npm run db:reset

# This will:
# - Drop all tables
# - Re-run all migrations from scratch
# - Require re-seeding data
```

**Warning**: This will delete all data. Ensure you have backups before proceeding.

## Troubleshooting

### Common Issues

#### 1. Migration Fails with "Table already exists"
```bash
# Reset and retry
npm run db:reset
npm run db:migrate
```

#### 2. Seed Script Fails with Validation Errors
- Check database connection in `.env`
- Ensure all required fields are properly configured
- Review validation error messages in console output

#### 3. Validation Script Reports Failures
- Run seed script again: `npm run db:seed`
- Check for data corruption
- Review specific validation error details

### Environment Variables Required

Ensure your `.env` file contains:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/sptm_db"
```

## Security Considerations

### Password Security
- All default passwords use strong hashing (bcrypt with 12 rounds)
- Change default passwords in production
- Implement password rotation policies

### Account Security
- Default accounts should be disabled/removed in production
- Implement proper access controls
- Monitor authentication attempts

### Data Protection
- Ensure database backups before migration
- Implement proper database access controls
- Use environment-specific configurations

## Production Migration Scripts

For production deployments, use the comprehensive migration scripts located in `scripts/`:

### Production-Safe Migration
```bash
# Test migration without making changes
npm run migrate:production:dry-run

# Run production migration with safety checks
npm run migrate:production
```

### Data Validation
```bash
# Comprehensive validation with detailed report
npm run migrate:validate --verbose --output=validation-report.json
```

### Zero-Downtime Deployment
```bash
# Full deployment with health checks and rollback capability
npm run deploy:zero-downtime
```

### Emergency Rollback
```bash
# List available backups
npm run migrate:rollback

# Rollback to specific backup
npm run migrate:rollback --backup-file=backup-YYYY-MM-DD.json
```

## Production Deployment

### Pre-deployment Checklist
- [ ] Database backup completed
- [ ] Environment variables configured
- [ ] Migration tested in staging
- [ ] Production migration dry-run successful
- [ ] Validation script passes
- [ ] Default accounts secured/removed
- [ ] Rollback procedure tested

### Recommended Deployment Steps
1. **Pre-deployment validation**
   ```bash
   npm run migrate:production:dry-run
   npm run migrate:validate
   ```

2. **Production migration**
   ```bash
   npm run migrate:production
   ```

3. **Zero-downtime deployment**
   ```bash
   npm run deploy:zero-downtime
   ```

4. **Post-deployment validation**
   ```bash
   npm run migrate:validate --verbose --output=post-deployment-report.json
   ```

### Legacy Deployment Steps (Development Only)
1. Stop application services
2. Backup production database
3. Run migration: `npm run db:migrate`
4. Run seed (if needed): `npm run db:seed`
5. Validate migration: `npm run db:validate`
6. Update application code
7. Restart services
8. Verify functionality

### Production Scripts Features

#### Production Migration (`scripts/production-migration.ts`)
- Comprehensive pre-migration validation
- Automatic backup creation
- Batch processing for large datasets
- Rollback capability on failure
- Post-migration validation

#### Rollback Migration (`scripts/rollback-migration.ts`)
- Backup file validation
- Pre-rollback backup creation
- Transaction-based rollback
- Foreign key constraint management
- Post-rollback validation

#### Zero-Downtime Deployment (`scripts/zero-downtime-deployment.sh`)
- Blue-green deployment simulation
- Health checks and monitoring
- Automatic rollback on failure
- Comprehensive logging

#### Data Validation (`scripts/data-validation.ts`)
- Data integrity validation
- Relationship integrity checks
- Password security validation
- Business logic validation
- Performance metrics and reporting

For detailed information about these scripts, see `scripts/README.md` and `DEPLOYMENT_CHECKLIST.md`.

## Support

For issues or questions regarding the migration:
1. Check this guide first
2. Run validation script for diagnostics
3. Review console output for specific error messages
4. Check database logs for connection issues

## Version Information

- **Migration Version**: 20251129074248_multi_tier_auth_system
- **Prisma Version**: ^5.6.0
- **Node.js Version**: ^20.9.0
- **Database**: PostgreSQL