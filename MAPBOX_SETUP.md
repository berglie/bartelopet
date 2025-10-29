# Mapbox Setup Guide

This project uses Mapbox GL to display the interactive 10km route map in Stavanger.

## Getting Your Mapbox Access Token

1. **Create a Mapbox Account** (Free)
   - Go to https://account.mapbox.com/auth/signup/
   - Sign up for a free account

2. **Get Your Access Token**
   - Once logged in, go to https://account.mapbox.com/access-tokens/
   - Copy your **Default public token** (starts with `pk.`)
   - Or create a new public token

3. **Add Token to Your Project**
   - Copy `.env.local.example` to `.env.local`:
     ```bash
     cp .env.local.example .env.local
     ```
   - Open `.env.local` and add your token:
     ```
     NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_actual_token_here
     ```

4. **Restart Development Server**
   ```bash
   npm run dev
   ```

## Free Tier Limits

Mapbox's free tier includes:
- **50,000 free map loads per month**
- This is more than enough for most projects
- No credit card required for the free tier

## Map Features

The map currently shows:
- Dark theme (`mapbox://styles/mapbox/dark-v11`)
- 10km route around Stavanger in amber/gold color
- Custom START/MÅL marker
- Route information overlay

## Customizing the Route

To add your actual GPX route:
1. Export your route as GPX from your running app
2. Convert GPX to GeoJSON coordinates
3. Update `routeGeoJSON` in `components/route-map-mapbox.tsx`

Or use a GPX parser library like `gpx-parser-builder` to automatically load GPX files.
