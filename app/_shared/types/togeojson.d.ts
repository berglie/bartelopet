declare module '@mapbox/togeojson' {
  export interface GeoJSON {
    type: string;
    features: Array<{
      type: string;
      properties: Record<string, unknown>;
      geometry: {
        type: string;
        coordinates: unknown;
      };
    }>;
  }

  export function gpx(doc: Document): GeoJSON;
  export function kml(doc: Document): GeoJSON;
}
