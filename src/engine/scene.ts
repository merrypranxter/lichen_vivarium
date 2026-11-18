import * as THREE from 'three';
import {FolioseGarden} from './foliose';
import {CrustWorld, EXTENT, GRID, fbm, hash, onRock, stoneRGB, stoneZ} from './biology';

export type Pigment = 'natural' | 'ultraviolet' | 'opal';
export type GrowthView = 'mixed' | 'crust' | 'foliose';
const SLICES=160;

/** Rest-space lookup: built once per seed, reused every biological snapshot. */
type SurfaceAtlas = {
  rock: Float32Array; relief: Float32Array; pigment: Float32Array; grain: Float32Array;
};
function createSurfaceAtlas(world:CrustWorld):SurfaceAtlas {
  const count=(SLICES+1)*(SLICES+1);
  const rock=new Float32Array(count),relief=new Float32Array(count);
  const pigment=new Float32Array(count),grain=new Float32Array(count);
  for(let k=0;k<count;k++){
    const col=k%(SLICES+1),row=Math.floor(k/(SLICES+1));
    const x=(col/SLICES-.5)*EXTENT,y=(.5-row/SLICES)*EXTENT;
    rock[k]=stoneZ(x,y,world.seed);
    relief[k]=fbm(x*10.8,y*9.8,world.seed+299);
    pigment[k]=fbm(x*3.7,y*4.2,world.seed+111);
    grain[k]=fbm(x*10.1,y*9.7,world.seed+331);
  }
  return {rock,relief,pigment,grain};
}
const clamp=(v:number,a=0,b=1)=>Math.min(b,Math.max(a,v));
function makeBump(seed:number):THREE.DataTexture{
  const n=512,bytes=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const f=fbm(x*.083,y*.083,seed+23),r=hash(x,y,seed+91);
    const v=Math.round(clamp(.22+.52*f+.25*r)*255),k=4*(y*n+x);
    bytes[k]=bytes[k+1]=bytes[k+2]=v;bytes[k+3]=255;
  }
  const tex=new THREE.DataTexture(bytes,n,n,THREE.RGBAFormat);
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.minFilter=THREE.LinearMipmapLinearFilter;
  tex.magFilter=THREE.LinearFilter;tex.generateMipmaps=true;tex.needsUpdate=true;
  return tex;
}
/**
 * Calibratable-looking cortical microrelief: a two-scale fibrous matrix
 * interrupted by sparse pore wells and minute raised grains.
 * One stable object-space map; no frame-randomized static/noise swimming.
 * Morphological appearance model, not tissue-calibrated microscopy.
 */
function makeCortexBump(seed:number):THREE.DataTexture{
  const n=512,bytes=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const u=x/n,v=y/n,px=u*86,py=v*86,ix=Math.floor(px),iy=Math.floor(py);
    const cx=ix+.18+.64*hash(ix,iy,seed+121);
    const cy=iy+.18+.64*hash(ix,iy,seed+122);
    const dist=Math.hypot(px-cx,py-cy);
    const pore=hash(ix,iy,seed+123)>.48?Math.exp(-32*dist*dist):0;
    const r=hash(x,y,seed+124);
    const matrix=fbm(u*70,v*70,seed+32);
    const fiber=.035*Math.sin(2*Math.PI*(u*113+v*31+matrix*.9));
    const height=clamp(.32+.39*matrix+.16*r+fiber-.35*pore);
    const k=4*(y*n+x),c=Math.round(height*255);
    bytes[k]=bytes[k+1]=bytes[k+2]=c;bytes[k+3]=255;
  }
  const tex=new THREE.DataTexture(bytes,n,n,THREE.RGBAFormat);
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.minFilter=THREE.LinearMipmapLinearFilter;
  tex.magFilter=THREE.LinearFilter;
  tex.generateMipmaps=true;tex.needsUpdate=true;
  return tex;
}
function makeRock(world:CrustWorld,bump:THREE.Texture):THREE.Mesh{
  const geo=new THREE.PlaneGeometry(EXTENT,EXTENT,SLICES,SLICES);
  const attr=geo.attributes.position as THREE.BufferAttribute;
  const colors=new Float32Array(attr.count*3),valid=new Uint8Array(attr.count);
  for(let k=0;k<attr.count;k++){
    const x=attr.getX(k),y=attr.getY(k);
    attr.setZ(k,stoneZ(x,y,world.seed));
    const rgb=stoneRGB(x,y,world.seed);
    colors[k*3]=rgb[0];colors[k*3+1]=rgb[1];colors[k*3+2]=rgb[2];
    valid[k]=onRock(x,y,world.seed)?1:0;
  }
  const source=geo.index!.array,triangles:number[]=[];
  for(let t=0;t<source.length;t+=3){
    const a=source[t],b=source[t+1],c=source[t+2];
    if(valid[a]&&valid[b]&&valid[c])triangles.push(a,b,c);
  }
  geo.setIndex(triangles);
  geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  geo.computeVertexNormals();geo.computeBoundingSphere();
  const mat=new THREE.MeshStandardMaterial({vertexColors:true,metalness:0,roughness:1,bumpMap:bump,bumpScale:.075,side:THREE.DoubleSide});
  const rock=new THREE.Mesh(geo,mat);
  rock.castShadow=true;rock.receiveShadow=true;rock.name='Irregular three-dimensional rock substrate';
  return rock;
}
function makeSide(world:CrustWorld):THREE.Mesh{
  const xyz:number[]=[],rgb:number[]=[],index:number[]=[],n=200;
  for(let i=0;i<=n;i++){
    const a=i/n*Math.PI*2;
    let r=.9;
    for(let s=0;s<60;s++){
      const step=r+.002;
      if(!onRock(Math.cos(a)*5.48*step,Math.sin(a)*5.08*step,world.seed))break;
      r=step;
    }
    const x=Math.cos(a)*5.48*r,y=Math.sin(a)*5.08*r;
    const z=stoneZ(x,y,world.seed),bottom=z-.58-.35*fbm(x*.8,y*.8,world.seed+57);
    xyz.push(x,y,z-.01,x*.91,y*.91,bottom);
    const c=stoneRGB(x,y,world.seed);
    rgb.push(c[0]*.7,c[1]*.7,c[2]*.7,c[0]*.38,c[1]*.38,c[2]*.38);
    if(i<n){const k=i*2;index.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(rgb,3));
  geo.setIndex(index);geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));
  mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}
function pigmentColor(x:number,y:number,owner:number,age:number,wet:number,edge:number,pigment:Pigment,n:number,granule:number):THREE.Color{
  const old=clamp(age/45),jitter=.1*(n-.5)+.08*(granule-.5);
  let c:THREE.Color;
  if(pigment==='natural'){
    const h=[.19,.182,.2,.15,.17][owner%5];
    c=new THREE.Color().setHSL(h+jitter*.19,clamp(.44+.18*n-old*.2),clamp(.42+.19*n+.08*wet-old*.11));
  }else if(pigment==='opal'){
    c=new THREE.Color().setHSL((.48+owner*.11+n*.14+.05*Math.sin(age*.14+x*.8))%1,
      .44+.35*n,.56+.27*granule);
  }else{
    const h=[.82,.31,.54,.09,.71,.43][owner%6];
    c=new THREE.Color().setHSL((h+.11*n+.05*Math.sin(x*2.1+y*2.8))%1,.82,.43+.27*n);
  }
  c.multiplyScalar((1-old*.17)*(.86+.32*granule));
  // Fine chalky deposits develop with tissue age, irrespective of fantasy hue.
  const pruina=clamp((granule-.61)*3)*clamp((age-12)/25)*.17;
  c.lerp(new THREE.Color(.74,.74,.68),pruina);
  c.lerp(new THREE.Color(.045,.053,.044),edge*.68);
  return c;
}
function makeTissue(world:CrustWorld,pigment:Pigment,atlas:SurfaceAtlas):THREE.BufferGeometry{
  const geo=new THREE.PlaneGeometry(EXTENT,EXTENT,SLICES,SLICES);
  const pos=geo.attributes.position as THREE.BufferAttribute;
  const colors=new Float32Array(pos.count*3),valid=new Uint8Array(pos.count);
  for(let k=0;k<pos.count;k++){
    const x=pos.getX(k),y=pos.getY(k),s=world.sample(x,y);
    valid[k]=s.biomass>=.105?1:0;
    const grain=atlas.relief[k];
    const thin=clamp((s.biomass-.08)*2);
    const oldEnough=clamp((s.age-3)/12);
    const crack=clamp(s.fracture*3.25);
    // Growing cortical plates develop uneven crowns, fractured troughs,
    // and a narrow raised bevel along each newly opened fissure.
    const crown=.021+.090*Math.sqrt(clamp(s.biomass))+.040*grain;
    const areole=.026*oldEnough*(1-clamp(s.guide))*grain;
    const edgeBevel=.048*Math.sqrt(Math.max(0,crack*(1-crack)));
    const relief=(crown+areole)*(1-.985*crack)+edgeBevel;
    pos.setZ(k,atlas.rock[k]+.008+thin*relief);
    const c=pigmentColor(x,y,s.owner,s.age,s.hydration,s.edge,pigment,atlas.pigment[k],atlas.grain[k]);
    // Fissure material is an exposed dark underlying layer, not an overlay.
    c.lerp(new THREE.Color(.025,.028,.024),crack*.86);
    colors[k*3]=c.r;colors[k*3+1]=c.g;colors[k*3+2]=c.b;
  }
  const src=geo.index!.array,tri:number[]=[];
  for(let t=0;t<src.length;t+=3){
    const a=src[t],b=src[t+1],c=src[t+2];
    if(valid[a]+valid[b]+valid[c]>=2)tri.push(a,b,c);
  }
  geo.setIndex(tri);
  geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  geo.computeVertexNormals();geo.computeBoundingSphere();
  return geo;
}
export class LichenView{
  readonly world:CrustWorld;
  readonly renderer:THREE.WebGLRenderer;
  readonly scene=new THREE.Scene();
  readonly camera=new THREE.PerspectiveCamera(39,1,.1,100);
  readonly stone:THREE.Mesh;
  readonly tissue:THREE.Mesh;
  private host:HTMLElement;
  private key:THREE.DirectionalLight;
  private bump:THREE.DataTexture;
  private tissueBump:THREE.DataTexture;
  private readonly atlas:SurfaceAtlas;
  readonly foliage:FolioseGarden;
  private growthView:GrowthView='mixed';
  private grayscale=false;
  private discs:THREE.InstancedMesh;
  private rims:THREE.InstancedMesh;
  private ro:ResizeObserver;
  private pigment:Pigment='natural';
  private disposed=false;
  private pointerStart:[number,number]=[0,0];
  onPlant?: (x:number,y:number)=>void;
  constructor(host:HTMLElement,world:CrustWorld){
    this.host=host;this.world=world;
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.45;
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.scene.background=new THREE.Color('#101714');
    host.appendChild(this.renderer.domElement);
    this.bump=makeBump(world.seed+7);
    this.tissueBump=makeCortexBump(world.seed+99);
    this.atlas=createSurfaceAtlas(world);
    this.stone=makeRock(world,this.bump);
    this.scene.add(this.stone,makeSide(world));
    const tissueMaterial=new THREE.MeshStandardMaterial({
      vertexColors:true,roughness:.88,metalness:0,side:THREE.DoubleSide,
      bumpMap:this.tissueBump,bumpScale:.043,polygonOffset:true,polygonOffsetFactor:-1
    });
    this.tissue=new THREE.Mesh(makeTissue(world,this.pigment,this.atlas),tissueMaterial);
    this.tissue.castShadow=true;this.tissue.receiveShadow=true;this.scene.add(this.tissue);
    this.scene.add(new THREE.HemisphereLight(0xe5efff,0x453529,1.35));
    this.key=new THREE.DirectionalLight(0xffe9d0,2);
    this.key.position.set(-5.3,5.8,8);
    this.key.castShadow=true;this.key.shadow.mapSize.set(1024,1024);
    this.key.shadow.camera.left=-8;this.key.shadow.camera.right=8;
    this.key.shadow.camera.top=8;this.key.shadow.camera.bottom=-8;
    this.key.shadow.bias=-.00015;this.scene.add(this.key);
    this.discs=new THREE.InstancedMesh(new THREE.CircleGeometry(.076,12),
      new THREE.MeshStandardMaterial({color:0x24211c,roughness:.98,side:THREE.DoubleSide}),320);
    this.rims=new THREE.InstancedMesh(new THREE.TorusGeometry(.078,.016,5,12),
      new THREE.MeshStandardMaterial({color:0x77795b,roughness:.9}),320);
    this.discs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.rims.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.discs,this.rims);
    this.foliage=new FolioseGarden(world);
    this.scene.add(this.foliage.group);
    this.setOrbit(0);this.setLight(2.2);
    this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(host);this.resize();
    this.renderer.domElement.addEventListener('pointerdown',this.pointerDown);
    this.renderer.domElement.addEventListener('pointerup',this.pointerUp);
    this.update();
  }
  private pointerDown=(e:PointerEvent)=>{this.pointerStart=[e.clientX,e.clientY];};
  private pointerUp=(e:PointerEvent)=>{
    if(Math.hypot(e.clientX-this.pointerStart[0],e.clientY-this.pointerStart[1])>12)return;
    const r=this.renderer.domElement.getBoundingClientRect();
    if(!r.width||!r.height)return;
    const ndc=new THREE.Vector2(2*(e.clientX-r.left)/r.width-1,1-2*(e.clientY-r.top)/r.height);
    const ray=new THREE.Raycaster();ray.setFromCamera(ndc,this.camera);
    const hit=ray.intersectObject(this.stone,false)[0];
    if(hit)this.onPlant?.(hit.point.x,hit.point.y);
  };
  setOrbit(angle:number){
    this.camera.position.set(Math.sin(angle)*5.8,-3.4+Math.cos(angle)*1.1,16-1.5*Math.abs(Math.sin(angle)));
    this.camera.lookAt(0,0,0);
  }
  setLight(angle:number){this.key.position.set(Math.cos(angle)*8,Math.sin(angle)*7,6.2);}
  setZoom(zoom:number){
    this.camera.fov=clamp(39/zoom,23,53);
    this.camera.updateProjectionMatrix();
  }
  setGrayscale(on:boolean){
    this.grayscale=on;
    this.renderer.domElement.style.filter=on?'grayscale(1)':'';
  }
  setPigment(mode:Pigment){
    if(this.pigment===mode)return;
    this.pigment=mode;
    this.foliage.setPigment(mode);
    this.update();
  }
  setGrowthView(mode:GrowthView){
    this.growthView=mode;
    const crustVisible=mode!=='foliose';
    this.tissue.visible=crustVisible;
    this.discs.visible=crustVisible;
    this.rims.visible=crustVisible;
    this.foliage.setVisible(mode!=='crust');
  }
  setRuffle(value:number){this.foliage.setRuffle(value);}
  setCurl(value:number){this.foliage.setCurl(value);}
  setFoldComplexity(value:number){this.foliage.setFoldComplexity(value);}
  plantFoliose(x:number,y:number){return this.foliage.plant(x,y);}
  advanceFoliose(dtYears:number){this.foliage.step(dtYears,this.world.rainfall);}
  folioseStats(){return this.foliage.metrics();}
  update(){
    if(this.disposed)return;
    const next=makeTissue(this.world,this.pigment,this.atlas);
    this.tissue.geometry.dispose();this.tissue.geometry=next;
    const o=new THREE.Object3D();let count=0;
    for(let j=5;j<GRID-5&&count<320;j+=3)for(let i=5;i<GRID-5&&count<320;i+=3){
      if(hash(i,j,this.world.seed+87)<.72)continue;
      const x=(i/(GRID-1)-.5)*EXTENT,y=(j/(GRID-1)-.5)*EXTENT;
      const s=this.world.sample(x,y);
      if(s.biomass<.84||s.age<11||s.fracture>.64)continue;
      const growth=clamp((s.age-11)/14);
      o.position.set(x,y,stoneZ(x,y,this.world.seed)+.10+.016*growth);
      o.scale.setScalar(.47+.68*growth);
      o.rotation.set(0,0,hash(i,j,this.world.seed+86)*Math.PI*2);
      o.updateMatrix();this.discs.setMatrixAt(count,o.matrix);
      o.position.z+=.009;o.updateMatrix();this.rims.setMatrixAt(count,o.matrix);
      count++;
    }
    this.discs.count=this.rims.count=count;
    this.discs.instanceMatrix.needsUpdate=true;
    this.rims.instanceMatrix.needsUpdate=true;
    this.foliage.update();
  }
  render(){if(!this.disposed)this.renderer.render(this.scene,this.camera);}
  png():string{
    this.render();
    if(!this.grayscale)return this.renderer.domElement.toDataURL('image/png');
    const original=this.renderer.domElement;
    const copy=document.createElement('canvas');
    copy.width=original.width;copy.height=original.height;
    const context=copy.getContext('2d');
    if(!context)throw new Error('Canvas capture unavailable');
    context.filter='grayscale(100%)';
    context.drawImage(original,0,0);
    return copy.toDataURL('image/png');
  }
  resize(){
    if(this.disposed)return;
    const w=Math.max(1,this.host.clientWidth),h=Math.max(1,this.host.clientHeight);
    this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
    this.renderer.setSize(w,h,false);this.render();
  }
  dispose(){
    if(this.disposed)return;
    this.disposed=true;this.ro.disconnect();
    this.renderer.domElement.removeEventListener('pointerdown',this.pointerDown);
    this.renderer.domElement.removeEventListener('pointerup',this.pointerUp);
    this.scene.traverse(o=>{
      if(o instanceof THREE.Mesh){
        o.geometry.dispose();
        const ms=Array.isArray(o.material)?o.material:[o.material];
        ms.forEach(m=>m.dispose());
      }
    });
    this.foliage.dispose();
    this.bump.dispose();this.tissueBump.dispose();this.renderer.dispose();
    if(this.renderer.domElement.parentNode===this.host)this.host.removeChild(this.renderer.domElement);
  }
}
