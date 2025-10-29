# Using Your GPX Route File

The map now automatically loads your 10km route from a GPX file! 🗺️

## Quick Start

1. **Export your route as GPX**
   - From Strava: Activity → 3 dots menu → Export GPX
   - From Garmin Connect: Activity → Settings → Export Original
   - From other apps: Look for "Export GPX" or "Export to GPX"

2. **Rename your GPX file**
   - Rename it to: `bartelopet-route.gpx`

3. **Place it in the public folder**
   ```bash
   cp your-route.gpx /home/stian/Repos/barteløpet/public/bartelopet-route.gpx
   ```

4. **Reload the page**
   - The map will automatically load and display your route!
   - The map will auto-center and zoom to fit your route perfectly

## What Happens Automatically

✅ **Route is loaded** from the GPX file
✅ **Map centers** on your route
✅ **Zoom level** is calculated based on route size
✅ **Start marker** is placed at the beginning
✅ **Finish marker** is added (if route is not a loop)
✅ **Route line** is drawn in amber/gold with glow effect

## Checking if GPX Loaded

Open your browser's developer console (F12) and look for:
- ✅ `GPX route loaded successfully` - Your GPX is working!
- ℹ️ `Using fallback route` - GPX file not found, using example route

## Supported GPX Sources

Any GPX file with a track or route will work:
- 🏃 Strava
- 🏃 Garmin Connect
- 🏃 Polar Flow
- 🏃 Suunto App
- 🏃 Nike Run Club
- 🏃 Any GPS tracking app that exports GPX

## File Location

The map looks for your GPX file at:
```
/public/bartelopet-route.gpx
```

## Troubleshooting

**Map shows example route instead of my GPX?**
- Check the file is named exactly `bartelopet-route.gpx`
- Make sure it's in the `/public` folder
- Open browser console (F12) to see error messages
- Try reloading the page (Ctrl+Shift+R for hard reload)

**Route looks wrong?**
- Make sure the GPX file contains a track (not just waypoints)
- Some apps export multiple activities - make sure yours is the only one
- Check the GPX file in a text editor - it should contain `<trk>` or `<rte>` tags

## Example GPX Structure

Your GPX file should contain track points like this:
```xml
<?xml version="1.0"?>
<gpx version="1.1">
  <trk>
    <trkseg>
      <trkpt lat="58.9700" lon="5.7331">
        <ele>10</ele>
        <time>2024-11-01T10:00:00Z</time>
      </trkpt>
      <!-- More points... -->
    </trkseg>
  </trk>
</gpx>
```

## Advanced: Using a Different Filename

If you want to use a different filename, update this line in `components/route-map-mapbox.tsx`:

```typescript
loadGPXRoute('/bartelopet-route.gpx')
```

Change `'/bartelopet-route.gpx'` to your filename.
