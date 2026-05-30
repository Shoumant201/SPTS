-- Fix Failed Migration in Prisma Migration History
-- This script marks the failed migration as rolled back so new migrations can proceed

-- Step 1: Check current migration status
SELECT migration_name, finished_at, rolled_back_at, logs 
FROM "_prisma_migrations" 
WHERE migration_name = '20260405034324_enhance_trips_for_drivers';

-- Step 2: Mark the failed migration as rolled back
UPDATE "_prisma_migrations"
SET 
  rolled_back_at = NOW(),
  logs = 'Migration manually rolled back - duplicate migration removed from codebase'
WHERE migration_name = '20260405034324_enhance_trips_for_drivers';

-- Step 3: Verify the update
SELECT migration_name, finished_at, rolled_back_at, logs 
FROM "_prisma_migrations" 
WHERE migration_name = '20260405034324_enhance_trips_for_drivers';

-- Alternative: Delete the failed migration record entirely (use if UPDATE doesn't work)
-- DELETE FROM "_prisma_migrations" 
-- WHERE migration_name = '20260405034324_enhance_trips_for_drivers';
