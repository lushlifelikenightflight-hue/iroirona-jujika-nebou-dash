import test from 'node:test';import assert from 'node:assert/strict';import {Game} from '../src/engine.mjs';
test('next stage is accepted only once from a cleared stage',()=>{
 const g=new Game();g.start();assert.equal(g.nextStage(),false);g.play();assert.equal(g.nextStage(),false);g.mode='clear';assert.equal(g.nextStage(),true);assert.equal(g.run.stage,1);assert.equal(g.mode,'intro');assert.equal(g.nextStage(),false);assert.equal(g.run.stage,1);
});
test('repeated final stage requests cannot advance beyond the ending',()=>{
 const g=new Game();g.start();g.loadStage(4);g.mode='clear';assert.equal(g.nextStage(),true);assert.equal(g.mode,'ending');assert.equal(g.nextStage(),false);assert.equal(g.run.stage,4);
});
