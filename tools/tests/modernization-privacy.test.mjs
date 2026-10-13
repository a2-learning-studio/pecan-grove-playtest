import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const api = require('../../assets/playtest/feedback.js');
const endpoint = 'https://script.google.com/macros/s/privacy-test/exec';
let serial = 0;
const id = () => `privacy-${String(++serial).padStart(24, '0')}`;
function storage() { const data = new Map(); return {data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value))}; }
function model(store = storage()) { return api.createModel({storage: store, language: 'en', build: 'privacy-test', id}); }
class Node {
  constructor(tag = 'div') { this.tagName = tag.toUpperCase(); this.nodeType = 1; this.listeners = new Map(); this.dataset = {}; this.children = []; this.attrs = {}; this.value = ''; this.textContent = ''; this.hidden = false; }
  addEventListener(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, []); this.listeners.get(name).push(fn); }
  fire(name, detail, extra = {}) { const event = {target: this, currentTarget: this, detail, preventDefault() {}, ...extra}; for (const fn of this.listeners.get(name) || []) fn(event); return event; }
  appendChild(node) { this.children.push(node); node.parentNode = this; return node; }
  removeChild(node) { this.children.splice(this.children.indexOf(node), 1); }
  get firstChild() { return this.children[0]; }
  get childNodes() { return this.children; }
  setAttribute(key, value) { this.attrs[key] = String(value); if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value); }
  getAttribute(key) { return this.attrs[key] ?? null; }
  focus() { this.document.activeElement = this; }
  click() { this.fire('click'); }
  remove() { this.parentNode?.removeChild(this); }
}
function browser({lang = 'en', store = storage(), failure = false, autoMount = true} = {}) {
  const nodes = [];
  const doc = new Node(); doc.body = new Node('body'); doc.visibilityState = 'visible';
  doc.createElement = tag => { const n = new Node(tag); n.document = doc; nodes.push(n); return n; };
  doc.getElementById = name => nodes.find(n => n.id === name) || null;
  doc.querySelector = () => null;
  doc.querySelectorAll = () => nodes.filter(n => n.getAttribute('data-pg-consent'));
  doc.dispatchEvent = event => doc.fire(event.type, event.detail);
  function add(name, tag = 'div') { const n = doc.createElement(tag); n.id = name; return n; }
  const panel = add('pt-feedback'); panel.dataset = {lang, build: 'privacy-test', endpoint};
  const queries = new Map(); panel.querySelector = selector => queries.get(selector) || null;
  const game = add('community-builders'); game.dataset.currentStop = '0';
  const form = add('pt-feedback-form', 'form'); panel.appendChild(form);
  for (const name of ['stop','rating','category','worked','fix','status','entries','context','player','new-player','new-player-top','download','submit']) form.appendChild(add('pt-feedback-' + name));
  for (const name of ['h','privacy','hint','shared']) panel.appendChild(add('pt-feedback-' + name));
  queries.set('h2 + p', doc.createElement('p'));
  for (const name of ['stop','rating','category','worked','fix']) {
    const label = doc.createElement('label'), prefix = doc.createElement('text'); prefix.nodeType = 3; label.appendChild(prefix); label.appendChild(doc.getElementById('pt-feedback-' + name)); queries.set('label[for="pt-feedback-' + name + '"]',label);
  }
  for (const [name,values] of [['stop',Array.from({length:16},(_,i)=>String(i))],['rating',['','unclear','okay','good']],['category',['','clarity','bug','voice','spanish','art','other']]]) doc.getElementById('pt-feedback-'+name).options=values.map(value=>({value,textContent:''}));
  for (const selector of ['.pt-feedback__saved > summary','.pt-feedback-more > summary']) queries.set(selector,doc.createElement('summary'));
  for (const name of ['player','context']) { const p=doc.createElement('p'),prefix=doc.createElement('text');prefix.nodeType=3;p.appendChild(prefix);p.appendChild(doc.getElementById('pt-feedback-'+name)); }
  for (const name of ['scores','autoScores']) { const n = add('consent-' + name, 'input'); n.setAttribute('data-pg-consent', name); }
  let time = 0, next = 0;
  const timers = new Map(), requests = [];
  const win = new Node(); win.localStorage = store; win.crypto = {randomUUID: id}; win.AbortController = AbortController;
  win.setTimeout = (fn, delay) => { timers.set(++next, {fn, at: time + delay, delay}); return next; };
  win.clearTimeout = key => timers.delete(key);
  win.location = {reload() { win.reloads = (win.reloads || 0) + 1; }};
  win.confirm = () => true; win.CustomEvent = class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } };
  win.Blob = Blob; win.URL = {createObjectURL: () => 'blob:test', revokeObjectURL() {}};
  win.fetch = async (url, options) => { requests.push({url, body: JSON.parse(options.body)}); if (failure) throw Error('offline'); return {ok: true, json: async () => ({ok: true, schemaVersion: 1, acknowledged: JSON.parse(options.body).entries.map(e => ({sessionId:e.sessionId,entryId:e.entryId,revision:e.revision}))})}; };
  const app = autoMount ? api.mount(doc, win) : null;
  async function tick(ms) { const end = time + ms; for (;;) { const pending = [...timers].filter(([, item]) => item.at <= end).sort((a,b) => a[1].at - b[1].at); if (!pending.length) break; const [key, item] = pending[0]; timers.delete(key); time = item.at; item.fn(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); } time = end; }
  return {app,doc,win,store,requests,timers,tick,el: name => doc.getElementById('pt-feedback-' + name),game,queries,panel};
}
const samples = [
  ['en','email sam@example.com','email [removed]'], ['es','mi correo es ana@x.com','mi correo es [quitado]'],
  ['en','call 555-123-4567','call [removed]'], ['es','llama al +34 612 345 678','llama al [quitado]'],
  ['en','phone (404) 555 7890','phone [removed]'], ['es','teléfono 555.123.4567','teléfono [quitado]'],
  ['en','visit https://example.org/kids','visit [removed]'], ['es','mira http://sitio.es/a','mira [quitado]'],
  ['en','web www.example.com','web [removed]'], ['es','web www.ejemplo.es','web [quitado]'],
  ['en','contact @sam_reader','contact [removed]'], ['es','escribe a @lectora_ana','escribe a [quitado]'],
  ['en','123 Main Street','[removed]'], ['en','42 Oak Road','[removed]'], ['en','7 Pine Avenue','[removed]'],
  ['es','12 calle Mayor','[quitado]'], ['es','calle Mayor 12','[quitado]'], ['es','avenida de la Paz 88','[quitado]'],
  ['en','Keep stop 2 and score 75','Keep stop 2 and score 75'], ['es','Me gustó la parada 4','Me gustó la parada 4'],
  ['en','Line\nuser.name+test@example.co.uk\nend','Line\n[removed]\nend'], ['es','1234567','[quitado]']
];
for (const [lang, input, expected] of samples) test(`PII ${lang}: ${input}`, () => assert.equal(api.scrubPII(input,lang),expected));
test('EN and ES runtime JSON strings have matching keys/placeholders and no empty values', () => {
 assert.deepEqual(Object.keys(api.WORDS.en).sort(),Object.keys(api.WORDS.es).sort());
 for(const key of Object.keys(api.WORDS.en)) {const en=api.WORDS.en[key],es=api.WORDS.es[key];assert.equal(typeof en,'string',key);assert.equal(typeof es,'string',key);assert.ok(en.trim()&&es.trim(),key);assert.deepEqual([...en.matchAll(/\{([\w.-]+)\}/g)].map(m=>m[1]).sort(),[...es.matchAll(/\{([\w.-]+)\}/g)].map(m=>m[1]).sort(),key);}
});

test('live language change translates existing form labels/options without replacing controls, session or draft',async()=>{
 const b=browser(),session=b.app.model.active(),form=b.el('form'),worked=b.el('worked');b.doc.fire('cb:screen',{stopN:4,phase:'playing'});worked.value='Keep my original English words';b.el('rating').value='good';b.el('category').value='art';worked.fire('input');
 b.doc.fire('pg:language-change',{language:'es',previousLanguage:'en'});await b.tick(300000);
 assert.equal(b.el('form'),form);assert.equal(b.el('worked'),worked);assert.equal(b.app.model.active(),session);assert.equal(worked.value,'Keep my original English words');assert.equal(b.app.model.find('feedback',4).worked,worked.value);assert.equal(b.el('stop').value,'4');assert.equal(b.el('rating').value,'good');assert.equal(b.el('category').value,'art');
 assert.equal(b.panel.dataset.lang,'es');assert.equal(b.el('h').textContent,'Comentarios de la prueba');assert.equal(b.el('context').textContent,'Parada 4');assert.match(b.el('privacy').textContent,/Pide a un adulto/);assert.equal(b.queries.get('label[for="pt-feedback-worked"]').firstChild.textContent,'¿Qué funcionó bien? ');assert.equal(b.el('rating').options.find(o=>o.value==='good').textContent,'Funcionó muy bien');assert.equal(b.el('stop').options[4].textContent,'Parada 4');assert.equal(b.el('save-draft').textContent,'Guardar borrador en este dispositivo');assert.equal(b.requests.length,0);
 b.doc.fire('pg:language-change',{language:'en',previousLanguage:'es'});assert.equal(b.el('h').textContent,'Playtest feedback');assert.equal(worked.value,'Keep my original English words');assert.match(b.el('status').textContent,/Draft saved/);
});

test('live language change cancels an active grown-up hold and rebuilds the scrubbed preview',async()=>{
 const b=browser();b.el('fix').value='Email ana@x.com';b.el('form').fire('submit');b.el('send').fire('keydown',null,{key:'Enter'});await b.tick(1000);b.doc.fire('pg:language-change',{language:'es',previousLanguage:'en'});await b.tick(5000);
 assert.equal(b.requests.length,0);assert.equal(b.el('preview').hidden,false);assert.match(b.el('preview-text').textContent,/Lo que se puede mejorar/);assert.match(b.el('preview-text').textContent,/\[quitado\]/);assert.match(b.el('hold-status').textContent,/No se ha enviado nada/);assert.match(b.el('send').textContent,/adulto/);
 b.el('send').fire('keydown',null,{key:'Enter'});await b.tick(2000);assert.equal(b.requests.length,1);assert.ok(b.requests[0].body.entries.filter(e=>e.kind==='feedback').every(e=>e.language==='es'));assert.doesNotMatch(JSON.stringify(b.requests[0].body),/ana@x\.com/);
});

test('browser boot reads JSON locales as first-party assets and mounts the singleton only after readiness',async()=>{
 const b=browser({autoMount:false}),staticRequests=[];b.win.document=b.doc;b.doc.baseURI='https://game.test/index.html';b.doc.documentElement={lang:'es'};b.win.PG_ASSET_MAP={'assets/playtest/locales/feedback-es.json':'./assets/feedback-es-hash.json'};
 b.win.fetch=async url=>{staticRequests.push(String(url));const lang=String(url).includes('feedback-es')?'es':'en';return{ok:true,json:async()=>JSON.parse(fs.readFileSync(new URL('../../assets/playtest/locales/feedback-'+lang+'.json',import.meta.url),'utf8'))};};
 vm.runInNewContext(fs.readFileSync(new URL('../../assets/playtest/feedback.js',import.meta.url),'utf8'),{window:b.win,URL,TextEncoder,Uint8Array,DataView,Date,Map,Number,JSON,Math});const runtime=await b.win.PecanGroveFeedback.ready;
 assert.ok(runtime);assert.equal(staticRequests.length,2);assert.ok(staticRequests.every(url=>new URL(url).origin==='https://game.test'));assert.ok(staticRequests.some(url=>url.endsWith('/assets/feedback-es-hash.json')));assert.equal(b.panel.dataset.lang,'es');assert.equal(b.el('save-draft').textContent,'Guardar borrador en este dispositivo');assert.equal(b.game.getAttribute('data-feedback-session'),runtime.model.active());assert.equal(b.el('form').children.filter(n=>n.id==='pt-feedback-preview').length,1);assert.equal(b.requests.length,0);
});
test('legacy drafts stay local and ordinary drafts are excluded from pending()', () => {
 const store=storage(),m=model(store),e=m.upsert('feedback',1,{worked:'legacy draft'}); const state=JSON.parse(store.getItem(api.KEY)); delete state.entries[0].submitted; store.setItem(api.KEY,JSON.stringify(state));
 const loaded=model(store); assert.equal(loaded.find('feedback',1).worked,e.worked); assert.equal(loaded.pending().length,0);
 loaded.submit(e.entryId,false); assert.equal(loaded.pending().length,1); loaded.upsert('feedback',1,{worked:'new unsent edit'}); assert.equal(loaded.pending().length,0);
});
test('mount, typing, play/results, online, visibility, storage and reload send nothing', async () => {
 const b=browser(); b.el('worked').value='a'.repeat(200); b.el('fix').value='b'.repeat(200); b.el('worked').fire('input'); await b.tick(2000);
 b.doc.fire('cb:screen',{stopN:1,phase:'result',score:90}); b.doc.fire('cb:screen',{stopN:2,phase:'playing'}); b.win.fire('online'); b.doc.visibilityState='hidden'; b.doc.fire('visibilitychange'); b.doc.visibilityState='visible'; b.doc.fire('visibilitychange'); b.win.fire('storage',null,{key:api.KEY}); await b.tick(300000);
 assert.equal(b.requests.length,0); assert.equal(b.app.model.entries().some(e=>e.kind==='progress'),false); assert.equal(browser({store:b.store}).requests.length,0);
});
test('preview redacts contact details and canceled hold sends nothing', async () => {
 const b=browser(); b.el('worked').value='mi correo es ana@x.com'; b.el('form').fire('submit');
 assert.equal(b.el('preview').hidden,false); assert.match(b.el('preview-text').textContent,/\[removed\]/); assert.doesNotMatch(b.el('preview-text').textContent,/ana@x.com/);
 b.el('send').fire('pointerdown',null,{button:0}); await b.tick(1999); assert.equal(b.requests.length,0); b.el('send').fire('pointerup'); await b.tick(5000); assert.equal(b.requests.length,0);
});
test('grown-up keyboard hold sends exactly one explicit scrubbed batch', async () => {
 const b=browser({lang:'es'}); b.el('fix').value='mi correo es ana@x.com y teléfono 555-123-4567'; b.el('form').fire('submit');
 b.el('send').fire('keydown',null,{key:'Enter',repeat:false}); await b.tick(2000); b.el('send').fire('keyup',null,{key:'Enter'});
 assert.equal(b.requests.length,1); const body=JSON.stringify(b.requests[0].body); assert.doesNotMatch(body,/ana@x\.com|555-123-4567/); assert.match(body,/quitado/); assert.ok(b.requests[0].body.entries.every(e=>e.submitted)); assert.equal(b.app.model.pending().length,0);
});
test('field edits invalidate preview and require a fresh grown-up hold', async () => {
 const b=browser(); b.el('worked').value='first'; b.el('form').fire('submit'); b.el('send').fire('pointerdown',null,{button:0}); b.el('worked').value='changed'; b.el('worked').fire('input'); await b.tick(3000);
 assert.equal(b.el('preview').hidden,true); assert.equal(b.requests.length,0);
});
test('Save draft never sends and Excel still includes the local draft', async () => {
 const b=browser(); b.el('fix').value='local only'; b.el('save-draft').click(); await b.tick(300000); assert.equal(b.requests.length,0); assert.equal(b.app.model.find('feedback',0).fix,'local only'); assert.ok(Buffer.from(api.excel(b.app.model.entries())).includes(Buffer.from('local only')));
});
test('consent is off by default, opt-in creates one local score, and revocation withdraws unsent scores', async () => {
 const b=browser(); assert.equal(b.app.getConsent().scores,false); b.app.setConsent({scores:true}); b.doc.fire('cb:screen',{stopN:3,phase:'result',score:80}); b.doc.fire('cb:screen',{stopN:3,phase:'result',score:80});
 assert.equal(b.app.model.find('progress',3).revision,1); assert.equal(b.app.model.pending().length,0); assert.equal(b.requests.length,0);
 b.app.model.submitProgress(3); b.app.setConsent({scores:false}); assert.equal(b.app.model.pending().length,0); b.doc.fire('cb:screen',{stopN:4,phase:'result',score:90}); assert.equal(b.app.model.find('progress',4),undefined);
});
test('auto score option needs both switches; new player resets consent and hides prior drafts', async () => {
 const b=browser(); b.app.setConsent({scores:false,autoScores:true}); assert.equal(b.app.getConsent().autoScores,false);
 b.app.setConsent({scores:true,autoScores:true}); b.doc.fire('cb:screen',{stopN:5,phase:'result',score:88}); await b.tick(0); assert.equal(b.requests.length,1); assert.ok(b.requests[0].body.entries.every(e=>e.kind==='progress'));
 b.el('fix').value='previous player'; b.el('new-player').click(); const next=browser({store:b.store}); assert.equal(next.app.getConsent().scores,false); assert.equal(next.app.getConsent().autoScores,false); assert.equal(next.app.model.entries().some(e=>e.fix==='previous player'),false); assert.ok(next.app.model.entries(true).some(e=>e.fix==='previous player'));
});
test('explicit-send failures stop after three total attempts and reload does not restart retrying', async () => {
 const b=browser({failure:true}); b.el('fix').value='retry this explicit send'; b.el('form').fire('submit'); b.el('send').fire('pointerdown',null,{button:0}); await b.tick(2000); assert.equal(b.requests.length,1);
 await b.tick(5000); assert.equal(b.requests.length,2); await b.tick(30000); assert.equal(b.requests.length,3); await b.tick(500000); assert.equal(b.requests.length,3); assert.equal(browser({store:b.store}).requests.length,0);
});
test('pagehide stops scheduled retry while preserving the submitted local copy', async () => {
 const b=browser({failure:true}); b.el('fix').value='preserve'; b.el('form').fire('submit'); b.el('send').fire('pointerdown',null,{button:0}); await b.tick(2000); b.win.fire('pagehide'); await b.tick(500000); assert.equal(b.requests.length,1); assert.equal(b.app.model.find('feedback',0).fix,'preserve');
});
function collector() {
 const properties={}; const ctx=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties[k]||null,setProperties:v=>Object.assign(properties,v)})},Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_,text)=>Array.from(crypto.createHash('sha256').update(text).digest()),newBlob:text=>({getBytes:()=>Array.from(Buffer.from(text))})}});
 vm.runInContext(fs.readFileSync(new URL('../../backend/feedback/Code.gs',import.meta.url),'utf8'),ctx); return {ctx,properties};
}
test('server reruns every client PII case using the same bilingual replacements',()=>{const {ctx}=collector();for(const [lang,input,expected]of samples)assert.equal(ctx.feedbackScrubPII_(input,lang),expected);});
test('server hourly station limit is 30 and rejects the 31st request',()=>{const {ctx}=collector();for(let i=0;i<30;i++)ctx.feedbackHourlyLimit_([{stationId:'station-00000000000000001'}]);assert.throws(()=>ctx.feedbackHourlyLimit_([{stationId:'station-00000000000000001'}]),/hourly_limit/);});
test('server hourly global limit is 300; compact station hashes fit Apps Script property limits',()=>{const {ctx,properties}=collector();for(let i=0;i<300;i++)ctx.feedbackHourlyLimit_([{stationId:'station-'+String(i).padStart(24,'0')}]);assert.throws(()=>ctx.feedbackHourlyLimit_([{stationId:'station-extra-00000000'}]),/hourly_limit/);assert.ok(Buffer.byteLength(properties.feedbackHourly)<9000);});
test('server rejects UTF-8 request bodies over 64 KiB before parsing',()=>{const {ctx}=collector();assert.throws(()=>ctx.feedbackRequest_({postData:{contents:'x'.repeat(65537),length:65537}}),/too_large/);assert.throws(()=>ctx.feedbackRequest_({postData:{contents:'é'.repeat(32769),length:0}}),/too_large/);assert.throws(()=>ctx.feedbackRequest_({postData:{contents:'x'.repeat(65536),length:65536}}),/invalid_request/);});

test('explicit submission does not include another stop’s unsubmitted draft', async()=>{const m=model();const first=m.upsert('feedback',1,{worked:'send this'});m.upsert('feedback',2,{worked:'keep this local'});m.submit(first.entryId,false);let sent;await api.sendBatch(m,endpoint,async(_,options)=>{sent=JSON.parse(options.body);return{ok:true,json:async()=>({ok:true,schemaVersion:1,acknowledged:sent.entries.map(e=>({sessionId:e.sessionId,entryId:e.entryId,revision:e.revision}))})};});assert.equal(sent.entries.some(e=>e.worked==='keep this local'),false);assert.equal(m.find('feedback',2).worked,'keep this local');});
test('collector rejects mixed-station requests before inflating the bounded rate bucket',()=>{const {ctx}=collector();const m=model();const a=m.upsert('feedback',1,{worked:'one'});const b=m.upsert('feedback',2,{worked:'two'});const entries=[{...a,stationId:'station-one-00000000000'},{...b,stationId:'station-two-00000000000'}];const raw=JSON.stringify({schemaVersion:1,entries});assert.throws(()=>ctx.feedbackRequest_({postData:{contents:raw,length:Buffer.byteLength(raw)}}),/invalid_request/);});
