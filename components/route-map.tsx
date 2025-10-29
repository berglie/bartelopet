'use client';

import dynamic from 'next/dynamic';

// Dynamically import Mapbox map (client-side only)
const MapboxMap = dynamic(
  () => import('./route-map-mapbox'),
  { ssr: false, loading: () => <div className="w-full h-[500px] md:h-[600px] bg-card animate-pulse rounded-2xl" /> }
);

export function RouteMap({ year }: { year?: number }) {
  // Always show Mapbox map now that token is configured
  return <MapboxMap year={year} />;
}
