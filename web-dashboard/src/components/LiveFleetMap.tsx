'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axiosInstance from '../services/axiosInstance';

// Fix Leaflet default icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const busIcon = L.divIcon({
  html: `<div style="background:#2563eb;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">🚌</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface DriverLocation {
  id: string;
  driverId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  recordedAt: string;
  driver: {
    id: string;
    name: string | null;
    phone: string;
    assignments: Array<{
      vehicle: { plateNumber: string; type: string };
      route: { name: string; routeNumber: string | null };
    }>;
  };
}

// Recenter map when first locations arrive
function AutoCenter({ locations }: { locations: DriverLocation[] }) {
  const map = useMap();
  const centered = useRef(false);
  useEffect(() => {
    if (!centered.current && locations.length > 0) {
      map.setView([locations[0].latitude, locations[0].longitude], 13);
      centered.current = true;
    }
  }, [locations, map]);
  return null;
}

const POLL_INTERVAL = 15000; // 15s

export const LiveFleetMap: React.FC = () => {
  const [locations, setLocations] = useState<DriverLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/location/live');
      setLocations(res.data.locations || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch live locations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
    const timer = setInterval(fetchLocations, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchLocations]);

  // Default center: Kathmandu
  const defaultCenter: [number, number] = [27.7172, 85.324];

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-green-600 dark:text-green-400">LIVE</span>
          <h3 className="font-semibold text-gray-900 dark:text-white">Live Fleet Map</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {locations.length} driver{locations.length !== 1 ? 's' : ''} on shift
          </span>
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="h-72 relative">
        {loading ? (
          <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-dark-700">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading live positions...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={defaultCenter}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <AutoCenter locations={locations} />
            {locations.map((loc) => {
              const assignment = loc.driver.assignments[0];
              const ageMs = Date.now() - new Date(loc.recordedAt).getTime();
              const isStale = ageMs > 60000; // older than 1 min
              return (
                <Marker
                  key={loc.driverId}
                  position={[loc.latitude, loc.longitude]}
                  icon={busIcon}
                  opacity={isStale ? 0.5 : 1}
                >
                  <Popup>
                    <div className="text-sm min-w-[160px]">
                      <p className="font-semibold">{loc.driver.name || loc.driver.phone}</p>
                      {assignment && (
                        <>
                          <p className="text-gray-600">{assignment.vehicle.plateNumber}</p>
                          <p className="text-gray-500 text-xs">
                            {assignment.route.routeNumber ? `#${assignment.route.routeNumber} ` : ''}
                            {assignment.route.name}
                          </p>
                        </>
                      )}
                      {loc.speed != null && (
                        <p className="text-gray-400 text-xs mt-1">{Math.round(loc.speed * 3.6)} km/h</p>
                      )}
                      <p className="text-gray-400 text-xs">
                        {isStale ? '⚠️ Stale' : '● Live'} · {new Date(loc.recordedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            {locations.length === 0 && !loading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
                <div className="bg-white/90 rounded-lg px-4 py-3 text-center shadow">
                  <p className="text-sm text-gray-500">No drivers on shift</p>
                </div>
              </div>
            )}
          </MapContainer>
        )}
      </div>
    </div>
  );
};
