const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure for React Native 0.81.5 / Expo SDK 54 (legacy architecture)
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add support for additional asset extensions
config.resolver.assetExts.push('otf', 'ttf', 'svg');

// Configure transformer for legacy architecture (disable new arch features)
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
  enableBabelRCLookup: false,
};

// Disable new architecture features to prevent TurboModule issues
config.resolver.unstable_enablePackageExports = false;

module.exports = config;