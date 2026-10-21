'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { RouteMapVariant } from './route-map-mapbox';

const placeholder = (variant: RouteMapVariant = 'classic') => (
  <div
    className={
      variant === 'trail'
        ? 'h-[500px] w-full animate-pulse border-2 border-foreground bg-card md:h-[600px]'
        : 'h-[500px] w-full animate-pulse rounded-2xl bg-card md:h-[600px]'
    }
  />
);

// Dynamically import Mapbox map (client-side only)
const MapboxMap = dynamic(() => import('./route-map-mapbox'), {
  ssr: false,
  loading: () => placeholder(),
});

export function RouteMap({
  year,
  variant,
  lazy = false,
}: {
  year?: number;
  variant?: RouteMapVariant;
  /** Wait until the map is near the viewport before loading Mapbox. */
  lazy?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!lazy);

  useEffect(() => {
    if (visible || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  if (!visible) return <div ref={ref}>{placeholder(variant)}</div>;
  return <MapboxMap year={year} variant={variant} />;
}
