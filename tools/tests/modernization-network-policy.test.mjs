import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {proveBaseline,baselineRoot,BASELINE_COMMIT} from '../privacy-baseline-proof.mjs';
const require=createRequire(import.meta.url);
const {classifyRequest}=require('../../tests/e2e/network-policy.cjs');
const origin='https://game.test';

test('same network policy rejects receiver traffic before DOMContentLoaded',()=>{
 for(const url of ['https://script.google.com/macros/s/test/exec','https://script.googleusercontent.com/macros/echo?key=test']) assert.deepEqual(classifyRequest(url,origin),{recorded:true,receiver:true,unexpected:true});
});
test('first-party assets pass; unapproved external requests fail after DOMContentLoaded',()=>{
 assert.deepEqual(classifyRequest(origin+'/assets/a.json',origin,{loaded:true}),{recorded:true,receiver:false,unexpected:false});
 assert.equal(classifyRequest('https://tracking.test/a',origin,{loaded:true}).unexpected,true);
 assert.equal(classifyRequest('data:text/plain,a',origin,{loaded:true}).recorded,false);
});
test('explicit receiver permission never permits unrelated external traffic',()=>{
 assert.equal(classifyRequest('https://script.google.com/macros/s/test/exec',origin,{allowFeedback:true}).unexpected,false);
 assert.equal(classifyRequest('https://tracking.test/a',origin,{loaded:true,allowFeedback:true}).unexpected,true);
});
test('actual committed old mount triggers the guard; current mount and typing do not',{skip:!fs.existsSync(baselineRoot)?'Baseline checkout unavailable; set PG_BASELINE_ROOT to the public a2feba5 Git checkout.':false},async()=>{
 const proof=await proveBaseline();assert.equal(proof.baselineCommit,BASELINE_COMMIT);assert.equal(proof.realNetworkRequests,0);
 assert.ok(proof.baseline.mountRequests>=1);assert.ok(proof.baseline.typedRequests>=1);
 assert.ok(proof.baseline.requests.every(request=>request.method==='POST'&&request.receiver&&request.unexpected));
 assert.ok(proof.baseline.requests[0].entries.some(entry=>entry.kind==='session'&&!entry.submitted));
 assert.equal(proof.current.mountRequests,0);assert.equal(proof.current.typedRequests,0);assert.equal(proof.current.passiveRequests,0);assert.deepEqual(proof.current.requests,[]);
});
