# LICHENARIUM / Lichen Vivarium

A living, procedural, macro-photographic lichen art app: **100 simulated years of colonies growing on rock in 30 seconds**, with anatomically credible 3D morphology and alien psychedelic pigmentation.

## Current status
**Clean Google AI Studio-compatible starting point — no simulation engine implemented yet.** The previous empty React starter component was replaced on purpose. Start implementation with one rock + one realistic crustose/areolate colony before adding other organisms.

**[Read the full technical blueprint](docs/LICHENARIUM_BLUEPRINT.md)**

## Run in Google AI Studio / locally
This repository retains the Vite + React + TypeScript setup and the AI Studio-specific settings in `vite.config.ts` and `metadata.json`. Usual commands:

```sh
npm install
npm run dev
npm run lint
npm run build
```

There is **no Netlify deployment in this project workflow**. No external image or paid API calls are required to render the current shell. Vite can be statically hosted later if requested.

## Build philosophy
- Biological structure and light response must look real before psychedelic pigment.
- Geometry changes over biological time; pixel effects are not a substitute for anatomy.
- Mobile WebGL2 first; use progressive quality tiers and graceful feature fallbacks.
- Deterministic fixed-time frame output for proper high-quality MP4/GIF; a 100-year progression is intentionally not a seamless loop.
- Keep previous Git commits as history for recovery. Only delete obsolete starter source; do not remove AI Studio runtime configuration.

## Next slice
Phase 1: a convincing rock substrate, stable camera, reference-gray lighting and the AREOLE crust growth engine.
