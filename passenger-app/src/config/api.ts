import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the backend URL based on environment and platform
// This function is called dynamically to support network changes
export const getBaseUrl = () => {
  // Production backend URL
  const PRODUCTION_URL = 'https://spts.onrender.com';
  
  // In development, you can use local backend for testing
  // Uncomment and set your local IP if needed
  // if (__DEV__ && Constants.expoConfig?.hostUri) {
  //   const hostUri = Constants.expoConfig.hostUri;
  //   if (!hostUri.includes('.exp.direct')) {
  //     const host = hostUri.split(':')[0];
  //     return `http://${host}:3001`;
  //   }
  // }
  
  // Always use production URL
  return PRODUCTION_URL;
};

export const API_CONFIG = {
  get BASE_URL() {
    return getBaseUrl();
  },
  TIMEOUT: 30000, // Increased for production API
  HEADERS: {
    'Content-Type': 'application/json',
    'X-App-Context': 'passenger-app',
  },
};

console.log('🌐 API Configuration initialized:', {
  BASE_URL: API_CONFIG.BASE_URL,
  PLATFORM: Platform.OS,
  DEV_MODE: __DEV__,
  EXPO_HOST: Constants.expoConfig?.hostUri,
});