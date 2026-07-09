# Wontu Frontend

Angular frontend for Wontu.

## Requirements

- Node.js: 20.19+ (22 LTS recommended)
- pnpm: 9+

## Setup

1. Install pnpm if needed:

```bash
npm install -g pnpm
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up your local Google Maps key (used by the location picker on the Offers page):

```bash
cp src/assets/env-config.template.js src/assets/env-config.js
```

Then edit `src/assets/env-config.js` and paste a Google Maps API key with the
Maps JavaScript API, Places API, and Geocoding API enabled. This file is
git-ignored — never commit a real key. Without it, the location picker still
works for manual text entry, but the map/pin and address lookup are disabled.

In production (Azure Static Web Apps), this file is generated automatically
from the `GOOGLE_MAPS_API_KEY` GitHub Actions secret before each build.

## Running the Dev Server

1. Start the app:

```bash
pnpm start
```

2. Open: http://localhost:4200
