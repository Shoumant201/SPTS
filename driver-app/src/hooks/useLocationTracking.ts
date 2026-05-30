import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import axiosInstance from '../services/axiosInstance';

const INTERVAL_MS = 15000; // send every 15 seconds

export function useLocationTracking(isActive: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const permissionGranted = useRef(false);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    permissionGranted.current = status === 'granted';
    return permissionGranted.current;
  }, []);

  const sendLocation = useCallback(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await axiosInstance.post('/api/location', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        heading: location.coords.heading,
        speed: location.coords.speed,
        isOnShift: true,
      });
    } catch (err) {
      console.warn('Location send failed:', err);
    }
  }, []);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    let cancelled = false;

    const start = async () => {
      const granted = permissionGranted.current || (await requestPermission());
      if (!granted || cancelled) return;

      sendLocation();
      intervalRef.current = setInterval(sendLocation, INTERVAL_MS);
    };

    start();

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, requestPermission, sendLocation]);

  return { requestPermission };
}
