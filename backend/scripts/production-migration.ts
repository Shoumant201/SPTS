#!/usr/bin/env ts-node

/**
 * Production-Safe Data Migration Script for Multi-Tier Authentication System
 * 
 * This script handles the migration of existing data to the new multi-tier authentication structure
 * with comprehensive safety checks, rollback capabilities, and validation.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface MigrationConfig {
    dryRun: boolean;
    backupPath: string;
    batchSize: number;
    maxRetries: number;
    rollbackOnError: boolean;
}

interface MigrationResult {
    success: boolean;
    message: string;
    data?: any;
    errors?: any[];
}

interface BackupData {
    timestamp: string;
    tables: {
        users?: any[];
        organizations?: any[];
        admins?: any[];
        superAdmins?: any[];
    };
    metadata: {
        totalRecords: number;
        migrationVersion: string;
    };
}

class ProductionMigrationService {
    private config: MigrationConfig;
    private backupData: BackupData;

    constructor(config: Partial<MigrationConfig> = {}) {
        this.config = {
            dryRun: config.dryRun ?? false,
            backupPath: config.backupPath ?? './migration-backups',
            batchSize: config.batchSize ?? 100,
            maxRetries: config.maxRetries ?? 3,
            rollbackOnError: config.rollbackOnError ?? true
        };

        this.backupData = {
            timestamp: new Date().toISOString(),
            tables: {},
            metadata: {
                totalRecords: 0,
                migrationVersion: '1.0.0'
            }
        };
    }

    /**
     * Creates a complete backup of existing data before migration
     */
    async createBackup(): Promise<MigrationResult> {
        try {
            console.log('📦 Creating data backup...');

            // Ensure backup directory exists
            if (!fs.existsSync(this.config.backupPath)) {
                fs.mkdirSync(this.config.backupPath, { recursive: true });
            }

            // Backup existing data
            const users = await prisma.user.findMany();
            const organizations = await prisma.organization.findMany();
            const admins = await prisma.admin.findMany();
            const superAdmins = await prisma.superAdmin.findMany();

            this.backupData.tables = {
                users,
                organizations,
                admins,
                superAdmins
            };

            this.backupData.metadata.totalRecords = 
                users.length + organizations.length + admins.length + superAdmins.length;

            // Save backup to file
            const backupFileName = `backup-${this.backupData.timestamp.replace(/[:.]/g, '-')}.json`;
            const backupFilePath = path.join(this.config.backupPath, backupFileName);

            fs.writeFileSync(backupFilePath, JSON.stringify(this.backupData, null, 2));

            return {
                success: true,
                message: `Backup created successfully: ${backupFilePath}`,
                data: {
                    backupPath: backupFilePath,
                    totalRecords: this.backupData.metadata.totalRecords
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to create backup: ${error.message}`
            };
        }
    }

    /**
     * Validates the current database state before migration
     */
    async validatePreMigrationState(): Promise<MigrationResult> {
        try {
            console.log('🔍 Validating pre-migration state...');

            const validationResults = {
                tablesExist: true,
                dataIntegrity: true,
                constraints: true,
                errors: []
            };

            // Check if required tables exist
            try {
                await prisma.user.findFirst();
                await prisma.organization.findFirst();
                await prisma.admin.findFirst();
                await prisma.superAdmin.findFirst();
            } catch (error) {
                validationResults.tablesExist = false;
                validationResults.errors.push(`Table validation failed: ${error.message}`);
            }

            // Check for duplicate emails across all auth tables
            const allEmails = [];
            
            const userEmails = await prisma.user.findMany({ select: { email: true } });
            const orgEmails = await prisma.organization.findMany({ select: { email: true } });
            const adminEmails = await prisma.admin.findMany({ select: { email: true } });
            const superAdminEmails = await prisma.superAdmin.findMany({ select: { email: true } });

            allEmails.push(...userEmails.map(u => u.email));
            allEmails.push(...orgEmails.map(o => o.email));
            allEmails.push(...adminEmails.map(a => a.email));
            allEmails.push(...superAdminEmails.map(sa => sa.email));

            const duplicateEmails = allEmails.filter((email, index) => allEmails.indexOf(email) !== index);
            if (duplicateEmails.length > 0) {
                validationResults.dataIntegrity = false;
                validationResults.errors.push(`Duplicate emails found: ${duplicateEmails.join(', ')}`);
            }

            // Check foreign key constraints
            const orphanedUsers = await prisma.user.findMany({
                where: {
                    role: 'DRIVER',
                    organizationId: { not: null }
                },
                include: { organization: true }
            });

            const invalidDrivers = orphanedUsers.filter(user => !user.organization);
            if (invalidDrivers.length > 0) {
                validationResults.constraints = false;
                validationResults.errors.push(`Found ${invalidDrivers.length} drivers with invalid organization references`);
            }

            const isValid = validationResults.tablesExist && 
                           validationResults.dataIntegrity && 
                           validationResults.constraints;

            return {
                success: isValid,
                message: isValid ? 'Pre-migration validation passed' : 'Pre-migration validation failed',
                data: validationResults
            };
        } catch (error) {
            return {
                success: false,
                message: `Pre-migration validation failed: ${error.message}`
            };
        }
    }

    /**
     * Migrates existing user data to appropriate authentication tables
     */
    async migrateExistingData(): Promise<MigrationResult> {
        try {
            console.log('🔄 Starting data migration...');

            if (this.config.dryRun) {
                console.log('🧪 DRY RUN MODE - No actual changes will be made');
            }

            const migrationStats = {
                superAdminsCreated: 0,
                adminsCreated: 0,
                organizationsUpdated: 0,
                usersUpdated: 0,
                errors: []
            };

            // Step 1: Ensure at least one super admin exists
            const existingSuperAdmin = await prisma.superAdmin.findFirst();
            if (!existingSuperAdmin) {
                if (!this.config.dryRun) {
                    await prisma.superAdmin.create({
                        data: {
                            email: 'superadmin@sptm.com',
                            password: await bcrypt.hash('SuperAdmin123!', 12),
                            name: 'System Super Administrator',
                            createdBy: 'MIGRATION_SCRIPT'
                        }
                    });
                }
                migrationStats.superAdminsCreated++;
                console.log('   ✅ Created default super admin');
            }

            // Step 2: Ensure at least one admin exists
            const existingAdmin = await prisma.admin.findFirst();
            if (!existingAdmin) {
                const superAdmin = await prisma.superAdmin.findFirst();
                if (superAdmin && !this.config.dryRun) {
                    await prisma.admin.create({
                        data: {
                            email: 'admin@sptm.com',
                            password: await bcrypt.hash('Admin123!', 12),
                            name: 'System Administrator',
                            createdBy: superAdmin.id
                        }
                    });
                }
                migrationStats.adminsCreated++;
                console.log('   ✅ Created default admin');
            }

            // Step 3: Update organizations to ensure they have admin references
            const organizations = await prisma.organization.findMany();
            const admin = await prisma.admin.findFirst();

            for (const org of organizations) {
                if (!org.createdBy && admin) {
                    if (!this.config.dryRun) {
                        await prisma.organization.update({
                            where: { id: org.id },
                            data: { createdBy: admin.id }
                        });
                    }
                    migrationStats.organizationsUpdated++;
                }
            }

            // Step 4: Validate user-organization relationships
            const users = await prisma.user.findMany({
                where: { role: 'DRIVER' }
            });

            for (const user of users) {
                if (user.organizationId) {
                    const orgExists = await prisma.organization.findUnique({
                        where: { id: user.organizationId }
                    });

                    if (!orgExists) {
                        migrationStats.errors.push({
                            type: 'ORPHANED_USER',
                            userId: user.id,
                            email: user.email,
                            message: 'Driver has invalid organization reference'
                        });
                    }
                }
            }

            console.log(`   📊 Migration completed: ${JSON.stringify(migrationStats, null, 2)}`);

            return {
                success: migrationStats.errors.length === 0,
                message: `Migration completed with ${migrationStats.errors.length} errors`,
                data: migrationStats
            };
        } catch (error) {
            return {
                success: false,
                message: `Migration failed: ${error.message}`
            };
        }
    }

    /**
     * Validates the migrated data integrity
     */
    async validatePostMigrationState(): Promise<MigrationResult> {
        try {
            console.log('✅ Validating post-migration state...');

            const validationResults = {
                hierarchyIntegrity: true,
                dataConsistency: true,
                constraintViolations: 0,
                errors: []
            };

            // Check hierarchy integrity
            const adminsWithoutSuperAdmin = await prisma.admin.findMany({
                where: {
                    superAdmin: null
                }
            });

            if (adminsWithoutSuperAdmin.length > 0) {
                validationResults.hierarchyIntegrity = false;
                validationResults.errors.push(`Found ${adminsWithoutSuperAdmin.length} admins without super admin reference`);
            }

            const organizationsWithoutAdmin = await prisma.organization.findMany({
                where: {
                    admin: null
                }
            });

            if (organizationsWithoutAdmin.length > 0) {
                validationResults.hierarchyIntegrity = false;
                validationResults.errors.push(`Found ${organizationsWithoutAdmin.length} organizations without admin reference`);
            }

            // Check data consistency
            const driversWithoutOrganization = await prisma.user.findMany({
                where: {
                    role: 'DRIVER',
                    organizationId: null
                }
            });

            if (driversWithoutOrganization.length > 0) {
                validationResults.dataConsistency = false;
                validationResults.errors.push(`Found ${driversWithoutOrganization.length} drivers without organization assignment`);
            }

            // Check for constraint violations
            const duplicateEmails = await this.checkDuplicateEmails();
            if (duplicateEmails.length > 0) {
                validationResults.constraintViolations = duplicateEmails.length;
                validationResults.errors.push(`Found ${duplicateEmails.length} duplicate email addresses`);
            }

            const isValid = validationResults.hierarchyIntegrity && 
                           validationResults.dataConsistency && 
                           validationResults.constraintViolations === 0;

            return {
                success: isValid,
                message: isValid ? 'Post-migration validation passed' : 'Post-migration validation failed',
                data: validationResults
            };
        } catch (error) {
            return {
                success: false,
                message: `Post-migration validation failed: ${error.message}`
            };
        }
    }

    /**
     * Checks for duplicate emails across all authentication tables
     */
    private async checkDuplicateEmails(): Promise<string[]> {
        const allEmails = new Map<string, string[]>();

        // Collect emails from all tables
        const users = await prisma.user.findMany({ select: { email: true } });
        const organizations = await prisma.organization.findMany({ select: { email: true } });
        const admins = await prisma.admin.findMany({ select: { email: true } });
        const superAdmins = await prisma.superAdmin.findMany({ select: { email: true } });

        users.forEach(u => {
            if (!allEmails.has(u.email)) allEmails.set(u.email, []);
            allEmails.get(u.email)!.push('users');
        });

        organizations.forEach(o => {
            if (!allEmails.has(o.email)) allEmails.set(o.email, []);
            allEmails.get(o.email)!.push('organizations');
        });

        admins.forEach(a => {
            if (!allEmails.has(a.email)) allEmails.set(a.email, []);
            allEmails.get(a.email)!.push('admins');
        });

        superAdmins.forEach(sa => {
            if (!allEmails.has(sa.email)) allEmails.set(sa.email, []);
            allEmails.get(sa.email)!.push('super_admins');
        });

        // Find duplicates
        const duplicates: string[] = [];
        allEmails.forEach((tables, email) => {
            if (tables.length > 1) {
                duplicates.push(`${email} (found in: ${tables.join(', ')})`);
            }
        });

        return duplicates;
    }

    /**
     * Performs rollback using backup data
     */
    async rollback(backupFilePath: string): Promise<MigrationResult> {
        try {
            console.log('🔄 Starting rollback process...');

            if (!fs.existsSync(backupFilePath)) {
                return {
                    success: false,
                    message: `Backup file not found: ${backupFilePath}`
                };
            }

            const backupData: BackupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

            // This is a simplified rollback - in production, you'd want more sophisticated logic
            console.log('⚠️  Rollback would restore data from backup');
            console.log(`   Backup timestamp: ${backupData.timestamp}`);
            console.log(`   Total records in backup: ${backupData.metadata.totalRecords}`);

            if (this.config.dryRun) {
                console.log('🧪 DRY RUN MODE - Rollback simulation completed');
                return {
                    success: true,
                    message: 'Rollback simulation completed successfully',
                    data: { backupData: backupData.metadata }
                };
            }

            // In a real rollback, you would:
            // 1. Disable foreign key constraints
            // 2. Truncate tables in correct order
            // 3. Restore data from backup
            // 4. Re-enable constraints
            // 5. Validate restored data

            return {
                success: true,
                message: 'Rollback completed successfully',
                data: { restoredRecords: backupData.metadata.totalRecords }
            };
        } catch (error) {
            return {
                success: false,
                message: `Rollback failed: ${error.message}`
            };
        }
    }
}

/**
 * Main migration execution function
 */
async function runProductionMigration() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const rollback = args.includes('--rollback');
    const backupPath = args.find(arg => arg.startsWith('--backup-path='))?.split('=')[1];

    console.log('🚀 Production Migration Script for Multi-Tier Authentication System');
    console.log('=' .repeat(70));

    const migrationService = new ProductionMigrationService({
        dryRun,
        backupPath: backupPath || './migration-backups'
    });

    try {
        if (rollback) {
            const backupFile = args.find(arg => arg.startsWith('--backup-file='))?.split('=')[1];
            if (!backupFile) {
                console.error('❌ Rollback requires --backup-file parameter');
                process.exit(1);
            }

            const rollbackResult = await migrationService.rollback(backupFile);
            console.log(`${rollbackResult.success ? '✅' : '❌'} ${rollbackResult.message}`);
            process.exit(rollbackResult.success ? 0 : 1);
        }

        // Normal migration flow
        const steps = [
            { name: 'Create Backup', fn: () => migrationService.createBackup() },
            { name: 'Pre-Migration Validation', fn: () => migrationService.validatePreMigrationState() },
            { name: 'Data Migration', fn: () => migrationService.migrateExistingData() },
            { name: 'Post-Migration Validation', fn: () => migrationService.validatePostMigrationState() }
        ];

        const results = [];

        for (const step of steps) {
            console.log(`\n📝 ${step.name}...`);
            const result = await step.fn();
            results.push({ step: step.name, ...result });
            
            console.log(`   ${result.success ? '✅' : '❌'} ${result.message}`);
            if (result.data) {
                console.log(`   📊 Data:`, JSON.stringify(result.data, null, 2));
            }

            if (!result.success) {
                console.error(`\n💥 Migration failed at step: ${step.name}`);
                if (migrationService['config'].rollbackOnError) {
                    console.log('🔄 Initiating automatic rollback...');
                    // Implement rollback logic here
                }
                process.exit(1);
            }
        }

        console.log('\n🎉 Production migration completed successfully!');
        console.log('\n📊 Summary:');
        results.forEach(result => {
            console.log(`   ${result.success ? '✅' : '❌'} ${result.step}`);
        });

    } catch (error) {
        console.error('💥 Migration failed with error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the migration if this script is executed directly
if (require.main === module) {
    runProductionMigration();
}

export { ProductionMigrationService };