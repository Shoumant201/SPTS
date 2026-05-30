import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  city?: string;
  loading: boolean;
  error: string | null;
}

export function usePassengerLocation() {
  const [location, setLocation] = useState<LocationData>({
    latitude: 0,
    longitude: 0,
    accuracy: null,
    city: 'Loading...',
    loading: true,
    error: null,
  });

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }, []);

  const getCityName = useCallback(async (lat: number, lon: number): Promise<string> => {
    try {
      const [result] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon,
      });
      
      if (result) {
        // Prefer city, then subregion, then region
        return result.city || result.subregion || result.region || 'Unknown';
      }
      return 'Unknown';
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return 'Unknown';
    }
  }, []);

  const updateLocation = useCallback(async () => {
    try {
      setLocation(prev => ({ ...prev, loading: true, error: null }));

      const granted = await requestPermission();
      if (!granted) {
        setLocation({
          latitude: 0,
          longitude: 0,
          accuracy: null,
          city: 'Location Disabled',
          loading: false,
          error: 'Location permission denied',
        });
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude, accuracy } = position.coords;
      
      // Get city name in background
      const city = await getCityName(latitude, longitude);

      setLocation({
        latitude,
        longitude,
        accuracy,
        city,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Location update failed:', error);
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to get location',
      }));
    }
  }, [requestPermission, getCityName]);

  useEffect(() => {
    updateLocation();
  }, [updateLocation]);

  return {
    location,
    updateLocation,
    requestPermission,
  };
}
