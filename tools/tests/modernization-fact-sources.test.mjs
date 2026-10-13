import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {inspectJavaScript,inspectJson,checkProject} from '../check-fact-sources.mjs';
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
