import {strict as assert} from 'node:assert';
import {separateFolioseSheets, type ContactSheet} from '../src/engine/leafContact';

function sheet(id:number,xOffset=0,yOffset=0,z=.12):ContactSheet {
  const rows=3,cols=3,pos=new Float32Array(rows*cols*3);
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const i=(r*cols+c)*3;
    pos[i]=(c-1)*.19+xOffset;
    pos[i+1]=(r-1)*.19+yOffset;
    pos[i+2]=z;
  }
  return {id,rows,cols,pos,contactZ:new Float32Array(rows*cols)};
}
const bottom=sheet(2,0,0,.15),top=sheet(8,.014,-.028,.17);
const before=Array.from(top.pos);
const result=separateFolioseSheets([top,bottom]);
assert.ok(result.candidates>0,'surface triangles should be examined');
assert.ok(result.corrections>0,'triangular surface should repel overlapping new tissue');
assert.ok(result.maxLift>0 && result.maxLift<=.095,'correction is positive and bounded');
assert.ok(top.contactZ.some(x=>x>0),'contact diagnostic must be recorded');
const replayBottom=sheet(2,0,0,.15),replayTop=sheet(8,.014,-.028,.17);
const replay=separateFolioseSheets([replayBottom,replayTop]);
assert.equal(result.corrections,replay.corrections,'order of input sheets must not change results');
assert.deepEqual(Array.from(top.pos),Array.from(replayTop.pos),'contact resolution is deterministic');
assert.notDeepEqual(before,Array.from(top.pos),'contact changes geometry');
const separate=sheet(19,3.5,3.5,.17);
const untouched=Array.from(separate.pos);
const noContact=separateFolioseSheets([bottom,separate]);
assert.equal(noContact.corrections,0,'distant leaf does not get false contact');
assert.deepEqual(Array.from(separate.pos),untouched,'far tissue remains untouched');
console.log('Leaf contact: stable spatial bins, triangle interpolation, bounded lift, replay.');
