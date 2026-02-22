#!/usr/bin/env tsx

/**
 * Documentation Monitoring Script
 * 
 * This script monitors documentation health and generates regular reports
 * for maintenance and improvement tracking.
 */

import fs from 'fs';
import path from 'path';
import { DocumentationValidator } from './validate-docs';
import { CoverageChecker } from './check-coverage';
import { ExampleTester } from './test-examples';

interface MonitoringReport {
    timestamp: string;
    period: string;
    validation: {
        status: 'pass' | 'fail';
        errors: number;
        warnings: number;
    };
    coverage: {
        percentage: number;
        totalEndpoints: number;
        documentedEndpoints: number;
        trend: 'up' | 'down' | 'stable';
    };
    examples: {
        successRate: number;
        totalExamples: number;
        passedExamples: number;
        trend: 'up' | 'down' | 'stable';
    };
    recommendations: string[];
    alerts: string[];
}

class DocumentationMonitor {
    private reportPath: string;
    private historyPath: string;

    constructor() {
        this.reportPath = path.join(__dirname, '../docs/monitoring-report.json');
        this.historyPath = path.join(__dirname, '../docs/monitoring-history.json');
    }

    async generateReport(period: string = 'daily'): Promise<MonitoringReport> {
        console.log('📊 Generating documentation monitoring report...\n');

        const report: MonitoringReport = {
            timestamp: new Date().toISOString(),
            period,
            validation: { status: 'pass', errors: 0, warnings: 0 },
            coverage: { percentage: 0, totalEndpoints: 0, documentedEndpoints: 0, trend: 'stable' },
            examples: { successRate: 0, totalExamples: 0, passedExamples: 0, trend: 'stable' },
            recommendations: [],
            alerts: []
        };

        try {
            // 1. Run validation
            const validator = new DocumentationValidator();
            const validationResult = await validator.validate();

            report.validation = {
                status: validationResult.valid ? 'pass' : 'fail',
                errors: validationResult.errors.length,
                warnings: validationResult.warnings.length
            };

            // 2. Check coverage
            const coverageChecker = new CoverageChecker();
            const coverageResult = await coverageChecker.generateReport();

            report.coverage = {
                percentage: coverageResult.coveragePercentage,
                totalEndpoints: coverageResult.totalEndpoints,
                documentedEndpoints: coverageResult.documentedEndpoints,
                trend: this.calculateTrend('coverage', coverageResult.coveragePercentage)
            };

            // 3. Test examples
            const exampleTester = new ExampleTester();
            const exampleResult = await exampleTester.runTests();

            report.examples = {
                successRate: exampleResult.successRate,
                totalExamples: exampleResult.totalExamples,
                passedExamples: exampleResult.passedExamples,
                trend: this.calculateTrend('examples', exampleResult.successRate)
            };

            // 4. Generate recommendations and alerts
            this.generateRecommendations(report);
            this.generateAlerts(report);

            // 5. Save report and update history
            this.saveReport(report);
            this.updateHistory(report);

            return report;

        } catch (error) {
            console.error('Monitoring report generation failed:', error);
            throw error;
        }
    }

    private calculateTrend(metric: string, currentValue: number): 'up' | 'down' | 'stable' {
        try {
            const history = this.loadHistory();
            if (history.length < 2) return 'stable';

            const previousReport = history[history.length - 2];
            let previousValue: number;

            switch (metric) {
                case 'coverage':
                    previousValue = previousReport.coverage.percentage;
                    break;
                case 'examples':
                    previousValue = previousReport.examples.successRate;
                    break;
                default:
                    return 'stable';
            }

            const difference = currentValue - previousValue;
            const threshold = 2; // 2% threshold for trend detection

            if (difference > threshold) return 'up';
            if (difference < -threshold) return 'down';
            return 'stable';

        } catch (error) {
            return 'stable';
        }
    }

    private generateRecommendations(report: MonitoringReport): void {
        // Coverage recommendations
        if (report.coverage.percentage < 80) {
            report.recommendations.push(
                `Documentation coverage is ${report.coverage.percentage}%. Target: 80%+`
            );
        }

        if (report.coverage.trend === 'down') {
            report.recommendations.push(
                'Documentation coverage is declining. Review recent endpoint additions.'
            );
        }

        // Validation recommendations
        if (report.validation.errors > 0) {
            report.recommendations.push(
                `Fix ${report.validation.errors} validation errors to improve documentation quality.`
            );
        }

        if (report.validation.warnings > 5) {
            report.recommendations.push(
                `Address ${report.validation.warnings} warnings to prevent future issues.`
            );
        }

        // Example recommendations
        if (report.examples.successRate < 90) {
            report.recommendations.push(
                `Example success rate is ${report.examples.successRate}%. Review and fix failing examples.`
            );
        }

        if (report.examples.trend === 'down') {
            report.recommendations.push(
                'Example success rate is declining. Check for API changes affecting examples.'
            );
        }

        // General recommendations
        if (report.coverage.totalEndpoints > report.coverage.documentedEndpoints + 10) {
            report.recommendations.push(
                'Many endpoints are undocumented. Consider a documentation sprint.'
            );
        }
    }

    private generateAlerts(report: MonitoringReport): void {
        // Critical alerts
        if (report.validation.status === 'fail') {
            report.alerts.push('🚨 CRITICAL: Documentation validation is failing');
        }

        if (report.coverage.percentage < 50) {
            report.alerts.push('🚨 CRITICAL: Documentation coverage is below 50%');
        }

        // Warning alerts
        if (report.coverage.percentage < 70) {
            report.alerts.push('⚠️ WARNING: Documentation coverage is below 70%');
        }

        if (report.examples.successRate < 80) {
            report.alerts.push('⚠️ WARNING: Example success rate is below 80%');
        }

        if (report.validation.errors > 5) {
            report.alerts.push('⚠️ WARNING: High number of validation errors');
        }

        // Trend alerts
        if (report.coverage.trend === 'down') {
            report.alerts.push('📉 TREND: Documentation coverage is declining');
        }

        if (report.examples.trend === 'down') {
            report.alerts.push('📉 TREND: Example success rate is declining');
        }
    }

    private saveReport(report: MonitoringReport): void {
        try {
            // Ensure docs directory exists
            const docsDir = path.dirname(this.reportPath);
            if (!fs.existsSync(docsDir)) {
                fs.mkdirSync(docsDir, { recursive: true });
            }

            fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2));
            console.log(`📄 Monitoring report saved to: ${this.reportPath}`);
        } catch (error) {
            console.warn(`Warning: Could not save monitoring report: ${error.message}`);
        }
    }

    private updateHistory(report: MonitoringReport): void {
        try {
            let history = this.loadHistory();

            // Add current report to history
            history.push(report);

            // Keep only last 30 reports
            if (history.length > 30) {
                history = history.slice(-30);
            }

            fs.writeFileSync(this.historyPath, JSON.stringify(history, null, 2));
        } catch (error) {
            console.warn(`Warning: Could not update monitoring history: ${error.message}`);
        }
    }

    private loadHistory(): MonitoringReport[] {
        try {
            if (fs.existsSync(this.historyPath)) {
                const content = fs.readFileSync(this.historyPath, 'utf-8');
                return JSON.parse(content);
            }
        } catch (error) {
            console.warn(`Warning: Could not load monitoring history: ${error.message}`);
        }
        return [];
    }

    printSummary(report: MonitoringReport): void {
        console.log('\n📊 Documentation Health Summary');
        console.log('================================');
        console.log(`Report Period: ${report.period}`);
        console.log(`Generated: ${new Date(report.timestamp).toLocaleString()}`);

        console.log('\n✅ Validation Status:');
        console.log(`   Status: ${report.validation.status === 'pass' ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   Errors: ${report.validation.errors}`);
        console.log(`   Warnings: ${report.validation.warnings}`);

        console.log('\n📊 Coverage Metrics:');
        console.log(`   Coverage: ${report.coverage.percentage}% ${this.getTrendIcon(report.coverage.trend)}`);
        console.log(`   Documented: ${report.coverage.documentedEndpoints}/${report.coverage.totalEndpoints}`);

        console.log('\n🧪 Example Testing:');
        console.log(`   Success Rate: ${report.examples.successRate}% ${this.getTrendIcon(report.examples.trend)}`);
        console.log(`   Passed: ${report.examples.passedExamples}/${report.examples.totalExamples}`);

        if (report.alerts.length > 0) {
            console.log('\n🚨 Alerts:');
            report.alerts.forEach(alert => console.log(`   ${alert}`));
        }

        if (report.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            report.recommendations.forEach(rec => console.log(`   • ${rec}`));
        }
    }

    private getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
        switch (trend) {
            case 'up': return '📈';
            case 'down': return '📉';
            case 'stable': return '➡️';
        }
    }

    // Method to generate different types of reports
    async generateWeeklyReport(): Promise<MonitoringReport> {
        return this.generateReport('weekly');
    }

    async generateMonthlyReport(): Promise<MonitoringReport> {
        return this.generateReport('monthly');
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const period = args[0] || 'daily';

    try {
        const monitor = new DocumentationMonitor();
        const report = await monitor.generateReport(period);
        monitor.printSummary(report);

        // Exit with error code if there are critical alerts
        const hasCriticalAlerts = report.alerts.some(alert => alert.includes('CRITICAL'));
        process.exit(hasCriticalAlerts ? 1 : 0);

    } catch (error) {
        console.error('Documentation monitoring failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export { DocumentationMonitor };