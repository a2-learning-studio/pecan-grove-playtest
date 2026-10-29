import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {inspectJavaScript,inspectJson,checkProject,checkRegister,stop10Rows,REGISTER} from '../check-fact-sources.mjs';
test('fact-source check scans actual game banks and checked runtime derivations',()=>{
 const result=checkProject(fileURLToPath(new URL('../../',import.meta.url)));assert.deepEqual(result.errors,[]);assert.ok(result.records.some(record=>record.location.includes('CLAIMS')));assert.ok(result.records.some(record=>record.location.includes('FACTS')));assert.ok(result.records.some(record=>record.derivedFrom==='OLDS'));
});
test('a new fact-tagged record with a missing or unknown source fails without a fixed claim whitelist',()=>{
 for(const property of ['',',source:"missing"',',source:""'])assert.ok(inspectJavaScript(`const SRC={plan:{}};const future={kind:"fact"${property}};`).errors.length);
 assert.deepEqual(inspectJavaScript('const SRC={plan:{}};const future={kind:"fact",source:"plan"};').errors,[]);
});
test('array claim banks and named fact banks resolve each source id',()=>{
 const code='var SRC={plan:[]};var CLAIMS=[].concat();var FACTS=[{src:"plan",t:["en","es"]}];';assert.deepEqual(inspectJavaScript(code).errors,[]);
 assert.ok(inspectJavaScript('var SRC={plan:[]};var CLAIMS=[["fact",null,null,"claim","afirmación"]];').errors.some(error=>error.includes('nonempty source')));
 assert.ok(inspectJavaScript('var SRC={plan:[]};var FACTS=[{src:"air"}];').errors.some(error=>error.includes('unknown source')));
});
test('derived fact source must trace to an inspected valid authored bank',()=>{
 assert.deepEqual(inspectJavaScript('var SRC={plan:[]};var FACTS=[{src:"plan"}];function make(i){var f=FACTS[i];return {kind:"fact",src:f.src};}').errors,[]);
 assert.ok(inspectJavaScript('function make(f){return {kind:"fact",src:f.src};}').errors.length);
});
test('new JSON fact records and legacy array records require a local source register',()=>{
 assert.deepEqual(inspectJson({sources:{plan:{title:'A plan'}},cards:[{classification:'fact',source:'plan'},['fact',null,'plan']]}).errors,[]);
 assert.ok(inspectJson({sources:{plan:{}},cards:[{type:'fact',source:'missing'}]}).errors.length);
 assert.ok(inspectJson({cards:[['fact',null,null]]}).errors.length);
});
test('the dated proposal excerpt is inspectable bilingual story evidence and not a promise',()=>{
 for(const language of ['en','es']){const data=JSON.parse(readFileSync(new URL(`../../assets/games/community-builders/locales/${language}/stop-04.json`,import.meta.url),'utf8'));assert.equal(data.T.planExcerpt.length,5);assert.match(data.T.sourceFiction,language==='en'?/made up|not a real/:/inventó|no es/i);assert.match(data.T.planExcerpt.at(-1),language==='en'?/not an approval or a promise/:/no una aprobación ni una promesa/);assert.match(data.bank.b0016,language==='en'?/proposal lists/:/propuesta.*indica/);}
});
test('real-world claims carry sources, checked dates and the wording that was checked',()=>{
 const root=fileURLToPath(new URL('../../',import.meta.url)),register=JSON.parse(readFileSync(new URL('../../'+REGISTER,import.meta.url),'utf8'));
 assert.deepEqual(checkRegister(root,register).errors,[]);
 const rows=stop10Rows(readFileSync(new URL('../../assets/games/community-builders/stops/10-match-a-fix.js',import.meta.url),'utf8'));
 assert.equal(rows.length,16);for(const row of rows)assert.ok(register.claims.some(claim=>claim.id==='stop-10/'+row.code&&claim.sources.length&&claim.checked),row.code);
 for(const id of ['stop-01/guText','stop-06/guText','stop-15/guText','stop-01/what'])assert.ok(register.claims.some(claim=>claim.id===id),id);
 const changed=(edit)=>{const copy=JSON.parse(JSON.stringify(register));edit(copy);return checkRegister(root,copy).errors;};
 assert.ok(changed(r=>{r.claims.find(c=>c.id==='stop-10/L3').fingerprint='0000000000000000';}).some(e=>e.includes('wording changed')));
 assert.ok(changed(r=>{r.claims=r.claims.filter(c=>c.id!=='stop-10/N4');}).some(e=>e.includes('row N4 has no source')));
 assert.ok(changed(r=>{r.claims.find(c=>c.id==='stop-10/V2').stamp='hour';}).some(e=>e.includes('does not match')));
 assert.ok(changed(r=>{r.claims.find(c=>c.id==='stop-10/W1').sources=['missing'];}).some(e=>e.includes('unknown source')));
 assert.ok(changed(r=>{delete r.claims.find(c=>c.id==='stop-10/W1').checked;}).some(e=>e.includes('no checked date')));
 assert.ok(changed(r=>{delete r.claims.find(c=>c.id==='stop-10/N3').note;}).some(e=>e.includes('needs a note')));
 assert.ok(changed(r=>{r.claims=r.claims.filter(c=>c.id!=='stop-06/guText');}).some(e=>e.includes('Georgia note stop-06')));
 assert.ok(changed(r=>{delete r.corrections;}).some(e=>e.includes('corrections')));
});
