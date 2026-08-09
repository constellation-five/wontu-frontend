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
Maps JavaScript API, Places API, and Geocoding API enabled. You can obtain this key from the [Google Cloud Console](https://console.cloud.google.com/). This file is
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

## Deployment

This frontend is deployed using **Azure Static Web Apps (SWA)**. The deployment is automated via GitHub Actions.

### Step-by-Step Azure Setup

1. **Create Static Web App**:
   - In the Azure Portal, create a **Static Web App**.
   - Select **GitHub** as the source and authorize Azure to connect to your repository.
   - Select your Organization, Repository, and `main` branch.
   - For Build Details, choose **Custom** (or Angular). 
   - Azure will automatically attempt to create a GitHub Actions workflow file in your repo. *Note: Since the workflow file already exists in `.github/workflows` in this repository, you may need to overwrite the Azure-generated one with the existing one, or just ensure the deployment token matches.*

2. **Retrieve Deployment Token**:
   - Go to your Static Web App overview in the Azure Portal.
   - Click **Manage deployment token** and copy the value to use as a GitHub Secret.

### GitHub Actions Secrets

To enable successful deployments and environment injection, the following secrets must be defined in the GitHub repository (under Settings > Secrets and variables > Actions):

- `AZURE_STATIC_WEB_APPS_API_TOKEN_POLITE_GLACIER_0F247FB00`: The deployment token for your Azure Static Web App.
- `REVERB_KEY`: The public key for Reverb WebSockets (matches the backend `REVERB_APP_KEY`).
- `VAPID_PUBLIC_KEY`: The public key for Push Notifications (matches the backend `VAPID_PUBLIC_KEY`).
- `GOOGLE_MAPS_API_KEY`: Your Google Maps API key (with Maps JavaScript API, Places API, and Geocoding API enabled).

During the build process, the workflow automatically injects these keys into the production environment files.
