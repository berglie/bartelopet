declare module '@mapbox/togeojson' {
  export interface GeoJSON {
    type: string;
    features: Array<{
      type: string;
      properties: Record<string, any>;
      geometry: {
        type: string;
        coordinates: any;
      };
    }>;
  }

  export function gpx(doc: Document): GeoJSON;
  export function kml(doc: Document): GeoJSON;
}
