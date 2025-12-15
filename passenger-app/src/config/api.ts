import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the backend URL based on environment and platform
const getBaseUrl = () => {
  // In Expo development, we can use the manifest to get the correct URL
  if (__DEV__ && Constants.expoConfig?.hostUri) {
    // Extract the IP from Expo's hostUri and use our backend port
    const host = Constants.expoConfig.hostUri.split(':')[0];
    return `http://${host}:3001`;
  }
  
  // For web platform, always use localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:3001';
  }
  
  // For production or when hostUri is not available
  // You should replace this with your actual production API URL
  return 'http://localhost:3001';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
    'X-App-Context': 'passenger-app',
  },
};

console.log('🌐 API Configuration:', {
  BASE_URL: API_CONFIG.BASE_URL,
  PLATFORM: Platform.OS,
  DEV_MODE: __DEV__,
  EXPO_HOST: Constants.expoConfig?.hostUri,
});