# Database Migration and Seeding

This directory contains the database migration and seeding scripts for the multi-tier authentication system.

## Files Overview

### Migration Files
- `migrations/` - Contains Prisma migration files
- `schema.prisma` - Database schema definition

### Seed and Validation Scripts
- `seed.ts` - Data seeding script with validation
- `validate-migration.ts` - Migration integrity validator
- `MIGRATION_GUIDE.md` - Comprehensive migration documentation

### Utility Scripts
- `../scripts/run-migration.sh` - Complete migration runner

## Quick Start

### Run Complete Migration
```bash
# From backend directory
npm run migrate:full
```

### Individual Commands
```bash
# Run database migration only
npm run db:migrate

# Seed initial data
npm run db:seed

# Validate migration integrity
npm run db:validate

# Reset database (WARNING: Deletes all data)
npm run db:reset
```

## What Gets Created

### Authentication Tables
- `super_admins` - System administrators
- `admins` - Platform administrators  
- `organizations` - Transport companies (with auth fields)
- `users` - Drivers and passengers (simplified)

### Supporting Tables
- `discount_configs` - Discount type configurations
- `vehicles`, `routes`, `trips` - Core business entities
- `discount_profiles`, `verification_documents` - User features

### Sample Data
- 1 Super Admin account
- 1 Admin account
- 2 Organization accounts
- 4 User accounts (2 drivers, 2 passengers)
- 3 Discount configurations

## Default Credentials

**Super Admin**
- Email: `superadmin@sptm.com`
- Password: `SuperAdmin123!`

**Admin**
- Email: `admin@sptm.com`
- Password: `Admin123!`

**Organizations**
- City Bus: `citybus@sptm.com` / `CityBus123!`
- Metro Trans: `metrotrans@sptm.com` / `MetroTrans123!`

**Sample Users**
- Driver 1: `driver1@sptm.com` / `Driver123!`
- Driver 2: `driver2@sptm.com` / `Driver123!`
- Passenger 1: `passenger1@sptm.com` / `Passenger123!`
- Passenger 2: `passenger2@sptm.com` / `Passenger123!`

## Validation Features

The migration includes comprehensive validation:

### Data Integrity
- ✅ Table structure verification
- ✅ Referential integrity checks
- ✅ Email uniqueness across all auth tables
- ✅ Password validation
- ✅ Role assignment verification

### Security Checks
- ✅ No empty passwords
- ✅ Proper bcrypt hashing
- ✅ Account status validation
- ✅ Organization boundary enforcement

### Business Logic
- ✅ Driver-organization assignments
- ✅ Discount configuration completeness
- ✅ User role validation

## Troubleshooting

### Common Issues

**Migration fails with "table already exists"**
```bash
npm run db:reset
npm run migrate:full
```

**Seed script validation errors**
- Check database connection in `.env`
- Ensure PostgreSQL is running
- Verify database permissions

**Validation script reports failures**
- Review specific error messages
- Re-run seed script if needed
- Check for data corruption

### Environment Setup

Ensure your `.env` file contains:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/sptm_db"
```

## Production Notes

⚠️ **Important for Production:**
- Change all default passwords
- Remove/disable sample accounts
- Backup database before migration
- Test in staging environment first
- Monitor migration performance

## Support

For detailed information, see `MIGRATION_GUIDE.md` in this directory.