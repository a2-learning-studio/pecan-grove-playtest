import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {functionSource}=require('./core-fragments.cjs');
const code=functionSource('progressEvent');
function harness() {
  const attrs = {}, events = [];
  const context = vm.createContext({mode:'title',feedbackStop:null,feedbackScore:null,restoring:false,
    STOPS:[{id:'welcome',n:1},{id:'listen',n:3}],
    root:{setAttribute(k,v){attrs[k]=v;}},
    player:()=>({stops:{welcome:{best:80}}}),journeyOf:p=>p.stops.welcome.best,
    window:{CustomEvent:class {constructor(type,options){this.type=type;this.detail=options.detail;}}},
    document:{dispatchEvent:event=>events.push(event)}});
  vm.runInContext(code,context);
  return {context,attrs,events,emit(){vm.runInContext('progressEvent()',context);return events.at(-1)?.detail;}};
}
test('feedback context follows the active stop and reports a completed score only on result screens',()=>{
  const h=harness();
  assert.equal(h.emit().stopN,0);
  Object.assign(h.context,{mode:'stop',feedbackStop:'listen',feedbackScore:null});
  let e=h.emit(); assert.equal(e.stopId,'listen');assert.equal(e.stopN,3);assert.equal(e.phase,'playing');assert.equal(e.score,null);
  h.context.feedbackScore=90;e=h.emit();assert.equal(e.phase,'result');assert.equal(e.score,90);assert.equal(e.journey,80);
  h.context.mode='map';e=h.emit();assert.equal(e.stopN,0);assert.equal(e.score,null);assert.equal(e.phase,'map');
  assert.equal(h.attrs['data-current-stop'],'0');assert.equal(h.attrs['data-feedback-score'],'');
  assert.ok(h.events.every(e=>e.type==='cb:screen'));
});
test('initial context attributes work even on a host without CustomEvent',()=>{
  const h=harness();h.context.window={};
  Object.assign(h.context,{mode:'stop',feedbackStop:'welcome',feedbackScore:null});
  assert.doesNotThrow(()=>h.emit());assert.equal(h.attrs['data-current-stop'],'1');assert.equal(h.events.length,0);
});
