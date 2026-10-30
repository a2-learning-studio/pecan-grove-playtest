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
function storage() { const data = new Map(); return {data, get length() { return data.size; }, key: i => [...data.keys()][i] ?? null, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key)}; }
function model(store = storage()) { return api.createModel({storage: store, language: 'en', build: 'privacy-test', id}); }
class Node {
  constructor(tag = 'div') { this.tagName = tag.toUpperCase(); this.nodeType = 1; this.listeners = new Map(); this.dataset = {}; this.children = []; this.attrs = {}; this.value = ''; this.textContent = ''; this.hidden = false; }
  addEventListener(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, []); this.listeners.get(name).push(fn); }
  fire(name, detail, extra = {}) { const event = {target: this, currentTarget: this, detail, preventDefault() {}, ...extra}; for (const fn of this.listeners.get(name) || []) fn(event); return event; }
  appendChild(node) { this.children.push(node); node.parentNode = this; return node; }
  insertBefore(node, ref) { const at = this.children.indexOf(ref); this.children.splice(at < 0 ? this.children.length : at, 0, node); node.parentNode = this; return node; }
  removeChild(node) { this.children.splice(this.children.indexOf(node), 1); }
  get firstChild() { return this.children[0]; }
  get childNodes() { return this.children; }
  setAttribute(key, value) { this.attrs[key] = String(value); if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value); }
  getAttribute(key) { return this.attrs[key] ?? null; }
  focus() { this.document.activeElement = this; }
  click() { this.fire('click'); }
  remove() { this.parentNode?.removeChild(this); }
  showModal() { this.open = true; }
  close() { this.open = false; this.fire('close'); }
}
// A build's close-out lock: a random salt and the SHA-256 of salt and code, as tools/make_playtest.py writes it.
const CODE = 'maple-heron-42';
function lock(code) { const salt = crypto.randomBytes(16).toString('hex'); return salt + ':' + crypto.createHash('sha256').update(salt + ':' + code).digest('hex'); }
function browser({lang = 'en', store = storage(), failure = false, autoMount = true, closeout = '', dialog = false, cloud = true, tab = storage(), secure = true} = {}) {
  const nodes = [];
  const doc = new Node(); doc.body = new Node('body'); doc.visibilityState = 'visible';
  doc.createElement = tag => { const n = new Node(tag); n.document = doc; nodes.push(n); return n; };
  // Re-rendered panels create a fresh node per id; like a real document, return the current one.
  doc.getElementById = name => nodes.findLast(n => n.id === name) || null;
  doc.querySelector = () => null;
  doc.querySelectorAll = () => nodes.filter(n => n.getAttribute('data-pg-consent'));
  doc.dispatchEvent = event => doc.fire(event.type, event.detail);
  function add(name, tag = 'div') { const n = doc.createElement(tag); n.id = name; return n; }
  const panel = add('pt-feedback'); panel.dataset = {lang, build: 'privacy-test', endpoint: cloud ? endpoint : ''};
  if (closeout) panel.dataset.closeout = lock(closeout);
  const queries = new Map(); panel.querySelector = selector => queries.get(selector) || null;
  const game = add('community-builders'); game.dataset.currentStop = '0';
  const form = add('pt-feedback-form', 'form'); panel.appendChild(form);
  // A copy that sends has no per-player Excel button.
  for (const name of ['stop','rating','category','worked','fix','status','entries','context','player','new-player','new-player-top', ...(cloud ? [] : ['download']),'device','submit']) form.appendChild(add('pt-feedback-' + name));
  if (dialog) {
    const box = add('pt-new-player-dialog', 'dialog'), row = doc.createElement('div');
    for (const name of ['title', 'message']) box.appendChild(add('pt-new-player-' + name));
    box.appendChild(row); for (const name of ['cancel', 'confirm']) row.appendChild(add('pt-new-player-' + name, 'button'));
  }
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
  const win = new Node(); win.localStorage = store; win.sessionStorage = tab; win.crypto = {randomUUID: id, ...(secure ? {subtle: crypto.webcrypto.subtle} : {})}; win.isSecureContext = secure; win.AbortController = AbortController;
  win.setTimeout = (fn, delay) => { timers.set(++next, {fn, at: time + delay, delay}); return next; };
  win.clearTimeout = key => timers.delete(key);
  win.location = {href: 'https://game.test/index.html', reload() { win.reloads = (win.reloads || 0) + 1; }};
  win.history = {state: null, replaceState(state, title, url) { win.replaced = (win.replaced || 0) + 1; win.location.href = url; }};
  win.confirm = () => true; win.CustomEvent = class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } };
  win.Blob = Blob; win.URL = Object.assign(class extends URL {}, {createObjectURL: () => 'blob:test', revokeObjectURL() {}});
  win.fetch = async (url, options) => { requests.push({url, body: JSON.parse(options.body)}); if (failure) throw Error('offline'); return {ok: true, json: async () => ({ok: true, schemaVersion: 1, acknowledged: JSON.parse(options.body).entries.map(e => ({sessionId:e.sessionId,entryId:e.entryId,revision:e.revision}))})}; };
  const app = autoMount ? api.mount(doc, win) : null;
  async function tick(ms) { const end = time + ms; for (;;) { const pending = [...timers].filter(([, item]) => item.at <= end).sort((a,b) => a[1].at - b[1].at); if (!pending.length) break; const [key, item] = pending[0]; timers.delete(key); time = item.at; item.fn(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); } time = end; }
  return {app,doc,win,store,requests,timers,tick,el: name => doc.getElementById('pt-feedback-' + name),id: name => doc.getElementById(name),game,queries,panel,allNodes: () => nodes};
}
// The grown-up check plus one ordinary activation replaces the timed hold.
function approve(b) { b.el('confirm').checked = true; b.el('confirm').fire('change'); b.el('send').click(); }
async function settle() { for (let i = 0; i < 30; i++) await Promise.resolve(); }
// SHA-256 in Web Crypto finishes outside the microtask queue.
async function digestDone() { for (let i = 0; i < 4; i++) await new Promise(resolve => setTimeout(resolve, 5)); await settle(); }
async function openCloseout(b, code = CODE) { b.app.openCloseout(); b.id('pt-closeout-code').value = code; b.id('pt-closeout-ask-confirm').click(); await digestDone(); }
// Next player for a player whose note the playtest team has not received: keep it for the facilitator's close-out.
function keepForFacilitator(b) { b.el('new-player').click(); b.id('pt-new-player-keep').click(); }
const textOf = node => !node ? '' : [node.textContent, ...(node.children || []).map(textOf)].join(' ');
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

test('live language change clears the grown-up check and rebuilds the scrubbed preview',async()=>{
 const b=browser();b.el('fix').value='Email ana@x.com';b.el('form').fire('submit');b.el('confirm').checked=true;b.doc.fire('pg:language-change',{language:'es',previousLanguage:'en'});await b.tick(5000);
 assert.equal(b.requests.length,0);assert.equal(b.el('preview').hidden,false);assert.equal(b.el('confirm').checked,false);assert.match(b.el('preview-text').textContent,/Lo que se puede mejorar/);assert.match(b.el('preview-text').textContent,/\[quitado\]/);assert.match(b.el('check-status').textContent,/No se envía nada/);assert.equal(b.el('send').textContent,'Enviar ahora');assert.match(b.el('check-text').textContent,/adulto/);
 b.el('send').click();await b.tick(2000);assert.equal(b.requests.length,0);assert.match(b.el('check-status').textContent,/Primero un adulto/);
 approve(b);await settle();assert.equal(b.requests.length,1);assert.ok(b.requests[0].body.entries.filter(e=>e.kind==='feedback').every(e=>e.language==='es'));assert.doesNotMatch(JSON.stringify(b.requests[0].body),/ana@x\.com/);
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
test('preview redacts contact details, starts at its heading, and Send without the grown-up check sends nothing', async () => {
 const b=browser(); b.el('worked').value='mi correo es ana@x.com'; b.el('form').fire('submit');
 assert.equal(b.el('preview').hidden,false); assert.match(b.el('preview-text').textContent,/\[removed\]/); assert.doesNotMatch(b.el('preview-text').textContent,/ana@x.com/);
 assert.equal(b.doc.activeElement,b.el('preview-heading'),'phones keep the remove-any-names prompt in view');
 b.el('send').click(); await b.tick(5000); assert.equal(b.requests.length,0); assert.equal(b.doc.activeElement,b.el('confirm')); assert.match(b.el('check-status').textContent,/tick the check first/);
});
test('one grown-up check and one ordinary Send activation send exactly one explicit scrubbed batch', async () => {
 const b=browser({lang:'es'}); b.el('fix').value='mi correo es ana@x.com y teléfono 555-123-4567'; b.el('form').fire('submit');
 approve(b); await settle();
 assert.equal(b.requests.length,1); const body=JSON.stringify(b.requests[0].body); assert.doesNotMatch(body,/ana@x\.com|555-123-4567/); assert.match(body,/quitado/); assert.ok(b.requests[0].body.entries.every(e=>e.submitted)); assert.equal(b.app.model.pending().length,0);
 b.el('send').click(); await b.tick(60000); assert.equal(b.requests.length,1,'a sent preview cannot be sent again');
});
test('field edits invalidate preview and require a fresh grown-up check', async () => {
 const b=browser(); b.el('worked').value='first'; b.el('form').fire('submit'); b.el('confirm').checked=true; b.el('worked').value='changed'; b.el('worked').fire('input'); b.el('send').click(); await b.tick(3000);
 assert.equal(b.el('preview').hidden,true); assert.equal(b.el('confirm').checked,false); assert.equal(b.requests.length,0);
});
test('Save draft never sends and Excel still includes the local draft', async () => {
 const b=browser(); b.el('fix').value='local only'; b.el('save-draft').click(); await b.tick(300000); assert.equal(b.requests.length,0); assert.equal(b.app.model.find('feedback',0).fix,'local only'); assert.ok(Buffer.from(api.excel(b.app.model.entries())).includes(Buffer.from('local only')));
});
test('consent is off by default, opt-in creates one local score, and revocation withdraws unsent scores', async () => {
 const b=browser(); assert.equal(b.app.getConsent().scores,false); b.app.setConsent({scores:true}); b.doc.fire('cb:screen',{stopN:3,phase:'result',score:80}); b.doc.fire('cb:screen',{stopN:3,phase:'result',score:80});
 assert.equal(b.app.model.find('progress',3).revision,1); assert.equal(b.app.model.pending().length,0); assert.equal(b.requests.length,0);
 b.app.model.submitProgress(3); b.app.setConsent({scores:false}); assert.equal(b.app.model.pending().length,0); b.doc.fire('cb:screen',{stopN:4,phase:'result',score:90}); assert.equal(b.app.model.find('progress',4),undefined);
});
test('auto score option needs both switches; new player resets consent and keeps prior drafts only for the facilitator', async () => {
 const b=browser({dialog:true,closeout:CODE}); b.app.setConsent({scores:false,autoScores:true}); assert.equal(b.app.getConsent().autoScores,false);
 b.app.setConsent({scores:true,autoScores:true}); b.doc.fire('cb:screen',{stopN:5,phase:'result',score:88}); await b.tick(0); assert.equal(b.requests.length,1); assert.ok(b.requests[0].body.entries.every(e=>e.kind==='progress'));
 b.el('fix').value='previous player'; keepForFacilitator(b); const next=browser({store:b.store}); assert.equal(next.app.getConsent().scores,false); assert.equal(next.app.getConsent().autoScores,false); assert.equal(next.app.model.entries().some(e=>e.fix==='previous player'),false); assert.ok(next.app.model.entries(true).some(e=>e.fix==='previous player'));
});
test('explicit-send failures stop after three total attempts and reload does not restart retrying', async () => {
 const b=browser({failure:true}); b.el('fix').value='retry this explicit send'; b.el('form').fire('submit'); approve(b); await settle(); assert.equal(b.requests.length,1);
 await b.tick(5000); assert.equal(b.requests.length,2); await b.tick(30000); assert.equal(b.requests.length,3); await b.tick(500000); assert.equal(b.requests.length,3); assert.equal(browser({store:b.store}).requests.length,0);
});
test('pagehide stops scheduled retry while preserving the submitted local copy', async () => {
 const b=browser({failure:true}); b.el('fix').value='preserve'; b.el('form').fire('submit'); approve(b); await settle(); b.win.fire('pagehide'); await b.tick(500000); assert.equal(b.requests.length,1); assert.equal(b.app.model.find('feedback',0).fix,'preserve');
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

// Children's details beyond contact patterns. Client-only rules: the deployed collector keeps its contact scrub.
const childSamples = [
  ['en','My name is Sofia Ramirez, I am 9, Pecan Elementary','My name is [removed], I am [removed], [removed]'],
  ['en','Born 3/14/2015','Born [removed]'],
  ['en','my name is sofia and i liked the map','my name is [removed] and i liked the map'],
  ['en',"I'm 10 years old and I go to Oak Middle School","I'm [removed] and I go to [removed]"],
  ['en','my birthday is March 14','my birthday is [removed]'],
  ['en','My best friend is named Jake Lopez','My best friend is named [removed]'],
  ['en',"My teacher's name is Ms. Lee","My teacher's name is Ms. [removed]"],
  ['en','I was born in 2015','I was born in [removed]'],
  ['en',"St. Mary's Academy was fun",'[removed] was fun'],
  ['en','We played on March 3, 2026','We played on [removed]'],
  ['es','Me llamo Sofía Ramírez y tengo 9 años','Me llamo [quitado] y tengo [quitado]'],
  ['es','Nací el 14 de marzo de 2015','Nací el [quitado]'],
  ['es','Voy a la Escuela Primaria Benito Juárez','Voy a la [quitado]'],
  ['es','mi cumpleaños es el 3 de mayo','mi cumpleaños es el [quitado]'],
  ['es','me llamo María de la Cruz','me llamo [quitado]'],
  ['es','Tengo once años de edad','Tengo [quitado]'],
  ['es','Mi nombre es Diego, voy al Colegio San José','Mi nombre es [quitado], voy al [quitado]'],
  // Every word after a name cue goes, capitalized or not, up to the punctuation or an everyday word.
  ['en','my name is sofia garcia','my name is [removed]'], ['en','my name is sofia garcia and my snap is mayal22','my name is [removed] and my snap is mayal22'],
  ['en','my name is jake123 and i liked it','my name is [removed] and i liked it'], ['en','My name is Jake liked the map','My name is [removed] liked the map'],
  ['es','me llamo sofia garcia','me llamo [quitado]'], ['es','me llamo juan pablo','me llamo [quitado]'], ['es','Mi nombre es: Pedro','Mi nombre es: [quitado]'],
  ['es','me llamo maría de la cruz y tengo 9 años','me llamo [quitado] y tengo [quitado]'],
  // An apartment number after a street and a direction, a Discord tag, and a pet's name after a clear cue.
  ['en','I live at 1234 Peachtree Rd NE apt 5','I live at [removed] NE [removed]'], ['es','vivo en el apto 4B','vivo en el [quitado]'],
  ['en','add me on discord: coolkid#1234','add me on discord: [removed]'], ['es','agrégame en discord: nina_22#0042','agrégame en discord: [quitado]'],
  ['es','mi perro se llama Toby','mi perro se llama [quitado]'], ['en',"my dog's name is Biscuit","my dog's name is [removed]"],
  // An age with a half, a step-parent or an uncle, and a Spanish diminutive.
  ['en',"I'm 9 1/2 and I liked it","I'm [removed] and I liked it"], ['en','I am 9 and a half years old','I am [removed]'], ['es','tengo 9 años y medio','tengo [quitado]'],
  ['en',"my stepdad's name is Marcus","my stepdad's name is [removed]"], ['en','my uncle is named Joe','my uncle is named [removed]'], ['es','mi hermanito se llama diego','mi hermanito se llama [quitado]']
];
for (const [lang, input, expected] of childSamples) test(`child details ${lang}: ${input}`, () => {
  assert.equal(api.scrubPII(input, lang), expected);
  assert.equal(api.scrubPII(expected, lang), expected, 'scrubbing twice changes nothing');
});
const ordinary = [
  ['en','I am 2 stops away from the end'], ['en','I liked Mrs. Ana and Mr. Patel'], ['en','Stop 9 was hard, score 7/10'],
  ['en','The High School Tech League part was fun'], ['en','my name is not important'], ['en','I may play again in March'],
  ['en','I am so happy with the map'], ['en','The school stop needs bigger words'], ['en','I miss playing at the library'],
  ['es','la escuela es divertida'], ['es','Lo jugué hace 2 años'], ['es','Me dicen que es fácil'], ['es','Me gustó la Sra. Lee'],
  ['es','me llamo la atencion el mapa'], ['es','La parada 12 tiene 3 preguntas'],
  // Numbers after stop or parada are stops, and everyday words are not a street name.
  ['en','Stop 2 was a good way to learn'], ['en','stop 10 11 12 13 were hard'], ['en','stop 7 had a long way to go'], ['en','I liked stop 3 because the court was fun'],
  ['en','my favorite was stop 12 the way it worked'], ['en','the 3 kids on the street'], ['en','I tried 2 times the same way'], ['en','I like the 4 animals on Main St'],
  ['en','I got 3 stars on stop 4 and 2 stars on stop 5 7 8'], ['en','Stop 6: the drive to the park'], ['en',"I'm so happy"], ['en','This is Stop 3 and it was fun'],
  ['es','La parada 2 fue una buena manera'], ['es','Me gustó la parada 10 de 16'], ['es','las paradas 3 4 5 6 7 8 9 fueron fáciles'], ['es','La parada 4 es la calle del mercado'],
  ['es','Me llamo mucho la atención'], ['es','soy feliz con el mapa'],
  // A list of scores is not a phone number, and these words after a name cue are not a name.
  ['en','my scores were 100 90 80 70 at the stops'], ['es','mi puntaje fue 100 90 80 70'], ['en','they call me when it is my turn'],
  ['en','my name is spelled wrong on the badge'], ['en','Name: Stop 3 feedback'], ['es','mi nombre es importante para mí'], ['es','Nombre: parada 3']
];
for (const [lang, input] of ordinary) test(`ordinary ${lang} sentence stays intact: ${input}`, () => assert.equal(api.scrubPII(input, lang), input));
test('every contact and child sample is unchanged by a second scrub', () => {
  for (const [lang, input] of [...samples, ...childSamples]) { const once = api.scrubPII(input, lang); assert.equal(api.scrubPII(once, lang), once, input); }
});
// Two name cues in one note: the name window after the first cue must not swallow the second cue and its name.
const twoNames = [
  ['es', 'me llamo Sofia y mi hermano se llama Diego', 'me llamo [quitado] y mi hermano se llama [quitado]'],
  ['en', "my name is Ava and my sister's name is Mia", "my name is [removed] and my sister's name is [removed]"],
  ['en', 'my dog is named Max and my name is Leo', 'my dog is named [removed] and my name is [removed]'],
  ['es', 'mi perro se llama Rocky y me llamo Pablo', 'mi perro se llama [quitado] y me llamo [quitado]'],
  ['en', 'my best friend is called Noor and my name is Zara', 'my best friend is called [removed] and my name is [removed]'],
  ['en', "my teacher's name is Mr. Park and my name is Eli", "my teacher's name is Mr. [removed] and my name is [removed]"],
  ['en', 'my name is my dog is named Max', 'my name is my dog is named [removed]']
];
for (const [lang, input, expected] of twoNames) test(`two names in one note ${lang}: ${input}`, () => {
  assert.equal(api.scrubPII(input, lang), expected); assert.equal(api.scrubPII(expected, lang), expected);
});
test('scrubbing twice changes nothing, over generated notes that join name cues, names and everyday words in English and Spanish', () => {
  const cues = ['my name is', "my name's", 'they call me', 'i am called', 'my dog is named', "my sister's name is", 'my best friend is called', "my stepdad's name is", 'my uncle is named',
    'Name:', 'my name:', 'me llamo', 'mi nombre es', 'me dicen', 'mi hermano se llama', 'mi hermanita se llama', 'mi perro se llama', 'el nombre de mi amiga es', 'Nombre:', "I'm", 'tengo', 'born', 'Mr.', 'la maestra'];
  const names = ['Sofia', 'Diego', 'Ava', 'Mia', 'maya lopez', 'María de la Cruz', 'Juárez', 'Toby', 'may', 'Jayden', 'Ana Sofia', 'nine'];
  const joiners = ['and', 'y', 'but', 'pero', 'and my', 'y mi', 'the map', 'stop 3', 'parada 2', 'liked it', ',', '.', '9 years old', '14 de marzo', 'Oak Elementary', 'x@y.com', '555-0100', '[removed]', '[quitado]'];
  // The notes a fuzzer found that one pass of the old scrubber left half done.
  const notes = ["mi perro se llama nine I'm Name: born de NE mi perro se llama and", 'mi perro se llama Juárez mi perro se llama may la', 'x@y.com mi perro se llama lopez me llamo may Ana 14 born my name:',
    'Elementary parada my name is they call me me llamo Maya -', '2015 Maya im diez my name: hi Middle mi perro se llama Juárez birthday', 'me llamo calle my name is Maya nine diez may',
    'de marzo Name: mi perro se llama Toby they call me NE my name is Roble kid#1234 Middle', 'my name is street Escuela y me llamo may and Benito called'];
  for (const a of cues) for (const b of cues) notes.push([a, names[notes.length % names.length], joiners[notes.length % joiners.length], b, names[(notes.length * 7) % names.length]].join(' '));
  let seed = 7; const rnd = n => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) % n, lists = [cues, names, joiners];
  for (let i = 0; i < 3000; i++) notes.push(Array.from({length: 3 + rnd(10)}, () => { const list = lists[rnd(3)]; return list[rnd(list.length)]; }).join(' '));
  for (const note of notes) for (const lang of ['en', 'es']) { const once = api.scrubPII(note, lang); assert.equal(api.scrubPII(once, lang), once, `${lang}: ${note}`); }
  // A note at the length limit stays within it after the scrub, so the saved, sent and exported texts are the same.
  const long = 'a@b.co '.repeat(171) + 'end', once = api.scrubPII(long, 'en');
  assert.ok(once.length <= 1200); assert.equal(api.scrubPII(once, 'en'), once);
});

test('Send says "Sending" until the matching acknowledgement and thanks only after it; a failed send says it was not sent', async () => {
  let release; const b = browser();
  b.win.fetch = async (url, options) => { b.requests.push({url, body: JSON.parse(options.body)}); await new Promise(resolve => { release = resolve; }); return {ok: true, json: async () => ({ok: true, schemaVersion: 1, acknowledged: JSON.parse(options.body).entries.map(e => ({sessionId: e.sessionId, entryId: e.entryId, revision: e.revision}))})}; };
  b.el('worked').value = 'Thanks only after the team has it'; b.el('form').fire('submit'); approve(b); await settle();
  assert.equal(b.el('thanks').hidden, false); assert.equal(b.el('thanks').textContent, 'Sending your note…'); assert.match(b.el('status').textContent, /waiting for confirmation/);
  release(); await settle();
  assert.equal(b.el('thanks').textContent, 'Thanks, feedback received'); assert.match(b.el('status').textContent, /received by the playtest team/);
  const f = browser({lang: 'es', failure: true}); f.el('worked').value = 'No llega'; f.el('form').fire('submit'); approve(f); await settle(); await f.tick(5000); await f.tick(30000); await settle();
  assert.equal(f.requests.length, 3); assert.match(f.el('thanks').textContent, /Todavía no se envió/); assert.doesNotMatch(f.el('thanks').textContent, /Gracias|recibimos/); assert.equal(f.el('submit').disabled, false);
  assert.match(textOf(f.el('entries')), /En espera: aún no recibida/);
});
test('after a reload an unconfirmed note says it has not reached the team and nothing retries by itself; Next player deletes it, or keeps it for the facilitator', async () => {
  const b = browser({failure: true}); b.el('fix').value = 'stranded'; b.el('form').fire('submit'); approve(b); await settle(); b.win.fire('pagehide');
  const next = browser({store: b.store}); await next.tick(600000);
  assert.equal(next.requests.length, 0); assert.match(next.el('status').textContent, /has not reached the playtest team yet/);
  let warned = ''; next.win.confirm = message => { warned = message; return true; }; next.el('new-player').click();
  assert.match(warned, /has not received: 1\. Delete them\? Nobody can bring them back\./);
  const after = browser({store: b.store}); assert.doesNotMatch(after.el('status').textContent, /earlier players/); assert.equal(after.app.model.waiting().length, 0);
  assert.doesNotMatch([...b.store.data.values()].join(''), /stranded/); assert.equal(after.requests.length, 0);
  // With a close-out code the grown-up can keep the note instead; the next player is told it waits for the facilitator.
  const k = browser({failure: true, dialog: true, closeout: CODE}); k.el('fix').value = 'kept'; k.el('form').fire('submit'); approve(k); await settle();
  keepForFacilitator(k); assert.equal(k.win.reloads, 1);
  const later = browser({store: k.store, closeout: CODE}); assert.match(later.el('status').textContent, /Notes from earlier players are saved on this device for Facilitator close-out\./);
  assert.equal(later.requests.length, 0);
});
test('a blank note opens no preview and cannot be sent; a rating alone is a note', async () => {
  const b = browser(); b.el('form').fire('submit');
  assert.equal(b.el('preview').hidden, true); assert.match(b.el('status').textContent, /Write a note or choose an answer/); assert.equal(b.doc.activeElement, b.el('worked'));
  b.el('worked').value = '   '; b.el('form').fire('submit'); assert.equal(b.el('preview').hidden, true);
  b.el('rating').value = 'good'; b.el('rating').fire('change'); b.el('form').fire('submit'); assert.equal(b.el('preview').hidden, false);
  assert.equal(b.requests.length, 0);
});
test('the preview removes children\'s details and flags names it cannot remove, in English and Spanish', () => {
  const b = browser(); b.el('worked').value = 'My name is Sofia Ramirez, I am 9, Pecan Elementary. Mr. Smith helped. Mrs. Ana was funny.'; b.el('form').fire('submit');
  const text = b.el('preview-text').textContent; assert.doesNotMatch(text, /Sofia|Ramirez|Pecan Elementary|\b9\b/); assert.match(text, /Mrs\. Ana was funny/);
  assert.equal(b.el('preview-flags').hidden, false); assert.match(b.el('preview-flags').textContent, /Mr\. Smith/); assert.doesNotMatch(b.el('preview-flags').textContent, /Ana/);
  const e = browser({lang: 'es'}); e.el('fix').value = 'Me llamo Sofía y tengo 9 años. Nací el 14 de marzo de 2015. La maestra Pérez me ayudó.'; e.el('form').fire('submit');
  assert.doesNotMatch(e.el('preview-text').textContent, /Sofía|2015|9 años/); assert.match(e.el('preview-flags').textContent, /^Revisa estas palabras antes de enviar: .*maestra Pérez/);
  const plainNote = browser(); plainNote.el('worked').value = 'The map was easy'; plainNote.el('form').fire('submit'); assert.equal(plainNote.el('preview-flags').hidden, true);
});
test('the preview flags names it cannot remove: introductions, relatives and friends, sign-offs, handles and lower-case schools', () => {
  for (const [lang, input, flags] of [
    ['en', "Hi I'm Maya Lopez", ['Maya Lopez']], ['en', 'Im Lily', ['Lily']], ['es', 'soy Mateo', ['Mateo']], ['en', 'This is Liam. I liked stop 3', ['Liam']],
    ['en', 'my brother Sam helped me', ['brother Sam']], ['en', 'My friend Ethan and I played', ['friend Ethan']], ['es', 'Mi hermano Juan me ayudó', ['hermano Juan']], ['es', 'Mi amiga Lucía jugó conmigo', ['amiga Lucía']],
    ['en', 'I liked it. -Emma', ['Emma']], ['es', 'Gracias, Valentina', ['Valentina']], ['en', 'sincerely, Olivia Brown', ['Olivia Brown']], ['es', 'Me gustó. Saludos, Sofía Pérez', ['Sofía Pérez']],
    ['en', 'i am in 4th grade at lincoln elementary', ['lincoln elementary']], ['en', 'my snap is mayal22', ['mayal22']], ['es', 'mi tiktok es lucia_baila', ['lucia_baila']],
    // Lower-case names after a greeting or "my brother", a last sign-off, pets, short school names and handles.
    ['en', 'hi im maya lopez and i liked stop 3', ['maya lopez']], ['es', 'hola soy valentina gomez y me gustó la parada 2', ['valentina gomez']],
    ['en', 'my little brother noah played too', ['brother noah']], ['es', 'mi hermano luis jugó también', ['hermano luis']],
    ['en', 'thanks, from ava r.', ['ava r']], ['en', 'love it bye Liam', ['Liam']], ['es', 'muchas gracias, de parte de sofi', ['sofi']],
    ['en', 'my dog Biscuit would like this game', ['dog Biscuit']], ['es', 'mi perro Toby es chistoso', ['perro Toby']],
    ['en', 'Mrs. Johnson is my teacher at Dickerson Middle', ['Dickerson Middle', 'teacher']], ['en', "We play this in Ms. Rivera's class at Pope High", ["Ms. Rivera's", 'Pope High']],
    ['en', 'I go to lincoln elementary in marietta', ['lincoln elementary', 'marietta']], ['en', 'add me on roblox: coolkid', ['coolkid']],
    // A real surname or second name after a game character's first name.
    ['en', 'me and my friend Jayden Smith liked it', ['friend Jayden Smith']], ['en', 'my sister Ana Sofia', ['sister Ana Sofia']], ['es', 'mi hermana Ana Sofía nos ayudó', ['hermana Ana Sofía']],
    // "its me", "hey guys", "this is from", "her sister", a step-parent, a lower-case "miss" before a possessive and a diminutive.
    ['en', 'yo its me jackson rivera, stop 7 was the best', ['jackson rivera']], ['en', 'hey guys im brooklyn!! fun game', ['brooklyn']], ['en', "It's me, Jackson", ['Jackson']],
    ['en', 'this is from harper and her twin sister lily', ['harper', 'sister lily']], ['en', 'my stepdad Marcus helped me read stop 4', ['stepdad Marcus']],
    ['en', "we are in miss okafor's class", ["miss okafor's"]], ['es', 'mi hermanito diego jugó conmigo', ['hermanito diego']], ['es', 'su perro Max es chistoso', ['perro Max']]
  ]) assert.deepEqual(api.privacyFlags(api.scrubPII(input, lang)), flags, input);
  for (const [lang, input] of [['en', "I'm Ana from the game"], ['en', 'I am so happy'], ['en', 'Grandma Ruth was kind'], ['es', 'soy feliz'], ['en', 'This is Stop 3'], ['en', 'Thanks for the game!'],
    ['es', 'La abuela Ruth me ayudó'], ['en', 'my insta is not working'], ['en', 'the elementary kids liked it'], ['es', 'Gracias por el juego'], ['en', 'I am the Fox'],
    ['en', 'my brother helped me'], ['en', 'hi im so happy'], ['en', 'made by kids.'], ['es', 'mi mamá dice que es bueno'], ['en', 'my dog ate my homework'], ['es', 'hola soy de Guatemala'],
    ['en', 'I liked Grandma Ruth and Jayden'], ['en', 'Thanks, Ana!'], ['en', 'The High School Tech League part was fun'], ['en', 'I miss playing at the library'], ['en', 'hey guys this is fun'],
    ['en', 'its me again'], ['es', 'yo soy de Georgia'], ['en', 'her sister likes the map'], ['en', "it's from the map"], ['en', 'hi all, this is great'], ['es', 'yo soy Ana'], ['en', 'their dog ran away']]) assert.deepEqual(api.privacyFlags(api.scrubPII(input, lang)).filter(word => word !== 'School'), [], input);
});
test('turning on score sharing waits for a grown-up confirmation; turning it off does not', () => {
  const b = browser(), box = b.id('consent-scores'), auto = b.id('consent-autoScores');
  box.checked = true; b.doc.fire('change', null, {target: box});
  assert.equal(b.app.getConsent().scores, false); assert.equal(box.checked, false);
  const dialog = b.id('pt-consent-dialog'); assert.equal(dialog.open, true); assert.match(b.id('pt-consent-message').textContent, /added to the notes you send/); assert.equal(b.doc.activeElement, b.id('pt-consent-cancel'));
  b.id('pt-consent-cancel').click(); assert.equal(dialog.open, false); assert.equal(b.app.getConsent().scores, false); assert.equal(b.doc.activeElement, box);
  box.checked = true; b.doc.fire('change', null, {target: box}); b.id('pt-consent-confirm').click(); assert.equal(b.app.getConsent().scores, true); assert.equal(box.checked, true);
  auto.checked = true; b.doc.fire('change', null, {target: auto}); assert.match(b.id('pt-consent-message').textContent, /as soon as a stop is finished/);
  b.id('pt-consent-confirm').click(); assert.equal(b.app.getConsent().autoScores, true);
  box.checked = false; b.doc.fire('change', null, {target: box}); assert.equal(dialog.open, false); assert.equal(b.app.getConsent().scores, false); assert.equal(b.app.getConsent().autoScores, false);
  assert.equal(b.requests.length, 0);
});
// The next child on a shared computer must never read, download, send or bring back the last child's notes.
test('Privacy and notes on this device shows the notice and only counts notes: no note text, Send, Excel for every player or way back to the last player', async () => {
  const b = browser({dialog: true, closeout: CODE}); b.el('fix').value = 'first player note with sam@example.com'; b.app.flush(); keepForFacilitator(b);
  const c = browser({store: b.store, closeout: CODE}); c.el('worked').value = 'second player note'; c.app.flush();
  assert.equal(c.id('pt-player-back'), null, 'no button brings back the last player');
  c.el('device').click();
  const dialog = c.id('pt-device-dialog'); assert.equal(dialog.open, true); assert.equal(c.doc.activeElement, c.id('pt-device-title'));
  const notice = textOf(c.id('pt-device-privacy'));
  for (const fact of [/akeyvanf@kennesaw\.edu/, /Google Apps Script/, /nothing leaves this device until a grown-up reviews a note/, /random codes/, /when it started and last changed, and whether it has ended/, /eight most recent players/, /Erase all Pecan Grove data on this device/,
    /names of files downloaded during the current player's turn/, /review and send them, keep them on this device for Facilitator close-out, which opens only with the facilitator's code, or delete them/, /Notes the team has received stay on this device as they were sent/]) assert.match(notice, fact);
  assert.match(textOf(dialog), /Players: 2\. Notes: 2\. Not received by the playtest team: 2\./);
  assert.match(textOf(dialog), /only counts them\. The facilitator reads them in Facilitator close-out, under For grown-ups, with the facilitator's code\./);
  assert.doesNotMatch(textOf(dialog), /first player note|second player note|sam@example\.com|closeout=|close-out view/);
  for (const id of ['pt-device-show', 'pt-device-notes', 'pt-device-confirm', 'pt-device-send', 'pt-device-download']) assert.equal(c.id(id), null, id);
  const status = c.id('pt-device-status');
  c.id('pt-device-erase').click(); assert.equal(c.doc.activeElement, c.id('pt-device-erase-no'));
  assert.equal(c.id('pt-device-status'), status, 'the polite status region is never replaced');
  assert.match(c.id('pt-device-erase-message').textContent, /Notes not received by the playtest team: 2\. Erasing deletes them\. To keep them, the facilitator can send or download them first in Facilitator close-out\./);
  c.id('pt-device-erase-yes').click();
  assert.equal(c.win.reloads, 1); assert.equal([...c.store.data.keys()].some(key => key.startsWith('pecan-grove')), false);
  c.win.fire('pagehide'); c.doc.visibilityState = 'hidden'; c.doc.fire('visibilitychange');
  assert.equal([...c.store.data.keys()].some(key => key.startsWith('pecan-grove')), false, 'the closing page does not write notes back');
  assert.equal(c.requests.length, 0);
  // A copy with no close-out code never mentions it, and says notes are sent or deleted.
  const plain = browser(); plain.el('device').click();
  assert.doesNotMatch(textOf(plain.id('pt-device-dialog')), /close-out|Facilitator/); assert.match(textOf(plain.id('pt-device-privacy')), /review and send them, or delete them\./);
  const local = browser({cloud: false}); local.el('device').click();
  assert.match(textOf(local.id('pt-device-privacy')), /At Next player, a grown-up deletes them, so download Excel first to keep them\. What is sent: nothing\. This copy of the game is not connected to the playtest team\. Questions/);
});
test('Facilitator close-out exists only with a close-out code: a dialog asks for the code, five wrong codes on this device wait a minute, and the address never changes', async () => {
  const plain = browser(); assert.equal(plain.app.openCloseout, undefined); assert.equal(plain.id('pt-closeout-ask'), null); assert.equal(plain.id('pt-closeout-dialog'), null);
  const tab = storage(), b = browser({closeout: CODE, tab}), opener = b.doc.createElement('button');
  b.app.openCloseout(opener);
  const ask = b.id('pt-closeout-ask'); assert.equal(ask.open, true); assert.equal(b.doc.activeElement, b.id('pt-closeout-code'));
  assert.match(textOf(ask), /Facilitator close-out .*Type the close-out code .*If you are a player, choose Not now\./);
  // A real password field that the browser treats as a one-time code: masked, never read out, never saved or filled in.
  const field = b.id('pt-closeout-code'); assert.equal(field.type, 'password'); assert.equal(field.getAttribute('autocomplete'), 'one-time-code'); assert.equal(field.name, 'pt-closeout-otp');
  b.id('pt-closeout-ask-confirm').click(); await digestDone(); assert.match(b.id('pt-closeout-ask-status').textContent, /Type the close-out code first/);
  for (let i = 1; i <= 4; i++) {
    b.id('pt-closeout-code').value = 'wrong-code-' + i; b.id('pt-closeout-ask-confirm').click(); await digestDone();
    assert.equal(b.id('pt-closeout-ask-status').textContent, 'That code is not right. Tries left before a one-minute wait: ' + (5 - i) + '.'); assert.equal(b.id('pt-closeout-code').value, '');
  }
  b.id('pt-closeout-code').value = 'wrong-code-5'; b.id('pt-closeout-ask-confirm').click(); await digestDone();
  assert.equal(b.id('pt-closeout-ask-status').textContent, 'Too many tries. Wait one minute, then try again.');
  b.id('pt-closeout-code').value = CODE; b.id('pt-closeout-ask-confirm').click(); await digestDone();
  assert.equal(b.id('pt-closeout-dialog'), null, 'even the right code waits');
  // The wait is kept on this device: across a reload, in a new tab and after Erase all, which keeps the count on purpose.
  const wait = JSON.parse(b.store.getItem(api.TRIES_KEY)); assert.ok(wait.until > Date.now() + 50000); assert.equal(tab.getItem(api.TRIES_KEY), null);
  assert.ok(!api.TRIES_KEY.startsWith('pecan-grove'));
  const again = browser({store: b.store, closeout: CODE, tab: storage()}); again.app.openCloseout(); assert.match(again.id('pt-closeout-ask-status').textContent, /Too many tries/);
  assert.equal(api.eraseAll(b.store, tab), true); assert.deepEqual(JSON.parse(b.store.getItem(api.TRIES_KEY)), wait);
  const erased = browser({store: b.store, closeout: CODE}); erased.app.openCloseout(); assert.match(erased.id('pt-closeout-ask-status').textContent, /Too many tries/);
  // A minute later the right code opens the close-out, with spaces around it trimmed.
  b.store.setItem(api.TRIES_KEY, JSON.stringify({count: 0, until: Date.now() - 1}));
  again.id('pt-closeout-code').value = '  ' + CODE + ' '; again.id('pt-closeout-ask-confirm').click(); await digestDone();
  assert.equal(again.id('pt-closeout-dialog').open, true); assert.equal(again.id('pt-closeout-ask').open, false); assert.equal(again.doc.activeElement, again.id('pt-closeout-title'));
  assert.equal(again.id('pt-closeout-code').value, ''); assert.deepEqual(JSON.parse(b.store.getItem(api.TRIES_KEY)), {count: 0, until: 0});
  for (const page of [b, again]) { assert.equal(page.win.location.href, 'https://game.test/index.html'); assert.equal(page.win.replaced || 0, 0); }
  // Escape closes the question, forgets what was typed and returns focus.
  const e = browser({closeout: CODE, lang: 'es'}), back = e.doc.createElement('button'); e.app.openCloseout(back);
  assert.equal(e.id('pt-closeout-ask-confirm').textContent, 'Abrir el cierre'); assert.match(textOf(e.id('pt-closeout-ask')), /Cierre para facilitadores .*Si eres un jugador, elige Ahora no\./);
  e.id('pt-closeout-code').value = 'typed'; const escape = e.id('pt-closeout-ask').fire('cancel'); assert.ok(escape);
  assert.equal(e.id('pt-closeout-ask').open, false); assert.equal(e.id('pt-closeout-code').value, ''); assert.equal(e.doc.activeElement, back); assert.equal(e.id('pt-closeout-dialog'), null);
});
test("close-out: a grown-up reads every player's notes, one check sends them, focus stays in the dialog, and the Excel for every player is scrubbed", async () => {
  const b = browser({dialog: true, closeout: CODE}); b.el('fix').value = 'first player note with sam@example.com'; b.app.flush(); keepForFacilitator(b);
  const c = browser({store: b.store, closeout: CODE}); c.el('worked').value = 'second player note'; c.app.flush();
  await openCloseout(c);
  const dialog = c.id('pt-closeout-dialog'); assert.equal(dialog.open, true); assert.equal(c.doc.activeElement, c.id('pt-closeout-title'));
  assert.equal(c.win.location.href, 'https://game.test/index.html', 'nothing reaches the address or the history');
  const listed = textOf(c.id('pt-closeout-notes')); assert.match(listed, /first player note with \[removed\]/); assert.match(listed, /second player note/); assert.match(listed, /\(playing now\)/);
  assert.doesNotMatch(listed, /sam@example\.com/);
  const status = c.id('pt-closeout-status');
  c.id('pt-closeout-send').click(); await settle(); assert.equal(c.requests.length, 0); assert.match(status.textContent, /tick the check first/);
  c.id('pt-closeout-confirm').checked = true; c.id('pt-closeout-send').click(); await settle();
  assert.equal(c.requests.length, 2, 'one request per player device code');
  for (const request of c.requests) assert.equal(new Set(request.body.entries.map(e => e.stationId)).size, 1);
  assert.doesNotMatch(JSON.stringify(c.requests), /sam@example\.com/);
  assert.equal(c.id('pt-closeout-status'), status, 'the result goes to the same polite region');
  assert.match(status.textContent, /received every note on this device/);
  assert.equal(c.doc.activeElement, c.id('pt-closeout-title'), 'focus stays in the dialog after the list is drawn again');
  let saved = null; c.win.Blob = class { constructor(parts) { saved = Buffer.from(parts[0]); } };
  c.id('pt-closeout-download').click();
  assert.ok(saved.includes(Buffer.from('first player note with [removed]'))); assert.ok(saved.includes(Buffer.from('second player note'))); assert.ok(!saved.includes(Buffer.from('sam@example.com')));
  assert.ok(saved.includes(Buffer.from('Check before sharing.')));
  // Closing first says to delete the downloaded file; the second Close closes and leaves no note text in the page.
  c.id('pt-closeout-close').click(); assert.equal(dialog.open, true);
  assert.equal(c.id('pt-closeout-files').textContent, 'Files were downloaded on this computer during this turn: pecan-grove-feedback-all-players.xlsx. Delete them from the Downloads folder before a child uses this computer.');
  assert.doesNotMatch(textOf(dialog), /player note/);
  c.id('pt-closeout-close').click(); assert.equal(dialog.open, false); assert.doesNotMatch(textOf(dialog), /player note|Downloads folder/);
});
test('close-out with two tabs: a note written in another tab after the list was shown is never sent without being read', async () => {
  const b = browser(); b.el('fix').value = 'read note'; b.app.flush();
  const c = browser({store: b.store, closeout: CODE}); await openCloseout(c);
  assert.match(c.id('pt-closeout-send').textContent, /\(1\)/);
  // Another tab adds a note, and its storage event redraws the list: the check is cleared and Send sends nothing.
  c.id('pt-closeout-confirm').checked = true;
  const other = browser({store: b.store}); other.doc.fire('cb:screen', {stopN: 5, phase: 'playing'}); other.el('worked').value = 'unread note from the other tab'; other.app.flush();
  c.win.fire('storage', null, {key: api.KEY});
  assert.match(textOf(c.id('pt-closeout-notes')), /unread note from the other tab/);
  assert.match(c.id('pt-closeout-status').textContent, /changed after this list was shown/);
  assert.equal(!!c.id('pt-closeout-confirm').checked, false); assert.match(c.id('pt-closeout-send').textContent, /\(2\)/);
  c.id('pt-closeout-send').click(); await settle(); assert.equal(c.requests.length, 0);
  // Without a storage event in time, Send still sends only the note as it was listed.
  other.el('worked').value = 'edited after the list was shown'; other.app.flush();
  c.id('pt-closeout-confirm').checked = true; c.id('pt-closeout-send').click(); await settle();
  assert.equal(c.requests.length, 1);
  const sent = c.requests[0].body.entries.filter(e => e.kind === 'feedback');
  assert.deepEqual(sent.map(e => e.fix || e.worked), ['read note']);
  assert.doesNotMatch(JSON.stringify(c.requests), /edited after the list was shown|unread note/);
  const left = c.app.model.entries(true).find(e => e.stop === 5 && e.kind === 'feedback');
  assert.equal(left.worked, 'edited after the list was shown'); assert.equal(left.submitted, false, 'the unread note stays a local draft');
  assert.match(c.id('pt-closeout-status').textContent, /Notes not received: 1\..*changed after this list was shown/);
});
test('Next player shows no way back to a child; the facilitator close-out brings back a player chosen by mistake', async () => {
  const b = browser({dialog: true, closeout: CODE}), first = b.app.model.active(); b.el('fix').value = 'first player draft'; keepForFacilitator(b);
  const c = browser({store: b.store}), second = c.app.model.active();
  assert.equal(c.id('pt-player-back'), null); assert.equal(c.id('pt-player-ready').textContent, 'The next player is ready.');
  assert.equal(textOf(c.panel).includes('Go back to the last player'), false);
  c.el('worked').value = 'second player typed'; c.el('worked').fire('input'); c.app.flush(); assert.equal(c.id('pt-player-ready').parentNode.children.includes(c.id('pt-player-ready')), false, 'typing removes the ready line');
  const d = browser({store: b.store, closeout: CODE}); await openCloseout(d);
  assert.match(textOf(d.id('pt-closeout-body')), /Bring back a player/);
  const bring = d.allNodes().findLast(n => n.tagName === 'BUTTON' && n.textContent.startsWith('Bring back player ' + first.slice(-6).toUpperCase() + ' (last saved '));
  assert.ok(bring, 'every earlier player can be brought back');
  bring.click(); assert.equal(d.win.reloads, 1); assert.equal(d.win.location.href, 'https://game.test/index.html');
  const e = browser({store: b.store}); assert.equal(e.app.model.active(), first); assert.equal(e.el('fix').value, 'first player draft');
  assert.equal(e.app.getConsent().scores, false);
  assert.ok(e.app.model.entries(true).some(x => x.sessionId === second && x.kind === 'session' && x.sessionEnded), 'the player who was playing stays saved and ends');
  assert.ok(e.app.model.entries(true).some(x => x.sessionId === second && x.worked === 'second player typed'));
});

// Next player never leaves a player's notes behind: they are sent after a grown-up's review, deleted, or (with a
// close-out code) kept for the facilitator.
test('Next player with notes not received: Keep playing is the default, and Review and send now sends only this player\'s notes after the grown-up check, then starts the next player', async () => {
  const b = browser({dialog: true, closeout: CODE}); b.el('fix').value = 'first player note'; b.app.flush(); keepForFacilitator(b);
  const c = browser({store: b.store, dialog: true, closeout: CODE}), second = c.app.model.active();
  c.doc.fire('cb:screen', {stopN: 2, phase: 'playing'}); c.el('worked').value = 'my sister Ana Sofia liked stop 2, email me at kid@example.com'; c.app.flush();
  const opener = c.el('new-player'); opener.focus(); opener.click();
  const dialog = c.id('pt-new-player-dialog'); assert.equal(dialog.open, true); assert.equal(c.doc.activeElement, c.id('pt-new-player-cancel'));
  assert.equal(c.id('pt-new-player-message').textContent, 'Notes from this player that the playtest team has not received: 1. Choose what happens to them before the next player starts.');
  for (const [id, label] of [['pt-new-player-send', 'Review and send now'], ['pt-new-player-keep', 'Keep them for the facilitator'], ['pt-new-player-delete', 'Delete them']]) { assert.equal(c.id(id).hidden, false, id); assert.equal(c.id(id).textContent, label); }
  assert.equal(c.id('pt-new-player-confirm').hidden, true, 'nothing starts the next player before the notes are handled');
  c.id('pt-new-player-cancel').click(); assert.equal(dialog.open, false); assert.equal(c.win.reloads || 0, 0); assert.equal(c.doc.activeElement, opener);
  opener.click(); c.id('pt-new-player-send').click();
  assert.equal(c.doc.activeElement, c.id('pt-new-player-review')); const listed = textOf(c.id('pt-new-player-notes'));
  assert.match(listed, /email me at \[removed\]/); assert.doesNotMatch(listed, /kid@example\.com|first player note/);
  assert.match(textOf(c.id('pt-new-player-body')), /Please check these words before sending: sister Ana Sofia/);
  assert.equal(c.id('pt-new-player-confirm').textContent, 'Send now');
  c.id('pt-new-player-confirm').click(); await settle(); assert.equal(c.requests.length, 0); assert.match(c.id('pt-new-player-status').textContent, /tick the check first/);
  c.id('pt-new-player-check').checked = true; c.id('pt-new-player-confirm').click(); await settle();
  assert.equal(c.requests.length, 1); const sent = c.requests[0].body.entries;
  assert.ok(sent.every(e => e.sessionId === second), 'only this player\'s records leave');
  assert.deepEqual(sent.filter(e => e.kind === 'feedback').map(e => e.worked), ['my sister Ana Sofia liked stop 2, email me at [removed]']);
  assert.equal(c.win.reloads, 1); assert.notEqual(c.app.model.active(), second); assert.equal(dialog.open, false);
  assert.doesNotMatch(textOf(dialog), /Ana Sofia|stop 2/, 'the closed dialog keeps no note text');
  assert.ok(c.app.model.entries(true).some(e => e.worked === 'first player note' || e.fix === 'first player note'), 'the kept note of the earlier player is untouched');
});
test('a review that does not reach the team keeps this player: the dialog says how many notes are left and the next player does not start', async () => {
  const c = browser({dialog: true, failure: true}), me = c.app.model.active(); c.el('worked').value = 'note that cannot be sent'; c.app.flush();
  c.el('new-player').click(); assert.equal(c.id('pt-new-player-keep').hidden, true, 'no close-out code, no keeping'); c.id('pt-new-player-send').click();
  c.id('pt-new-player-check').checked = true; c.id('pt-new-player-confirm').click(); await settle();
  assert.equal(c.requests.length, 1); assert.equal(c.app.model.active(), me); assert.equal(c.win.reloads || 0, 0); assert.equal(c.id('pt-new-player-dialog').open, true);
  assert.match(c.id('pt-new-player-status').textContent, /Notes not received: 1\./); assert.equal(!!c.id('pt-new-player-check').checked, false, 'a new try needs the check again');
});
test('Delete them asks again with Keep playing as the default, then leaves no text of this player\'s notes on the device', () => {
  const c = browser({dialog: true}), me = c.app.model.active(); c.el('worked').value = 'delete me please'; c.app.flush(); c.doc.fire('cb:screen', {stopN: 4, phase: 'playing'}); c.el('fix').value = 'and me'; c.app.flush();
  c.el('new-player').click(); c.id('pt-new-player-delete').click();
  assert.equal(c.doc.activeElement, c.id('pt-new-player-cancel'), 'Keep playing is the safe default');
  assert.equal(c.id('pt-new-player-message').textContent, 'Notes from this player that the playtest team has not received: 2. Delete them? Nobody can bring them back.');
  assert.equal(c.id('pt-new-player-confirm').textContent, 'Delete and start the next player');
  c.id('pt-new-player-cancel').click(); assert.equal(c.win.reloads || 0, 0); assert.equal(c.app.model.find('feedback', 4).fix, 'and me');
  c.el('new-player').click(); c.id('pt-new-player-delete').click(); c.id('pt-new-player-confirm').click();
  assert.equal(c.win.reloads, 1); assert.notEqual(c.app.model.active(), me); assert.equal(c.requests.length, 0);
  assert.doesNotMatch([...c.store.data.values()].join(''), /delete me please|and me/);
});
test('Keep them for the facilitator needs a close-out code and Review and send now a receiver; with nothing to handle, Next player only confirms', () => {
  for (const [cloud, closeout, offered] of [[true, CODE, ['send', 'keep', 'delete']], [true, '', ['send', 'delete']], [false, CODE, ['keep', 'delete']]]) {
    const b = browser({dialog: true, cloud, closeout}); b.el('worked').value = 'a note'; b.app.flush(); b.el('new-player').click();
    for (const id of ['send', 'keep', 'delete']) assert.equal(b.id('pt-new-player-' + id).hidden, !offered.includes(id), cloud + ' ' + closeout + ' ' + id);
  }
  // A copy with neither asks only to delete, and says how to keep a copy first.
  const local = browser({dialog: true, cloud: false}); local.el('worked').value = 'a note'; local.app.flush(); local.el('new-player').click();
  assert.equal(local.id('pt-new-player-send').hidden, true); assert.equal(local.id('pt-new-player-confirm').textContent, 'Delete and start the next player');
  assert.match(local.id('pt-new-player-message').textContent, /Delete them\? Nobody can bring them back\. To keep the notes, choose Keep playing and download Excel first\./);
  const empty = browser({dialog: true, closeout: CODE}); empty.el('new-player').click();
  assert.equal(empty.id('pt-new-player-confirm').hidden, false); assert.equal(empty.id('pt-new-player-confirm').textContent, 'Start next player');
  assert.match(empty.id('pt-new-player-message').textContent, /This player's game stays saved on this device\. Only Facilitator close-out, with the facilitator's code, can bring this player back\.$/);
  // A note saved in another tab while the question is open is handled before the next player starts.
  const other = browser({store: empty.store}); other.el('worked').value = 'written in the other tab'; other.app.flush();
  empty.id('pt-new-player-confirm').click(); assert.equal(empty.win.reloads || 0, 0); assert.match(empty.id('pt-new-player-message').textContent, /has not received: 1\. Choose what happens/);
  empty.id('pt-new-player-keep').click(); assert.equal(empty.win.reloads, 1);
  const plain = browser({dialog: true}); plain.el('new-player').click(); assert.doesNotMatch(plain.id('pt-new-player-message').textContent, /Facilitator|close-out/);
});
test('when saving stops working after this player saved, Next player opens with the storage message and offers to erase and start over', () => {
  const store = storage(), b = browser({store, dialog: true}); b.el('worked').value = 'saved once'; b.app.flush();
  store.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
  b.el('worked').value = 'saved once, then more'; b.el('new-player').click();
  assert.equal(b.id('pt-new-player-dialog').open, true); assert.equal(b.doc.activeElement, b.id('pt-new-player-cancel'));
  assert.match(b.id('pt-new-player-message').textContent, /cannot save on this device right now, so the next player cannot start the usual way\. You can erase this device's Pecan Grove data and start over\./);
  assert.equal(b.id('pt-new-player-confirm').textContent, 'Erase and start over'); assert.match(b.el('status').textContent, /cannot save feedback on this device right now/);
  b.id('pt-new-player-cancel').click(); assert.equal(b.el('worked').value, 'saved once, then more', 'Keep playing keeps the form');
  b.el('new-player').click(); b.id('pt-new-player-confirm').click();
  assert.equal(b.win.reloads, 1); assert.equal([...store.data.keys()].some(key => key.startsWith('pecan-grove')), false);
  // Where even erasing fails, the dialog says so and the form stays as it was.
  const blocked = storage(), c = browser({store: blocked, dialog: true}); c.el('worked').value = 'keep me'; c.app.flush();
  blocked.setItem = () => { throw Error('full'); }; blocked.removeItem = () => { throw Error('denied'); };
  c.el('worked').value = 'keep me too'; c.el('new-player').click(); c.id('pt-new-player-confirm').click();
  assert.equal(c.win.reloads || 0, 0); assert.match(c.id('pt-new-player-status').textContent, /could not erase Pecan Grove's data/); assert.equal(c.el('worked').value, 'keep me too');
});
test('files downloaded during this turn: Next player says to delete them from Downloads, and the next player starts with none', () => {
  const b = browser({dialog: true, cloud: false, closeout: CODE}); b.el('worked').value = 'local note'; b.app.flush();
  b.el('download').click(); assert.match(b.el('status').textContent, /^Excel downloaded for this player\. Before the next player starts, delete it from the Downloads folder or move it somewhere private\.$/);
  b.doc.fire('pg:file-saved', {name: 'pecan-grove-progress-2026-10-27.json'});
  b.el('new-player').click();
  assert.match(b.id('pt-new-player-files').textContent, /^Files were downloaded on this computer during this player's turn: pecan-grove-feedback-[0-9a-z]{6}\.xlsx, pecan-grove-progress-2026-10-27\.json\. Before the next player starts, delete them from the Downloads folder or move them somewhere private\.$/);
  // A reload in the same turn still remembers the files; the next player starts with none.
  b.id('pt-new-player-cancel').click();
  const again = browser({store: b.store, dialog: true, cloud: false, closeout: CODE}); again.el('new-player').click(); assert.match(again.id('pt-new-player-files').textContent, /pecan-grove-progress-2026-10-27\.json/);
  again.id('pt-new-player-keep').click(); assert.equal(again.store.getItem(api.FILES_KEY), null);
  const next = browser({store: b.store, dialog: true, cloud: false}); next.el('new-player').click(); assert.equal(next.id('pt-new-player-files'), null);
});
test('leaving the page closes and empties every dialog and the form; Back or Forward shows the same player again, or reloads when the player changed', async () => {
  const b = browser({dialog: true, closeout: CODE}); b.el('worked').value = 'first note'; b.app.flush(); keepForFacilitator(b);
  const c = browser({store: b.store, dialog: true, closeout: CODE}); c.el('worked').value = 'mine, my sister Ana Sofia'; c.app.flush(); c.el('form').fire('submit'); assert.match(c.el('preview-flags').textContent, /Ana Sofia/);
  await openCloseout(c); assert.match(textOf(c.id('pt-closeout-notes')), /first note/);
  c.win.fire('pagehide');
  assert.equal(c.id('pt-closeout-dialog').open, false); assert.doesNotMatch(textOf(c.id('pt-closeout-dialog')), /first note|mine/);
  assert.equal(c.el('worked').value, ''); assert.doesNotMatch(textOf(c.el('entries')), /mine/); assert.equal(c.el('preview-text').textContent, ''); assert.equal(c.el('preview-flags').textContent, '');
  assert.equal(c.app.model.find('feedback', 0).worked, 'mine, my sister Ana Sofia', 'the note stays saved');
  // The same player in the back-forward cache: the form and the list come back from storage, without a reload.
  c.win.fire('pageshow', null, {persisted: true}); assert.equal(c.win.reloads || 0, 0); assert.equal(c.el('worked').value, 'mine, my sister Ana Sofia'); assert.match(textOf(c.el('entries')), /mine/);
  // The code question and Next player's list of notes empty too.
  c.app.openCloseout(); c.id('pt-closeout-code').value = 'half typed';
  c.win.fire('pagehide'); assert.equal(c.id('pt-closeout-ask').open, false); assert.equal(c.id('pt-closeout-code').value, '');
  c.win.fire('pageshow', null, {persisted: true});
  c.el('new-player').click(); c.id('pt-new-player-send').click(); assert.match(textOf(c.id('pt-new-player-notes')), /mine/);
  c.win.fire('pagehide'); assert.equal(c.id('pt-new-player-dialog').open, false); assert.doesNotMatch(textOf(c.id('pt-new-player-dialog')), /mine/);
  // Another tab starts a player while this page waits in the back-forward cache: showing it again reloads.
  browser({store: b.store}).app.model.rotate();
  c.win.fire('pageshow', null, {persisted: true}); assert.equal(c.win.reloads, 1);
  // A normal first show does nothing.
  const d = browser(); d.win.fire('pageshow', null, {persisted: false}); assert.equal(d.win.reloads || 0, 0);
});

// What the grown-up reads is what leaves and what Excel keeps, on the first Send, also for a note with two names.
test('a note with two names is sent on the first Send exactly as the grown-up read it, and the Excel has the same text', async () => {
  const single = browser(); single.el('worked').value = 'my dog is named Max and my name is Leo'; single.el('form').fire('submit');
  assert.match(single.el('preview-text').textContent, /my dog is named \[removed\] and my name is \[removed\]/); assert.equal(single.el('preview-flags').hidden, true);
  approve(single); await settle();
  assert.deepEqual(single.requests.map(r => r.body.entries.filter(e => e.kind === 'feedback').map(e => e.worked)), [['my dog is named [removed] and my name is [removed]']]);
  assert.equal(single.el('thanks').textContent, 'Thanks, feedback received');
  const next = browser({dialog: true, lang: 'es'}), me = next.app.model.active(); next.el('worked').value = 'me llamo Sofia y mi hermano se llama Diego'; next.app.flush();
  next.el('new-player').click(); next.id('pt-new-player-send').click();
  const listed = textOf(next.id('pt-new-player-notes')); assert.match(listed, /me llamo \[quitado\] y mi hermano se llama \[quitado\]/); assert.doesNotMatch(listed, /Sofia|Diego/);
  next.id('pt-new-player-check').checked = true; next.id('pt-new-player-confirm').click(); await settle();
  assert.equal(next.requests.length, 1); assert.deepEqual(next.requests[0].body.entries.filter(e => e.kind === 'feedback').map(e => e.worked), ['me llamo [quitado] y mi hermano se llama [quitado]']);
  assert.equal(next.win.reloads, 1, 'the next player starts after the first Send'); assert.notEqual(next.app.model.active(), me);
  const close = browser({closeout: CODE}); close.el('fix').value = 'my best friend is called Noor and my name is Zara'; close.app.flush();
  await openCloseout(close); assert.match(textOf(close.id('pt-closeout-notes')), /my best friend is called \[removed\] and my name is \[removed\]/);
  let saved = null; close.win.Blob = class { constructor(parts) { saved = Buffer.from(parts[0]); } }; close.id('pt-closeout-download').click();
  assert.ok(saved.includes(Buffer.from('my best friend is called [removed] and my name is [removed]'))); assert.ok(!saved.includes(Buffer.from('Noor')) && !saved.includes(Buffer.from('Zara')));
  close.id('pt-closeout-confirm').checked = true; close.id('pt-closeout-send').click(); await settle();
  assert.deepEqual(close.requests.flatMap(r => r.body.entries.filter(e => e.kind === 'feedback').map(e => e.fix)), ['my best friend is called [removed] and my name is [removed]']);
  assert.match(close.id('pt-closeout-status').textContent, /received every note on this device/);
});
// The feedback words load as two files. A missing one borrows the other; with neither, only Next player works.
async function bootWith(failing, {lang = 'en', store = storage(), note = ''} = {}) {
  if (note) { const m = api.createModel({storage: store, language: lang, build: 'privacy-test', id}); m.upsert('feedback', 0, {worked: note}); }
  const b = browser({autoMount: false, dialog: true, store}); b.win.document = b.doc; b.doc.baseURI = 'https://game.test/index.html'; b.doc.documentElement = {lang};
  b.win.PGShellLocale = Object.fromEntries(['en', 'es'].map(l => [l, JSON.parse(fs.readFileSync(new URL(`../../assets/playtest/locales/${l}.json`, import.meta.url), 'utf8'))]));
  const form = b.el('form'), fields = ['stop', 'rating', 'category', 'worked', 'fix', 'submit'].map(name => b.el(name));
  for (const name of ['worked', 'fix']) b.el(name).tagName = 'TEXTAREA';
  form.elements = fields; b.el('worked').value = 'typed before the words came: my name is Lila';
  b.win.fetch = async url => { const l = String(url).includes('feedback-es') ? 'es' : 'en'; if (failing.includes(l)) throw new TypeError('Failed to fetch'); return {ok: true, json: async () => JSON.parse(fs.readFileSync(new URL(`../../assets/playtest/locales/feedback-${l}.json`, import.meta.url), 'utf8'))}; };
  vm.runInNewContext(fs.readFileSync(new URL('../../assets/playtest/feedback.js', import.meta.url), 'utf8'), {window: b.win, URL, TextEncoder, Uint8Array, DataView, Date, Map, Number, JSON, Math});
  return {b, runtime: await b.win.PecanGroveFeedback.ready, fields};
}
const RAW_KEY = /\b(?:undefined|null|new[A-Z]\w+|feedback_\w+|privacy[A-Z]\w+)\b|\{\w+\}/;
test('a feedback language that does not load borrows the other one, so every control still works and no raw key shows', async () => {
  for (const [failing, lang, title] of [['en', 'en', 'Comentarios de la prueba'], ['es', 'es', 'Playtest feedback'], ['es', 'en', 'Playtest feedback']]) {
    const {b, runtime} = await bootWith([failing], {lang});
    assert.ok(runtime && runtime.openDevice, failing + ' ' + lang); assert.equal(b.el('h').textContent, title);
    assert.equal(b.panel.dataset.lang, lang); assert.equal(b.panel.getAttribute('lang'), title === 'Playtest feedback' ? 'en' : 'es', 'the form says which language its words are in');
    assert.equal(b.panel.dataset.feedbackUnavailable, undefined); assert.equal(b.el('worked').value, '', 'the form shows this player\'s saved note, not earlier typing');
    b.el('worked').value = 'a note'; b.app = runtime; runtime.flush(); b.el('new-player').click();
    assert.equal(b.id('pt-new-player-dialog').open, true); assert.doesNotMatch(textOf(b.id('pt-new-player-dialog')), RAW_KEY);
    b.id('pt-new-player-delete').click(); b.id('pt-new-player-confirm').click(); assert.equal(b.win.reloads, 1);
    assert.doesNotMatch([...b.store.data.values()].join(''), /a note/);
  }
});
test('with no feedback words at all, the form is switched off and emptied, says to reload while online, and Next player still starts the next player', async () => {
  for (const lang of ['en', 'es']) {
    const {b, runtime, fields} = await bootWith(['en', 'es'], {lang}), shell = b.win.PGShellLocale[lang], first = runtime.model.active();
    assert.equal(b.panel.dataset.feedbackUnavailable, 'true'); assert.ok(fields.every(field => field.disabled)); assert.equal(b.el('worked').value, '', 'typed text is cleared');
    assert.equal(b.el('status').textContent, shell.feedback_unavailable); assert.match(shell.feedback_unavailable, lang === 'en' ? /Reload this page while you are online/ : /Recarga esta página con conexión/);
    assert.equal(b.el('player').textContent, first.slice(-6).toUpperCase());
    for (const name of ['device']) assert.equal(b.el(name).hidden, true, 'the privacy panel needs the feedback words');
    let prevented = false; b.el('form').fire('submit', null, {preventDefault() { prevented = true; }}); assert.ok(prevented, 'the switched-off form never submits');
    // The game's own For grown-ups calls this too.
    assert.equal(typeof b.win.PecanGroveFeedback.requestNewPlayer, 'function'); assert.equal(b.win.PecanGroveFeedback.openDevice, undefined);
    const opener = b.el('new-player-top'); opener.focus(); opener.click();
    const dialog = b.id('pt-new-player-dialog'); assert.equal(dialog.open, true); assert.equal(b.doc.activeElement, b.id('pt-new-player-cancel'));
    assert.equal(b.id('pt-new-player-message').textContent, shell.feedback_unavailable); assert.equal(b.id('pt-new-player-confirm').hidden, false);
    assert.doesNotMatch(textOf(dialog) + b.el('status').textContent, RAW_KEY);
    b.id('pt-new-player-cancel').click(); assert.equal(dialog.open, false); assert.equal(b.doc.activeElement, opener); assert.equal(b.win.reloads || 0, 0);
    b.win.PecanGroveFeedback.requestNewPlayer(opener); b.id('pt-new-player-confirm').click();
    assert.equal(b.win.reloads, 1); const state = JSON.parse(b.store.getItem(api.KEY)); assert.notEqual(state.activeSession, first, 'a new player with new codes');
    assert.doesNotMatch([...b.store.data.values()].join(''), /Lila|typed before/);
  }
  // A note this player saved earlier, before the words stopped loading, waits for the form: Next player says to reload first.
  const {b} = await bootWith(['en', 'es'], {note: 'saved while the form worked'});
  b.el('new-player').click(); assert.equal(b.id('pt-new-player-message').textContent, b.win.PGShellLocale.en.feedback_unavailable_notes);
  assert.equal(b.id('pt-new-player-confirm').hidden, true); assert.equal(b.win.reloads || 0, 0);
  b.doc.fire('pg:language-change', {language: 'es'}); assert.equal(b.id('pt-new-player-message').textContent, b.win.PGShellLocale.es.feedback_unavailable_notes);
  assert.equal(b.el('status').textContent, b.win.PGShellLocale.es.feedback_unavailable);
});
test('on a page that is not secure (plain http, not localhost) there is no close-out and no keeping for it, even in a build with a code', () => {
  const b = browser({closeout: CODE, dialog: true, secure: false, autoMount: false}), open = b.doc.createElement('button'); open.id = 'pt-closeout-open';
  const app = api.mount(b.doc, b.win); assert.equal(app.openCloseout, undefined); assert.equal(open.hidden, true);
  b.el('worked').value = 'a note'; app.flush(); b.el('new-player').click();
  assert.equal(b.id('pt-new-player-keep').hidden, true); assert.equal(b.id('pt-new-player-send').hidden, false); assert.equal(b.id('pt-new-player-delete').hidden, false);
  b.id('pt-new-player-cancel').click(); app.openDevice(); const panel = textOf(b.id('pt-device-dialog'));
  assert.match(panel, /review and send them, or delete them\./); assert.doesNotMatch(panel, /Facilitator close-out|close-out code/);
  assert.doesNotMatch(b.el('status').textContent, /Facilitator close-out/);
  // A secure page with the same build keeps both.
  const s = browser({closeout: CODE, dialog: true}); s.el('worked').value = 'a note'; s.app.flush(); s.el('new-player').click(); assert.equal(s.id('pt-new-player-keep').hidden, false);
  s.id('pt-new-player-cancel').click(); s.app.openDevice(); assert.match(textOf(s.id('pt-device-dialog')), /wrong codes typed on this device are counted/);
});
test('Keep them for the facilitator saves each note scrubbed, as Send and Excel would give it', () => {
  const b = browser({dialog: true, closeout: CODE}); b.el('worked').value = 'my name is Lila Fernandez, email lila@example.com'; b.app.flush();
  b.doc.fire('cb:screen', {stopN: 3, phase: 'playing'}); b.el('fix').value = 'call 555-123-4567'; b.app.flush();
  keepForFacilitator(b); assert.equal(b.win.reloads, 1);
  const stored = [...b.store.data.values()].join(''); assert.doesNotMatch(stored, /Lila|Fernandez|lila@example\.com|555-123-4567/);
  const kept = b.app.model.entries(true).filter(e => e.kind === 'feedback').map(e => e.worked + e.fix).sort();
  assert.deepEqual(kept, ['call [removed]', 'my name is [removed], email [removed]']);
});
test('the close-out closes by itself when the tab is hidden and after ten minutes without input, keeping no note text', async () => {
  const b = browser({closeout: CODE}); b.el('worked').value = 'private note'; b.app.flush();
  await openCloseout(b); const dialog = b.id('pt-closeout-dialog'); assert.equal(dialog.open, true);
  b.doc.visibilityState = 'hidden'; b.doc.fire('visibilitychange'); assert.equal(dialog.open, false); assert.doesNotMatch(textOf(dialog), /private note/);
  b.doc.visibilityState = 'visible'; b.doc.fire('visibilitychange');
  b.app.openCloseout(); b.id('pt-closeout-code').value = 'half typed'; b.doc.visibilityState = 'hidden'; b.doc.fire('visibilitychange');
  assert.equal(b.id('pt-closeout-ask').open, false); assert.equal(b.id('pt-closeout-code').value, ''); b.doc.visibilityState = 'visible';
  await openCloseout(b); await b.tick(599000); assert.equal(dialog.open, true);
  dialog.fire('keydown'); await b.tick(599000); assert.equal(dialog.open, true, 'input starts the ten minutes again');
  await b.tick(2000); assert.equal(dialog.open, false); assert.doesNotMatch(textOf(dialog), /private note/);
  // After a download, ten idle minutes first leave only the reminder to delete the file, then close the view.
  await openCloseout(b); b.win.Blob = class {}; b.id('pt-closeout-download').click(); await b.tick(600000);
  assert.equal(dialog.open, true); assert.match(b.id('pt-closeout-files').textContent, /Delete them from the Downloads folder/); assert.doesNotMatch(textOf(dialog), /private note/);
  await b.tick(600000); assert.equal(dialog.open, false);
});

// 2026-10-30 UI/UX round. PG-UX-C16: before anything is written the line says where drafts stay (not "Draft saved"),
// and redrawing the same words is not announced again. PG-UX-C17: Send now looks unavailable until the check is
// ticked; the gate itself (finishSend) is unchanged. PG-UX-C32: a wrong close-out code marks the field invalid.
for (const lang of ['en', 'es']) test(`${lang}: the status line says where drafts stay until a note is written, and Send now waits for the check`, async () => {
  const shell = JSON.parse(fs.readFileSync(new URL(`../../assets/playtest/locales/${lang}.json`, import.meta.url), 'utf8'));
  const b = browser({lang});
  assert.equal(b.el('status').textContent, shell.feedback_status, 'nothing written yet: drafts stay on this device until Send');
  b.el('fix').value = 'test'; b.el('fix').fire('input'); await b.tick(2000);
  assert.notEqual(b.el('status').textContent, shell.feedback_status, 'a written note is saved as a draft');
  b.el('form').fire('submit');
  assert.equal(b.el('send').getAttribute('aria-disabled'), 'true', 'Send now looks unavailable before the grown-up check');
  b.el('confirm').checked = true; b.el('confirm').fire('change');
  assert.equal(b.el('send').getAttribute('aria-disabled'), 'false');
  b.el('confirm').checked = false; b.el('confirm').fire('change');
  b.el('send').click(); await b.tick(2000); assert.equal(b.requests.length, 0, 'the gate is unchanged: nothing is sent without the check');
});
test('a wrong close-out code marks the code field invalid until it is typed again', async () => {
  const b = browser({closeout: CODE});
  b.app.openCloseout(b.doc.createElement('button'));
  b.id('pt-closeout-code').value = 'test'; b.id('pt-closeout-ask-confirm').click(); await digestDone();
  assert.equal(b.id('pt-closeout-code').getAttribute('aria-invalid'), 'true');
  b.id('pt-closeout-code').fire('input');
  assert.equal(b.id('pt-closeout-code').getAttribute('aria-invalid'), 'false');
});
