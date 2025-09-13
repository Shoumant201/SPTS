# Passenger Mobile App (Expo)

Expo TypeScript app for passengers using the SPTM system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

## Running the App

### Development Server
```bash
npm start
```

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

### Web
```bash
npm run web
```

## Development with Expo

- **Expo Go App**: Install Expo Go on your phone and scan the QR code
- **Development Build**: For testing native features
- **Web Preview**: Test in browser during development
- **Hot Reload**: Changes reflect instantly

## Environment Variables

Configure the following in your `.env` file:
- EXPO_PUBLIC_API_URL: Backend API endpoint
- EXPO_PUBLIC_ENVIRONMENT: development/staging/production

## Features

- Find nearby bus stops
- Track real-time arrivals
- Plan your journey
- Purchase tickets

## Expo Features Used

- TypeScript support
- React Navigation
- StatusBar component
- Safe Area Context