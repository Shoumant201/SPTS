# SPTM Passenger App

React Native mobile application for passengers to book rides, track buses in real-time, and manage their public transport experience.

## Features

- 🚌 Real-time bus tracking and ETA predictions
- 📍 Route planning and navigation
- 🎫 Digital ticket booking and management
- 💳 Integrated payment system
- 📱 User-friendly interface with accessibility support
- 🔔 Push notifications for bus arrivals
- 📊 Trip history and analytics
- 🛡️ Secure user authentication

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

# Run on web (for testing)
npm run web

# Run on specific device
npm run android -- --deviceId=DEVICE_ID
```

## Configuration

### Environment Setup

Configure API endpoints in:

```typescript
// src/services/endpoints.ts
export const API_BASE_URL = 'http://your-backend-url:3000';
export const ML_SERVICE_URL = 'http://your-ml-service:5000';
```

### Authentication

The app supports:
- Email/phone registration and login
- Social media authentication (planned)
- Secure token storage
- Biometric authentication (planned)

## Project Structure

```
passenger-app/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # App screens (Home, Booking, Profile)
│   ├── services/        # API services & auth
│   ├── utils/           # Utilities & helpers
│   ├── types/           # TypeScript definitions
│   └── navigation/      # Navigation setup
├── assets/              # Images, fonts, icons
└── android/ios/         # Platform-specific code
```

## Key Screens

- **Home**: Real-time bus locations and nearby stops
- **Booking**: Route selection and ticket booking
- **Tracking**: Live bus tracking with ETA
- **Profile**: User account and trip history
- **Payment**: Wallet and payment methods

## Troubleshooting

### Common Issues

**Registration Issues**: Ensure backend API is running and accessible.

**AsyncStorage Errors**: Run the fix script:
```bash
./fix-runtime.sh
```

**TurboModule Issues**: Fix architecture conflicts:
```bash
./fix-turbo-module.sh
```

**Network Connectivity**: For Android emulator, use `10.0.2.2` instead of `localhost` for API calls.

### Development Tips

- Use Flipper for debugging network requests
- Enable remote debugging for JavaScript debugging
- Use `react-native doctor` to check development environment

## Building for Production

### Android
```bash
cd android
./gradlew assembleRelease
```

### iOS
```bash
# Open in Xcode and build
open ios/PassengerApp.xcworkspace
```

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests (if configured)
npm run test:e2e
```

## Contributing

1. Follow React Native best practices
2. Use TypeScript for type safety
3. Write tests for new features
4. Follow the existing code style