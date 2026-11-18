import {useCallback,useEffect,useRef,useState} from 'react';
import {CrustWorld,GRID} from './engine/biology';
import {LichenView,type Pigment,type GrowthView} from './engine/scene';

const paletteChoices:{id:Pigment;name:string;subtitle:string}[]=[
  {id:'natural',name:'Botanical',subtitle:'Biological reference'},
  {id:'ultraviolet',name:'Ultraviolet',subtitle:'Alien mineral pigments'},
  {id:'opal',name:'Opaline',subtitle:'Pearly cortex'},
];
export default function App(){
  const host=useRef<HTMLDivElement>(null);
  const world=useRef<CrustWorld|null>(null);
  const view=useRef<LichenView|null>(null);
  const speedRef=useRef(3.333);
  const pauseRef=useRef(false);
  const plantModeRef=useRef<'crust'|'foliose'>('foliose');
  const [seed,setSeed]=useState(75231);
  const [revision,setRevision]=useState(0);
  const [year,setYear]=useState(0);
  const [count,setCount]=useState(0);
  const [leafCount,setLeafCount]=useState(0);
  const [lobeCount,setLobeCount]=useState(0);
  const [coverage,setCoverage]=useState(0);
  const [paused,setPaused]=useState(false);
  const [speed,setSpeed]=useState(3.333);
  const [rain,setRain]=useState(.62);
  const [pigment,setPigment]=useState<Pigment>('natural');
  const [growthView,setGrowthView]=useState<GrowthView>('mixed');
  const [plantMode,setPlantMode]=useState<'crust'|'foliose'>('foliose');
  const [ruffle,setRuffle]=useState(.83);
  const [curl,setCurl]=useState(.66);
  const [cortex,setCortex]=useState(1);
  const [showHapters,setShowHapters]=useState(true);
  const [contacts,setContacts]=useState(0);
  const [hapters,setHapters]=useState(0);
  const [light,setLight]=useState(2.2);
  const [orbit,setOrbit]=useState(0);
  const [zoom,setZoom]=useState(1);
  const [grayscale,setGrayscale]=useState(false);
  const [tab,setTab]=useState<'growth'|'foliose'|'material'|'camera'>('foliose');
  const [error,setError]=useState('');
  const [message,setMessage]=useState('Tap the rock to plant another living colony.');
  const restart=useCallback((newSeed:number)=>{
    setSeed(newSeed);setRevision(r=>r+1);setYear(0);setCoverage(0);
    pauseRef.current=false;setPaused(false);
  },[]);
  useEffect(()=>{speedRef.current=speed;},[speed]);
  useEffect(()=>{pauseRef.current=paused;},[paused]);
  useEffect(()=>{plantModeRef.current=plantMode;},[plantMode]);
  useEffect(()=>{
    const element=host.current;
    if(!element)return;
    let mounted=true,raf=0,last=0,accumulator=0,refresh=0,ui=0,finishedRendered=false;
    try{
      const simulation=new CrustWorld(seed);
      simulation.rainfall=rain;
      world.current=simulation;
      const graphics=new LichenView(element,simulation);
      view.current=graphics;
      graphics.setPigment(pigment);
      graphics.setGrowthView(growthView);
      graphics.setRuffle(ruffle);graphics.setCurl(curl);
      graphics.foliage.setCortex(cortex);
      graphics.foliage.setHaptersVisible(showHapters);
      graphics.setOrbit(orbit);graphics.setLight(light);
      graphics.setZoom(zoom);graphics.setGrayscale(grayscale);
      graphics.onPlant=(x,y)=>{
        if(plantModeRef.current==='foliose'){
          if(graphics.plantFoliose(x,y)){
            setLeafCount(graphics.foliage.colonyCount);
            setLobeCount(graphics.foliage.lobes.length);
            setMessage('A new foliose rosette is taking hold. Watch its tips form living tissue.');
          }else setMessage('Plant on bare rock; foliose limit is seven rosettes.');
          return;
        }
        if(simulation.inoculate(x,y)){
          graphics.update();setCount(simulation.colonyCount);
          setMessage('A new crust colony is taking hold.');
        }else setMessage('Plant on the rock surface; maximum 12 crust colonies.');
      };
      setError('');setCount(simulation.colonyCount);
      setLeafCount(graphics.foliage.colonyCount);
      setLobeCount(graphics.foliage.lobes.length);
      const frame=(now:number)=>{
        if(!mounted)return;
        const elapsed=Math.max(0,Math.min(.05,(now-(last||now))/1000));
        last=now;
        if(!pauseRef.current&&simulation.year<100){
          accumulator+=elapsed*speedRef.current;
          let steps=0;
          while(accumulator>=.2&&steps<20&&simulation.year<100){
            simulation.step(.2);
            graphics.advanceFoliose(.2);
            accumulator-=.2;steps++;
          }
          if(steps>0)refresh+=elapsed;
          if(refresh>.16||(simulation.year>=100&&!finishedRendered)){graphics.update();refresh=0;if(simulation.year>=100)finishedRendered=true;}
        }
        if(now-ui>220){
          setYear(simulation.year);
          setCoverage(Math.round(simulation.occupied/(GRID*GRID)*100));
          setContacts(graphics.foliage.contactCount);
          setHapters(graphics.foliage.attachmentCount);
          ui=now;
        }
        graphics.render();
        raf=requestAnimationFrame(frame);
      };
      raf=requestAnimationFrame(frame);
    }catch(e){
      setError(e instanceof Error?e.message:'WebGL initialization failed.');
    }
    return ()=>{
      mounted=false;cancelAnimationFrame(raf);
      if(view.current){view.current.dispose();view.current=null;}
      world.current=null;
    };
    // The whole living specimen resets only for new seed/restart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[seed,revision]);
  const changeRain=(v:number)=>{setRain(v);if(world.current)world.current.rainfall=v;};
  const changePigment=(v:Pigment)=>{setPigment(v);view.current?.setPigment(v);};
  const changeLight=(v:number)=>{setLight(v);view.current?.setLight(v);};
  const changeOrbit=(v:number)=>{setOrbit(v);view.current?.setOrbit(v);};
  const changeView=(v:GrowthView)=>{setGrowthView(v);view.current?.setGrowthView(v);};
  const changeRuffle=(v:number)=>{setRuffle(v);view.current?.setRuffle(v);};
  const changeCurl=(v:number)=>{setCurl(v);view.current?.setCurl(v);};
  const changeCortex=(v:number)=>{setCortex(v);view.current?.foliage.setCortex(v);};
  const changeHapters=(v:boolean)=>{setShowHapters(v);view.current?.foliage.setHaptersVisible(v);};
  const changeZoom=(v:number)=>{setZoom(v);view.current?.setZoom(v);};
  const changeGrayscale=(v:boolean)=>{setGrayscale(v);view.current?.setGrayscale(v);};
  const savePNG=()=>{
    try{
      const image=view.current?.png();if(!image)return;
      const link=document.createElement('a');
      link.href=image;
      link.download='lichenarium-'+seed+'-year-'+Math.floor(year)+'.png';
      link.click();
    }catch{setMessage('This browser blocked PNG capture. Try your device screenshot.');}
  };
  const newRock=()=>{
    if(!window.confirm('Grow a new rock? Existing colony history will be replaced.'))return;
    restart(Math.floor(Math.random()*2147483647));
  };
  return <main className="lichen-app">
    <div className="art-dock">
      <header className="topbar">
        <div className="brand">
          <span className="eyebrow">A LIVING MACROSCOPIC WORLD</span>
          <strong>LICHENARIUM <em>02B / LOBE</em></strong>
        </div>
        <button className="small-button" onClick={savePNG} title="Save current canvas PNG">↓ PNG</button>
      </header>
      <div className="viewport" ref={host} aria-label="Interactive three-dimensional living lichen on rock">
        {error&&<div className="fatal"><strong>WebGL could not initialize</strong><p>{error}</p><p>Try reloading in Google AI Studio or Safari.</p></div>}
        <span className="specimen">LIVING AREOLE + ROCK-GROWING FOLIOSE TISSUE</span>
        <div className="age">{year.toFixed(1)} <small>YEARS</small></div>
      </div>
      <div className="player">
        <div className="player-row">
          <button className="play-button" onClick={()=>setPaused(v=>!v)}>{paused?'▶ GROW':'Ⅱ PAUSE'}</button>
          <div className="timeline-label">A century on stone <span>{Math.round(year)}% elapsed</span></div>
        </div>
        <div className="track"><div className="fill" style={{width:year+'%'}}/></div>
      </div>
    </div>
    <section className="controls">
      <div className="tabs" role="tablist" aria-label="Art controls">
        <button role="tab" aria-selected={tab==='growth'} className={tab==='growth'?'chosen':''} onClick={()=>setTab('growth')}>CRUST</button>
        <button role="tab" aria-selected={tab==='foliose'} className={tab==='foliose'?'chosen':''} onClick={()=>setTab('foliose')}>FOLIOSE</button>
        <button role="tab" aria-selected={tab==='material'} className={tab==='material'?'chosen':''} onClick={()=>setTab('material')}>PIGMENT + WATER</button>
        <button role="tab" aria-selected={tab==='camera'} className={tab==='camera'?'chosen':''} onClick={()=>setTab('camera')}>CAMERA + LIGHT</button>
      </div>
      <div className="panel">
        {tab==='growth'&&<>
          <div className="panel-heading"><h2>Living crust</h2><span>ONE SPECIES · MULTIPLE COLONIES</span></div>
          <p className="help">Tap anywhere on the rock to inoculate. Living edges recruit new cells, grow thick cortex, age, and develop irreversible areole fissures.</p>
          <label className="control"><span>Biological time</span><b>{speed.toFixed(1)} years/sec</b>
            <input type="range" min=".5" max="15" step=".5" value={speed} onChange={e=>setSpeed(Number(e.target.value))}/></label>
          <div className="stats"><span><b>{count}</b> colonies</span><span><b>{coverage}%</b> grid covered</span><span><b>{seed}</b> seed</span></div>
          <div className="buttons">
            <button onClick={newRock}>✳ NEW DESIGN</button>
            <button className="outline" onClick={()=>{if(window.confirm('Restart this seed from the beginning?'))restart(seed);}}>↺ RESTART</button>
          </div>
        </>}
        {tab==='foliose'&&<>
          <div className="panel-heading"><h2>Living leafy lobes</h2><span>NEW: FOLIOSE ENGINE</span></div>
          <p className="help">Saxicolous, Xanthoria-inspired rosettes. Each lobe grows new margin sections, has upper and lower tissue, and develops 3D bends as its free edge gains more material than the anchored center.</p>
          <div className="view-picks">
            <span className="control-label">VIEW THESE ORGANISMS</span>
            <div className="choice-row">
              {(['mixed','foliose','crust'] as GrowthView[]).map(v=><button key={v} className={growthView===v?'active-choice':''} onClick={()=>changeView(v)}>{v==='mixed'?'BOTH':v==='foliose'?'LEAFY ONLY':'CRUST ONLY'}</button>)}
            </div>
          </div>
          <div className="view-picks">
            <span className="control-label">TAP THE ROCK TO PLANT</span>
            <div className="choice-row">
              <button className={plantMode==='foliose'?'active-choice':''} onClick={()=>setPlantMode('foliose')}>LEAFY ROSETTE</button>
              <button className={plantMode==='crust'?'active-choice':''} onClick={()=>setPlantMode('crust')}>CRUST COLONY</button>
            </div>
          </div>
          <label className="control"><span>Growing-edge surplus (ruffles)</span><b>{Math.round(ruffle*100)}%</b>
            <input type="range" min="0" max="1.6" step=".02" value={ruffle} onChange={e=>changeRuffle(Number(e.target.value))}/></label>
          <label className="control"><span>Desiccation-driven curling</span><b>{Math.round(curl*100)}%</b>
            <input type="range" min="0" max="1.5" step=".02" value={curl} onChange={e=>changeCurl(Number(e.target.value))}/></label>
          <label className="control"><span>Upper cortex microrelief</span><b>{Math.round(cortex*100)}%</b>
            <input type="range" min="0" max="2" step=".05" value={cortex} onChange={e=>changeCortex(Number(e.target.value))}/></label>
          <label className="diagnostic-toggle"><input type="checkbox" checked={showHapters} onChange={e=>changeHapters(e.target.checked)}/>
            <span><strong>Show pale underside holdfasts</strong><small>Sparse, short Xanthoria-inspired hapters—visible at macro angles</small></span>
          </label>
          <div className="stats">
            <span><b>{leafCount}</b> foliose rosettes</span>
            <span><b>{lobeCount}</b> living lobes</span>
            <span><b>{hapters}</b> holdfasts</span>
            <span><b>{contacts}</b> contact corrections</span>
          </div>
          <p className="annotation">Living tissue now uses a coarse spatial-hash contact pass, compression-driven tertiary corrugation, a pale lower cortex and sparse attachment structures. Contact is an approximation—not full continuous triangle collision.</p>
        </>}
        {tab==='material'&&<>
          <div className="panel-heading"><h2>Cortex pigmentation</h2><span>REAL GEOMETRY · ALIEN PALETTES</span></div>
          <p className="help">The organism keeps its physical structure when you change colors. Botanical mode lets us examine anatomy without neon doing the work.</p>
          <div className="palette-grid">{paletteChoices.map(p=><button key={p.id} className={'palette '+(pigment===p.id?'current':'')} onClick={()=>changePigment(p.id)}>
            <span className={'swatch '+p.id}/><b>{p.name}</b><small>{p.subtitle}</small>
          </button>)}</div>
          <label className="control"><span>Water availability</span><b>{Math.round(rain*100)}%</b>
            <input type="range" min=".05" max="1" step=".01" value={rain} onChange={e=>changeRain(Number(e.target.value))}/></label>
          <p className="annotation">Hydration influences growth and accumulated drying stress. True wet/dry cortex optics are a later material milestone.</p>
        </>}
        {tab==='camera'&&<>
          <div className="panel-heading"><h2>Macro laboratory</h2><span>LET LIGHT PROVE THE TEXTURE</span></div>
          <p className="help">Study actual raised areoles, fractured cortex, and shadow relief. Switch to grayscale so the pigment cannot conceal weak geometry.</p>
          <label className="control"><span>Raking-light direction</span><b>{Math.round(light*180/Math.PI)}°</b>
            <input type="range" min="0" max="6.28" step=".03" value={light} onChange={e=>changeLight(Number(e.target.value))}/></label>
          <label className="control"><span>Camera angle</span><b>{Math.round(orbit*180/Math.PI)}°</b>
            <input type="range" min="-.9" max=".9" step=".02" value={orbit} onChange={e=>changeOrbit(Number(e.target.value))}/></label>
          <label className="control"><span>Macro magnification</span><b>{zoom.toFixed(2)}×</b>
            <input type="range" min=".8" max="1.65" step=".05" value={zoom} onChange={e=>changeZoom(Number(e.target.value))}/></label>
          <label className="diagnostic-toggle"><input type="checkbox" checked={grayscale} onChange={e=>changeGrayscale(e.target.checked)}/>
            <span><strong>Grayscale anatomy test</strong><small>Applies to the live view and exported PNG</small></span>
          </label>
          <button className="outline" onClick={()=>{changeLight(2.2);changeOrbit(0);changeZoom(1);changeGrayscale(false);}}>RESET CAMERA + LIGHT</button>
        </>}
        <div className="notice">{message}</div>
        <p className="scientific">PHASE 2B · Coarse 3D foliose contact, stress-amplified fine folds, persistent cortex texture, pale underside and short hapter attachments. Growth is still an artist's bio-inspired structural model, not a validated lichen growth prediction. Full triangle collision, real microscopy matching, pixie cups and offline MP4 remain upcoming.</p>
      </div>
    </section>
  </main>;
}
