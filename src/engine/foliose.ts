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
  strain: Float32Array; // persistent compression in resting tissue
  contactZ: Float32Array; // persistent upper-surface contact clearance (diagnostic)
  terrain: Float32Array; // cached rest-space substrate elevation
  pigmentNoise: Float32Array; // stable cortex color statistics
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
  const strain = new Float32Array(POINTS);
  const contactZ = new Float32Array(POINTS);
  const terrain = new Float32Array(POINTS);
  const pigmentNoise = new Float32Array(POINTS);
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
      const ground=stoneZ(x,y,world.seed);
      terrain[r*COLS+c]=ground;
      pigmentNoise[r*COLS+c]=fbm((c/(COLS-1))*6+id*.2,(r/(ROWS-1))*6+colony*.3,world.seed+320);
      const z=ground+.042+colony*.013
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
  return {id,colony,birth,length,width,count:2,rest,pos,previous,baseSpan,strain,contactZ,terrain,pigmentNoise,
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
  contacts: number;
  hapters: number;
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
  private hapterMesh:THREE.InstancedMesh;
  private hapterCount=0;
  private contacts=0;
  private cortex=1;
  constructor(world:CrustWorld) {
    this.world=world;
    this.material=new THREE.MeshStandardMaterial({
      vertexColors:true,side:THREE.DoubleSide,roughness:.88,metalness:0,
      flatShading:false,
      bumpMap:this.makeCortexBump(world.seed),bumpScale:.024
    });
    // Xanthoria: scarce short, pale hapters, not dense black rhizines.
    this.hapterMesh=new THREE.InstancedMesh(
      new THREE.CylinderGeometry(.006,.018,1,5,1),
      new THREE.MeshStandardMaterial({color:0xd2c6a0,roughness:.95,metalness:0}),
      256
    );
    this.hapterMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.hapterMesh.count=0;
    this.hapterMesh.castShadow=true;
    this.group.add(this.hapterMesh);
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
  private makeCortexBump(seed:number):THREE.DataTexture {
    const n=256, data=new Uint8Array(n*n*4);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const u=x/n,v=y/n;
      const coarse=fbm(u*19,v*23,seed+61),fine=fbm(u*77,v*82,seed+119);
      const px=u*53,py=v*43,i=Math.floor(px),j=Math.floor(py);
      const dx=px-i-.15-.7*hash(i,j,seed+7);
      const dy=py-j-.15-.7*hash(i,j,seed+8);
      const pit=hash(i,j,seed+9)>.60 ? Math.exp(-65*(dx*dx+dy*dy)) : 0;
      const line=.045*Math.sin((u*88+coarse*2.8)*Math.PI*2);
      const height=clamp(.32+.38*coarse+.20*fine+line-.23*pit);
      const k=(y*n+x)*4,c=Math.round(height*255);
      data[k]=data[k+1]=data[k+2]=c;data[k+3]=255;
    }
    const tex=new THREE.DataTexture(data,n,n,THREE.RGBAFormat);
    tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
    tex.minFilter=THREE.LinearMipmapLinearFilter;tex.magFilter=THREE.LinearFilter;
    tex.generateMipmaps=true;tex.needsUpdate=true;
    return tex;
  }
  get colonyCount(){return this.colonyTotal;}
  setVisible(visible:boolean){this.group.visible=visible;}
  setPigment(mode:Pigment){this.pigment=mode;this.update();}
  setRuffle(v:number){this.ruffle=clamp(v,0,1.6);}
  setCurl(v:number){this.curl=clamp(v,0,1.5);}
  setCortex(v:number){this.cortex=clamp(v,0,2);this.material.bumpScale=.024*this.cortex;}
  setHaptersVisible(visible:boolean){this.hapterMesh.visible=visible;}
  get contactCount(){return this.contacts;}
  get attachmentCount(){return this.hapterCount;}
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
      // Sample ground once per fixed biological step, not four times per
      // spring iteration. Final post-solve projection checks true ground.
      const groundStep=new Float32Array(lobe.count*COLS);
      for(let r=0;r<lobe.count;r++)for(let c=0;c<COLS;c++){
        const k=offset(r,c);
        groundStep[r*COLS+c]=stoneZ(px[k],px[k+1],this.world.seed);
      }
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
          const baseZ=groundStep[r*COLS+c]+.075+lobe.colony*.013;
          px[k+2]+= .09*(baseZ+lifted-px[k+2]);
          px[k+2]=clamp(px[k+2],baseZ,baseZ+.72);
          // Limit lateral shear while allowing genuine buckling.
          px[k]=clamp(px[k],lobe.rest[k]-.32,lobe.rest[k]+.32);
          px[k+1]=clamp(px[k+1],lobe.rest[k+1]-.32,lobe.rest[k+1]+.32);
        }
      }
      // Stress is causally derived from rest-metric surplus and the actual
      // local deformed distance. It amplifies seeded irregularities into
      // physically persistent tertiary folds, not a time-driven sine wave.
      if(this.ruffle>0){
        for(let r=2;r<lobe.count;r++)for(let c=1;c<COLS-1;c++){
          const a=offset(r,c-1),b=offset(r,c+1),k=offset(r,c);
          const span=Math.hypot(px[b]-px[a],px[b+1]-px[a+1],px[b+2]-px[a+2]);
          const reference=lobe.baseSpan[r*(COLS-1)+c-1]
            +lobe.baseSpan[r*(COLS-1)+c];
          const t=r/(lobe.count-1);
          const preferred=reference*(1+this.ruffle*edgeEnergy*Math.pow(t,2.35)*.57);
          const compression=clamp((preferred-span)/Math.max(preferred,.0001));
          const q=r*COLS+c;
          lobe.strain[q]+=.12*(compression-lobe.strain[q]);
          const variation=hash(r,c,lobe.id+this.world.seed+887);
          const ridgeSign=variation>.5?1:-1;
          px[k+2]+=.024*this.ruffle*lobe.strain[q]*ridgeSign*Math.pow(t,2);
          const substrate=groundStep[r*COLS+c]+.062;
          px[k+2]=clamp(px[k+2],substrate,substrate+.75);
        }
      }
      // Final projection prevents surface intersections after lateral
      // spring updates without repeating full rock FBM inside iterations.
      for(let r=1;r<lobe.count;r++)for(let c=0;c<COLS;c++){
        const k=offset(r,c);
        const floor=stoneZ(px[k],px[k+1],this.world.seed)+.062;
        if(px[k+2]<floor)px[k+2]=floor;
      }
    }
    this.resolveContacts();
  }
  /**
   * Bounded local vertex contact / 2.5D shell separation.
   * Spatial hash limits neighbors to nearby cells; does not claim exact
   * triangle-triangle collision (that requires a later continuous solver).
   * The higher tissue yields upward, preserving the lower sheet.
   */
  private resolveContacts():void {
    type ContactPoint={lobe:Lobe; r:number; c:number; x:number; y:number; z:number};
    const map=new Map<string,ContactPoint[]>();
    const cell=.19;
    this.contacts=0;
    for(const lobe of this.lobes){
      if(this.year<=lobe.birth)continue;
      for(let r=2;r<lobe.count;r+=2)for(let c=0;c<COLS;c+=2){
        const k=offset(r,c),x=lobe.pos[k],y=lobe.pos[k+1],z=lobe.pos[k+2];
        const gx=Math.floor(x/cell),gy=Math.floor(y/cell);
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
          const around=map.get((gx+dx)+','+(gy+dy));
          if(!around)continue;
          for(const p of around){
            if(p.lobe===lobe)continue;
            if(Math.abs(x-p.x)>.15||Math.abs(y-p.y)>.15)continue;
            if(Math.hypot(x-p.x,y-p.y)>.15)continue;
            const separation=z-p.z;
            if(Math.abs(separation)>=.09)continue;
            // Stable identity ordering breaks perfectly coincident ties.
            const thisTop=separation>.00001 || (Math.abs(separation)<.00001 && lobe.id>p.lobe.id);
            const upper=thisTop?lobe:p.lobe;
            const upperIndex=thisTop?k:offset(p.r,p.c);
            const lowerZ=thisTop?p.z:z;
            const correction=.09-Math.abs(separation);
            const maxAbove=stoneZ(upper.pos[upperIndex],upper.pos[upperIndex+1],this.world.seed)+.78;
            upper.pos[upperIndex+2]=Math.min(maxAbove,Math.max(upper.pos[upperIndex+2],lowerZ+.09)+correction*.15);
            upper.contactZ[upperIndex/3]=Math.max(upper.contactZ[upperIndex/3],correction);
            this.contacts++;
          }
        }
        const key=gx+','+gy;
        let bucket=map.get(key);
        if(!bucket){bucket=[];map.set(key,bucket);}
        bucket.push({lobe,r,c,x,y,z});
      }
    }
  }
  private color(lobe:Lobe,r:number,c:number,underside:boolean):THREE.Color {
    const u=r/(ROWS-1),v=c/(COLS-1);
    const n=lobe.pigmentNoise[r*COLS+c];
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
    if(underside){
      // Pale underside of Xanthoria; avoid the generic black underside.
      h=.13+.018*n;s=.20+.08*n;l=.69-.10*n;
    } else {
      const relief=lobe.strain[r*COLS+c];
      l+=.11*relief; // raised cortical stress bands slightly lighten
    }
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
          // Upper and lower cortex: maintain contact-safe physical thickness.
          const undersideZ=Math.max(lobe.terrain[r*COLS+c]+.012,topZ-.042);
          dst[k+2]=side?undersideZ:topZ;
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
    this.updateHapters();
  }
  /** Short pale basal holdfasts, only where a grown lobe approaches stone. */
  private updateHapters():void {
    const obj=new THREE.Object3D();
    const axis=new THREE.Vector3(0,1,0),target=new THREE.Vector3(0,0,1);
    obj.quaternion.setFromUnitVectors(axis,target);
    let count=0;
    for(const lobe of this.lobes){
      if(this.year<=lobe.birth)continue;
      for(const r of [1,3,5])for(const c of [2,COLS-3]){
        if(r>=lobe.count||count>=256)continue;
        const k=offset(r,c);
        const x=lobe.pos[k],y=lobe.pos[k+1];
        const ground=lobe.terrain[r*COLS+c]+.008;
        const underside=Math.max(ground+.014,lobe.pos[k+2]-.042);
        const length=Math.max(.014,underside-ground);
        if(length>.30)continue;
        obj.position.set(x,y,ground+length*.5);
        obj.scale.set(1,length,1);obj.updateMatrix();
        this.hapterMesh.setMatrixAt(count++,obj.matrix);
      }
    }
    this.hapterCount=count;
    this.hapterMesh.count=count;
    this.hapterMesh.instanceMatrix.needsUpdate=true;
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
    return {activatedRows:activated,edgeLift:lift,maxRockPenetration:penetration,lobes:count,year:this.year,
      contacts:this.contacts,hapters:this.hapterCount};
  }
  dispose():void{
    for(const lobe of this.lobes)lobe.geometry.dispose();
    this.material.bumpMap?.dispose();
    this.material.dispose();
    this.hapterMesh.geometry.dispose();
    (this.hapterMesh.material as THREE.Material).dispose();
    this.group.clear();
  }
}
