# SPTM Driver App

React Native mobile application for bus drivers with real-time tracking, route management, and passenger communication.

## Features

- 🚌 Real-time GPS tracking and route navigation
- 👥 Driver authentication with organization support
- 📱 Passenger pickup/drop-off management
- 🔔 Push notifications for route updates
- 📊 Trip reporting and analytics
- 🛡️ Secure token-based authentication

## Prerequisites

- Node.js 18+
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)
- iOS Simulator or Android Emulator

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Install iOS pods (iOS only)
cd ios && pod install && cd ..

# Start Metro bundler
npm start
```

### Running the App

```bash
# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on specific device
npm run android -- --deviceId=DEVICE_ID
```

## Configuration

### Environment Setup

The app connects to the backend API. Ensure the backend is running and update the API endpoints in:

```typescript
// src/services/endpoints.ts
export const API_BASE_URL = 'http://your-backend-url:3000';
```

### Authentication

The app supports multi-tier authentication:
- Organization-based login
- Driver role verification
- Secure token storage with AsyncStorage

## Project Structure

```
driver-app/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # App screens
│   ├── services/        # API services & auth
│   ├── utils/           # Utilities & helpers
│   ├── types/           # TypeScript definitions
│   └── navigation/      # Navigation setup
├── assets/              # Images, fonts, etc.
└── android/ios/         # Platform-specific code
```

## Troubleshooting

### Common Issues

**TurboModule Error**: If you encounter `TurboModuleRegistry.getEnforcing(...): 'PlatformConstants' could not be found`:
```bash
./fix-turbo-module.sh
```

**AsyncStorage Issues**: For AsyncStorage-related errors:
```bash
./fix-runtime.sh
```

**Network Issues**: Ensure your device/emulator can reach the backend API. For Android emulator, use `10.0.2.2` instead of `localhost`.

### Development Tips

- Use `npm run reset-cache` to clear Metro cache
- For debugging, enable remote debugging in the dev menu
- Check `react-native doctor` for environment issues

## Building for Production

### Android
```bash
cd android
./gradlew assembleRelease
```

### iOS
```bash
# Open in Xcode and build
open ios/DriverApp.xcworkspace
```

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

3. Run on device/simulator:
```bash
npm run android  # For Android
npm run ios      # For iOS
npm run web      # For web browser
```

## Features (To be implemented)
- Route management
- Passenger count tracking
- Real-time location sharing
- Trip logging