import {strict as assert} from 'node:assert';
import {CrustWorld} from '../src/engine/biology';
import {FolioseGarden} from '../src/engine/foliose';

function make(seed=75231,ruffle=.83,curl=.66) {
  const world=new CrustWorld(seed);
  const leaves=new FolioseGarden(world);
  leaves.setRuffle(ruffle);leaves.setCurl(curl);
  return {world,leaves};
}
function grow(model:ReturnType<typeof make>,years:number,water=.62) {
  for(let i=0;i<Math.round(years/.2);i++){
    model.world.step(.2);
    model.leaves.step(.2,water);
  }
}
const a=make(),b=make();
const initial=a.leaves.metrics();
assert.equal(a.leaves.colonyCount,3,'three initial foliose rosettes');
assert.equal(initial.lobes,23,'three colonies with independent lobe shells');
grow(a,40);grow(b,40);
const mid=a.leaves.metrics();
assert.ok(mid.activatedRows>initial.activatedRows,'margin deposition activates new rows');
assert.ok(mid.edgeLift>0,'upper tissue physically lifts from substrate');
assert.ok(mid.maxRockPenetration<.011,'upper tissue must not enter rock');
for(let i=0;i<a.leaves.lobes.length;i++){
  const one=a.leaves.lobes[i],two=b.leaves.lobes[i];
  assert.equal(one.count,two.count,'deterministic active marginal rows');
  for(let k=0;k<one.pos.length;k++){
    assert.ok(Number.isFinite(one.pos[k]),'all material coordinates must remain finite');
    assert.equal(one.pos[k],two.pos[k],'same-seed foliose geometry and physics must replay');
  }
}
a.leaves.update();
for(const lobe of a.leaves.lobes){
  assert.ok(lobe.geometry.index!.count>0,'every shell has physical triangles');
  assert.ok(lobe.geometry.attributes.normal!==undefined,'meshes calculate lit surface normals');
}
assert.ok(a.leaves.plant(.1,-2.5),'tap-planted rosette on rock should succeed');
assert.equal(a.leaves.colonyCount,4);
grow(a,10);
assert.equal(a.leaves.lobes.length,31,'manual rosette creates its own separate growing lobes');
const calm=make(8123,0,.65),folded=make(8123,1.5,.65);
grow(calm,35,.52);grow(folded,35,.52);
let difference=0;
for(let i=0;i<calm.leaves.lobes.length;i++){
  const low=calm.leaves.lobes[i].pos,high=folded.leaves.lobes[i].pos;
  for(let k=0;k<low.length;k++)difference=Math.max(difference,Math.abs(low[k]-high[k]));
}
assert.ok(difference>1e-5,'edge rest-metric surplus must alter geometry, not only color');
const wet=make(12345),dry=make(12345);
grow(wet,35,.96);grow(dry,35,.14);
assert.ok(dry.leaves.metrics().edgeLift>wet.leaves.metrics().edgeLift,
  'desiccation must physically increase free-edge lift');
for(const model of [a,b,calm,folded,wet,dry])model.leaves.dispose();
console.log('Foliose tests passed: mesh deposition, seed replay, no penetration, edge mechanics, hydration curl, user planting.');
