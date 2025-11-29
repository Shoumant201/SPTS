import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface MigrationResult {
  success: boolean;
  message: string;
  data?: any;
}

interface ValidationError {
  field: string;
  value: any;
  message: string;
}

class DataMigrationService {
  private validationErrors: ValidationError[] = [];

  /**
   * Validates email format
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates password strength
   */
  private validatePassword(password: string): boolean {
    // Check if password is already hashed (bcrypt format)
    if (password.startsWith('$2a$') || password.startsWith('$2b$')) {
      return true;
    }
    // For plain text passwords, ensure minimum length
    return password.length >= 6;
  }

  /**
   * Validates required fields for user data
   */
  private validateUserData(userData: any, userType: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Common validations
    if (!userData.email || !this.validateEmail(userData.email)) {
      errors.push({
        field: 'email',
        value: userData.email,
        message: `Invalid email format for ${userType}`
      });
    }

    if (!userData.password || !this.validatePassword(userData.password)) {
      errors.push({
        field: 'password',
        value: '[REDACTED]',
        message: `Invalid password for ${userType}`
      });
    }

    if (!userData.name || userData.name.trim().length === 0) {
      errors.push({
        field: 'name',
        value: userData.name,
        message: `Name is required for ${userType}`
      });
    }

    // Type-specific validations
    if (userType === 'Organization') {
      if (userData.licenseNumber && userData.licenseNumber.trim().length === 0) {
        errors.push({
          field: 'licenseNumber',
          value: userData.licenseNumber,
          message: 'License number cannot be empty if provided'
        });
      }
    }

    return errors;
  }

  /**
   * Creates a default super admin if none exists
   */
  async createDefaultSuperAdmin(): Promise<MigrationResult> {
    try {
      const existingSuperAdmin = await prisma.superAdmin.findFirst();
      
      if (existingSuperAdmin) {
        return {
          success: true,
          message: 'Super admin already exists, skipping creation'
        };
      }

      const defaultSuperAdmin = {
        email: 'superadmin@sptm.com',
        password: await bcrypt.hash('SuperAdmin123!', 12),
        name: 'System Super Administrator',
        createdBy: 'SYSTEM'
      };

      const validationErrors = this.validateUserData(defaultSuperAdmin, 'SuperAdmin');
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: 'Validation failed for default super admin',
          data: validationErrors
        };
      }

      const superAdmin = await prisma.superAdmin.create({
        data: defaultSuperAdmin
      });

      return {
        success: true,
        message: 'Default super admin created successfully',
        data: { id: superAdmin.id, email: superAdmin.email }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create default super admin: ${error.message}`
      };
    }
  }

  /**
   * Creates a default admin if none exists
   */
  async createDefaultAdmin(): Promise<MigrationResult> {
    try {
      const existingAdmin = await prisma.admin.findFirst();
      
      if (existingAdmin) {
        return {
          success: true,
          message: 'Admin already exists, skipping creation'
        };
      }

      // Get the super admin to use as creator
      const superAdmin = await prisma.superAdmin.findFirst();
      if (!superAdmin) {
        return {
          success: false,
          message: 'Cannot create admin: No super admin found'
        };
      }

      const defaultAdmin = {
        email: 'admin@sptm.com',
        password: await bcrypt.hash('Admin123!', 12),
        name: 'System Administrator',
        phone: '+1234567890',
        createdBy: superAdmin.id
      };

      const validationErrors = this.validateUserData(defaultAdmin, 'Admin');
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: 'Validation failed for default admin',
          data: validationErrors
        };
      }

      const admin = await prisma.admin.create({
        data: defaultAdmin
      });

      return {
        success: true,
        message: 'Default admin created successfully',
        data: { id: admin.id, email: admin.email }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create default admin: ${error.message}`
      };
    }
  }

  /**
   * Creates sample organizations for testing
   */
  async createSampleOrganizations(): Promise<MigrationResult> {
    try {
      const existingOrganizations = await prisma.organization.findMany();
      
      if (existingOrganizations.length > 0) {
        return {
          success: true,
          message: 'Organizations already exist, skipping creation'
        };
      }

      // Get the admin to use as creator
      const admin = await prisma.admin.findFirst();
      if (!admin) {
        return {
          success: false,
          message: 'Cannot create organizations: No admin found'
        };
      }

      const sampleOrganizations = [
        {
          email: 'citybus@sptm.com',
          password: await bcrypt.hash('CityBus123!', 12),
          name: 'City Bus Transport',
          phone: '+1234567891',
          address: '123 Transport Street, City Center',
          licenseNumber: 'CBT-2024-001',
          createdBy: admin.id
        },
        {
          email: 'metrotrans@sptm.com',
          password: await bcrypt.hash('MetroTrans123!', 12),
          name: 'Metro Transport Services',
          phone: '+1234567892',
          address: '456 Metro Avenue, Downtown',
          licenseNumber: 'MTS-2024-002',
          createdBy: admin.id
        }
      ];

      const createdOrganizations = [];
      const errors = [];

      for (const orgData of sampleOrganizations) {
        const validationErrors = this.validateUserData(orgData, 'Organization');
        if (validationErrors.length > 0) {
          errors.push({
            email: orgData.email,
            errors: validationErrors
          });
          continue;
        }

        try {
          const organization = await prisma.organization.create({
            data: orgData
          });
          createdOrganizations.push({
            id: organization.id,
            email: organization.email,
            name: organization.name
          });
        } catch (error) {
          errors.push({
            email: orgData.email,
            error: error.message
          });
        }
      }

      return {
        success: errors.length === 0,
        message: `Created ${createdOrganizations.length} organizations${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
        data: { created: createdOrganizations, errors }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create sample organizations: ${error.message}`
      };
    }
  }

  /**
   * Creates sample users (drivers and passengers) for testing
   */
  async createSampleUsers(): Promise<MigrationResult> {
    try {
      const existingUsers = await prisma.user.findMany();
      
      if (existingUsers.length > 0) {
        return {
          success: true,
          message: 'Users already exist, skipping creation'
        };
      }

      // Get organizations for driver assignment
      const organizations = await prisma.organization.findMany();
      
      const sampleUsers = [
        // Drivers
        {
          email: 'driver1@sptm.com',
          password: await bcrypt.hash('Driver123!', 12),
          name: 'John Driver',
          phone: '+1234567893',
          role: 'DRIVER' as const,
          organizationId: organizations[0]?.id || null
        },
        {
          email: 'driver2@sptm.com',
          password: await bcrypt.hash('Driver123!', 12),
          name: 'Jane Driver',
          phone: '+1234567894',
          role: 'DRIVER' as const,
          organizationId: organizations[1]?.id || organizations[0]?.id || null
        },
        // Passengers
        {
          email: 'passenger1@sptm.com',
          password: await bcrypt.hash('Passenger123!', 12),
          name: 'Alice Passenger',
          phone: '+1234567895',
          role: 'PASSENGER' as const,
          organizationId: null
        },
        {
          email: 'passenger2@sptm.com',
          password: await bcrypt.hash('Passenger123!', 12),
          name: 'Bob Passenger',
          phone: '+1234567896',
          role: 'PASSENGER' as const,
          organizationId: null
        }
      ];

      const createdUsers = [];
      const errors = [];

      for (const userData of sampleUsers) {
        const validationErrors = this.validateUserData(userData, 'User');
        if (validationErrors.length > 0) {
          errors.push({
            email: userData.email,
            errors: validationErrors
          });
          continue;
        }

        try {
          const user = await prisma.user.create({
            data: userData
          });
          createdUsers.push({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          });
        } catch (error) {
          errors.push({
            email: userData.email,
            error: error.message
          });
        }
      }

      return {
        success: errors.length === 0,
        message: `Created ${createdUsers.length} users${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
        data: { created: createdUsers, errors }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create sample users: ${error.message}`
      };
    }
  }

  /**
   * Creates default discount configurations
   */
  async createDiscountConfigs(): Promise<MigrationResult> {
    try {
      const existingConfigs = await prisma.discountConfig.findMany();
      
      if (existingConfigs.length > 0) {
        return {
          success: true,
          message: 'Discount configurations already exist, skipping creation'
        };
      }

      const discountConfigs = [
        {
          discountType: 'STUDENT' as const,
          percentage: 50,
          maxDiscountAmount: 100,
          description: 'Student discount - 50% off with maximum discount of 100 units'
        },
        {
          discountType: 'ELDERLY' as const,
          percentage: 30,
          maxDiscountAmount: 75,
          description: 'Elderly discount - 30% off with maximum discount of 75 units'
        },
        {
          discountType: 'DISABLED' as const,
          percentage: 60,
          maxDiscountAmount: 120,
          description: 'Disabled person discount - 60% off with maximum discount of 120 units'
        }
      ];

      const createdConfigs = [];

      for (const configData of discountConfigs) {
        try {
          const config = await prisma.discountConfig.create({
            data: configData
          });
          createdConfigs.push({
            discountType: config.discountType,
            percentage: config.percentage
          });
        } catch (error) {
          return {
            success: false,
            message: `Failed to create discount config for ${configData.discountType}: ${error.message}`
          };
        }
      }

      return {
        success: true,
        message: `Created ${createdConfigs.length} discount configurations`,
        data: createdConfigs
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create discount configurations: ${error.message}`
      };
    }
  }

  /**
   * Validates the integrity of migrated data
   */
  async validateMigratedData(): Promise<MigrationResult> {
    try {
      const validationResults = {
        superAdmins: 0,
        admins: 0,
        organizations: 0,
        users: 0,
        discountConfigs: 0,
        relationshipIntegrity: true,
        errors: []
      };

      // Count records
      validationResults.superAdmins = await prisma.superAdmin.count();
      validationResults.admins = await prisma.admin.count();
      validationResults.organizations = await prisma.organization.count();
      validationResults.users = await prisma.user.count();
      validationResults.discountConfigs = await prisma.discountConfig.count();

      // Validate relationships
      const adminsWithInvalidSuperAdmin = await prisma.admin.findMany({
        where: {
          createdBy: {
            not: {
              in: (await prisma.superAdmin.findMany({ select: { id: true } })).map(sa => sa.id)
            }
          }
        }
      });

      if (adminsWithInvalidSuperAdmin.length > 0) {
        validationResults.relationshipIntegrity = false;
        validationResults.errors.push(`Found ${adminsWithInvalidSuperAdmin.length} admins without valid super admin reference`);
      }

      const organizationsWithInvalidAdmin = await prisma.organization.findMany({
        where: {
          createdBy: {
            not: {
              in: (await prisma.admin.findMany({ select: { id: true } })).map(a => a.id)
            }
          }
        }
      });

      if (organizationsWithInvalidAdmin.length > 0) {
        validationResults.relationshipIntegrity = false;
        validationResults.errors.push(`Found ${organizationsWithInvalidAdmin.length} organizations without valid admin reference`);
      }

      const driversWithInvalidOrganization = await prisma.user.findMany({
        where: {
          role: 'DRIVER',
          organizationId: {
            not: null,
            notIn: (await prisma.organization.findMany({ select: { id: true } })).map(o => o.id)
          }
        }
      });

      if (driversWithInvalidOrganization.length > 0) {
        validationResults.relationshipIntegrity = false;
        validationResults.errors.push(`Found ${driversWithInvalidOrganization.length} drivers with invalid organization reference`);
      }

      return {
        success: validationResults.relationshipIntegrity && validationResults.errors.length === 0,
        message: validationResults.relationshipIntegrity ? 'Data validation passed' : 'Data validation failed',
        data: validationResults
      };
    } catch (error) {
      return {
        success: false,
        message: `Data validation failed: ${error.message}`
      };
    }
  }
}

async function main() {
  console.log('🚀 Starting multi-tier authentication system data migration...\n');

  const migrationService = new DataMigrationService();
  const results = [];

  try {
    // Step 1: Create default super admin
    console.log('📝 Step 1: Creating default super admin...');
    const superAdminResult = await migrationService.createDefaultSuperAdmin();
    results.push({ step: 'Super Admin Creation', ...superAdminResult });
    console.log(`   ${superAdminResult.success ? '✅' : '❌'} ${superAdminResult.message}`);
    if (superAdminResult.data) {
      console.log(`   Data:`, superAdminResult.data);
    }
    console.log();

    // Step 2: Create default admin
    console.log('📝 Step 2: Creating default admin...');
    const adminResult = await migrationService.createDefaultAdmin();
    results.push({ step: 'Admin Creation', ...adminResult });
    console.log(`   ${adminResult.success ? '✅' : '❌'} ${adminResult.message}`);
    if (adminResult.data) {
      console.log(`   Data:`, adminResult.data);
    }
    console.log();

    // Step 3: Create sample organizations
    console.log('📝 Step 3: Creating sample organizations...');
    const organizationsResult = await migrationService.createSampleOrganizations();
    results.push({ step: 'Organizations Creation', ...organizationsResult });
    console.log(`   ${organizationsResult.success ? '✅' : '❌'} ${organizationsResult.message}`);
    if (organizationsResult.data) {
      console.log(`   Data:`, organizationsResult.data);
    }
    console.log();

    // Step 4: Create sample users
    console.log('📝 Step 4: Creating sample users...');
    const usersResult = await migrationService.createSampleUsers();
    results.push({ step: 'Users Creation', ...usersResult });
    console.log(`   ${usersResult.success ? '✅' : '❌'} ${usersResult.message}`);
    if (usersResult.data) {
      console.log(`   Data:`, usersResult.data);
    }
    console.log();

    // Step 5: Create discount configurations
    console.log('📝 Step 5: Creating discount configurations...');
    const discountConfigsResult = await migrationService.createDiscountConfigs();
    results.push({ step: 'Discount Configs Creation', ...discountConfigsResult });
    console.log(`   ${discountConfigsResult.success ? '✅' : '❌'} ${discountConfigsResult.message}`);
    if (discountConfigsResult.data) {
      console.log(`   Data:`, discountConfigsResult.data);
    }
    console.log();

    // Step 6: Validate migrated data
    console.log('📝 Step 6: Validating migrated data...');
    const validationResult = await migrationService.validateMigratedData();
    results.push({ step: 'Data Validation', ...validationResult });
    console.log(`   ${validationResult.success ? '✅' : '❌'} ${validationResult.message}`);
    if (validationResult.data) {
      console.log(`   Data:`, validationResult.data);
    }
    console.log();

    // Summary
    console.log('📊 Migration Summary:');
    console.log('='.repeat(50));
    const successfulSteps = results.filter(r => r.success).length;
    const totalSteps = results.length;
    
    console.log(`✅ Successful steps: ${successfulSteps}/${totalSteps}`);
    
    if (successfulSteps < totalSteps) {
      console.log('❌ Failed steps:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.step}: ${r.message}`);
      });
    }

    console.log('\n🎉 Multi-tier authentication system migration completed!');
    
    if (successfulSteps === totalSteps) {
      console.log('\n📋 Default Credentials Created:');
      console.log('Super Admin: superadmin@sptm.com / SuperAdmin123!');
      console.log('Admin: admin@sptm.com / Admin123!');
      console.log('Organization 1: citybus@sptm.com / CityBus123!');
      console.log('Organization 2: metrotrans@sptm.com / MetroTrans123!');
      console.log('Driver 1: driver1@sptm.com / Driver123!');
      console.log('Driver 2: driver2@sptm.com / Driver123!');
      console.log('Passenger 1: passenger1@sptm.com / Passenger123!');
      console.log('Passenger 2: passenger2@sptm.com / Passenger123!');
    }

  } catch (error) {
    console.error('💥 Migration failed with error:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('💥 Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });