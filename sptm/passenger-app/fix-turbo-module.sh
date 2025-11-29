#!/bin/bash

echo "🔧 Fixing TurboModule 'PlatformConstants' error for Passenger App..."

echo "🗑️ Removing node_modules and cache..."
rm -rf node_modules .expo

echo "🧹 Clearing npm cache..."
npm cache clean --force

echo "📦 Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps

echo "🚀 Starting with cleared cache..."
npx expo start --clear --port 8081

echo "✅ TurboModule fix complete!"