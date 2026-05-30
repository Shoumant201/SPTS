'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Loading component for maps
const MapLoadingFallback = () => (
  <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-dark-700">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
      <p className="text-sm text-gray-500">Loading map...</p>
    </div>
  </div>
);

// Dynamically import LiveFleetMap with no SSR
export const DynamicLiveFleetMap = dynamic(
  () => import('./LiveFleetMap').then((mod) => ({ default: mod.LiveFleetMap })),
  {
    ssr: false,
    loading: MapLoadingFallback,
  }
);

// Dynamically import RouteMapEditor with no SSR
export const DynamicRouteMapEditor = dynamic(
  () => import('./RouteMapEditor'),
  {
    ssr: false,
    loading: MapLoadingFallback,
  }
);
