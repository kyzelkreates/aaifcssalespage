# Apex Intelligent AI — Fleet Control OS + AP3X Navigation Platform

Enterprise fleet management system + AI-powered driver navigation PWA.

## Tech Stack
- React 18 + Vite + Tailwind CSS
- Supabase (Auth + PostgreSQL + Realtime)
- Leaflet / React-Leaflet (map rendering)
- Mapbox GL JS (3D driver navigation — loaded at runtime)
- Recharts (analytics)
- Zustand (state — SSOT: /src/core/storage.js)

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
```
Fill in `.env` with your keys (see below).

### 3. Set up Supabase database
- Create a new Supabase project at https://supabase.com
- Open SQL Editor → New Query
- Paste and run the full content of `supabase/schema_complete.sql`
- Go to **Authentication → Providers → Email** → turn OFF "Confirm email"

### 4. Run dev server
```bash
npm run dev
```

### 5. First-run setup
Visit the app — you'll see a 3-step setup wizard to create your admin and driver accounts. This only shows once.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anon/public key |
| `VITE_MAPBOX_TOKEN` | Recommended | Enables 3D navigation in driver app |
| `VITE_GRAPHHOPPER_API_KEY` | Optional | Primary routing (falls back to OSRM) |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | Google Maps routing |

AI provider keys (OpenAI, Groq, etc.) can also be set in `.env` or added at runtime in the app Settings panel.

## Build for production
```bash
npm run build
```
Output is in `/dist`. Deploy to Vercel, Netlify, or any static host.

## Project Structure
```
src/
  app/          → App root + Router
  components/   → Reusable UI components
  core/         → storage.js (Zustand SSOT)
  hooks/        → Custom React hooks
  intel/        → Local AI intelligence engines
  layouts/      → AppShell, Sidebar, TopNav
  modules/      → Feature modules (fleet, navigation, AI panel)
  pages/        → Route pages (Dashboard, Fleet, Drivers, etc.)
  providers/    → AuthProvider
  services/     → All service layers
    ai/         → Universal AI abstraction layer (9 providers)
    apex/       → AP3X bridge + client
    compliance/ → Compliance service
    dispatch/   → Dispatch jobs service
    drivers/    → Driver service
    federation/ → Multi-tenant pairing + telemetry queue
    fleet/      → Fleet/vehicle service
    local/      → localStorage/IndexedDB fallback
    maps/       → Map provider abstraction
    realtime/   → Supabase realtime service
    routing/    → Local routing engine + cache
    safety/     → Safety alert service
    supabase/   → Supabase auth + client
    sync/       → Driver sync (BroadcastChannel + Supabase)
  styles/       → globals.css
  utils/        → cn.js, format.js

supabase/
  schema_complete.sql  ← Run this to set up your database
  schema.sql           ← Original schema (reference)
```

## Two Applications in One

### Fleet Control Dashboard
Accessible at `/` — requires login (fleet_admin role)
- Live fleet map + vehicle tracking
- Route planner (single + multi-stop, saves to dispatch jobs)
- Driver management, dispatch, compliance, analytics, incidents, AI

### AP3X Driver App
Accessible at `/ap3x` or `/driver-app` — standalone PWA
- 3D Mapbox navigation + turn-by-turn instructions
- Assigned jobs from fleet with "Start Navigation" button
- AI Sentinel fatigue monitoring
- Fleet messaging (Comms tab)

## Repository
github.com/kyzelkreates/aaifcs
