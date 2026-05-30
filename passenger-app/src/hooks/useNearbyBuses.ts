import { useState, useEffect, useCallback } from 'react';
import { busApi, NearbyBus } from '../services/api/buses';

interface UseNearbyBusesProps {
  latitude: number;
  longitude: number;
  radius?: number;
  enabled?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function useNearbyBuses({
  latitude,
  longitude,
  radius = 5,
  enabled = true,
  refreshInterval = 30000, // 30 seconds default
}: UseNearbyBusesProps) {
  const [buses, setBuses] = useState<NearbyBus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNearbyBuses = useCallback(async () => {
    if (!enabled || latitude === 0 || longitude === 0) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await busApi.getNearbyBuses(latitude, longitude, radius);
      
      setBuses(response.buses);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to fetch nearby buses:', err);
      setError(err.message || 'Failed to fetch nearby buses');
      setBuses([]);
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, radius, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchNearbyBuses();
  }, [fetchNearbyBuses]);

  // Auto-refresh
  useEffect(() => {
    if (!enabled || !refreshInterval) return;

    const interval = setInterval(() => {
      fetchNearbyBuses();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchNearbyBuses, enabled, refreshInterval]);

  return {
    buses,
    loading,
    error,
    lastUpdated,
    refresh: fetchNearbyBuses,
    nearestBus: buses.length > 0 ? buses[0] : null,
  };
}
