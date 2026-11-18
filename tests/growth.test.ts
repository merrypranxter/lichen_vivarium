import {strict as assert} from 'node:assert';
import {CrustWorld,GRID} from '../src/engine/biology';

// No rendering dependency: validate the persistent biological state separately.
function advance(world:CrustWorld,years:number){
  const steps=Math.round(years/.2);
  for(let i=0;i<steps;i++)world.step(.2);
}
function compare(a:Float32Array|Uint8Array,b:Float32Array|Uint8Array,label:string){
  assert.equal(a.length,b.length,label+' size');
  for(let i=0;i<a.length;i++)assert.equal(a[i],b[i],label+' at '+i);
}
const a=new CrustWorld(75231),b=new CrustWorld(75231);
const initial=a.occupied;
assert.equal(a.colonyCount,3,'Three founding colonies should be present');
advance(a,50);advance(b,50);
compare(a.owner,b.owner,'same-seed tissue IDs');
compare(a.damage,b.damage,'same-seed fracture state');
assert.ok(a.occupied>initial,'living fronts must recruit new tissue');
const midpoint=new Float32Array(a.damage);
advance(a,50);advance(b,50);
compare(a.damage,b.damage,'century fracture replay');
compare(a.owner,b.owner,'century growth replay');
assert.ok(Math.abs(a.year-100)<1e-3,'century clock should stop at 100');
let fractures=0;
for(let k=0;k<GRID*GRID;k++){
  assert.ok(Number.isFinite(a.damage[k]),'finite fracture field');
  assert.ok(Number.isFinite(a.biomass[k]),'finite biomass');
  assert.ok(a.damage[k]>=midpoint[k],'fractures must never spontaneously heal');
  if(a.damage[k]>.18)fractures++;
}
assert.ok(fractures>0,'mature tissue should develop actual propagated fractures');
const frozen=new Float32Array(a.damage);
a.step(.2);
compare(frozen,a.damage,'growth freezes at century end');
const different=new CrustWorld(77331);
advance(different,100);
let mismatch=0;
for(let k=0;k<a.owner.length;k++)if(a.owner[k]!==different.owner[k])mismatch++;
assert.ok(mismatch>0,'different seeds should create different colony patterns');
console.log('Growth tests passed',JSON.stringify({
  years:a.year,founders:a.colonyCount,occupied:a.occupied,fracturedCells:fractures,
  changedCellsDifferentSeed:mismatch
}));
