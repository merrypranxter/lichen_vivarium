export const EXTENT = 11.6;
export const GRID = 112;
const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const smooth = (x: number) => { const t = clamp(x); return t*t*(3-2*t); };
export function hash(i:number,j:number,seed:number):number{
  let n=Math.imul(i|0,374761393)+Math.imul(j|0,668265263)+Math.imul(seed|0,1442695041);
  n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;
}
export function noise(x:number,y:number,s:number):number{
  const i=Math.floor(x),j=Math.floor(y),a=smooth(x-i),b=smooth(y-j);
  const u=hash(i,j,s)*(1-a)+hash(i+1,j,s)*a;
  const v=hash(i,j+1,s)*(1-a)+hash(i+1,j+1,s)*a;
  return u*(1-b)+v*b;
}
export function fbm(x:number,y:number,s:number):number{
  let value=0,weight=.54,total=0;
  for(let k=0;k<5;k++){value+=weight*noise(x,y,s+37*k);total+=weight;x=x*2.08+4.31;y=y*2.08-8.15;weight*=.49;}
  return value/total;
}
export function onRock(x:number,y:number,s:number):boolean{
  const a=Math.atan2(y/.94,x),r=Math.hypot(x/5.48,y/5.08);
  const b=1+.036*Math.sin(7*a+1.8)+.035*Math.sin(13*a-.9)
    +.025*(noise(Math.cos(a)*6+10,Math.sin(a)*6+10,s+310)-.5);
  return r<b;
}
export function stoneZ(x:number,y:number,s:number):number{
  const large=fbm(x*.26+14,y*.29-8,s+51)-.5;
  const medium=fbm(x*.86-3,y*.92+9,s+73)-.5;
  const small=fbm(x*3.1,y*3.1,s+97)-.5;
  const warp=.24*(fbm(x*.45,y*.55,s+22)-.5);
  const seam=Math.exp(-Math.pow(Math.sin(x*.69+y*.26+warp*3.4)*8.5,2));
  const r=Math.hypot(x/5.48,y/5.08);
  return .18+large*1.06+medium*.27+small*.045-seam*.065-.39*smooth((r-.7)/.34);
}
export function stoneRGB(x:number,y:number,s:number):[number,number,number]{
  const n=fbm(x*.93,y*.76,s+2),mineral=noise(x*.27+22,y*.35-9,s+6);
  const seam=Math.exp(-Math.pow(Math.sin(x*.69+y*.26)*9,2));
  const v=.44+.45*n-.11*seam;
  return [v*(.61+.22*mineral),v*(.62+.08*mineral),v*(.65+.14*(1-mineral))];
}
export interface TissueSample {
  biomass:number; age:number; owner:number; fracture:number; edge:number; hydration:number; guide:number;
}
export class CrustWorld {
  readonly seed:number;
  readonly owner=new Uint8Array(GRID*GRID);
  readonly biomass=new Float32Array(GRID*GRID);
  readonly age=new Float32Array(GRID*GRID);
  readonly stress=new Float32Array(GRID*GRID);
  /** Persistent fracture severity; written only by advanceFractures(). */
  readonly damage=new Float32Array(GRID*GRID);
  readonly resource=new Float32Array(GRID*GRID);
  readonly crackSite=new Float32Array(GRID*GRID);
  readonly valid=new Uint8Array(GRID*GRID);
  year=0;
  rainfall=.62;
  colonyCount=0;
  occupied=0;
  private tick=0;
  constructor(seed:number){
    this.seed=seed|0;
    for(let j=0;j<GRID;j++)for(let i=0;i<GRID;i++){
      const x=(i/(GRID-1)-.5)*EXTENT,y=(j/(GRID-1)-.5)*EXTENT,k=j*GRID+i;
      this.valid[k]=onRock(x,y,seed)?1:0;
      this.resource[k]=clamp(.37+.8*fbm(x*.55,y*.61,seed+19),.38,1);
      this.crackSite[k]=this.voronoiCrack(x,y);
    }
    this.inoculate(-2.5,.8);this.inoculate(1.8,1.9);this.inoculate(.2,-2.25);
  }
  private voronoiCrack(x:number,y:number):number{
    const warp=.14*(fbm(x*.84,y*.82,this.seed+781)-.5);
    const gx=(x+warp)*2.28,gy=(y-warp)*2.28,ix=Math.floor(gx),iy=Math.floor(gy);
    let first=100,second=100;
    for(let by=-1;by<=1;by++)for(let bx=-1;bx<=1;bx++){
      const a=ix+bx,b=iy+by;
      const px=a+.19+.62*hash(a,b,this.seed+4);
      const py=b+.19+.62*hash(a,b,this.seed+5);
      const d=Math.hypot(gx-px,gy-py);
      if(d<first){second=first;first=d;}else if(d<second)second=d;
    }
    return clamp(1-(second-first)/.18);
  }
  inoculate(x:number,y:number):boolean{
    if(!onRock(x,y,this.seed)||this.colonyCount>=12)return false;
    const id=++this.colonyCount,ix=Math.round((x/EXTENT+.5)*(GRID-1)),iy=Math.round((y/EXTENT+.5)*(GRID-1));
    for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){
      const i=ix+ox,j=iy+oy;
      if(i<0||j<0||i>=GRID||j>=GRID||Math.hypot(ox,oy)>2.25)continue;
      const k=j*GRID+i;if(!this.valid[k])continue;
      if(!this.owner[k])this.occupied++;
      this.owner[k]=id;this.biomass[k]=Math.max(this.biomass[k],.58+.4*(1-Math.hypot(ox,oy)/2.4));
      this.age[k]=Math.max(this.age[k],.5);
    }
    return true;
  }
  step(dtYears:number):void{
    const dt=Math.min(.5,Math.max(0,dtYears),100-this.year);
    if(dt<=0)return;
    this.year+=dt;this.tick++;
    const climate=clamp(this.rainfall+.16*Math.sin(this.year*.17+this.seed)+.11*Math.sin(this.year*.61+1.7),.07,1);
    const nextOwner=this.owner.slice(),nextBio=this.biomass.slice();
    for(let j=1;j<GRID-1;j++)for(let i=1;i<GRID-1;i++){
      const k=j*GRID+i;if(!this.valid[k])continue;
      const res=this.resource[k],water=clamp(climate*(.62+.57*res));
      if(this.owner[k]){
        const vitality=clamp(.35+water*1.1-Math.abs(water-.65)*.55);
        this.age[k]+=dt;
        nextBio[k]=clamp(this.biomass[k]+dt*(.20*vitality-.018*(1-water)));
        this.stress[k]=clamp(this.stress[k]+dt*(.011+.07*(1-water)*Math.abs(Math.sin(this.year*.64+res*2))));
        if(this.age[k]>38&&water<.34)nextBio[k]=Math.max(.24,nextBio[k]-dt*.025);
        continue;
      }
      let source=0,influence=0;
      const around=[-GRID-1,-GRID,-GRID+1,-1,1,GRID-1,GRID,GRID+1];
      for(let q=0;q<8;q++){
        const n=k+around[q];if(!this.owner[n])continue;
        const energy=this.biomass[n]*(q%2?1:.72);
        if(energy>influence){source=this.owner[n];influence=energy;}
      }
      if(!source||influence<.26)continue;
      const rate=.34*(.4+res)*(.23+1.1*water)*influence;
      if(hash(i+this.tick*17,j-this.tick*11,this.seed+893)<1-Math.exp(-dt*rate)){
        nextOwner[k]=source;nextBio[k]=.19+.15*hash(i,j,this.seed+17);
        this.age[k]=0;this.occupied++;
      }
    }
    this.owner.set(nextOwner);this.biomass.set(nextBio);
    this.advanceFractures(dt);
  }
  /**
   * Raster fracture graph, not a painted Voronoi decal.
   * Nucleation happens at rare, mature, high-strain sites. Neighbor-to-neighbor
   * propagation follows an irregular stress-tolerant areole guide.
   * Prior damage is immutable: no visual crack can "unhappen" on hydration.
   *
   * Mechanism classification: physically motivated *computational analogy*.
   * The thresholds/rates here are artist-tunable, not measured lichen kinetics.
   */
  private advanceFractures(dt:number):void{
    const next=this.damage.slice();
    for(let j=2;j<GRID-2;j++)for(let i=2;i<GRID-2;i++){
      const k=j*GRID+i,id=this.owner[k];
      if(!id||this.age[k]<7||this.biomass[k]<.38||this.stress[k]<.16)continue;
      const old=this.damage[k],guide=this.crackSite[k];
      if(old>.001){
        // Open splits gradually deepen as adjacent tissue weathers.
        next[k]=clamp(old+dt*(.065+.125*this.stress[k]));
        continue;
      }
      const nucleation=guide>.66&&this.stress[k]>.27&&this.age[k]>11
        &&hash(i,j,this.seed+731)>.984;
      if(nucleation){next[k]=Math.max(next[k],.29);continue;}
      // A front can only pass between cells belonging to the *same* colony.
      // A high guide value directs the fracture; an occasional off-guide
      // passage creates irregular junctions and short secondary branches.
      if(guide<.22||hash(i,j,this.seed+517)<.085)continue;
      let neighborStrength=0;
      const offsets=[-GRID,-GRID-1,-GRID+1,-1,1,GRID,GRID-1,GRID+1];
      for(let q=0;q<offsets.length;q++){
        const n=k+offsets[q];
        if(this.owner[n]===id&&this.damage[n]>.24){
          neighborStrength=Math.max(neighborStrength,this.damage[n]);
        }
      }
      if(neighborStrength<=0)continue;
      const propagation=dt*(.31+.70*guide)*(.7+.55*this.stress[k])
        *(.75+.25*neighborStrength);
      next[k]=clamp(propagation);
    }
    this.damage.set(next);
  }
  sample(x:number,y:number):TissueSample{
    const gx=(x/EXTENT+.5)*(GRID-1),gy=(y/EXTENT+.5)*(GRID-1);
    const i=Math.floor(gx),j=Math.floor(gy);
    if(i<0||j<0||i>=GRID-1||j>=GRID-1||!onRock(x,y,this.seed)){
      return {biomass:0,age:0,owner:0,fracture:0,edge:1,hydration:.4,guide:0};
    }
    const u=smooth(gx-i),v=smooth(gy-j);
    const ks=[j*GRID+i,j*GRID+i+1,(j+1)*GRID+i,(j+1)*GRID+i+1];
    const ws=[(1-u)*(1-v),u*(1-v),(1-u)*v,u*v];
    let b=0,age=0,fracture=0,guide=0,resource=0,owner=0,dominant=0;
    for(let a=0;a<4;a++){
      const k=ks[a],w=ws[a];b+=w*this.biomass[k];age+=w*this.age[k]*this.biomass[k];
      fracture+=w*this.damage[k];guide+=w*this.crackSite[k];resource+=w*this.resource[k];
      if(w*this.biomass[k]>dominant){dominant=w*this.biomass[k];owner=this.owner[k];}
    }
    age/=Math.max(.001,b);
    return {biomass:b,age,fracture,guide,owner,edge:1-smooth((b-.12)/.47),
      hydration:clamp(this.rainfall*(.54+.60*resource))};
  }
}
