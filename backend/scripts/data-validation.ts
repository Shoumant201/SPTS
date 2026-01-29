#!/usr/bin/env ts-node

/**
 * Data Validation Script for Multi-Tier Authentication System
 * 
 * This script provides comprehensive data validation to verify migration integrity,
 * check data consistency, and ensure system health after deployment.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface ValidationConfig {
    verbose: boolean;
    outputFile?: string;
    checkPasswords: boolean;
    checkRelationships: boolean;
    checkConstraints: boolean;
    generateReport: boolean;
}

interface ValidationResult {
    success: boolean;
    message: string;
    data?: any;
    errors?: any[];
    warnings?: any[];
}

interface ValidationReport {
    timestamp: string;
    overallStatus: 'PASS' | 'FAIL' | 'WARNING';
    summary: {
        totalChecks: number;
        passed: number;
        failed: number;
        warnings: number;
    };
    details: {
        dataIntegrity: ValidationResult;
        relationshipIntegrity: ValidationResult;
        constraintValidation: ValidationResult;
        passwordValidation: ValidationResult;
        businessLogicValidation: ValidationResult;
        performanceMetrics: ValidationResult;
    };
    recommendations: string[];
}

class DataValidationService {
    private config: ValidationConfig;
    private report: ValidationReport;

    constructor(config: Partial<ValidationConfig> = {}) {
        this.config = {
            verbose: config.verbose ?? false,
            outputFile: config.outputFile,
            checkPasswords: config.checkPasswords ?? true,
            checkRelationships: config.checkRelationships ?? true,
            checkConstraints: config.checkConstraints ?? true,
            generateReport: config.generateReport ?? true
        };

        this.report = {
            timestamp: new Date().toISOString(),
            overallStatus: 'PASS',
            summary: {
                totalChecks: 0,
                passed: 0,
                failed: 0,
                warnings: 0
            },
            details: {} as any,
            recommendations: []
        };
    }

    /**
     * Validates data integrity across all authentication tables
     */
    async validateDataIntegrity(): Promise<ValidationResult> {
        try {
            console.log('🔍 Validating data integrity...');

            const integrityChecks = {
                duplicateEmails: [],
                invalidEmails: [],
                missingRequiredFields: [],
                dataTypeViolations: []
            };

            // Check for duplicate emails across all auth tables
            const allEmails = new Map<string, string[]>();

            const users = await prisma.user.findMany({ select: { email: true } });
            const organizations = await prisma.organization.findMany({ select: { email: true } });
            const admins = await prisma.admin.findMany({ select: { email: true } });
            const superAdmins = await prisma.superAdmin.findMany({ select: { email: true } });

            // Collect emails from all tables
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
            allEmails.forEach((tables, email) => {
                if (tables.length > 1) {
                    integrityChecks.duplicateEmails.push({
                        email,
                        foundIn: tables
                    });
                }
            });

            // Validate email formats
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            for (const user of users) {
                if (!emailRegex.test(user.email)) {
                    integrityChecks.invalidEmails.push({
                        table: 'users',
                        email: user.email
                    });
                }
            }

            // Check for missing required fields
            const usersWithMissingData = await prisma.user.findMany({
                where: {
                    OR: [
                        { email: { equals: '' } },
                        { password: { equals: '' } },
                        { name: null }
                    ]
                }
            });

            integrityChecks.missingRequiredFields.push(...usersWithMissingData.map(u => ({
                table: 'users',
                id: u.id,
                issues: [
                    !u.email && 'missing email',
                    !u.password && 'missing password',
                    !u.name && 'missing name'
                ].filter(Boolean)
            })));

            const hasErrors = integrityChecks.duplicateEmails.length > 0 ||
                            integrityChecks.invalidEmails.length > 0 ||
                            integrityChecks.missingRequiredFields.length > 0;

            return {
                success: !hasErrors,
                message: hasErrors ? 'Data integrity issues found' : 'Data integrity validation passed',
                data: integrityChecks,
                errors: hasErrors ? [integrityChecks] : undefined
            };
        } catch (error) {
            return {
                success: false,
                message: `Data integrity validation failed: ${error.message}`,
                errors: [error]
            };
        }
    }

    /**
     * Validates relationship integrity between tables
     */
    async validateRelationshipIntegrity(): Promise<ValidationResult> {
        try {
            console.log('🔗 Validating relationship integrity...');

            const relationshipChecks = {
                orphanedAdmins: [],
                orphanedOrganizations: [],
                orphanedDrivers: [],
                invalidReferences: []
            };

            // Check admins without valid super admin references
            const orphanedAdmins = await prisma.admin.findMany({
                where: {
                    superAdmin: null
                },
                select: { id: true, email: true, createdBy: true }
            });

            relationshipChecks.orphanedAdmins = orphanedAdmins;

            // Check organizations without valid admin references
            const orphanedOrganizations = await prisma.organization.findMany({
                where: {
                    admin: null
                },
                select: { id: true, email: true, createdBy: true }
            });

            relationshipChecks.orphanedOrganizations = orphanedOrganizations;

            // Check drivers without valid organization references
            const driversWithOrganization = await prisma.user.findMany({
                where: {
                    role: 'DRIVER',
                    organizationId: { not: null }
                },
                include: { organization: true }
            });

            const orphanedDrivers = driversWithOrganization.filter(driver => !driver.organization);
            relationshipChecks.orphanedDrivers = orphanedDrivers.map(d => ({
                id: d.id,
                email: d.email,
                organizationId: d.organizationId
            }));

            // Check for circular references (shouldn't happen but good to verify)
            const adminsWithSelfReference = await prisma.admin.findMany({
                where: {
                    id: { equals: prisma.admin.fields.createdBy }
                }
            });

            if (adminsWithSelfReference.length > 0) {
                relationshipChecks.invalidReferences.push({
                    type: 'circular_reference',
                    table: 'admins',
                    count: adminsWithSelfReference.length
                });
            }

            const hasErrors = relationshipChecks.orphanedAdmins.length > 0 ||
                            relationshipChecks.orphanedOrganizations.length > 0 ||
                            relationshipChecks.orphanedDrivers.length > 0 ||
                            relationshipChecks.invalidReferences.length > 0;

            return {
                success: !hasErrors,
                message: hasErrors ? 'Relationship integrity issues found' : 'Relationship integrity validation passed',
                data: relationshipChecks,
                errors: hasErrors ? [relationshipChecks] : undefined
            };
        } catch (error) {
            return {
                success: false,
                message: `Relationship integrity validation failed: ${error.message}`,
                errors: [error]
            };
        }
    }

    /**
     * Validates database constraints and indexes
     */
    async validateConstraints(): Promise<ValidationResult> {
        try {
            console.log('⚡ Validating database constraints...');

            const constraintChecks = {
                uniqueConstraints: [],
                foreignKeyConstraints: [],
                checkConstraints: [],
                indexPerformance: []
            };

            // Test unique constraints by attempting to find duplicates
            const duplicateEmailsInUsers = await prisma.$queryRaw`
                SELECT email, COUNT(*) as count 
                FROM users 
                GROUP BY email 
                HAVING COUNT(*) > 1
            `;

            if (Array.isArray(duplicateEmailsInUsers) && duplicateEmailsInUsers.length > 0) {
                constraintChecks.uniqueConstraints.push({
                    table: 'users',
                    constraint: 'unique_email',
                    violations: duplicateEmailsInUsers
                });
            }

            // Check foreign key constraints by looking for orphaned records
            const orphanedTrips = await prisma.$queryRaw`
                SELECT t.id, t.userId, t.routeId, t.vehicleId
                FROM trips t
                LEFT JOIN users u ON t.userId = u.id
                LEFT JOIN routes r ON t.routeId = r.id
                LEFT JOIN vehicles v ON t.vehicleId = v.id
                WHERE u.id IS NULL OR r.id IS NULL OR (t.vehicleId IS NOT NULL AND v.id IS NULL)
            `;

            if (Array.isArray(orphanedTrips) && orphanedTrips.length > 0) {
                constraintChecks.foreignKeyConstraints.push({
                    table: 'trips',
                    issue: 'orphaned_records',
                    count: orphanedTrips.length
                });
            }

            // Check enum constraints
            const invalidUserRoles = await prisma.$queryRaw`
                SELECT id, role 
                FROM users 
                WHERE role NOT IN ('DRIVER', 'PASSENGER')
            `;

            if (Array.isArray(invalidUserRoles) && invalidUserRoles.length > 0) {
                constraintChecks.checkConstraints.push({
                    table: 'users',
                    constraint: 'valid_role',
                    violations: invalidUserRoles
                });
            }

            // Basic index performance check
            const slowQueries = await this.checkIndexPerformance();
            constraintChecks.indexPerformance = slowQueries;

            const hasErrors = constraintChecks.uniqueConstraints.length > 0 ||
                            constraintChecks.foreignKeyConstraints.length > 0 ||
                            constraintChecks.checkConstraints.length > 0;

            const hasWarnings = constraintChecks.indexPerformance.length > 0;

            return {
                success: !hasErrors,
                message: hasErrors ? 'Constraint violations found' : 'Constraint validation passed',
                data: constraintChecks,
                errors: hasErrors ? [constraintChecks] : undefined,
                warnings: hasWarnings ? constraintChecks.indexPerformance : undefined
            };
        } catch (error) {
            return {
                success: false,
                message: `Constraint validation failed: ${error.message}`,
                errors: [error]
            };
        }
    }

    /**
     * Validates password hashing and security
     */
    async validatePasswords(): Promise<ValidationResult> {
        try {
            console.log('🔐 Validating password security...');

            const passwordChecks = {
                unhashedPasswords: [],
                weakHashes: [],
                invalidHashes: []
            };

            // Check all authentication tables for password issues
            const tables = [
                { name: 'users', model: prisma.user },
                { name: 'organizations', model: prisma.organization },
                { name: 'admins', model: prisma.admin },
                { name: 'super_admins', model: prisma.superAdmin }
            ];

            for (const table of tables) {
                const records = await table.model.findMany({
                    select: { id: true, email: true, password: true }
                });

                for (const record of records) {
                    // Check if password is hashed (bcrypt format)
                    if (!record.password.startsWith('$2a$') && !record.password.startsWith('$2b$')) {
                        passwordChecks.unhashedPasswords.push({
                            table: table.name,
                            id: record.id,
                            email: record.email
                        });
                    } else {
                        // Check hash strength (bcrypt rounds)
                        const hashParts = record.password.split('$');
                        if (hashParts.length >= 4) {
                            const rounds = parseInt(hashParts[2]);
                            if (rounds < 10) {
                                passwordChecks.weakHashes.push({
                                    table: table.name,
                                    id: record.id,
                                    email: record.email,
                                    rounds
                                });
                            }
                        } else {
                            passwordChecks.invalidHashes.push({
                                table: table.name,
                                id: record.id,
                                email: record.email
                            });
                        }
                    }
                }
            }

            const hasErrors = passwordChecks.unhashedPasswords.length > 0 ||
                            passwordChecks.invalidHashes.length > 0;

            const hasWarnings = passwordChecks.weakHashes.length > 0;

            return {
                success: !hasErrors,
                message: hasErrors ? 'Password security issues found' : 'Password validation passed',
                data: passwordChecks,
                errors: hasErrors ? [passwordChecks] : undefined,
                warnings: hasWarnings ? passwordChecks.weakHashes : undefined
            };
        } catch (error) {
            return {
                success: false,
                message: `Password validation failed: ${error.message}`,
                errors: [error]
            };
        }
    }

    /**
     * Validates business logic rules
     */
    async validateBusinessLogic(): Promise<ValidationResult> {
        try {
            console.log('📋 Validating business logic rules...');

            const businessChecks = {
                driversWithoutOrganization: [],
                passengersWithOrganization: [],
                invalidDiscountProfiles: [],
                inconsistentTripData: []
            };

            // Rule: Drivers should have an organization
            const driversWithoutOrg = await prisma.user.findMany({
                where: {
                    role: 'DRIVER',
                    organizationId: null
                },
                select: { id: true, email: true, name: true }
            });

            businessChecks.driversWithoutOrganization = driversWithoutOrg;

            // Rule: Passengers should not have an organization
            const passengersWithOrg = await prisma.user.findMany({
                where: {
                    role: 'PASSENGER',
                    organizationId: { not: null }
                },
                select: { id: true, email: true, name: true, organizationId: true }
            });

            businessChecks.passengersWithOrganization = passengersWithOrg;

            // Rule: Discount profiles should have valid user references
            const invalidDiscountProfiles = await prisma.discountProfile.findMany({
                where: {
                    user: null
                },
                select: { id: true, userId: true, discountType: true }
            });

            businessChecks.invalidDiscountProfiles = invalidDiscountProfiles;

            // Rule: Trip final price should be base price minus discount
            const inconsistentTrips = await prisma.trip.findMany({
                where: {
                    finalPrice: {
                        not: {
                            equals: prisma.trip.fields.basePrice
                        }
                    },
                    discountApplied: 0
                },
                select: { id: true, basePrice: true, finalPrice: true, discountApplied: true }
            });

            // Filter trips where finalPrice != basePrice - discountApplied
            const actuallyInconsistent = inconsistentTrips.filter(trip => 
                Math.abs(trip.finalPrice - (trip.basePrice - trip.discountApplied)) > 0.01
            );

            businessChecks.inconsistentTripData = actuallyInconsistent;

            const hasErrors = businessChecks.invalidDiscountProfiles.length > 0 ||
                            businessChecks.inconsistentTripData.length > 0;

            const hasWarnings = businessChecks.driversWithoutOrganization.length > 0 ||
                              businessChecks.passengersWithOrganization.length > 0;

            return {
                success: !hasErrors,
                message: hasErrors ? 'Business logic violations found' : 'Business logic validation passed',
                data: businessChecks,
                errors: hasErrors ? [businessChecks] : undefined,
                warnings: hasWarnings ? [businessChecks] : undefined
            };
        } catch (error) {
            return {
                success: false,
                message: `Business logic validation failed: ${error.message}`,
                errors: [error]
            };
        }
    }

    /**
     * Checks basic performance metrics
     */
    async validatePerformanceMetrics(): Promise<ValidationResult> {
        try {
            console.log('⚡ Checking performance metrics...');

            const performanceMetrics = {
                tableSizes: {},
                queryPerformance: [],
                indexUsage: []
            };

            // Get table sizes
            const tables = ['users', 'organizations', 'admins', 'super_admins', 'trips', 'routes', 'vehicles'];
            
            for (const table of tables) {
                const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table}`);
                performanceMetrics.tableSizes[table] = Array.isArray(count) ? count[0] : count;
            }

            // Basic query performance test
            const startTime = Date.now();
            await prisma.user.findMany({
                where: { role: 'DRIVER' },
                include: { organization: true }
            });
            const queryTime = Date.now() - startTime;

            if (queryTime > 1000) { // More than 1 second
                performanceMetrics.queryPerformance.push({
                    query: 'user_with_organization',
                    duration: queryTime,
                    warning: 'Query took longer than expected'
                });
            }

            return {
                success: true,
                message: 'Performance metrics collected',
                data: performanceMetrics,
                warnings: performanceMetrics.queryPerformance.length > 0 ? performanceMetrics.queryPerformance : undefined
            };
        } catch (error) {
            return {
                success: false,
                message: `Performance metrics collection failed: ${error.message}`,
                errors: [error]
            };
        }
    }

    /**
     * Checks index performance
     */
    private async checkIndexPerformance(): Promise<any[]> {
        try {
            // This is a simplified check - in production you'd use more sophisticated queries
            const slowQueries = [];

            // Check if email lookups are fast
            const startTime = Date.now();
            await prisma.user.findUnique({ where: { email: 'test@example.com' } });
            const duration = Date.now() - startTime;

            if (duration > 100) {
                slowQueries.push({
                    query: 'user_email_lookup',
                    duration,
                    recommendation: 'Consider adding or optimizing email index'
                });
            }

            return slowQueries;
        } catch (error) {
            return [{
                error: error.message,
                recommendation: 'Unable to check index performance'
            }];
        }
    }

    /**
     * Generates a comprehensive validation report
     */
    async generateValidationReport(): Promise<ValidationReport> {
        console.log('📊 Generating comprehensive validation report...');

        const validations = [
            { name: 'dataIntegrity', fn: () => this.validateDataIntegrity() },
            { name: 'relationshipIntegrity', fn: () => this.validateRelationshipIntegrity() },
            { name: 'constraintValidation', fn: () => this.validateConstraints() },
            { name: 'passwordValidation', fn: () => this.validatePasswords() },
            { name: 'businessLogicValidation', fn: () => this.validateBusinessLogic() },
            { name: 'performanceMetrics', fn: () => this.validatePerformanceMetrics() }
        ];

        for (const validation of validations) {
            if (!this.config.checkPasswords && validation.name === 'passwordValidation') {
                continue;
            }
            if (!this.config.checkRelationships && validation.name === 'relationshipIntegrity') {
                continue;
            }
            if (!this.config.checkConstraints && validation.name === 'constraintValidation') {
                continue;
            }

            const result = await validation.fn();
            this.report.details[validation.name] = result;
            this.report.summary.totalChecks++;

            if (result.success) {
                this.report.summary.passed++;
            } else {
                this.report.summary.failed++;
                this.report.overallStatus = 'FAIL';
            }

            if (result.warnings && result.warnings.length > 0) {
                this.report.summary.warnings++;
                if (this.report.overallStatus === 'PASS') {
                    this.report.overallStatus = 'WARNING';
                }
            }
        }

        // Generate recommendations
        this.generateRecommendations();

        return this.report;
    }

    /**
     * Generates recommendations based on validation results
     */
    private generateRecommendations(): void {
        const recommendations = [];

        // Check each validation result for specific recommendations
        Object.entries(this.report.details).forEach(([key, result]) => {
            if (!result.success && result.errors) {
                switch (key) {
                    case 'dataIntegrity':
                        recommendations.push('Fix duplicate emails and missing required fields');
                        break;
                    case 'relationshipIntegrity':
                        recommendations.push('Repair orphaned records and invalid foreign key references');
                        break;
                    case 'constraintValidation':
                        recommendations.push('Address constraint violations and consider index optimization');
                        break;
                    case 'passwordValidation':
                        recommendations.push('Rehash weak passwords and fix invalid password formats');
                        break;
                    case 'businessLogicValidation':
                        recommendations.push('Review and fix business logic violations');
                        break;
                }
            }

            if (result.warnings && result.warnings.length > 0) {
                recommendations.push(`Review warnings in ${key} validation`);
            }
        });

        if (recommendations.length === 0) {
            recommendations.push('All validations passed - system is healthy');
        }

        this.report.recommendations = recommendations;
    }

    /**
     * Saves the validation report to a file
     */
    async saveReport(report: ValidationReport): Promise<void> {
        if (this.config.outputFile) {
            const reportJson = JSON.stringify(report, null, 2);
            fs.writeFileSync(this.config.outputFile, reportJson);
            console.log(`📄 Validation report saved to: ${this.config.outputFile}`);
        }
    }
}

/**
 * Main validation execution function
 */
async function runDataValidation() {
    const args = process.argv.slice(2);
    const verbose = args.includes('--verbose');
    const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1];
    const skipPasswords = args.includes('--skip-passwords');
    const skipRelationships = args.includes('--skip-relationships');
    const skipConstraints = args.includes('--skip-constraints');

    console.log('🔍 Data Validation Script for Multi-Tier Authentication System');
    console.log('=' .repeat(65));

    const validationService = new DataValidationService({
        verbose,
        outputFile,
        checkPasswords: !skipPasswords,
        checkRelationships: !skipRelationships,
        checkConstraints: !skipConstraints,
        generateReport: true
    });

    try {
        const report = await validationService.generateValidationReport();

        console.log('\n📊 Validation Summary:');
        console.log('=' .repeat(40));
        console.log(`Overall Status: ${report.overallStatus}`);
        console.log(`Total Checks: ${report.summary.totalChecks}`);
        console.log(`Passed: ${report.summary.passed}`);
        console.log(`Failed: ${report.summary.failed}`);
        console.log(`Warnings: ${report.summary.warnings}`);

        if (verbose || report.overallStatus !== 'PASS') {
            console.log('\n📋 Detailed Results:');
            Object.entries(report.details).forEach(([key, result]) => {
                const status = result.success ? '✅' : '❌';
                console.log(`${status} ${key}: ${result.message}`);
                
                if (verbose && result.data) {
                    console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`);
                }
            });
        }

        if (report.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            report.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec}`);
            });
        }

        if (outputFile) {
            await validationService.saveReport(report);
        }

        console.log(`\n🎯 Validation completed with status: ${report.overallStatus}`);
        process.exit(report.overallStatus === 'FAIL' ? 1 : 0);

    } catch (error) {
        console.error('💥 Validation failed with error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Show usage information
function showUsage() {
    console.log('Usage: npx ts-node scripts/data-validation.ts [OPTIONS]');
    console.log('');
    console.log('Options:');
    console.log('  --verbose              Show detailed validation results');
    console.log('  --output=FILE          Save validation report to file');
    console.log('  --skip-passwords       Skip password validation checks');
    console.log('  --skip-relationships   Skip relationship integrity checks');
    console.log('  --skip-constraints     Skip database constraint checks');
    console.log('');
    console.log('Examples:');
    console.log('  npx ts-node scripts/data-validation.ts');
    console.log('  npx ts-node scripts/data-validation.ts --verbose --output=validation-report.json');
    console.log('  npx ts-node scripts/data-validation.ts --skip-passwords');
}

// Handle script arguments
if (process.argv.includes('--help')) {
    showUsage();
    process.exit(0);
}

// Run validation if this script is executed directly
if (require.main === module) {
    runDataValidation();
}

export { DataValidationService };