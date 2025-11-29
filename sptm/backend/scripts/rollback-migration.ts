#!/usr/bin/env ts-node

/**
 * Rollback Script for Multi-Tier Authentication System Migration
 * 
 * This script provides comprehensive rollback capabilities for the multi-tier authentication
 * system migration, including data restoration, constraint management, and validation.
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface RollbackConfig {
    dryRun: boolean;
    backupPath: string;
    validateBeforeRollback: boolean;
    createPreRollbackBackup: boolean;
}

interface RollbackResult {
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
        discountConfigs?: any[];
        routes?: any[];
        vehicles?: any[];
        trips?: any[];
        discountProfiles?: any[];
        verificationDocuments?: any[];
    };
    metadata: {
        totalRecords: number;
        migrationVersion: string;
        databaseVersion?: string;
    };
}

class RollbackService {
    private config: RollbackConfig;

    constructor(config: Partial<RollbackConfig> = {}) {
        this.config = {
            dryRun: config.dryRun ?? false,
            backupPath: config.backupPath ?? './migration-backups',
            validateBeforeRollback: config.validateBeforeRollback ?? true,
            createPreRollbackBackup: config.createPreRollbackBackup ?? true
        };
    }

    /**
     * Validates the backup file before attempting rollback
     */
    async validateBackupFile(backupFilePath: string): Promise<RollbackResult> {
        try {
            console.log('🔍 Validating backup file...');

            if (!fs.existsSync(backupFilePath)) {
                return {
                    success: false,
                    message: `Backup file not found: ${backupFilePath}`
                };
            }

            const backupData: BackupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

            const validationResults = {
                hasValidStructure: true,
                hasRequiredTables: true,
                hasValidTimestamp: true,
                totalRecords: 0,
                errors: []
            };

            // Check backup structure
            if (!backupData.timestamp || !backupData.tables || !backupData.metadata) {
                validationResults.hasValidStructure = false;
                validationResults.errors.push('Backup file has invalid structure');
            }

            // Check timestamp validity
            const backupDate = new Date(backupData.timestamp);
            if (isNaN(backupDate.getTime())) {
                validationResults.hasValidTimestamp = false;
                validationResults.errors.push('Backup file has invalid timestamp');
            }

            // Count total records
            Object.values(backupData.tables).forEach(table => {
                if (Array.isArray(table)) {
                    validationResults.totalRecords += table.length;
                }
            });

            // Validate against metadata
            if (validationResults.totalRecords !== backupData.metadata.totalRecords) {
                validationResults.errors.push(
                    `Record count mismatch: found ${validationResults.totalRecords}, expected ${backupData.metadata.totalRecords}`
                );
            }

            const isValid = validationResults.hasValidStructure && 
                           validationResults.hasValidTimestamp && 
                           validationResults.errors.length === 0;

            return {
                success: isValid,
                message: isValid ? 'Backup file validation passed' : 'Backup file validation failed',
                data: {
                    ...validationResults,
                    backupTimestamp: backupData.timestamp,
                    migrationVersion: backupData.metadata.migrationVersion
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Backup validation failed: ${error.message}`
            };
        }
    }

    /**
     * Creates a pre-rollback backup of current state
     */
    async createPreRollbackBackup(): Promise<RollbackResult> {
        try {
            console.log('📦 Creating pre-rollback backup...');

            const timestamp = new Date().toISOString();
            const backupData: BackupData = {
                timestamp,
                tables: {},
                metadata: {
                    totalRecords: 0,
                    migrationVersion: '1.0.0',
                    databaseVersion: 'pre-rollback'
                }
            };

            // Backup all tables
            backupData.tables.users = await prisma.user.findMany();
            backupData.tables.organizations = await prisma.organization.findMany();
            backupData.tables.admins = await prisma.admin.findMany();
            backupData.tables.superAdmins = await prisma.superAdmin.findMany();
            backupData.tables.discountConfigs = await prisma.discountConfig.findMany();
            backupData.tables.routes = await prisma.route.findMany();
            backupData.tables.vehicles = await prisma.vehicle.findMany();
            backupData.tables.trips = await prisma.trip.findMany();
            backupData.tables.discountProfiles = await prisma.discountProfile.findMany();
            backupData.tables.verificationDocuments = await prisma.verificationDocument.findMany();

            // Calculate total records
            backupData.metadata.totalRecords = Object.values(backupData.tables)
                .reduce((total, table) => total + (Array.isArray(table) ? table.length : 0), 0);

            // Save backup
            const backupFileName = `pre-rollback-backup-${timestamp.replace(/[:.]/g, '-')}.json`;
            const backupFilePath = path.join(this.config.backupPath, backupFileName);

            if (!fs.existsSync(this.config.backupPath)) {
                fs.mkdirSync(this.config.backupPath, { recursive: true });
            }

            fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));

            return {
                success: true,
                message: `Pre-rollback backup created: ${backupFilePath}`,
                data: {
                    backupPath: backupFilePath,
                    totalRecords: backupData.metadata.totalRecords
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to create pre-rollback backup: ${error.message}`
            };
        }
    }

    /**
     * Performs the actual rollback operation
     */
    async performRollback(backupFilePath: string): Promise<RollbackResult> {
        try {
            console.log('🔄 Performing rollback operation...');

            const backupData: BackupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

            if (this.config.dryRun) {
                console.log('🧪 DRY RUN MODE - Simulating rollback operation');
                return {
                    success: true,
                    message: 'Rollback simulation completed successfully',
                    data: {
                        wouldRestore: backupData.metadata.totalRecords,
                        backupTimestamp: backupData.timestamp
                    }
                };
            }

            const rollbackStats = {
                tablesCleared: 0,
                recordsRestored: 0,
                errors: []
            };

            // Start transaction for rollback
            await prisma.$transaction(async (tx) => {
                // Step 1: Disable foreign key constraints (PostgreSQL specific)
                await tx.$executeRaw`SET session_replication_role = replica;`;

                try {
                    // Step 2: Clear existing data in reverse dependency order
                    const clearOrder = [
                        'verification_documents',
                        'discount_profiles', 
                        'trips',
                        'vehicles',
                        'routes',
                        'users',
                        'organizations',
                        'admins',
                        'super_admins',
                        'discount_configs'
                    ];

                    for (const tableName of clearOrder) {
                        await tx.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
                        rollbackStats.tablesCleared++;
                        console.log(`   🗑️  Cleared table: ${tableName}`);
                    }

                    // Step 3: Restore data from backup in dependency order
                    const restoreOrder = [
                        { table: 'super_admins', data: backupData.tables.superAdmins },
                        { table: 'admins', data: backupData.tables.admins },
                        { table: 'organizations', data: backupData.tables.organizations },
                        { table: 'users', data: backupData.tables.users },
                        { table: 'discount_configs', data: backupData.tables.discountConfigs },
                        { table: 'routes', data: backupData.tables.routes },
                        { table: 'vehicles', data: backupData.tables.vehicles },
                        { table: 'trips', data: backupData.tables.trips },
                        { table: 'discount_profiles', data: backupData.tables.discountProfiles },
                        { table: 'verification_documents', data: backupData.tables.verificationDocuments }
                    ];

                    for (const { table, data } of restoreOrder) {
                        if (data && Array.isArray(data) && data.length > 0) {
                            // Use appropriate Prisma method based on table
                            switch (table) {
                                case 'super_admins':
                                    await tx.superAdmin.createMany({ data, skipDuplicates: true });
                                    break;
                                case 'admins':
                                    await tx.admin.createMany({ data, skipDuplicates: true });
                                    break;
                                case 'organizations':
                                    await tx.organization.createMany({ data, skipDuplicates: true });
                                    break;
                                case 'users':
                                    await tx.user.createMany({ data, skipDuplicates: true });
                                    break;
                                case 'discount_configs':
                                    await tx.discountConfig.createMany({ data, skipDuplicates: true });
                                    break;
                                case 'routes':
                                    await tx.route.createMany({ data, skipDuplicates: true });
                                    break;
                                case 'vehicles':
                                    await tx.vehicle.createMany({ data, skipDuplicates: true });
                                    break;
                                case 'trips':
                                    await tx.trip.createMany({ data, skipDuplicates: true });
                                    break;
                                case 'discount_profiles':
                                    await tx.discountProfile.createMany({ data, skipDuplicates: true });
                                    break;
                                case 'verification_documents':
                                    await tx.verificationDocument.createMany({ data, skipDuplicates: true });
                                    break;
                            }
                            rollbackStats.recordsRestored += data.length;
                            console.log(`   ✅ Restored ${data.length} records to ${table}`);
                        }
                    }

                } finally {
                    // Step 4: Re-enable foreign key constraints
                    await tx.$executeRaw`SET session_replication_role = DEFAULT;`;
                }
            });

            return {
                success: true,
                message: `Rollback completed successfully. Restored ${rollbackStats.recordsRestored} records.`,
                data: rollbackStats
            };

        } catch (error) {
            return {
                success: false,
                message: `Rollback failed: ${error.message}`,
                errors: [error]
            };
        }
    }

    /**
     * Validates the database state after rollback
     */
    async validatePostRollbackState(): Promise<RollbackResult> {
        try {
            console.log('✅ Validating post-rollback state...');

            const validationResults = {
                recordCounts: {},
                constraintViolations: 0,
                dataIntegrity: true,
                errors: []
            };

            // Count records in each table
            validationResults.recordCounts = {
                superAdmins: await prisma.superAdmin.count(),
                admins: await prisma.admin.count(),
                organizations: await prisma.organization.count(),
                users: await prisma.user.count(),
                discountConfigs: await prisma.discountConfig.count(),
                routes: await prisma.route.count(),
                vehicles: await prisma.vehicle.count(),
                trips: await prisma.trip.count(),
                discountProfiles: await prisma.discountProfile.count(),
                verificationDocuments: await prisma.verificationDocument.count()
            };

            // Check foreign key constraints
            const orphanedAdmins = await prisma.admin.findMany({
                where: { superAdmin: null }
            });

            if (orphanedAdmins.length > 0) {
                validationResults.constraintViolations++;
                validationResults.errors.push(`Found ${orphanedAdmins.length} admins without super admin reference`);
            }

            const orphanedOrganizations = await prisma.organization.findMany({
                where: { admin: null }
            });

            if (orphanedOrganizations.length > 0) {
                validationResults.constraintViolations++;
                validationResults.errors.push(`Found ${orphanedOrganizations.length} organizations without admin reference`);
            }

            // Check data integrity
            const driversWithInvalidOrg = await prisma.user.findMany({
                where: {
                    role: 'DRIVER',
                    organizationId: { not: null }
                },
                include: { organization: true }
            });

            const invalidDrivers = driversWithInvalidOrg.filter(user => !user.organization);
            if (invalidDrivers.length > 0) {
                validationResults.dataIntegrity = false;
                validationResults.errors.push(`Found ${invalidDrivers.length} drivers with invalid organization references`);
            }

            const isValid = validationResults.constraintViolations === 0 && 
                           validationResults.dataIntegrity && 
                           validationResults.errors.length === 0;

            return {
                success: isValid,
                message: isValid ? 'Post-rollback validation passed' : 'Post-rollback validation failed',
                data: validationResults
            };
        } catch (error) {
            return {
                success: false,
                message: `Post-rollback validation failed: ${error.message}`
            };
        }
    }

    /**
     * Lists available backup files
     */
    listAvailableBackups(): string[] {
        try {
            if (!fs.existsSync(this.config.backupPath)) {
                return [];
            }

            return fs.readdirSync(this.config.backupPath)
                .filter(file => file.endsWith('.json'))
                .sort((a, b) => b.localeCompare(a)); // Most recent first
        } catch (error) {
            console.error(`Failed to list backups: ${error.message}`);
            return [];
        }
    }
}

/**
 * Main rollback execution function
 */
async function runRollback() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const backupFile = args.find(arg => arg.startsWith('--backup-file='))?.split('=')[1];
    const backupPath = args.find(arg => arg.startsWith('--backup-path='))?.split('=')[1];
    const skipValidation = args.includes('--skip-validation');
    const skipPreBackup = args.includes('--skip-pre-backup');

    console.log('🔄 Rollback Script for Multi-Tier Authentication System');
    console.log('=' .repeat(60));

    const rollbackService = new RollbackService({
        dryRun,
        backupPath: backupPath || './migration-backups',
        validateBeforeRollback: !skipValidation,
        createPreRollbackBackup: !skipPreBackup
    });

    try {
        // List available backups if no specific file provided
        if (!backupFile) {
            console.log('\n📁 Available backup files:');
            const backups = rollbackService.listAvailableBackups();
            
            if (backups.length === 0) {
                console.log('   No backup files found');
                process.exit(1);
            }

            backups.forEach((backup, index) => {
                console.log(`   ${index + 1}. ${backup}`);
            });

            console.log('\nPlease specify a backup file using --backup-file=<filename>');
            process.exit(1);
        }

        const backupFilePath = path.isAbsolute(backupFile) 
            ? backupFile 
            : path.join(rollbackService['config'].backupPath, backupFile);

        // Rollback process steps
        const steps = [
            { 
                name: 'Validate Backup File', 
                fn: () => rollbackService.validateBackupFile(backupFilePath),
                required: true
            },
            { 
                name: 'Create Pre-Rollback Backup', 
                fn: () => rollbackService.createPreRollbackBackup(),
                required: !skipPreBackup
            },
            { 
                name: 'Perform Rollback', 
                fn: () => rollbackService.performRollback(backupFilePath),
                required: true
            },
            { 
                name: 'Validate Post-Rollback State', 
                fn: () => rollbackService.validatePostRollbackState(),
                required: !skipValidation
            }
        ];

        const results = [];

        for (const step of steps) {
            if (!step.required) {
                console.log(`\n⏭️  Skipping ${step.name}...`);
                continue;
            }

            console.log(`\n📝 ${step.name}...`);
            const result = await step.fn();
            results.push({ step: step.name, ...result });
            
            console.log(`   ${result.success ? '✅' : '❌'} ${result.message}`);
            if (result.data) {
                console.log(`   📊 Data:`, JSON.stringify(result.data, null, 2));
            }

            if (!result.success) {
                console.error(`\n💥 Rollback failed at step: ${step.name}`);
                if (result.errors) {
                    console.error('   Errors:', result.errors);
                }
                process.exit(1);
            }
        }

        console.log('\n🎉 Rollback completed successfully!');
        console.log('\n📊 Summary:');
        results.forEach(result => {
            console.log(`   ${result.success ? '✅' : '❌'} ${result.step}`);
        });

    } catch (error) {
        console.error('💥 Rollback failed with error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the rollback if this script is executed directly
if (require.main === module) {
    runRollback();
}

export { RollbackService };