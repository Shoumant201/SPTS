'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { RouteStop } from '../services/api/routes';

// Fix Leaflet default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom numbered marker
const createNumberedIcon = (number: number, isFirst: boolean, isLast: boolean) => {
  const color = isFirst ? '#16a34a' : isLast ? '#dc2626' : '#2563eb';
  return L.divIcon({
    html: `<div style="background:${color};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">${number}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export interface RouteMapEditorProps {
  stops: RouteStop[];
  onStopsChange: (stops: RouteStop[]) => void;
}

const RouteMapEditor: React.FC<RouteMapEditorProps> = ({ stops, onStopsChange }) => {
  // Nepal center coordinates
  const center: [number, number] = stops.length > 0
    ? [stops[0].lat, stops[0].lng]
    : [27.7172, 85.3240]; // Kathmandu

  const handleMapClick = (lat: number, lng: number) => {
    const newStop: RouteStop = {
      name: `Stop ${stops.length + 1}`,
      lat,
      lng,
      order: stops.length + 1,
    };
    onStopsChange([...stops, newStop]);
  };

  const polylinePoints: [number, number][] = stops
    .sort((a, b) => a.order - b.order)
    .map(s => [s.lat, s.lng]);

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-dark-600">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '420px', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onMapClick={handleMapClick} />

        {/* Draw route line */}
        {polylinePoints.length > 1 && (
          <Polyline positions={polylinePoints} color="#2563eb" weight={3} opacity={0.8} />
        )}

        {/* Stop markers */}
        {stops.map((stop, i) => (
          <Marker
            key={i}
            position={[stop.lat, stop.lng]}
            icon={createNumberedIcon(stop.order, i === 0, i === stops.length - 1)}
          >
            <Popup>
              <div className="text-sm">
                <strong>{stop.name}</strong>
                <br />
                Stop #{stop.order}
                <br />
                <span className="text-gray-500">{stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="px-3 py-2 bg-gray-50 dark:bg-dark-700 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-4">
        <span>🟢 Start &nbsp; 🔵 Stop &nbsp; 🔴 End</span>
        <span>Click anywhere on the map to add a stop</span>
      </div>
    </div>
  );
};

export default RouteMapEditor;
