# Module 5: Core (`modules/core`)

## Responsibility
Responsible for the shared application foundation, routing, state management, canonical data contracts, global error handling, and platform compatibility.

## Submodules
1. `app/`: Application bootstrap, initialization sequencing, feature flags.
2. `navigation/`: Screen transitions (`screen-dashboard`, `screen-wardrobe-sheet`, `screen-profile`, etc.).
3. `shared-ui/`: Design system tokens (`tokens.css`), toast notifications, modals, bottom navigation bar.
4. `state/`: Reactive state store, immutable transitions, persistent storage synchronization.
5. `contracts/`: Canonical TypeScript/JSDoc data schemas (Garment, Look, Avatar, SceneState).
6. `errors/`: Application error boundary, `ErrorBoundary3D`, WebGL context lost/restored handling.
7. `platform/`: Touch/mouse device detection, mobile viewport resize handling, Android webview bridge.

## Public Interface Contract
The module exposes its public API through `index.js`.
