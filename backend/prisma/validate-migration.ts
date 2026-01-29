import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ValidationReport {
  timestamp: string;
  overall: 'PASS' | 'FAIL';
  checks: ValidationCheck[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
  };
}

interface ValidationCheck {
  name: string;
  status: 'PASS' | 'FAIL';
  message: string;
  details?: any;
}

class MigrationValidator {
  private checks: ValidationCheck[] = [];

  private addCheck(name: string, status: 'PASS' | 'FAIL', message: string, details?: any) {
    this.checks.push({ name, status, message, details });
  }

  /**
   * Validates that all required tables exist and have data
   */
  async validateTableStructure(): Promise<void> {
    try {
      // Check SuperAdmin table
      const superAdminCount = await prisma.superAdmin.count();
      this.addCheck(
        'SuperAdmin Table',
        superAdminCount > 0 ? 'PASS' : 'FAIL',
        `Found ${superAdminCount} super admin(s)`,
        { count: superAdminCount }
      );

      // Check Admin table
      const adminCount = await prisma.admin.count();
      this.addCheck(
        'Admin Table',
        adminCount > 0 ? 'PASS' : 'FAIL',
        `Found ${adminCount} admin(s)`,
        { count: adminCount }
      );

      // Check Organization table
      const organizationCount = await prisma.organization.count();
      this.addCheck(
        'Organization Table',
        organizationCount >= 0 ? 'PASS' : 'FAIL',
        `Found ${organizationCount} organization(s)`,
        { count: organizationCount }
      );

      // Check User table
      const userCount = await prisma.user.count();
      this.addCheck(
        'User Table',
        userCount >= 0 ? 'PASS' : 'FAIL',
        `Found ${userCount} user(s)`,
        { count: userCount }
      );

    } catch (error) {
      this.addCheck(
        'Table Structure',
        'FAIL',
        `Failed to validate table structure: ${error.message}`
      );
    }
  }

  /**
   * Validates referential integrity between tables
   */
  async validateReferentialIntegrity(): Promise<void> {
    try {
      // Check Admin -> SuperAdmin relationships
      const superAdminIds = (await prisma.superAdmin.findMany({ select: { id: true } })).map(sa => sa.id);
      const adminsWithoutSuperAdmin = await prisma.admin.findMany({
        where: {
          createdBy: {
            not: { in: superAdminIds }
          }
        },
        select: { id: true, email: true, createdBy: true }
      });

      this.addCheck(
        'Admin-SuperAdmin Integrity',
        adminsWithoutSuperAdmin.length === 0 ? 'PASS' : 'FAIL',
        adminsWithoutSuperAdmin.length === 0 
          ? 'All admins have valid super admin references'
          : `Found ${adminsWithoutSuperAdmin.length} admins with invalid super admin references`,
        adminsWithoutSuperAdmin.length > 0 ? { invalidAdmins: adminsWithoutSuperAdmin } : undefined
      );

      // Check Organization -> Admin relationships
      const adminIds = (await prisma.admin.findMany({ select: { id: true } })).map(a => a.id);
      const organizationsWithoutAdmin = await prisma.organization.findMany({
        where: {
          createdBy: {
            not: { in: adminIds }
          }
        },
        select: { id: true, email: true, createdBy: true }
      });

      this.addCheck(
        'Organization-Admin Integrity',
        organizationsWithoutAdmin.length === 0 ? 'PASS' : 'FAIL',
        organizationsWithoutAdmin.length === 0
          ? 'All organizations have valid admin references'
          : `Found ${organizationsWithoutAdmin.length} organizations with invalid admin references`,
        organizationsWithoutAdmin.length > 0 ? { invalidOrganizations: organizationsWithoutAdmin } : undefined
      );

      // Check Driver -> Organization relationships
      const organizationIds = (await prisma.organization.findMany({ select: { id: true } })).map(o => o.id);
      const driversWithInvalidOrganization = await prisma.user.findMany({
        where: {
          role: 'DRIVER',
          organizationId: {
            not: null,
            notIn: organizationIds
          }
        },
        select: { id: true, email: true, organizationId: true }
      });

      this.addCheck(
        'Driver-Organization Integrity',
        driversWithInvalidOrganization.length === 0 ? 'PASS' : 'FAIL',
        driversWithInvalidOrganization.length === 0
          ? 'All drivers have valid organization references'
          : `Found ${driversWithInvalidOrganization.length} drivers with invalid organization references`,
        driversWithInvalidOrganization.length > 0 ? { invalidDrivers: driversWithInvalidOrganization } : undefined
      );

    } catch (error) {
      this.addCheck(
        'Referential Integrity',
        'FAIL',
        `Failed to validate referential integrity: ${error.message}`
      );
    }
  }

  /**
   * Validates data quality and constraints
   */
  async validateDataQuality(): Promise<void> {
    try {
      // Check for duplicate emails across all auth tables
      const duplicateEmails = [];

      // Get all emails from all auth tables
      const superAdminEmails = await prisma.superAdmin.findMany({ select: { email: true } });
      const adminEmails = await prisma.admin.findMany({ select: { email: true } });
      const organizationEmails = await prisma.organization.findMany({ select: { email: true } });
      const userEmails = await prisma.user.findMany({ select: { email: true } });

      const allEmails = [
        ...superAdminEmails.map(e => ({ email: e.email, table: 'super_admins' })),
        ...adminEmails.map(e => ({ email: e.email, table: 'admins' })),
        ...organizationEmails.map(e => ({ email: e.email, table: 'organizations' })),
        ...userEmails.map(e => ({ email: e.email, table: 'users' }))
      ];

      const emailCounts = allEmails.reduce((acc, { email, table }) => {
        if (!acc[email]) {
          acc[email] = { count: 0, tables: [] };
        }
        acc[email].count++;
        acc[email].tables.push(table);
        return acc;
      }, {} as Record<string, { count: number; tables: string[] }>);

      const duplicates = Object.entries(emailCounts)
        .filter(([_, data]) => data.count > 1)
        .map(([email, data]) => ({ email, ...data }));

      this.addCheck(
        'Email Uniqueness',
        duplicates.length === 0 ? 'PASS' : 'FAIL',
        duplicates.length === 0
          ? 'No duplicate emails found across authentication tables'
          : `Found ${duplicates.length} duplicate email(s) across authentication tables`,
        duplicates.length > 0 ? { duplicates } : undefined
      );

      // Check for users with invalid roles
      const invalidRoleUsers = await prisma.user.findMany({
        where: {
          role: { notIn: ['DRIVER', 'PASSENGER'] }
        },
        select: { id: true, email: true, role: true }
      });

      this.addCheck(
        'User Role Validation',
        invalidRoleUsers.length === 0 ? 'PASS' : 'FAIL',
        invalidRoleUsers.length === 0
          ? 'All users have valid roles'
          : `Found ${invalidRoleUsers.length} user(s) with invalid roles`,
        invalidRoleUsers.length > 0 ? { invalidUsers: invalidRoleUsers } : undefined
      );

      // Check for drivers without organization assignment
      const driversWithoutOrganization = await prisma.user.findMany({
        where: {
          role: 'DRIVER',
          organizationId: null
        },
        select: { id: true, email: true, name: true }
      });

      this.addCheck(
        'Driver Organization Assignment',
        driversWithoutOrganization.length === 0 ? 'PASS' : 'FAIL',
        driversWithoutOrganization.length === 0
          ? 'All drivers are assigned to organizations'
          : `Found ${driversWithoutOrganization.length} driver(s) without organization assignment`,
        driversWithoutOrganization.length > 0 ? { unassignedDrivers: driversWithoutOrganization } : undefined
      );

    } catch (error) {
      this.addCheck(
        'Data Quality',
        'FAIL',
        `Failed to validate data quality: ${error.message}`
      );
    }
  }

  /**
   * Validates authentication credentials
   */
  async validateAuthenticationData(): Promise<void> {
    try {
      // Check for users with empty passwords
      const usersWithEmptyPasswords = [];

      // Check SuperAdmins
      const superAdmins = await prisma.superAdmin.findMany({
        where: { password: '' },
        select: { id: true, email: true }
      });
      usersWithEmptyPasswords.push(...superAdmins.map(u => ({ ...u, table: 'super_admins' })));

      // Check Admins
      const admins = await prisma.admin.findMany({
        where: { password: '' },
        select: { id: true, email: true }
      });
      usersWithEmptyPasswords.push(...admins.map(u => ({ ...u, table: 'admins' })));

      // Check Organizations
      const organizations = await prisma.organization.findMany({
        where: { password: '' },
        select: { id: true, email: true }
      });
      usersWithEmptyPasswords.push(...organizations.map(u => ({ ...u, table: 'organizations' })));

      // Check Users
      const users = await prisma.user.findMany({
        where: { password: '' },
        select: { id: true, email: true }
      });
      usersWithEmptyPasswords.push(...users.map(u => ({ ...u, table: 'users' })));

      this.addCheck(
        'Password Validation',
        usersWithEmptyPasswords.length === 0 ? 'PASS' : 'FAIL',
        usersWithEmptyPasswords.length === 0
          ? 'All users have valid passwords'
          : `Found ${usersWithEmptyPasswords.length} user(s) with empty passwords`,
        usersWithEmptyPasswords.length > 0 ? { usersWithEmptyPasswords } : undefined
      );

      // Check for inactive accounts
      const inactiveAccounts = [];

      const inactiveSuperAdmins = await prisma.superAdmin.count({ where: { isActive: false } });
      const inactiveAdmins = await prisma.admin.count({ where: { isActive: false } });
      const inactiveOrganizations = await prisma.organization.count({ where: { isActive: false } });
      const inactiveUsers = await prisma.user.count({ where: { isActive: false } });

      const totalInactive = inactiveSuperAdmins + inactiveAdmins + inactiveOrganizations + inactiveUsers;

      this.addCheck(
        'Account Status',
        'PASS', // This is informational, not a failure
        `Found ${totalInactive} inactive account(s) (${inactiveSuperAdmins} super admins, ${inactiveAdmins} admins, ${inactiveOrganizations} organizations, ${inactiveUsers} users)`,
        {
          inactiveSuperAdmins,
          inactiveAdmins,
          inactiveOrganizations,
          inactiveUsers,
          total: totalInactive
        }
      );

    } catch (error) {
      this.addCheck(
        'Authentication Data',
        'FAIL',
        `Failed to validate authentication data: ${error.message}`
      );
    }
  }

  /**
   * Validates discount configuration
   */
  async validateDiscountConfiguration(): Promise<void> {
    try {
      const discountConfigs = await prisma.discountConfig.findMany();
      
      this.addCheck(
        'Discount Configurations',
        discountConfigs.length > 0 ? 'PASS' : 'FAIL',
        `Found ${discountConfigs.length} discount configuration(s)`,
        { configs: discountConfigs.map(c => ({ type: c.discountType, percentage: c.percentage })) }
      );

      // Check for required discount types
      const requiredTypes = ['STUDENT', 'ELDERLY', 'DISABLED'];
      const existingTypes = discountConfigs.map(c => c.discountType);
      const missingTypes = requiredTypes.filter(type => !existingTypes.includes(type as any));

      this.addCheck(
        'Required Discount Types',
        missingTypes.length === 0 ? 'PASS' : 'FAIL',
        missingTypes.length === 0
          ? 'All required discount types are configured'
          : `Missing discount configurations for: ${missingTypes.join(', ')}`,
        missingTypes.length > 0 ? { missingTypes } : undefined
      );

    } catch (error) {
      this.addCheck(
        'Discount Configuration',
        'FAIL',
        `Failed to validate discount configuration: ${error.message}`
      );
    }
  }

  /**
   * Runs all validation checks and returns a comprehensive report
   */
  async validate(): Promise<ValidationReport> {
    console.log('🔍 Starting migration validation...\n');

    await this.validateTableStructure();
    await this.validateReferentialIntegrity();
    await this.validateDataQuality();
    await this.validateAuthenticationData();
    await this.validateDiscountConfiguration();

    const passed = this.checks.filter(c => c.status === 'PASS').length;
    const failed = this.checks.filter(c => c.status === 'FAIL').length;

    const report: ValidationReport = {
      timestamp: new Date().toISOString(),
      overall: failed === 0 ? 'PASS' : 'FAIL',
      checks: this.checks,
      summary: {
        totalChecks: this.checks.length,
        passed,
        failed
      }
    };

    return report;
  }
}

async function main() {
  const validator = new MigrationValidator();
  
  try {
    const report = await validator.validate();

    // Print results
    console.log('📊 Validation Results:');
    console.log('='.repeat(60));
    
    report.checks.forEach(check => {
      const icon = check.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${check.name}: ${check.message}`);
      
      if (check.details && check.status === 'FAIL') {
        console.log(`   Details:`, JSON.stringify(check.details, null, 2));
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`📈 Summary: ${report.summary.passed}/${report.summary.totalChecks} checks passed`);
    console.log(`🎯 Overall Status: ${report.overall}`);
    
    if (report.overall === 'FAIL') {
      console.log('\n❌ Migration validation failed. Please review the failed checks above.');
      process.exit(1);
    } else {
      console.log('\n✅ Migration validation passed successfully!');
    }

  } catch (error) {
    console.error('💥 Validation failed with error:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('💥 Validation script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });