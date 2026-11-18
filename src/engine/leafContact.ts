/**
 * Deterministic, bounded foliose contact in projected rock coordinates.
 *
 * Contact algorithm: spatial hash of existing lower shell TRIANGLES,
 * barycentric height lookup, and elevation of newer upper shell VERTICES.
 * This is a 2.5D vertex-triangle projection (better than vertex proximity).
 * It does not solve continuous collision or same-lobe self-intersection.
 * No Three.js dependency; can be regression-tested without WebGL.
 */
export interface ContactSheet {
  id: number;
  rows: number;
  cols: number;
  pos: Float32Array;
  contactZ: Float32Array;
}
export interface ContactResult {
  corrections: number;
  candidates: number;
  maxLift: number;
}
interface Triangle {
  sheet: ContactSheet;
  a: number;
  b: number;
  c: number;
}
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const key = (x: number, y: number) => x + ',' + y;
const XY_CELL = .28;
const THICKNESS_GAP = .075;
const MAX_RISE = .095;

// Returns interpolated height only inside the projected triangle.
function surfaceZ(t: Triangle, x: number, y: number): number | undefined {
  const p=t.sheet.pos,ia=t.a*3,ib=t.b*3,ic=t.c*3;
  const ax=p[ia],ay=p[ia+1],bx=p[ib],by=p[ib+1],cx=p[ic],cy=p[ic+1];
  const denom=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);
  if(Math.abs(denom)<1e-7)return undefined;
  const u=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/denom;
  const v=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/denom;
  const w=1-u-v;
  if(u<-.0001||v<-.0001||w<-.0001)return undefined;
  return u*p[ia+2]+v*p[ib+2]+w*p[ic+2];
}
function insertTriangle(
  t: Triangle,
  tris: Triangle[],
  bins: Map<string, number[]>
) {
  const p=t.sheet.pos;
  const ia=t.a*3,ib=t.b*3,ic=t.c*3;
  const minX=Math.floor(Math.min(p[ia],p[ib],p[ic])/XY_CELL);
  const maxX=Math.floor(Math.max(p[ia],p[ib],p[ic])/XY_CELL);
  const minY=Math.floor(Math.min(p[ia+1],p[ib+1],p[ic+1])/XY_CELL);
  const maxY=Math.floor(Math.max(p[ia+1],p[ib+1],p[ic+1])/XY_CELL);
  // Degenerate/overexpanded faces never become global collision hotspots.
  if((maxX-minX+1)*(maxY-minY+1)>35)return;
  const index=tris.length;tris.push(t);
  for(let gx=minX;gx<=maxX;gx++)for(let gy=minY;gy<=maxY;gy++){
    const k=key(gx,gy);let b=bins.get(k);
    if(!b){b=[];bins.set(k,b);}b.push(index);
  }
}
/** Increasing id determines stable stacking order for cohabiting rosettes. */
export function separateFolioseSheets(sheets: readonly ContactSheet[]): ContactResult {
  const ordered=[...sheets].sort((a,b)=>a.id-b.id);
  const bins=new Map<string,number[]>(),tris:Triangle[]=[];
  let corrections=0,candidates=0,maxLift=0;
  for(const sheet of ordered){
    const p=sheet.pos,cols=sheet.cols,rows=sheet.rows;
    if(rows<2||cols<2)continue;
    // Newer/higher-priority leaf contacts the *triangulated lower surfaces*.
    // Use every surface vertex to prevent tips slipping through wide quads.
    for(let r=2;r<rows;r++)for(let c=0;c<cols;c++){
      const vertex=r*cols+c,i=3*vertex,x=p[i],y=p[i+1];
      const bucket=bins.get(key(Math.floor(x/XY_CELL),Math.floor(y/XY_CELL)));
      if(!bucket)continue;
      let target=p[i+2];
      for(let n=0;n<bucket.length;n++){
        const t=tris[bucket[n]];
        candidates++;
        const z=surfaceZ(t,x,y);
        if(z!==undefined)target=Math.max(target,z+THICKNESS_GAP);
      }
      const rise=clamp(target-p[i+2],0,MAX_RISE);
      if(rise>1e-6){
        p[i+2]+=rise;
        sheet.contactZ[vertex]=Math.max(sheet.contactZ[vertex],rise);
        corrections++;
        maxLift=Math.max(maxLift,rise);
      }
    }
    // Insert a *coarsely triangulated* surface, not sparse vertex points.
    // 2x2 tessellation keeps phone CPU usage controlled; the full edge can
    // still be tested against this surface on its next lobe.
    for(let r=0;r<rows-1;r+=2){
      const r2=Math.min(rows-1,r+2);
      for(let c=0;c<cols-1;c+=2){
        const c2=Math.min(cols-1,c+2);
        const a=r*cols+c,b=r*cols+c2,d=r2*cols+c,e=r2*cols+c2;
        insertTriangle({sheet,a,b,c:d},tris,bins);
        insertTriangle({sheet,a:b,b:e,c:d},tris,bins);
      }
    }
  }
  return {corrections,candidates,maxLift};
}
