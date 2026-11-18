# LICHENARIUM — Lichen Vivarium implementation blueprint

**Status:** Planned, not implemented. **Source of truth:** `merrypranxter/lichen_vivarium`, `main`. **Host:** Google AI Studio / Vite. Do not send builds to Netlify.

## Artistic North Star
Render approximately **100 biological years as a 30-second macro-photographic timelapse** of living lichen colonies on rock (later bark and soil). Keep biological silhouette, thickness, branching, crust fractures, ruffled margins and reproductive microanatomy convincing in grayscale and under moving light. Give pigmentation outrageous color freedom—electric magenta, opalescent cortex, fluorescent emerald, impossible prismatic spectra—without flattening the material into a sticker.

The photographically believable tissue, not a shader preset, is the artwork. All morphology comes from persistent simulation state, not uniform scaling, opacity reveals, or advection of a single 2D noise texture.

## Biology and growth geometry (five distinct modules)

### 1. AREOLE — crustose, areolate
Substrate-projected colony boundary, thin living front, raised cortical mosaics, dark hypothallus, persistent damage/fracture graph, differentiated growth margin and older interior. Use surface distance/level sets, thickness fields and strain-dependent cracking; correlate age and stress with surface relief. Target: *Rhizocarpon geographicum*.

### 2. LOBE — foliose leaves and rosettes
Connected double-sided mesh with stable material coordinates, physical upper/lower layers, contact/cast shadows, optional rhizine anchors, overlapping lobes and maturation-dependent organs. Species-dependent marginal growth and some internal expansion; adaptive edge subdivision and dynamic triangle creation. Differential rest metrics + PBD/XPBD bending and attachment constraints create plausible **hyperbolic-looking ruffled rims**: extra arclength in the growth edge forces primary, secondary and tertiary buckling. Real thickness, wrinkles and water-sensitive curling. Avoid a sine-wave ribbon. Targets: *Lobaria pulmonaria*, *Parmelia sulcata*, *Xanthoria parietina*. Use species-substrate constraints; *Lobaria* generally belongs in bark rather than the default bare-rock scene.

### 3. THALLUS_AXIS — fruticose and perforated ribbons
Dynamic branched graph with differential tip extension, resource transport, nonuniform taper, fork angles, gravity and moisture response. Swept tissue-bearing tubes and ribbons, separate fruticose / flattened-net profiles. *Ramalina menziesii* must **develop genuine holes in its tissue**, not simply receive a lace texture. Targets: *Cladonia rangiferina* and *Ramalina menziesii*.

### 4. SQUAMULE / SORALIUM — miniature scales, powder and pixie cups
Grow many separate, age-aware tiny attached leaflets. From mature appropriate structures, develop podetia with hollow upward-flaring scyphi whose rims gain realistic granulation. Species-specific isidia/soredia/soralia production and shedding; no universal anatomy brush. *Cladonia pyxidata* lacks soredia; use its authentic cup-surface granules rather than mislabeling them. Include diffuse granular leprose mode for *Lepraria*.

### 5. HYDRA / UMBILICUS — wet jelly and attached free sheets
Mode A: umbilicate membrane fixed at central anchor, with radial expansion, pustules, pleats, lifting and fold dynamics (*Lasallia*). Mode B: gelatinous tissue with hydration-dependent thickness, hysteresis, stiffness and scattering (*Enchylium*). Separate species profiles despite sharing software constraints.

## Shared living world
The five morphology modules share an environment on a physical substrate mesh:
- water (precipitation/dew, evaporation, runoff/pooling, hydration lag);
- light/shade (orientation and inter-colony shadows);
- resources (carbon proxy, substrate minerals, tissue maintenance and growth);
- colony occupancy, contact, competition, lineage and propagation;
- age/development stage, damage, thickness and stress;
- climate, disturbance, death, weathering, persistence of dead material and ecological succession.

Use deterministic events with seeded PRNG and fixed simulation ticks. Each colony has stable ID, lineage, species and growth profile; each tissue face/voxel carries age and stable *material/rest coordinates*. Growth must produce new tissue/geometry; old tissue does not globally inflate. Ecology simulates plausible artistic succession, **not a scientifically calibrated 100-year prediction**. Prefer rock-compatible species in the Century Rock preset and expose an explicit alien-ecology compatibility override.

**Fixed update order:** input events → weather/hydrology → light/resources → colony budgets → morphology growth → collisions/competition → reproduction/death → mechanical relaxation → render snapshot → checkpoint.

## Material renderer / visual realism
Four layers:
1. true silhouettes and geometrical relief (cracks, folded edges, cup depth, ridges);
2. anatomically appropriate cortex/medulla/photobiont zones and microtexture (pores, furrows, grains, cilia, rhizines, reproductive rims);
3. tissue optics via PBR diffuse/specular, roughness, micro-normals, contact shadows, wet/dry absorption and approximate internal scatter/transmission;
4. artistic pigment metamorphosis in *material coordinates* before tone mapping—natural mode as control, user colors as art.

Use scale-conditioned LOD: **macro** geometry, **meso** close-up displacement/geometry, **micro** filtered normal/roughness and instanced granules. Never animate color texture in screen space so it swims over growing tissue. Test fixed photo-like camera and raking light before adding glow or interference.

## The user experience
- iPhone-first: canvas pinned at the top, divider adjustable, tabs below, limited scroll.
- **World:** rock/bark/soil, mineral/porosity/relief, moisture/weather, day/season/light.
- **Colonies:** species/habitat, number, seeded inoculation, lifespan/competition/dispersal.
- **Form:** species-eligible lobes, ruffling, curling, fractures, branch graph, nets, cups.
- **Anatomy:** cortex relief, pores, granules, cilia/rhizines, apothecia/isidia/soralia where valid.
- **Color & Light:** natural reference, opaline, prismatic, fluorescence/fiction, gradient; per species/colony/tissue and palette stop shuffle, reverse, lock.
- **Time & Export:** 1–500 simulated years, default century/30 sec, 5/10/20/30/60 sec video options, seeded timeline, frame rate, quality and ratios.

Touch: seed a colony by tapping; paint inoculation/moisture patches; select colonies; pan/zoom; optional orbit/lighting gesture. Preserve undo/redo, save/load JSON, confirm before New Design, Surprise Me changes actual ecology and topology.

### Century replay contract
At 30 FPS, 30 seconds means 900 offline output frames; 100 years / 900 is about 40.6 days per **output frame**. Compute/schedule stable biological steps and interpolate coherent snapshots; do not use an enormous, numerically unstable one-frame timestep. Record seed, events and periodic checkpoints for rewind/replay. **Ecological succession is non-looping**; exact seamless loops are a separate stable-geometry seasonal/light/pigment mode.

### Export
Build PNG and preset JSON first; high-quality GIF and genuine MP4 next, with 1:1 / 9:16 first, optionally 16:9 / 3:4 / 4:3. Output frames at fixed simulated times, not from jittery live canvas capture. Feature-detect Safari video encoder availability. Do **not** call a renamed WebM an MP4. 30-second masters should favor MP4 over huge GIF.

## Host architecture
- Keep the present **Google AI Studio Vite + React + TypeScript** project setup: `vite.config.ts` has an AI Studio HMR/watch safeguard that should not be removed.
- Three.js/WebGL2 for geometry, shading and framebuffer computation. Use CPU typed arrays/Worker for sparse topology and graph updates, GPU ping-pong for dense fields where supported. When float rendering unsupported, use explicitly tested packed RGBA8 fallback. Optional WASM only if profiled bottlenecks demand it.
- Avoid mandatory paid APIs. No Netlify builds for ordinary development. GitHub Pages is an optional later host for the client-only version.
- Suggested modules: `src/world`, `src/biology`, `src/engines/{areole,lobe,axis,squamule,hydra}`, `src/materials`, `src/render`, `src/timeline`, `src/export`, `src/validation`, `data/species`.

## Build gates (one convincing specimen before a zoo)
0. Reference vault and macro camera/material diagnostic rig; species photo/license/source ledger.
1. **AREOLE flagship**: physically credible grayscale *Rhizocarpon* on rock, real cracks and edge growth.
2. **LOBE hero**: genuine expanding 3D sheet with layered ruffles, self-shadow and grounded attachment.
3. **SCYPHI hero**: squamules continuously developing hollow granular pixie cups.
4. Material realism: wet/dry paired test, microscopic pores/ridges/anatomy and lights.
5. Fruticose branches, perforated lace, gelatinous/umbilicate organisms.
6. Cohabitation: resources, habitat constraints, competition, dispersal, death/succession.
7. Full color lab, presets, touch, state rewind and verified smooth offline video output.

**Acceptance criteria:** recognizable grayscale species, no swimming textures, real lobe/cup depth and light shadows, no species-inappropriate organs, biologically linked wet/dry geometric AND material response, deterministic replays, graceful iPhone WebGL2 fallbacks, no blank screens, no ghost controls, tested video encode/reimport.

## Research provenance / scientific humility
Based on the artist's November 17, 2026 attachments: `photorealistic_lichen_engine_research(1).txt`, `photorealistic_lichen_engine_research(5).pdf`, `lichen_species_reference_atlas(1).json`, `Lichenssss.pdf`. Reference species include *Rhizocarpon geographicum*, *Xanthoria parietina*, *Lobaria pulmonaria*, *Parmelia sulcata*, *Cladonia pyxidata*, *Cladonia rangiferina*, *Ramalina menziesii*, *Lasallia pustulata*, *Lepraria incana* and *Enchylium tenax*. Verify source photographs' individual licenses before bundling assets. Biological observations, physically inspired mechanisms, computational approximations and psychedelic inventions must not be conflated. This repo's **current display is a scaffold, not a finished lichen simulator**.
