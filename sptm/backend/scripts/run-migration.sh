#!/bin/bash

# Multi-Tier Authentication System Migration Script
# This script runs the complete migration process

set -e  # Exit on any error

echo "🚀 Starting Multi-Tier Authentication System Migration"
echo "======================================================"

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please create it with DATABASE_URL"
    exit 1
fi

echo "📝 Step 1: Running database migration..."
npm run db:migrate

echo ""
echo "📝 Step 2: Seeding initial data..."
npm run db:seed

echo ""
echo "📝 Step 3: Validating migration..."
npm run db:validate

echo ""
echo "✅ Migration completed successfully!"
echo ""
echo "📋 Default accounts have been created. Check the migration guide for credentials."
echo "📖 See backend/prisma/MIGRATION_GUIDE.md for detailed information."