# Migration and Deployment Scripts

This directory contains production-safe migration and deployment scripts for the Multi-Tier Authentication System. These scripts provide comprehensive data migration, rollback capabilities, zero-downtime deployment, and data validation.

## Scripts Overview

### 1. Production Migration (`production-migration.ts`)

Handles the migration of existing data to the new multi-tier authentication structure with comprehensive safety checks.

**Features:**
- Pre-migration validation
- Backup creation before migration
- Batch processing for large datasets
- Rollback capability on failure
- Post-migration validation
- Dry-run mode for testing

**Usage:**
```bash
# Run migration with all safety checks
npx ts-node scripts/production-migration.ts

# Dry run to test migration without making changes
npx ts-node scripts/production-migration.ts --dry-run

# Custom backup path
npx ts-node scripts/production-migration.ts --backup-path=/custom/backup/path

# Rollback to a specific backup
npx ts-node scripts/production-migration.ts --rollback --backup-file=backup-2024-01-01.json
```

### 2. Rollback Migration (`rollback-migration.ts`)

Provides comprehensive rollback capabilities for failed migrations with data restoration and validation.

**Features:**
- Backup file validation
- Pre-rollback backup creation
- Transaction-based rollback
- Foreign key constraint management
- Post-rollback validation
- Dry-run mode

**Usage:**
```bash
# List available backups
npx ts-node scripts/rollback-migration.ts

# Rollback to specific backup
npx ts-node scripts/rollback-migration.ts --backup-file=backup-2024-01-01.json

# Dry run rollback
npx ts-node scripts/rollback-migration.ts --backup-file=backup-2024-01-01.json --dry-run

# Skip pre-rollback backup
npx ts-node scripts/rollback-migration.ts --backup-file=backup-2024-01-01.json --skip-pre-backup

# Skip validation steps
npx ts-node scripts/rollback-migration.ts --backup-file=backup-2024-01-01.json --skip-validation
```

### 3. Zero-Downtime Deployment (`zero-downtime-deployment.sh`)

Handles production deployment with minimal service interruption using blue-green deployment principles.

**Features:**
- Pre-deployment validation
- Database and application backups
- Health checks
- Automatic rollback on failure
- Blue-green deployment simulation
- Comprehensive logging

**Usage:**
```bash
# Full deployment with all checks
./scripts/zero-downtime-deployment.sh

# Skip tests (faster deployment)
./scripts/zero-downtime-deployment.sh --skip-tests

# Skip database migration
./scripts/zero-downtime-deployment.sh --skip-migration

# Custom health check URL
./scripts/zero-downtime-deployment.sh --health-check-url http://localhost:4000/health

# Force deployment (ignore health check failures)
./scripts/zero-downtime-deployment.sh --force
```

### 4. Data Validation (`data-validation.ts`)

Provides comprehensive data validation to verify migration integrity and system health.

**Features:**
- Data integrity validation
- Relationship integrity checks
- Database constraint validation
- Password security validation
- Business logic validation
- Performance metrics
- Detailed reporting

**Usage:**
```bash
# Run all validations
npx ts-node scripts/data-validation.ts

# Verbose output with detailed results
npx ts-node scripts/data-validation.ts --verbose

# Save report to file
npx ts-node scripts/data-validation.ts --output=validation-report.json

# Skip specific validation types
npx ts-node scripts/data-validation.ts --skip-passwords --skip-relationships
```

## Migration Workflow

### Standard Migration Process

1. **Pre-Migration Setup**
   ```bash
   # Ensure database is accessible
   npm run db:test-connection
   
   # Run tests to ensure system stability
   npm test
   ```

2. **Create Backup**
   ```bash
   # The migration script will create backups automatically
   # But you can create manual backups if needed
   pg_dump $DATABASE_URL > manual-backup-$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Run Migration**
   ```bash
   # Test migration first
   npx ts-node scripts/production-migration.ts --dry-run
   
   # Run actual migration
   npx ts-node scripts/production-migration.ts
   ```

4. **Validate Migration**
   ```bash
   # Comprehensive validation
   npx ts-node scripts/data-validation.ts --verbose --output=post-migration-report.json
   ```

5. **Deploy Application**
   ```bash
   # Zero-downtime deployment
   ./scripts/zero-downtime-deployment.sh
   ```

### Emergency Rollback Process

If migration fails or issues are discovered:

1. **Immediate Rollback**
   ```bash
   # List available backups
   npx ts-node scripts/rollback-migration.ts
   
   # Rollback to latest backup
   npx ts-node scripts/rollback-migration.ts --backup-file=backup-YYYY-MM-DD.json
   ```

2. **Validate Rollback**
   ```bash
   # Ensure system is back to working state
   npx ts-node scripts/data-validation.ts --verbose
   ```

3. **Restart Services**
   ```bash
   # Restart application services
   npm run restart
   ```

## Configuration

### Environment Variables

The scripts use the following environment variables:

```bash
# Database connection
DATABASE_URL=postgresql://user:password@localhost:5432/database

# Health check configuration
HEALTH_CHECK_URL=http://localhost:3000/health

# Backup configuration
BACKUP_RETENTION_DAYS=30
MAX_BACKUP_SIZE=1GB
```

### Script Configuration

Each script accepts configuration through command-line arguments:

- `--dry-run`: Test mode without making actual changes
- `--verbose`: Detailed output and logging
- `--backup-path`: Custom backup directory
- `--skip-*`: Skip specific validation or process steps
- `--force`: Override safety checks (use with caution)

## Safety Features

### Backup Strategy

- **Automatic Backups**: All scripts create backups before making changes
- **Multiple Backup Types**: Database dumps, application state, configuration files
- **Backup Validation**: Verify backup integrity before proceeding
- **Retention Policy**: Automatic cleanup of old backups

### Validation Layers

1. **Pre-Migration Validation**
   - Database connectivity
   - Data integrity checks
   - Constraint validation
   - Dependency verification

2. **Migration Validation**
   - Step-by-step verification
   - Transaction rollback on errors
   - Progress tracking
   - Error logging

3. **Post-Migration Validation**
   - Data consistency checks
   - Relationship integrity
   - Performance validation
   - Business logic verification

### Error Handling

- **Graceful Degradation**: Scripts continue where possible, log errors
- **Automatic Rollback**: Failed migrations trigger automatic rollback
- **Detailed Logging**: Comprehensive logs for troubleshooting
- **Exit Codes**: Proper exit codes for CI/CD integration

## Monitoring and Logging

### Log Files

All scripts generate detailed logs:

- **Migration Logs**: `migration-backups/migration-TIMESTAMP.log`
- **Deployment Logs**: `deployment-backups/deployment-TIMESTAMP.log`
- **Validation Reports**: `validation-report-TIMESTAMP.json`

### Log Levels

- **INFO**: Normal operation messages
- **WARN**: Warnings that don't stop execution
- **ERROR**: Errors that require attention
- **DEBUG**: Detailed debugging information

### Monitoring Integration

The scripts are designed to integrate with monitoring systems:

- **Exit Codes**: 0 for success, 1 for failure
- **JSON Reports**: Machine-readable validation reports
- **Health Checks**: Built-in health check endpoints
- **Metrics**: Performance and timing metrics

## Troubleshooting

### Common Issues

1. **Database Connection Failures**
   ```bash
   # Check database connectivity
   psql $DATABASE_URL -c "SELECT 1;"
   
   # Verify environment variables
   echo $DATABASE_URL
   ```

2. **Migration Timeout**
   ```bash
   # Increase timeout in script configuration
   # Or run migration in smaller batches
   npx ts-node scripts/production-migration.ts --batch-size=50
   ```

3. **Rollback Failures**
   ```bash
   # Manual database restore
   psql $DATABASE_URL < backup-file.sql
   
   # Restart application
   npm run restart
   ```

4. **Validation Errors**
   ```bash
   # Run specific validation
   npx ts-node scripts/data-validation.ts --verbose --skip-passwords
   
   # Check specific issues
   npx ts-node scripts/data-validation.ts --output=debug-report.json
   ```

### Recovery Procedures

1. **Partial Migration Failure**
   - Check migration logs for specific errors
   - Fix data issues manually if needed
   - Re-run migration from checkpoint

2. **Complete Migration Failure**
   - Use rollback script to restore previous state
   - Investigate root cause
   - Fix issues and retry migration

3. **Deployment Failure**
   - Check deployment logs
   - Verify health check endpoints
   - Use rollback if necessary

## Best Practices

### Before Migration

1. **Test in Staging**: Always test migration in staging environment first
2. **Backup Everything**: Create comprehensive backups
3. **Schedule Maintenance**: Plan migration during low-traffic periods
4. **Team Coordination**: Ensure team is aware of migration schedule

### During Migration

1. **Monitor Progress**: Watch logs and metrics
2. **Be Ready to Rollback**: Have rollback plan ready
3. **Communicate Status**: Keep stakeholders informed
4. **Document Issues**: Log any problems encountered

### After Migration

1. **Validate Thoroughly**: Run comprehensive validation
2. **Monitor Performance**: Watch for performance issues
3. **Update Documentation**: Document any changes made
4. **Plan Next Steps**: Schedule follow-up validations

## Security Considerations

### Data Protection

- **Encryption**: Backups are stored securely
- **Access Control**: Restrict script execution permissions
- **Audit Logging**: All operations are logged
- **Sensitive Data**: Passwords and tokens are masked in logs

### Network Security

- **Database Access**: Use secure connections
- **API Endpoints**: Validate health check URLs
- **File Permissions**: Restrict backup file access
- **Environment Variables**: Secure configuration management

## Performance Optimization

### Large Dataset Handling

- **Batch Processing**: Process data in configurable batches
- **Connection Pooling**: Efficient database connections
- **Memory Management**: Monitor memory usage during migration
- **Progress Tracking**: Show migration progress

### Resource Management

- **CPU Usage**: Monitor CPU during intensive operations
- **Disk Space**: Ensure adequate space for backups
- **Network Bandwidth**: Consider network impact
- **Database Load**: Monitor database performance

## Integration with CI/CD

### Pipeline Integration

```yaml
# Example GitHub Actions workflow
- name: Run Migration
  run: |
    npx ts-node scripts/production-migration.ts --dry-run
    npx ts-node scripts/production-migration.ts

- name: Validate Migration
  run: |
    npx ts-node scripts/data-validation.ts --output=validation-report.json

- name: Deploy Application
  run: |
    ./scripts/zero-downtime-deployment.sh --skip-tests
```

### Automated Testing

- **Pre-deployment Tests**: Run test suite before migration
- **Migration Tests**: Validate migration in test environment
- **Post-deployment Tests**: Smoke tests after deployment
- **Rollback Tests**: Test rollback procedures regularly

## Support and Maintenance

### Regular Maintenance

- **Backup Cleanup**: Remove old backups regularly
- **Log Rotation**: Manage log file sizes
- **Performance Monitoring**: Regular performance checks
- **Security Updates**: Keep dependencies updated

### Documentation Updates

- **Script Changes**: Document any script modifications
- **Process Updates**: Update procedures as needed
- **Lessons Learned**: Document issues and solutions
- **Team Training**: Keep team updated on procedures

For additional support or questions about these scripts, please refer to the project documentation or contact the development team.