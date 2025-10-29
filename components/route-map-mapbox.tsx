'use client';

import { useState, useEffect } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { loadGPXRoute, getRouteCenter, getRouteZoom, type RouteData } from '@/lib/gpx-loader';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

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
  dark: 'mapbox://styles/mapbox/dark-v11',
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
};

type MapStyleKey = keyof typeof MAP_STYLES;

export default function RouteMapMapbox() {
  const [routeData, setRouteData] = useState<RouteData>(FALLBACK_ROUTE);
  const [viewState, setViewState] = useState(DEFAULT_CENTER);
  const [isLoading, setIsLoading] = useState(true);
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('dark');

  useEffect(() => {
    // Try to load GPX file from public folder
    loadGPXRoute('/bartelopet-route.gpx')
      .then((gpxRoute) => {
        if (gpxRoute) {
          setRouteData(gpxRoute);
          const center = getRouteCenter(gpxRoute);
          const zoom = getRouteZoom(gpxRoute);
          setViewState({ ...center, zoom });
          console.log('✅ GPX route loaded successfully');
        } else {
          console.log('ℹ️ Using fallback route (add /public/bartelopet-route.gpx to use your GPX)');
        }
      })
      .catch((error) => {
        console.log('ℹ️ Using fallback route:', error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

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

        {/* Navigation Controls (Zoom +/-) */}
        <NavigationControl position="top-right" showCompass={true} />
      </Map>

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
      <div className="absolute bottom-6 left-6 bg-card/95 backdrop-blur-sm px-6 py-3 rounded-xl shadow-lg border border-primary/30">
        <p className="text-sm font-semibold text-accent">📍 Stavanger Sentrum</p>
        <p className="text-xs text-muted-foreground mt-1">10km løype • Flatt terreng • Asfaltert</p>
      </div>
    </div>
  );
}
