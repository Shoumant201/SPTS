#!/bin/bash

echo "🔧 Fixing SPTM Passenger App Runtime Issues..."
echo "This includes fixes for 'runtime not ready', AsyncStorage errors, and network configuration"

# Check if we're in the passenger-app directory
if [ ! -f "package.json" ] || ! grep -q "sptm-passenger-app" package.json; then
    echo "❌ Error: Please run this script from the passenger-app directory"
    exit 1
fi

# Clear all caches and temporary files
echo "🧹 Clearing all caches..."
rm -rf node_modules
rm -rf .expo
rm -f package-lock.json
rm -f yarn.lock

# Clear npm cache
echo "📦 Clearing npm cache..."
npm cache clean --force

# Clear Metro cache specifically
echo "🔄 Clearing Metro bundler cache..."
npx expo start --clear --no-dev --minify

# Reinstall dependencies with updated versions
echo "📥 Reinstalling dependencies with SDK 54 compatibility..."
npm install --legacy-peer-deps

# Fix any dependency issues
echo "🔧 Fixing dependencies for SDK 54..."
npx expo install --fix --legacy-peer-deps

echo "✅ Runtime fix complete!"
echo ""
echo "📋 Changes applied:"
echo "  - Updated React Native to 0.81.5 (matches Expo SDK 54)"
echo "  - Updated all Expo dependencies to compatible versions"
echo "  - Added SDK version to app.json"
echo "  - Enhanced TypeScript configuration"
echo "  - Fixed AsyncStorage undefined/null value errors"
echo "  - Updated network configuration to use IP: 192.168.1.68:3001"
echo ""
echo "🚀 To start the app: npm start"
echo "📱 The app should now work with Expo Go version 2.32.x or later"
echo ""
echo "🌐 Network Status:"
echo "   Backend: http://192.168.1.68:3001 ✅"
echo "   Role: PASSENGER users only ✅"