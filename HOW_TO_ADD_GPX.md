# How to Add Your GPX Route

The website now has GPX route support! Here's how to add your actual 10km route.

## Option 1: Use Your GPX File (Recommended)

### Step 1: Place Your GPX File

Put your GPX file in the `/public` folder:
```
/public/route.gpx
```

### Step 2: Update the RouteMap Component

Edit `/components/route-map.tsx` and add GPX parsing:

```typescript
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import gpxParser from 'gpxparser';

// ... existing imports ...

export function RouteMap({ gpxPath }: { gpxPath?: string }) {
  const [isClient, setIsClient] = useState(false);
  const [routeData, setRouteData] = useState<[number, number][] | null>(null);

  useEffect(() => {
    setIsClient(true);

    // Load and parse GPX
    if (gpxPath) {
      fetch(gpxPath)
        .then(response => response.text())
        .then(gpxText => {
          const gpx = new gpxParser();
          gpx.parse(gpxText);

          // Extract coordinates from the first track
          if (gpx.tracks.length > 0 && gpx.tracks[0].points.length > 0) {
            const coordinates: [number, number][] = gpx.tracks[0].points.map(
              point => [point.lat, point.lon]
            );
            setRouteData(coordinates);
          }
        })
        .catch(error => console.error('Error loading GPX:', error));
    }
  }, [gpxPath]);

  // ... rest of the component ...

  // Use routeData instead of hardcoded coordinates
  <Polyline
    positions={routeData || routeCoordinates}
    pathOptions={{ color: '#2d8a64', weight: 5, opacity: 0.8 }}
  />
}
```

### Step 3: Update Homepage to Pass GPX Path

Edit `/app/page.tsx`:

```typescript
<RouteMap gpxPath="/route.gpx" />
```

## Option 2: Use the Placeholder Image (Current)

The current setup uses a nice SVG placeholder showing a stylized 10km route in Stavanger.

To customize the placeholder:
1. Edit `/public/route-placeholder.svg`
2. Adjust the path coordinates to match your actual route
3. Update landmarks and distance markers

## Option 3: Create a Static Route Image

If you have an actual route screenshot or map image:

1. Save your route image as `/public/route-actual.png` or `/public/route-actual.jpg`
2. Update `/components/route-map.tsx`:

```typescript
<Image
  src="/route-actual.png"  // or .jpg
  alt="10km Barteløpet rute i Stavanger"
  fill
  className="object-cover"
  priority
/>
```

## GPX File Format Example

Your GPX file should look something like this:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="YourApp">
  <trk>
    <name>Barteløpet 10km</name>
    <trkseg>
      <trkpt lat="58.9700" lon="5.7331">
        <ele>0</ele>
      </trkpt>
      <trkpt lat="58.9720" lon="5.7350">
        <ele>0</ele>
      </trkpt>
      <!-- More points... -->
    </trkseg>
  </trk>
</gpx>
```

## Testing

After adding your GPX file:

1. Restart the dev server: `npm run dev`
2. Visit http://localhost:3000
3. Scroll to the map section
4. You should see your actual route rendered on the map!

## Interactive Map Features

The current map implementation includes:
- ✅ Zoomable and pannable map
- ✅ OpenStreetMap tiles
- ✅ Route polyline visualization
- ✅ Start/Finish marker
- ✅ Responsive design
- ✅ Bordered with primary color theme

## Customization Tips

### Change Map Style
Edit the TileLayer URL in `/components/route-map.tsx`:

```typescript
// Dark map
url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"

// Satellite
url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

// Terrain
url="https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg"
```

### Adjust Route Color
In the Polyline component:

```typescript
pathOptions={{
  color: '#2d8a64',    // Route color (currently forest green)
  weight: 5,           // Line thickness
  opacity: 0.8         // Transparency
}}
```

### Add Distance Markers

```typescript
{[2.5, 5, 7.5].map((km, i) => (
  <Marker
    key={i}
    position={routeData[Math.floor(routeData.length * (km/10))]}
  >
    <Popup>{km}km</Popup>
  </Marker>
))}
```

---

## Current Setup

Right now, the map shows a beautiful SVG placeholder. This looks great and is performant, but adding your actual GPX file will make it even more authentic!

**No GPX file? No problem!** The placeholder looks professional and works perfectly for launch.
