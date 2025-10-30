'use client';

import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function RouteMapClient() {
  // Example route around Stavanger (replace with actual GPX data)
  const routeCoordinates: [number, number][] = [
    [58.9700, 5.7331], // Start
    [58.9720, 5.7350],
    [58.9740, 5.7380],
    [58.9750, 5.7420],
    [58.9730, 5.7450],
    [58.9700, 5.7470],
    [58.9670, 5.7450],
    [58.9650, 5.7400],
    [58.9670, 5.7360],
    [58.9700, 5.7331], // End (same as start)
  ];

  return (
    <div className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden border-4 border-primary/20 shadow-2xl">
      <MapContainer
        center={[58.9700, 5.7331]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions={routeCoordinates}
          pathOptions={{ color: 'hsl(38 70% 60%)', weight: 5, opacity: 0.8 }}
        />
        <Marker position={[58.9700, 5.7331]}>
          <Popup>
            <div className="text-center">
              <p className="font-bold text-primary">Start/Mål</p>
              <p className="text-sm">Stavanger Sentrum</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
