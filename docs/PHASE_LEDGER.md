# LICHENARIUM — Phase 1 handoff

**Project:** merrypranxter/lichen_vivarium  
**Host:** Google AI Studio, preserving Vite configuration. No Netlify.

## Implemented in source
- `src/engine/biology.ts`: deterministic seeded rock relief, resource fields, colony ID, biomass, age, bounded local recruitment, moisture influence, stress and irreversible fracture state at potential areole boundaries.
- `src/engine/scene.ts`: actual rock geometry with normals and bump material, separately displaced and illuminated crust mesh, differential age/pigment material, age-triggered disc instances, raycast planting, camera/light controls and canvas PNG.
- `src/App.tsx`: actual simulation clock (default 3.33 years/s, 100-year stop), pause, restart with same seed, New Design confirmation, colony inoculation, water/pigments/lighting and pinned phone controls.
- `src/index.css`: pinned viewing area with compact settings tabs.
- `package.json`: adds `three` and `@types/three`, otherwise keeps AI Studio package/tooling choices.

## Research caveat and honesty
This is a **first causal simulation**, not finished photorealistic ecology. There is no calibrated universal morphogenetic equation for lichens; the empirical atlas and uploaded research distinguish observed lichen biology from spring/front/fracture approximations.

## Validation still outstanding
1. Install dependencies, `npm run lint`, `npm run build`, preview in Google AI Studio.
2. Test black/white screen regressions and pointer picking on iPhone Safari.
3. Compare rock, crust, cracking and apothecia to species-identified macrophotography under multiple light directions.
4. Profile mesh regeneration and CPU loops on iPhone, reduce quality tier if slow.
5. Check exact seed replay after restart and on editor return.
6. Next: genuinely propagating crack graph, beveled areole borders, tissue cortex microgeometry and realistic light response; then foliose lobes.

## Planned later
LOBE (real growth-induced ruffles), SQUAMULE (actual hollow pixie cups), THALLUS_AXIS (fruticose/net), HYDRA (gelatinous/umbilicate), ecological succession and offline PNG/GIF/MP4 export.

## 2026-11-18 — Phase 1B: fracture propagation and material relief (source update)
- Replaced synchronous cracking along a fixed Voronoi mask with a **persistent raster fracture network**: rare nucleation in mature strained cells, neighbor-to-neighbor propagation inside the same colony, irreversible widening/deepening, and guide-dependent branching. Voronoi is a local weak-zone guide, not the complete drawing.
- Added a 512×512 procedural **cortex microrelief map** with tiny pore wells and heterogeneous fibrous/particulate relief (rest-space attached, not re-randomized every frame). This is a material approximation, not SEM-calibrated anatomy.
- Raised and varied areole crowns, deepened real geometry at crack valleys and added bevel relief at partially fractured edges.
- Added cached rest-space rock/relief/pigment samples to reduce repeated multi-octave field evaluation during each mesh refresh. The live mesh still refreshes per growth step; profile before increasing tessellation on phone.
- Added macro magnification and a grayscale structural diagnostic. The PNG export applies the grayscale diagnostic when switched on.
- Added an automated, pure-simulation regression test: `npm run test:biology`, covering deterministic replay, irreversible fracture, century stop, seeded growth diversity, and finite fields.
- **Verification limits:** connector verified source/branch state; build, tests and real iPhone/Safari visual output still require runtime execution. No Netlify deployment triggered by us.

### Phase 1C priority
Do side-by-side macro calibration against real `Rhizocarpon` images, improve pore/ridge spectrum and areole masks, then implement true foliose differential-growth membranes. Do not call first-pass renderer photographically indistinguishable until matched-light comparisons.
