import {strict as assert} from 'node:assert';
import {CrustWorld} from '../src/engine/biology';
import {FolioseGarden} from '../src/engine/foliose';

function create(seed=53245,complexity=1) {
  const world=new CrustWorld(seed);
  const garden=new FolioseGarden(world);
  garden.setFoldComplexity(complexity);
  garden.setRuffle(1.35);
  return garden;
}
function grow(garden:FolioseGarden){
  for(let t=0;t<300;t++)garden.step(.2,.41);
  garden.update();
}
const a=create(),b=create(),flat=create(53245,0),rich=create(53245,2);
grow(a);grow(b);grow(flat);grow(rich);
for(let i=0;i<a.lobes.length;i++){
  const one=a.lobes[i],two=b.lobes[i];
  assert.equal(one.count,two.count,'same-seed topology');
  for(let k=0;k<one.pos.length;k++){
    assert.ok(Number.isFinite(one.pos[k]),'every tissue coordinate is finite');
    assert.equal(one.pos[k],two.pos[k],'same seed/settings reproduce membrane geometry');
  }
}
let zDifference=0;
for(let i=0;i<flat.lobes.length;i++){
  const f=flat.lobes[i],r=rich.lobes[i];
  for(let k=2;k<f.pos.length;k+=3)zDifference=Math.max(zDifference,Math.abs(f.pos[k]-r.pos[k]));
}
assert.ok(zDifference>1e-5,'fold complexity changes physical geometry, not merely pigment');
assert.ok(rich.metrics().maxRockPenetration<.011,'folding remains above the rock');
assert.ok(rich.metrics().hapters>0,'existing pale-hapter anatomy remains');
assert.ok(rich.lobes.some(l=>l.strain.some(x=>x>.0001)),'folds remain driven by actual compression');
for(const x of [a,b,flat,rich])x.dispose();
console.log('Foliose 2C: fixed-seed repeatability, geometry-changing fold controls, substrate clearance.');
