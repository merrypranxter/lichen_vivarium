/**
 * LICHENARIUM Phase 2D. Seeded adaptive free-edge tessellation.
 * Geometric extension of a growing foliose shell: NOT a 2D decal or
 * biological growth-rate prediction. Does not depend on Three/WebGL.
 */
export interface MarginInput {
  positions: Float32Array;
  strain: Float32Array;
  rows: number;
  cols: number;
  seed: number;
  lobeId: number;
  maturity: number;
  detail: number;
  dryness: number;
  ground: (x: number, y: number) => number;
}
export interface MarginData {
  positions: Float32Array;
  uvs: Float32Array;
  sources: Uint16Array;
  indices: Uint16Array;
  samples: number;
  triangles: number;
  maxExtension: number;
  maxFloorViolation: number;
}
interface BoundaryPoint {
  x: number; y: number; z: number;
  dx: number; dy: number; strain: number;
  source: number;
  u: number; v: number;
}
const clamp = (v: number, lo = 0, hi = 1): number => Math.max(lo, Math.min(hi, v));
const smooth = (v: number): number => { const t=clamp(v); return t*t*(3-2*t); };
function hash(x: number, y: number, seed: number): number {
  let a=Math.imul(Math.floor(x)|0,374761393)+Math.imul(Math.floor(y)|0,668265263)+Math.imul(seed|0,1442695041);
  a=Math.imul(a^(a>>>13),1274126177);
  return ((a^(a>>>16))>>>0)/4294967296;
}
function noise(x: number, y: number, seed: number): number {
  const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy);
  const a=hash(ix,iy,seed)*(1-fx)+hash(ix+1,iy,seed)*fx;
  const b=hash(ix,iy+1,seed)*(1-fx)+hash(ix+1,iy+1,seed)*fx;
  return a*(1-fy)+b*fy;
}
function boundaryPoint(input:MarginInput,r:number,c:number,innerR:number,innerC:number):BoundaryPoint{
  const {positions, strain, cols, rows}=input;
  const k=r*cols+c,q=k*3,t=(innerR*cols+innerC)*3;
  const dx=positions[q]-positions[t],dy=positions[q+1]-positions[t+1];
  const len=Math.max(1e-7,Math.hypot(dx,dy));
  return {
    x:positions[q], y:positions[q+1], z:positions[q+2],
    dx:dx/len,dy:dy/len,
    strain:clamp(strain[k]*2.3),source:k,
    u:c/(cols-1)*2.4,v:r/(rows-1)*2.6
  };
}
/**
 * Free boundary: left flank from near-anchor to tip, across the tip,
 * and back along the right flank. Each edge segment chooses its OWN
 * tessellation density based on compression and local bend.
 */
export function buildLivingMargin(input:MarginInput):MarginData {
  const {rows, cols, seed, lobeId}=input;
  const empty:MarginData={positions:new Float32Array(0),uvs:new Float32Array(0),sources:new Uint16Array(0),indices:new Uint16Array(0),samples:0,triangles:0,maxExtension:0,maxFloorViolation:0};
  if(rows<2||cols<3||input.maturity<=0)return empty;
  const maturity=smooth(input.maturity),detail=clamp(input.detail,0,2),dry=clamp(input.dryness);
  const path:BoundaryPoint[]=[];
  for(let r=1;r<rows;r++)path.push(boundaryPoint(input,r,0,r,1));
  for(let c=1;c<cols;c++)path.push(boundaryPoint(input,rows-1,c,rows-2,c));
  for(let r=rows-2;r>=1;r--)path.push(boundaryPoint(input,r,cols-1,r,cols-2));
  if(path.length<2)return empty;
  const samples:BoundaryPoint[]=[];
  for(let i=0;i<path.length-1;i++){
    const a=path[i],b=path[i+1];
    const bend=Math.min(1,Math.abs(b.z-a.z)*12+Math.hypot(b.dx-a.dx,b.dy-a.dy)*.65);
    const strain=Math.max(a.strain,b.strain);
    const subdivisions=Math.max(1,Math.min(7,1+Math.floor(detail*1.2+strain*5.5+bend*2)));
    for(let j=0;j<subdivisions;j++){
      const t=j/subdivisions;
      samples.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,
        dx:a.dx+(b.dx-a.dx)*t,dy:a.dy+(b.dy-a.dy)*t,
        strain:a.strain+(b.strain-a.strain)*t,
        source:t<.5?a.source:b.source,
        u:a.u+(b.u-a.u)*t,v:a.v+(b.v-a.v)*t});
    }
  }
  samples.push(path[path.length-1]);
  if(samples.length*4>65535)throw new Error('Margin exceeds Uint16 mesh index capacity');
  const positions=new Float32Array(samples.length*4*3);
  const uvs=new Float32Array(samples.length*4*2);
  const sources=new Uint16Array(samples.length*4);
  const indices:number[]=[];
  let maxExtension=0,maxFloorViolation=0;
  for(let i=0;i<samples.length;i++){
    const p=samples[i],n=Math.max(1e-8,Math.hypot(p.dx,p.dy));
    const nx=p.dx/n,ny=p.dy/n;
    const irregular=noise(p.x*7.3+lobeId*.77,p.y*7.3-lobeId*.41,seed+71);
    const small=noise(p.x*17.5,p.y*17.5,seed+lobeId*11+23);
    const variation=.72+.52*irregular+.15*(small-.5);
    const reach=maturity*(.018+.043*detail)*variation*(.36+1.9*p.strain);
    maxExtension=Math.max(maxExtension,reach);
    const x2=p.x+nx*reach,y2=p.y+ny*reach;
    const ground0=input.ground(p.x,p.y),ground1=input.ground(x2,y2);
    const topBase=Math.max(p.z,ground0+.059);
    const ridge=(irregular-.5)*2;
    const tipRise=.016*maturity+.075*maturity*p.strain*detail*ridge+.032*dry*maturity;
    const tipZ=Math.max(ground1+.059,topBase+tipRise);
    const baseBottom=Math.max(ground0+.014,topBase-.036);
    const tipBottom=Math.max(ground1+.014,tipZ-.028);
    maxFloorViolation=Math.max(maxFloorViolation,ground0+.014-baseBottom,ground1+.014-tipBottom);
    positions.set([p.x,p.y,topBase,x2,y2,tipZ,p.x,p.y,baseBottom,x2,y2,tipBottom],i*12);
    uvs.set([p.u,p.v,p.u,p.v+.18,p.u,p.v,p.u,p.v+.18],i*8);
    for(let side=0;side<4;side++)sources[i*4+side]=p.source;
    if(i>0){
      const a=(i-1)*4,b=i*4;
      indices.push(a,b,a+1,b,b+1,a+1);
      indices.push(a+2,a+3,b+2,b+2,a+3,b+3);
      indices.push(a+1,b+1,a+3,b+1,b+3,a+3);
    }
  }
  if(samples.length>1){
    indices.push(0,1,2,1,3,2);
    const a=(samples.length-1)*4;
    indices.push(a,a+2,a+1,a+1,a+2,a+3);
  }
  return {positions,uvs,sources,indices:new Uint16Array(indices),samples:samples.length,
    triangles:indices.length/3,maxExtension,maxFloorViolation};
}
