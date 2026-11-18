# LICHENARIUM · Lichen Vivarium

A physically inspired living-crust experiment aiming eventually for 100 simulated years of credible lichen life in 30 seconds.

## Phase 1 — implemented in source
- A real-time three-dimensional rock mesh with irregular height, an irregular outline, geology-colored vertices, micro-bump detail and movable macro lighting.
- **AREOLE**: seeded persistent growth state per rock cell (colony ID, biomass, age, substrate suitability, drying stress, irreversible damage).
- Tissue spreads only from existing colonies. A separate raised mesh grows thicker; aging activates crack valleys with physical height variation and dark exposed fissures.
- Sparse, mature-area apothecial discs; tap to plant another colony; play/pause; change years per second and water; move light/camera; natural / ultraviolet / opaline pigments; reset confirmation and PNG current-frame capture.
- Natural pigment mode is the realism baseline, psychedelia is an appearance choice. These are species-inspired numerical approximations, **not scientifically calibrated 100-year kinetics**.
- iPhone-oriented fixed art and control tabs. Browser performance, photorealism and exports still need device-level validation.

## Google AI Studio
Pull the GitHub **main** branch into your Google AI Studio project. The repo retains the existing Vite/React/TypeScript project, AI Studio HMR guard and metadata.

Local commands:
- `npm install`
- `npm run lint`
- `npm run dev`
- `npm run build`

**No Netlify deployment was initiated.** No external API key is necessary for rendering Phase 1.

## Remaining quality gates
- Run lint/build and load in AI Studio, then inspect on iPhone Safari. No device test claimed.
- Compare matched grayscale/raking-light images to true `Rhizocarpon` macro photographs; tune rock silhouettes, areole thickness distributions, apothecial details, crack topology and tissue reflectance.
- Replace fixed Voronoi-based crack sites with a fully propagated persistent fracture graph.
- Add advanced microscopic cortex anatomy, hydrological optical response, wet/dry hysteresis.
- Phase 2: real growing, ruffled, overlapping **LOBE** sheets.
- Phase 3: actual hollow pixie cups from mature basal squamules.

Full research architecture: [LICHENARIUM Blueprint](docs/LICHENARIUM_BLUEPRINT.md).

**Export note:** PNG captures the current canvas. MP4/GIF encoding is not implemented yet. Natural multi-year growth is intentionally nonlooping.

## Phase 1B: fracture and anatomy refinement
- Mature strain initiates spatial crack networks, which spread along neighboring tissue instead of revealing all Voronoi edges together.
- The living crust has age-conditioned raised areole crowns, carved fissure valleys, and beveled margins plus a separate procedural cortex bump atlas with pit-like pores.
- Macro magnification and grayscale anatomy diagnostics added under **Camera + Light**; PNG reflects the grayscale mode.
- Rest-space material coordinates are cached for faster mesh updates and reduced texture flicker.
- `npm run test:biology` validates deterministic growth/fractures without a GPU.

These are science-inspired approximations; full real-photography calibration remains unfinished.
