const phases = [
  { id: "01", title: "AREOLE", detail: "Living crust, raised mosaics and permanent cracks." },
  { id: "02", title: "LOBE", detail: "Growing leafy sheets with real curled, ruffled margins." },
  { id: "03", title: "SCYPHI", detail: "Tiny squamules developing into hollow pixie cups." },
  { id: "04", title: "ECOSYSTEM", detail: "Moisture, light, competition, succession and century timelapse." },
];

export default function App() {
  return (
    <main className="app">
      <header className="hero" aria-label="LICHENARIUM project starting point">
        <div className="eyebrow">LICHEN VIVARIUM · NEW FOUNDATION</div>
        <div className="hero-body">
          <div className="specimen-mark" aria-hidden="true">◎</div>
          <h1>LICHENARIUM</h1>
          <p className="tagline">One century of alien life in thirty seconds.</p>
        </div>
        <div className="hero-note">
          <span className="status-dot" aria-hidden="true" />
          Clean canvas · biological renderer not built yet
        </div>
      </header>
      <section className="mission" aria-labelledby="mission-title">
        <div className="section-label">THE MISSION</div>
        <h2 id="mission-title">Biology first. Impossibly beautiful color second.</h2>
        <p>We are building physically convincing lichen growth, not animated lichen-shaped wallpaper. Actual raised areoles, living lobes, ruffled tissue, granular pixie cups, pores, filaments, and changing material optics will come from persistent growth state and geometry.</p>
        <p className="quiet">This page is intentionally an honest project shell. No fake simulation, no placeholder fractal pretending to be lichen. The implementation plan is in <code>docs/LICHENARIUM_BLUEPRINT.md</code>.</p>
      </section>
      <section className="roadmap" aria-label="Build phases">
        <div className="section-label">GROWTH ENGINES · BUILD ORDER</div>
        <div className="phase-grid">
          {phases.map((p) => (
            <article className="phase" key={p.id}>
              <div className="phase-number">{p.id}</div>
              <h3>{p.title}</h3>
              <p>{p.detail}</p>
            </article>
          ))}
        </div>
      </section>
      <footer>STATIC AI STUDIO STARTING POINT · VITE / REACT / TYPESCRIPT · NO NETLIFY REQUIRED</footer>
    </main>
  );
}
