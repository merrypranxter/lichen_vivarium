/**
 * LICHENARIUM · Phase 2 / LOBE
 *
 * Foliose growth on rock: independent radial lobes, persistent rest-space
 * tissue, new longitudinal mesh rows at active tips, metric-driven wrinkling,
 * underside + edge thickness, and reversible hydration-sensitive curling.
 *
 * Inspiration: Xanthoria-like saxicolous lobes. The spring/rest-metric model
 * is a physically motivated ARTISTIC approximation, not a calibrated species
 * growth law. No universal real-world cell velocities are claimed.
 */
import * as THREE from 'three';
import {fbm, hash, onRock, stoneZ, type CrustWorld} from './biology';
import type {Pigment} from './scene';

const ROWS = 15;
const COLS = 11;
const POINTS = ROWS * COLS;
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

interface Lobe {
  id: number;
  colony: number;
  birth: number;
  width: number;
  length: number;
  count: number;
  rest: Float32Array; // [x, y, z] for all available future material points
  pos: Float32Array; // persistent current shell positions
  previous: Float32Array;
  baseSpan: Float32Array; // row/column intrinsic transverse rest metric
  geometry: THREE.BufferGeometry;
  positions: Float32Array; // upper+lower surfaces
  colors: Float32Array;
  mesh: THREE.Mesh;
}
const offset = (r: number, c: number) => (r * COLS + c) * 3;
const get = (positions: Float32Array, r: number, c: number, axis: number) =>
  positions[offset(r,c) + axis];

/**
 * Construct genuine double faces and CLOSED boundaries. Only activated rows
 * form triangles. Geometry remains a stable object; update() edits buffers.
 */
function indicesForRows(rows: number): number[] {
  const idx: number[] = [];
  for (let r = 0; r < rows - 1; r++) for (let c = 0; c < COLS - 1; c++) {
    const a = r*COLS+c, b = a+1, d=(r+1)*COLS+c, e=d+1;
    idx.push(a,b,d,b,e,d);
    const back=POINTS;
    idx.push(back+a,back+d,back+b,back+b,back+d,back+e);
  }
  // Side faces at both lateral edges.
  for (let r=0;r<rows-1;r++) {
    for (const c of [0,COLS-1]) {
      const a=r*COLS+c, b=(r+1)*COLS+c;
      idx.push(a,b,POINTS+a,b,POINTS+b,POINTS+a);
    }
  }
  // Closed basal and growing-tip caps.
  for (const r of [0, rows-1]) for (let c=0;c<COLS-1;c++) {
    const a=r*COLS+c,b=a+1;
    idx.push(a,POINTS+a,b,b,POINTS+a,POINTS+b);
  }
  return idx;
}

function createLobe(
  world: CrustWorld, colony: number, id: number,
  cx: number, cy: number, angle: number, length: number, width: number, birth: number,
  material: THREE.Material
): Lobe {
  const rest = new Float32Array(POINTS*3);
  const pos = new Float32Array(POINTS*3);
  const previous = new Float32Array(POINTS*3);
  const baseSpan = new Float32Array(ROWS*(COLS-1));
  const perpX = -Math.sin(angle), perpY = Math.cos(angle);
  const forwardX=Math.cos(angle),forwardY=Math.sin(angle);
  const curve = .12 * (hash(id,colony,world.seed+900)-.5);
  const splay = hash(id,colony,world.seed+902)*.3+.85;
  for(let r=0;r<ROWS;r++){
    const t=r/(ROWS-1);
    const distance=.10+length*t;
    const taper=Math.pow(Math.sin(.11+Math.PI*.75*t),.75);
    const spread=width*(.16+.84*taper)*(1+.11*Math.sin(4*t+id));
    const bend=curve*length*t*t;
    for(let c=0;c<COLS;c++){
      const v=c/(COLS-1)*2-1;
      const side=v*spread*splay;
      const x=cx+forwardX*distance+perpX*(side+bend);
      const y=cy+forwardY*distance+perpY*(side+bend);
      const k=offset(r,c);
      const z=stoneZ(x,y,world.seed)+.042+colony*.013
        +.011*Math.sin(c*2.35+id*.7)*t;
      rest[k]=x;rest[k+1]=y;rest[k+2]=z;
      pos[k]=x;pos[k+1]=y;pos[k+2]=z;
      previous[k]=x;previous[k+1]=y;previous[k+2]=z;
    }
    for(let c=0;c<COLS-1;c++){
      const a=offset(r,c),b=offset(r,c+1);
      baseSpan[r*(COLS-1)+c]=Math.hypot(rest[b]-rest[a],rest[b+1]-rest[a+1]);
    }
  }
  const positions=new Float32Array(POINTS*2*3);
  const colors=new Float32Array(POINTS*2*3);
  const uv=new Float32Array(POINTS*2*2);
  for(let side=0;side<2;side++)for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const k=side*POINTS+r*COLS+c;
    uv[k*2]=c/(COLS-1)*2.4;
    uv[k*2+1]=r/(ROWS-1)*2.6;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  geometry.setIndex(indicesForRows(2));
  const mesh=new THREE.Mesh(geometry,material);
  mesh.castShadow=true;mesh.receiveShadow=true;
  mesh.frustumCulled=false; // small dynamic shells; skip stale bounding sphere bugs
  mesh.name='Xanthoria-like growing foliose lobe '+id;
  return {id,colony,birth,length,width,count:2,rest,pos,previous,baseSpan,
    geometry,positions,colors,mesh};
}

function solveSpring(
  lobe:Lobe, ar:number,ac:number,br:number,bc:number,
  target:number, strength:number
):void {
  const a=offset(ar,ac), b=offset(br,bc);
  const dx=lobe.pos[b]-lobe.pos[a],dy=lobe.pos[b+1]-lobe.pos[a+1];
  const dz=lobe.pos[b+2]-lobe.pos[a+2];
  const dist=Math.sqrt(dx*dx+dy*dy+dz*dz);
  if(dist<1e-5)return;
  const delta=clamp((dist-target)*.5*strength,-.045,.045)/dist;
  const wa=ar===0?.02:ar===1?.28:1;
  const wb=br===0?.02:br===1?.28:1;
  const sum=wa+wb;
  const moveA=delta*wa*2/sum,moveB=delta*wb*2/sum;
  lobe.pos[a]+=dx*moveA;lobe.pos[a+1]+=dy*moveA;lobe.pos[a+2]+=dz*moveA;
  lobe.pos[b]-=dx*moveB;lobe.pos[b+1]-=dy*moveB;lobe.pos[b+2]-=dz*moveB;
}

export interface FolioseMetrics {
  activatedRows: number;
  edgeLift: number;
  maxRockPenetration: number;
  lobes: number;
  year: number;
}
export class FolioseGarden {
  readonly group=new THREE.Group();
  readonly lobes:Lobe[]=[];
  readonly world:CrustWorld;
  year=0;
  ruffle=.83;
  curl=.66;
  private pigment:Pigment='natural';
  private colonyTotal=0;
  private material:THREE.MeshStandardMaterial;
  constructor(world:CrustWorld) {
    this.world=world;
    this.material=new THREE.MeshStandardMaterial({
      vertexColors:true,side:THREE.DoubleSide,roughness:.88,metalness:0,
      flatShading:false
    });
    this.plant(-1.70,-.22);
    this.plant(2.15,.48);
    this.plant(.10,2.42);
    this.group.name='Living foliose lichen: rock-adapted rosettes';
    this.update();
  }
  /** Plant a new locally attached rosette. Maximum seven to bound phone cost. */
  plant(x:number,y:number):boolean{
    if(!onRock(x,y,this.world.seed)||this.colonyTotal>=7)return false;
    const colony=this.colonyTotal++;
    const count=colony===2?7:8;
    const direction=hash(colony,13,this.world.seed+412)*Math.PI*2;
    for(let a=0;a<count;a++){
      const id=colony*11+a;
      const angle=direction+a/count*Math.PI*2
        +.11*(hash(id,colony,this.world.seed+411)-.5);
      const length=mix(.93,1.52,hash(id,colony,this.world.seed+71));
      const width=mix(.24,.42,hash(id,colony,this.world.seed+72));
      const birth=this.year+(colony<3?colony*5:0)+hash(id,colony,this.world.seed+73)*7;
      const lobe=createLobe(this.world,colony,id,x,y,
        angle,length,width,birth,this.material);
      this.lobes.push(lobe);this.group.add(lobe.mesh);
    }
    this.update();
    return true;
  }
  get colonyCount(){return this.colonyTotal;}
  setVisible(visible:boolean){this.group.visible=visible;}
  setPigment(mode:Pigment){this.pigment=mode;this.update();}
  setRuffle(v:number){this.ruffle=clamp(v,0,1.6);}
  setCurl(v:number){this.curl=clamp(v,0,1.5);}
  /**
   * Increment only active marginal mesh rows. Already-deposited tissue
   * retains rest coordinates and geometric history while stress relaxes.
   * Fixed iteration count and traversal order keep seed replay stable.
   */
  step(dtYears:number, hydration:number):void {
    const dt=Math.min(.5,Math.max(0,dtYears),100-this.year);
    if(dt<=0)return;
    this.year+=dt;
    const dry=clamp(1-hydration);
    for(const lobe of this.lobes){
      const age=Math.max(0,this.year-lobe.birth);
      const development=clamp(age/82);
      const rows=Math.min(ROWS,2+Math.floor(development*(ROWS-2)));
      if(rows>lobe.count){
        lobe.count=rows;
        lobe.geometry.setIndex(indicesForRows(rows));
      }
      if(age<=0)continue;
      const edgeEnergy=clamp(age/47);
      const px=lobe.pos;
      // Rest-metric mismatch: transverse free margins want MORE material
      // than the surrounding attached tissue can accommodate.
      // This encourages out-of-plane folds, not periodic vertex animation.
      for(let iteration=0;iteration<4;iteration++){
        for(let r=0;r<lobe.count;r++){
          const t=r/(lobe.count-1);
          for(let c=0;c<COLS-1;c++){
            const baseline=lobe.baseSpan[r*(COLS-1)+c];
            const outer=Math.pow(t,2.35);
            const uneven=1+.13*(hash(r,c,lobe.id+this.world.seed+5)-.5);
            const extra=this.ruffle*edgeEnergy*outer*.57*uneven;
            solveSpring(lobe,r,c,r,c+1,baseline*(1+extra),.74);
          }
        }
        for(let r=0;r<lobe.count-1;r++)for(let c=0;c<COLS;c++){
          const a=offset(r,c),b=offset(r+1,c);
          const baseline=Math.hypot(lobe.rest[b]-lobe.rest[a],lobe.rest[b+1]-lobe.rest[a+1]);
          const edge=Math.pow(Math.abs(c/(COLS-1)*2-1),2);
          const target=baseline*(1+this.ruffle*edgeEnergy*edge*.23*Math.pow(r/(lobe.count-1),1.4));
          solveSpring(lobe,r,c,r+1,c,target,.57);
        }
        for(let r=0;r<lobe.count;r++)for(let c=0;c<COLS;c++){
          const k=offset(r,c),u=r/(lobe.count-1),v=c/(COLS-1)*2-1;
          if(r===0){
            px[k]=lobe.rest[k];px[k+1]=lobe.rest[k+1];px[k+2]=lobe.rest[k+2];
            continue;
          }
          const anchored=Math.pow(1-u,1.9);
          const returnStrength=.032+.22*anchored;
          px[k]+=returnStrength*(lobe.rest[k]-px[k]);
          px[k+1]+=returnStrength*(lobe.rest[k+1]-px[k+1]);
          const freeEdge=clamp(.45*Math.pow(u,2)+.55*Math.pow(Math.abs(v),3));
          const lifted=(.04+.33*dry*this.curl*freeEdge)*clamp(age/15);
          const baseZ=stoneZ(px[k],px[k+1],this.world.seed)+.03+lobe.colony*.013;
          px[k+2]+= .09*(baseZ+lifted-px[k+2]);
          px[k+2]=clamp(px[k+2],baseZ,baseZ+.72);
          // Limit lateral shear while allowing genuine buckling.
          px[k]=clamp(px[k],lobe.rest[k]-.32,lobe.rest[k]+.32);
          px[k+1]=clamp(px[k+1],lobe.rest[k+1]-.32,lobe.rest[k+1]+.32);
        }
      }
    }
  }
  private color(lobe:Lobe,r:number,c:number,underside:boolean):THREE.Color {
    const u=r/(ROWS-1),v=c/(COLS-1);
    const n=fbm(v*6+lobe.id*.2,u*6+lobe.colony*.3,this.world.seed+320);
    const veins=Math.sin(v*12+2*n+u*8)*.04;
    const maturity=clamp((this.year-lobe.birth-u*40)/50);
    let h:number,s:number,l:number;
    if(this.pigment==='natural'){
      h=.11+.020*n+.012*lobe.colony+veins*.2;s=.78-.12*maturity;l=.36+.20*n-.07*maturity;
    }else if(this.pigment==='ultraviolet'){
      h=(.75+lobe.colony*.18+.16*n+.07*u)%1;s=.91;l=.43+.20*n;
    }else{
      h=(.45+.12*lobe.colony+.15*n+.10*u)%1;s=.62;l=.62+.17*n;
    }
    if(underside){s*=.42;l*=.43;}
    return new THREE.Color().setHSL(h,clamp(s),clamp(l+.03*veins));
  }
  update():void{
    for(const lobe of this.lobes){
      const dst=lobe.positions,colors=lobe.colors;
      const age=Math.max(0,this.year-lobe.birth);
      lobe.mesh.visible=age>0;
      for(let r=0;r<lobe.count;r++)for(let c=0;c<COLS;c++){
        const src=offset(r,c);
        const topZ=lobe.pos[src+2];
        for(let side=0;side<2;side++){
          const k=(side*POINTS+r*COLS+c)*3;
          dst[k]=lobe.pos[src];
          dst[k+1]=lobe.pos[src+1];
          dst[k+2]=topZ-(side?.042:0);
          const color=this.color(lobe,r,c,side===1);
          colors[k]=color.r;colors[k+1]=color.g;colors[k+2]=color.b;
        }
      }
      const geometry=lobe.geometry;
      (geometry.attributes.position as THREE.BufferAttribute).needsUpdate=true;
      (geometry.attributes.color as THREE.BufferAttribute).needsUpdate=true;
      geometry.computeVertexNormals();
      (geometry.attributes.normal as THREE.BufferAttribute).needsUpdate=true;
    }
  }
  metrics():FolioseMetrics{
    let activated=0,lift=0,penetration=0,count=0;
    for(const lobe of this.lobes){
      activated+=lobe.count;
      count++;
      for(let r=0;r<lobe.count;r++)for(let c=0;c<COLS;c++){
        const k=offset(r,c);
        const ground=stoneZ(lobe.pos[k],lobe.pos[k+1],this.world.seed);
        const elevation=lobe.pos[k+2]-ground;
        lift=Math.max(lift,elevation);
        penetration=Math.max(penetration,Math.max(0,.02-elevation));
      }
    }
    return {activatedRows:activated,edgeLift:lift,maxRockPenetration:penetration,lobes:count,year:this.year};
  }
  dispose():void{
    for(const lobe of this.lobes)lobe.geometry.dispose();
    this.material.dispose();
    this.group.clear();
  }
}
