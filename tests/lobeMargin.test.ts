import {strict as assert} from 'node:assert';
import {buildLivingMargin} from '../src/engine/lobeMargin';

/** Tests the pure geometry generator without a browser/WebGL dependency. */
function grow(rows=12, detail=1, maturity=.8, compression=.3, seed=33) {
  const cols=11;
  const pos=new Float32Array(rows*cols*3);
  const strain=new Float32Array(rows*cols);
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const k=r*cols+c;
    pos[k*3]=r*.15+.02*Math.sin(c*.23);
    pos[k*3+1]=(c-5)*.09;
    pos[k*3+2]=.1+.03*Math.sin(r*.6+c*.1);
    strain[k]=compression;
  }
  return buildLivingMargin({
    positions:pos,strain,rows,cols,seed,lobeId:2,maturity,detail,
    dryness:.4,ground:()=>0
  });
}
const base=grow(),replay=grow();
assert.ok(base.samples>30,'maturing perimeter should be subdivided');
assert.deepEqual(base.positions,replay.positions,'same seed and biological state produce exact same mesh');
assert.deepEqual(base.indices,replay.indices,'triangle topology replays deterministically');
assert.equal(base.positions.length,base.samples*12,'four 3D vertices per edge sample');
assert.equal(base.uvs.length,base.samples*8,'four UV pairs per edge sample');
assert.equal(base.sources.length,base.samples*4,'all vertices map to parent living tissue');
assert.ok(base.indices.every(x=>x<base.samples*4),'triangles reference only existing vertices');
assert.equal(base.triangles,base.indices.length/3);
assert.ok(base.positions.every(Number.isFinite),'all edge coordinates are finite');
assert.ok(base.maxFloorViolation<1e-7,'upper and lower margins do not penetrate sampled stone');
const coarse=grow(12,0),detailed=grow(12,2);
assert.ok(detailed.samples>coarse.samples,'detail adds actual mesh vertices');
assert.ok(detailed.maxExtension>coarse.maxExtension,'detail changes physical lip reach');
const young=grow(12,2,0),mature=grow(12,2,1);
assert.equal(young.samples,0,'juvenile lobes do not yet have raised lips');
assert.ok(mature.triangles>0,'older tissue creates physical perimeter faces');
const compressed=grow(12,1,1,.5),relaxed=grow(12,1,1,0);
assert.ok(compressed.samples>=relaxed.samples,'compression increases geometric subdivision');
assert.ok(compressed.maxExtension>relaxed.maxExtension,'compression increases margin extent');
assert.ok(grow(2).triangles>0,'young small shells can still generate valid geometry');
console.log('Adaptive foliose margin geometry tests passed',{
  samples:base.samples,coarse:coarse.samples,detailed:detailed.samples,
  compressed:compressed.samples,triangles:base.triangles
});
