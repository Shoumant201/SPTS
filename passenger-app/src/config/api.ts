import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the backend URL based on environment and platform
// This function is called dynamically to support network changes
export const getBaseUrl = () => {
  // In Expo development, we can use the manifest to get the correct URL
  if (__DEV__ && Constants.expoConfig?.hostUri) {
    const hostUri = Constants.expoConfig.hostUri;
    
    // Check if using Expo tunnel (contains .exp.direct)
    if (hostUri.includes('.exp.direct')) {
      console.log('⚠️ Expo tunnel detected:', hostUri);
      console.log('⚠️ Tunnel mode does not work with local backend!');
      console.log('⚠️ Please restart Expo without --tunnel flag:');
      console.log('⚠️   npx expo start');
      console.log('⚠️ Or use LAN mode for same network access');
      
      // Return a placeholder that will fail with a clear error
      return 'http://tunnel-not-supported:3001';
    }
    
    // Extract the IP from Expo's hostUri and use our backend port
    const host = hostUri.split(':')[0];
    const url = `http://${host}:3001`;
    console.log('🌐 Dynamic API URL:', url, 'from hostUri:', hostUri);
    return url;
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
  get BASE_URL() {
    return getBaseUrl();
  },
  TIMEOUT: 10000,
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