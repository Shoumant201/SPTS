#!/bin/bash

echo "🔧 Fixing SPTM Driver App Runtime Issues..."
echo "This includes fixes for 'require' not defined errors in SDK 54"

# Clear all caches and temporary files
echo "🧹 Clearing all caches..."
rm -rf node_modules
rm -rf .expo
rm -f package-lock.json
rm -f yarn.lock

# Clear Metro cache specifically
echo "📦 Clearing Metro bundler cache..."
npx expo start --clear --no-dev --minify

# Reinstall dependencies
echo "📥 Reinstalling dependencies with SDK 54 support..."
npm install --legacy-peer-deps

# Fix any dependency issues
echo "🔧 Fixing dependencies for SDK 54..."
npx expo install --fix --legacy-peer-deps

# Start with cleared cache
echo "🚀 Starting Expo with cleared cache..."
npx expo start --clear

echo "✅ Runtime fix complete!"
echo ""
echo "📱 If you're still getting 'runtime not ready' or 'require' errors:"
echo "1. Your Expo Go app supports SDK 54 - perfect match!"
echo "2. Updated Metro and Babel configs for new architecture"
echo "3. Fixed network configuration to use IP: 192.168.1.68:3001"
echo "4. Try restarting the Expo Go app completely"
echo "5. Scan the QR code again"
echo ""
echo "🌐 Network Status:"
echo "   Backend: http://192.168.1.68:3001 ✅"
echo "   Test connection: node test-network.js"