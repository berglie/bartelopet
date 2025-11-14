import * as toGeoJSON from '@mapbox/togeojson';

export interface RouteData {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

/**
 * Load and parse a GPX file from the public folder
 * @param gpxPath - Path to GPX file (e.g., '/route.gpx')
 * @returns GeoJSON feature with route coordinates
 */
export async function loadGPXRoute(gpxPath: string): Promise<RouteData | null> {
  try {
    const response = await fetch(gpxPath);
    if (!response.ok) {
      console.error(`Failed to load GPX file: ${gpxPath}`);
      return null;
    }

    const gpxText = await response.text();
    const parser = new DOMParser();
    const gpxDoc = parser.parseFromString(gpxText, 'text/xml');

    // Convert GPX to GeoJSON
    const geoJSON = toGeoJSON.gpx(gpxDoc);

    // Extract the first track or route
    if (geoJSON.features && geoJSON.features.length > 0) {
      const feature = geoJSON.features[0];

      // Ensure it's a LineString
      if (feature.geometry.type === 'LineString') {
        return feature as RouteData;
      } else if (feature.geometry.type === 'MultiLineString') {
        // Convert MultiLineString to single LineString by flattening
        const coordinates = (feature.geometry.coordinates as number[][][]).flat() as [
          number,
          number,
        ][];
        return {
          type: 'Feature',
          properties: feature.properties || {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        };
      }
    }

    console.error('No valid route found in GPX file');
    return null;
  } catch (error) {
    console.error('Error parsing GPX file:', error);
    return null;
  }
}

/**
 * Calculate the center point of a route
 */
export function getRouteCenter(route: RouteData): { longitude: number; latitude: number } {
  const coords = route.geometry.coordinates;
  const sum = coords.reduce((acc, [lon, lat]) => ({ lon: acc.lon + lon, lat: acc.lat + lat }), {
    lon: 0,
    lat: 0,
  });

  return {
    longitude: sum.lon / coords.length,
    latitude: sum.lat / coords.length,
  };
}

/**
 * Calculate appropriate zoom level based on route bounds
 */
export function getRouteZoom(route: RouteData): number {
  const coords = route.geometry.coordinates;
  const lons = coords.map(([lon]) => lon);
  const lats = coords.map(([, lat]) => lat);

  const lonDelta = Math.max(...lons) - Math.min(...lons);
  const latDelta = Math.max(...lats) - Math.min(...lats);
  const maxDelta = Math.max(lonDelta, latDelta);

  // Rough zoom calculation (adjust as needed)
  if (maxDelta > 0.1) return 11;
  if (maxDelta > 0.05) return 12;
  if (maxDelta > 0.02) return 13;
  return 14;
}
