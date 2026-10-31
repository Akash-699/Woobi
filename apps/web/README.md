# Woobi Web Application (`apps/web`)

## Overview
`apps/web` is the presentation and entry shell for the Woobi browser experience.

## Responsibilities
- Serves the top-level HTML application shell (`index.html`)
- Mounts the 3D virtual studio canvas and editorial UI overlay
- Integrates the 5 primary business modules (`modules/3d-studio`, `modules/3d-studio-features`, `modules/settings`, `modules/core`)
- Communicates with `modules/backend` strictly via HTTP REST APIs (`fetch`)

## Public Interface
- Entry point: `index.html`
- Host runtime: Static web server (`/`)

## Architecture Rule
Browser code in `apps/web` must **never** import backend server implementation code directly. All data access must pass through API contracts.
