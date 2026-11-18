import {strict as assert} from 'node:assert';
import {CrustWorld} from '../src/engine/biology';
import {FolioseGarden} from '../src/engine/foliose';

const seed=75231;
const first=new FolioseGarden(new CrustWorld(seed));
const replay=new FolioseGarden(new CrustWorld(seed));
const rest=first.lobes.map(lobe=>new Float32Array(lobe.pos));
assert.equal(first.colonyCount,3,'three starting foliose rosettes');
const before=first.metrics();
assert.equal(before.hapters,0,'no mature holdfasts at year zero');
for(let t=0;t<200;t++){
  first.step(.2,.38);
  replay.step(.2,.38);
}
first.update();
replay.update();
const after=first.metrics();
assert.ok(after.activatedRows>before.activatedRows,'young sheet must grow new marginal rows');
assert.ok(after.hapters>0,'mature foliose tissue must develop sparse attachments');
assert.ok(after.hapters<256,'bounded number of instanced attachment structures');
assert.ok(after.maxRockPenetration<.011,'upper surface must clear the substrate');
assert.equal(after.hapters,replay.metrics().hapters,'same seed and timeline reproduce holdfast counts');
assert.equal(after.contacts,replay.metrics().contacts,'same seed reproduces coarse contact response');
let stressFound=false,undersideDifferent=false,difference=0;
for(let i=0;i<first.lobes.length;i++){
  const a=first.lobes[i],b=replay.lobes[i];
  assert.equal(a.count,b.count,'active topology equal');
  const color=a.geometry.attributes.color;
  const pointCapacity=a.rest.length/3;
  for(let r=0;r<a.count;r++)for(let c=0;c<11;c++){
    const k=r*11+c;
    const p=k*3;
    for(let d=0;d<3;d++){
      assert.ok(Number.isFinite(a.pos[p+d]),'finite living material coordinates');
      assert.equal(a.pos[p+d],b.pos[p+d],'reproducible stress/collision state');
      difference=Math.max(difference,Math.abs(a.pos[p+d]-rest[i][p+d]));
    }
    assert.equal(a.strain[k],b.strain[k],'compression history replay');
    if(a.strain[k]>.0001)stressFound=true;
    const shadeDelta=Math.abs(color.getX(k)-color.getX(pointCapacity+k))
      +Math.abs(color.getY(k)-color.getY(pointCapacity+k))
      +Math.abs(color.getZ(k)-color.getZ(pointCapacity+k));
    if(shadeDelta>.02)undersideDifferent=true;
    assert.ok(a.contactZ[k]>=0 && Number.isFinite(a.contactZ[k]),'valid local contact correction');
  }
}
assert.ok(difference>.002,'growth must physically change old living material');
assert.ok(stressFound,'maturing free margins should accumulate metric mismatch');
assert.ok(undersideDifferent,'lower cortex must differ from upper pigment');
first.setCortex(0);
first.setCortex(2);
first.setHaptersVisible(false);
first.setHaptersVisible(true);
first.update();
assert.ok(first.metrics().hapters>0,'re-enabling instanced attachments preserves them');
first.dispose();replay.dispose();
console.log('Foliose 2B tests passed: geometry, contact determinism, stress, pale underside, sparse hapters.');
