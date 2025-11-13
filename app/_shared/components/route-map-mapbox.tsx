'use client';

import { useState, useEffect, useRef } from 'react';
import Map, { Source, Layer, Marker, type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { loadGPXRoute, getRouteCenter, getRouteZoom, type RouteData } from '@/app/_shared/lib/gpx-loader';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Free parking location
const PARKING_LOCATION = {
  longitude: 5.713827,
  latitude: 58.966044,
};

// Default Stavanger center
const DEFAULT_CENTER = {
  longitude: 5.7331,
  latitude: 58.9700,
  zoom: 13,
};

// Example fallback route (if no GPX file is found)
const FALLBACK_ROUTE: RouteData = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates: [
      [5.7331, 58.9700], // Start
      [5.7350, 58.9720],
      [5.7380, 58.9740],
      [5.7420, 58.9750],
      [5.7450, 58.9730],
      [5.7470, 58.9700],
      [5.7450, 58.9670],
      [5.7400, 58.9650],
      [5.7360, 58.9670],
      [5.7331, 58.9700], // End (loop back to start)
    ],
  },
};

// Map styles
const MAP_STYLES = {
  natt: 'mapbox://styles/mapbox/dark-v11',
  gater: 'mapbox://styles/mapbox/streets-v12',
  satelitt: 'mapbox://styles/mapbox/satellite-streets-v12',
};

type MapStyleKey = keyof typeof MAP_STYLES;

// Custom Zoom Control Component
function CustomZoomControl({ mapRef }: { mapRef: React.RefObject<MapRef | null> }) {
  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleResetNorth = () => {
    mapRef.current?.resetNorth();
  };

  return (
    <div className="absolute top-6 right-6 bg-card/95 backdrop-blur-sm rounded-xl shadow-lg border border-primary/30 overflow-hidden">
      <div className="flex flex-col">
        <button
          onClick={handleZoomIn}
          className="px-3 py-2 text-lg font-semibold text-foreground hover:bg-muted transition-colors border-b border-primary/20"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="px-3 py-2 text-lg font-semibold text-foreground hover:bg-muted transition-colors border-b border-primary/20"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          onClick={handleResetNorth}
          className="px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          aria-label="Reset north"
          title="Reset north"
        >
          N
        </button>
      </div>
    </div>
  );
}

export default function RouteMapMapbox({ year = 2025 }: { year?: number }) {
  const [routeData, setRouteData] = useState<RouteData>(FALLBACK_ROUTE);
  const [viewState, setViewState] = useState(DEFAULT_CENTER);
  const [isLoading, setIsLoading] = useState(true);
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('gater');
  const [isMobile, setIsMobile] = useState(false);
  const mapRef = useRef<MapRef | null>(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Try to load GPX file from public folder (year-specific)
    const gpxPath = `/bartelopet-${year}.gpx`;

    loadGPXRoute(gpxPath)
      .then((gpxRoute) => {
        if (gpxRoute) {
          setRouteData(gpxRoute);
          const center = getRouteCenter(gpxRoute);
          let zoom = getRouteZoom(gpxRoute);

          // Zoom out slightly on mobile devices to show more of the route
          if (isMobile) {
            zoom = Math.max(zoom - 0.7, 11); // Reduce by 0.7 levels, minimum zoom 11
          }

          setViewState({ ...center, zoom });
        }
      })
      .catch(() => {
        // Using fallback route if GPX loading fails
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [year, isMobile]);

  // Show helpful message if token is missing
  if (!MAPBOX_TOKEN) {
    return (
      <div className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden border-4 border-primary/30 shadow-2xl bg-card flex items-center justify-center">
        <div className="text-center space-y-4 p-8 max-w-md">
          <p className="text-lg font-semibold text-foreground">Mapbox Token Required</p>
          <p className="text-sm text-muted-foreground">
            To display the interactive map, add your Mapbox token to <code className="text-accent">.env.local</code>
          </p>
          <div className="bg-background/80 p-4 rounded-lg text-left text-xs font-mono">
            <p className="text-muted-foreground">NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Get a free token at{' '}
            <a
              href="https://account.mapbox.com/access-tokens/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              mapbox.com/access-tokens
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden border-4 border-primary/30 shadow-2xl">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle={MAP_STYLES[mapStyle]}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Route line */}
        <Source id="route" type="geojson" data={routeData}>
          <Layer
            id="route-line"
            type="line"
            paint={{
              'line-color': 'hsl(35, 85%, 55%)', // Amber/mustache gold
              'line-width': 5,
              'line-opacity': 0.9,
            }}
          />
          {/* Route glow effect */}
          <Layer
            id="route-glow"
            type="line"
            paint={{
              'line-color': 'hsl(35, 85%, 55%)',
              'line-width': 12,
              'line-opacity': 0.3,
              'line-blur': 4,
            }}
          />
        </Source>

        {/* Route arrows to show direction */}
        <Source id="route-arrows" type="geojson" data={routeData}>
          <Layer
            id="route-arrows-layer"
            type="symbol"
            layout={{
              'symbol-placement': 'line',
              'symbol-spacing': 150,
              'text-field': '▶',
              'text-size': 32,
              'text-keep-upright': false,
              'text-rotation-alignment': 'map',
              'text-pitch-alignment': 'map',
            }}
            paint={{
              'text-color': 'hsl(24, 20%, 25%)',
            }}
          />
        </Source>

        {/* Parking marker */}
        <Marker
          longitude={PARKING_LOCATION.longitude}
          latitude={PARKING_LOCATION.latitude}
          anchor="center"
        >
          <div className="w-5 h-5 bg-primary rounded-full border-2 border-white shadow-lg" />
        </Marker>
      </Map>

      {/* Custom Zoom Controls */}
      <CustomZoomControl mapRef={mapRef} />

      {/* Map Style Switcher */}
      <div className="absolute top-6 left-6 bg-card/95 backdrop-blur-sm rounded-xl shadow-lg border border-primary/30 overflow-hidden">
        <div className="flex flex-col">
          {(Object.keys(MAP_STYLES) as MapStyleKey[]).map((style) => (
            <button
              key={style}
              onClick={() => setMapStyle(style)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mapStyle === style
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Route info overlay */}
      <div className="absolute bottom-6 left-6 bg-card/95 backdrop-blur-sm px-6 py-3 rounded-xl shadow-lg border border-primary/30 max-w-[calc(100%-3rem)]">
        <p className="text-sm font-semibold text-accent">📍 11 km gjennom Stavanger</p>
        <p className="text-xs text-muted-foreground mt-1">Fargegadå • Gamle Stavanger • Stavanger Øst • Eiganes</p>
      </div>

      {/* Legend - bottom right */}
      <div className="absolute bottom-6 right-6 bg-card/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-primary/30">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-md" />
          <p className="text-xs font-medium text-foreground">Gratis parkering</p>
        </div>
      </div>
    </div>
  );
}
