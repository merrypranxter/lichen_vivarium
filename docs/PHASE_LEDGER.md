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

## 2026-11-18 — Phase 2: living foliose material (source update)
- **Module:** `src/engine/foliose.ts`. Three initial rock-adapted rosettes containing 23 independently deforming lobes; users can inoculate up to seven rosettes total.
- **Living growth:** margin-row activation with persistent rest-space tissue. Existing sections stay present as the front develops new geometry. Top/underside surfaces and closed sidewalls give actual biological-like thickness and cast shadows.
- **Mechanics:** deterministic iterative spring constraints with excess target rest lengths along mature free margins; anchored inner rows, rock nonpenetration, bounded shear and hydration-dependent preferred elevation simulate *differential-growth-induced ruffling*. **Model [B/C]**, not validated experimental lichen mechanics.
- **Composition:** `LichenView` now owns both AREOLE and LOBE; both advance using the exact same fixed biological time and water setting. Camera, lighting, pigments and canvas capture remain shared.
- **Controls:** dedicated FOLIOSE tab; show mixed / leafy-only / crust-only, choose rock-tap inoculation type, edge surplus slider, curl slider and live rosette/lobe counts. Default shows both.
- **Diagnostics/tests:** added `tests/foliose.test.ts` and `npm run test:foliose`; compares same seed, row activation, rock clearance, nonzero metric effect and dry/wet curling.
- **Preservation:** previously implemented crust fracture network, palette controls, grayscale mode, restart/new design confirmation, PNG and Google AI Studio HMR safeguard remain in code.
- **Limits:** these lobes do not yet use broadphase shell-to-shell collision, reactive hydration/photobiont material shaders, rhizine anchors, measured cortex roughness, apothecial anatomy or calibrated biological growth. Ruffle waves remain an engineering approximation; compare with real species under raking light before claiming photorealism.
- **Validation:** source checked and committed only; execute `npm run test:engines`, `npm run lint`, and `npm run build` in the actual AI Studio environment. Inspect final rendering on iPhone Safari. No deployment initiated by this phase.

### Phase 2B target
Upgrade the foliose solver from bounded spring relaxation to adaptive mesh edge splitting, leaf–leaf contact constraints and wrinkled cortical ridges derived from persistent material stress; add realistic underside/rhizines and species-calibrated photo tests before proceeding to Cladonia scyphi.

## 2026-11-18 — Phase 2B: mechanically layered foliose tissue

**Source edits (implementation state, browser run pending):**
- `src/engine/foliose.ts`: retains existing growing lobe shells, crust independence and fixed-step clock. Adds a spatial-hash local contact pass across DIFFERENT lobes, with a bounded lift of upper tissue and deterministic tie-breaking. Not continuous triangle collision.
- Caches stable cortex pigment/noise and rest-rock sample coordinates, limiting the cost of per-frame tissue updates.
- Couples stress-derived surface wrinkling to geometric rest-metric excess and continuing age-dependent compression. Existing tip-row growth, ruffling and moisture-dependent curling preserved.
- Attaches a UV-stable micropitted cortical bump map to the existing MeshStandardMaterial. Provides `setCortex()` for direct material roughness intensity without altering growth history.
- Sets *Xanthoria*-inspired lower cortex pale (rather than generic dark or fully saturated), and instantiates a limited number of short pale **hapters** underneath older lobes. These are an artistic proxy for attachment anatomy, not a claim about every species. Toggling visibility does not affect physics or growth.
- `src/App.tsx`: exposes upper cortex microrelief slider, holdfast visibility control, contact correction count and anatomical statistics within the existing FOLIOSE tab.
- `tests/foliose-2b.test.ts`: regression coverage for deterministic repeatability, stress state, substrate clearance, upper/lower color distinction, attachment instances and user-adjustable material behavior.
- `package.json`: adds `npm run test:foliose-2b`, includes it in `test:engines`; no dependency additions.
- **Reference correction:** Xanthoria-like lobes are pale underneath, and attachment anatomies vary (short hapters, sparse rhizines reported by some sources), so a dense dark-rhizine curtain would be inappropriate. References: [Xanthoria parietina taxon description](https://italic.units.it/index.php?num=2594&procedure=taxonpage), [Consortium of Lichen Herbaria Xanthoria genus](https://lichenportal.org/portal/taxa/index.php?clid=36860&pid=&taxauthid=1&tid=52249).
- **Known limitations:** coarse vertex contact misses edge crossings, fully accurate self-collision and adaptive new triangles are not present, true cortex/medulla layering and realistic all-scale photography still need work. Avoid declaring macro photorealism from code alone.

**Verification gate:** check GitHub branch/file state, then run `npm run test:engines`, `npm run lint`, `npm run build` and load Google AI Studio preview. Real Safari and color/lighting macro QA not yet run. No Netlify trigger was requested.
