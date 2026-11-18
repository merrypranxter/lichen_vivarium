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

## Phase 2 — actual foliose tissue (source implementation)
- New independent `src/engine/foliose.ts` module. Three rock-compatible, *Xanthoria*-inspired foliose rosettes comprise 23 separate, living lobes. More can be planted by tapping the rock using the FOLIOSE tab.
- Each lobe has persistent 3D tissue/rest coordinates, physically distinct top and bottom surfaces, real side-wall thickness, and growing-tip mesh rows. Existing tissue remains; new mesh sections appear at active margins.
- A bounded fixed-step spring-constraint solver advances locally surplus rest lengths at free margins, generating buckling and uneven uplift; drying changes the preferred curl of partially anchored tissue. The growth is a physically motivated computational analogy, not calibrated life-history data.
- Crust and foliose share the **same 100-year biological timeline and rainfall field**. Toggle **BOTH / LEAFY ONLY / CRUST ONLY**, select which kind of organism a rock tap seeds, and adjust edge surplus and desiccation curl.
- Natural/yellow-orange, ultraviolet and opaline pigments apply to foliose material independently of growth state.
- Run `npm run test:foliose` or `npm run test:engines` for seed replay, newly deposited mesh geometry, bounded rock clearance, curl behavior and touch planting.
- Leaf-to-leaf collision, species-calibrated anatomy, matching to macro reference photos, photorealistic upper/lower textures, 30-second MP4, and GPU/phone profiling remain **future work**. Do not assume these are complete.

No Netlify release was initiated. Preserve AI Studio Vite configuration.

## Phase 2B — tissue contact and true underside (source update)

- **Contact:** bounded, deterministic local spatial-hash **vertex-to-vertex** 2.5D separation of nearby *different* lobes. Higher tissue is pushed above lower tissue. This reduces intersections but is **not** a complete continuous triangle/triangle or same-lobe self-collision engine. Contact-correction counts are reported.
- **Growth-driven secondary corrugation:** persistent compression measured from intrinsic material rest spans versus deformed tissue spans; seeded imperfections are amplified only where mechanical stress accumulates. No animated cosine filter pretending to be physical buckling.
- **Upper cortex:** repeatable UV-attached pores/roughness/wrinkled microrelief on the three-dimensional shell, adjustable from the FOLIOSE tab.
- **Pale lower cortex:** botanically recognizable pale underside instead of black or arbitrary inverted color.
- **Sparse hapter attachments:** small, pale, real 3D basal holdfast meshes; intentionally sparse and short, closer to Xanthoria-style attachments than dense dangling rhizines. Toggle under FOLIOSE.
- **Performance:** local broadphase instead of an all-polygons contact search; material statistics and rest-space height cached where appropriate. World-space rock clearance is revalidated after shape relaxation.
- **Tests:** `npm run test:foliose-2b` and `npm run test:engines`. The tests are committed but must be run in Google AI Studio or a local development environment before their outcomes are claimed.
- **No automatic deployment.** Do not use Netlify for development. Google AI Studio Vite/HMR settings are unchanged.

This is a controlled, reversible improvement toward macro realism. **Remaining:** full surface-to-surface collision, species-calibrated morphogenesis, apothecia/basal anatomy validation, photo comparisons, and long-video export.
