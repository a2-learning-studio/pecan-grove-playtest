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
function browser({lang = 'en', store = storage(), failure = false, autoMount = true, closeout = false} = {}) {
  const nodes = [];
  const doc = new Node(); doc.body = new Node('body'); doc.visibilityState = 'visible';
  doc.createElement = tag => { const n = new Node(tag); n.document = doc; nodes.push(n); return n; };
  // Re-rendered panels create a fresh node per id; like a real document, return the current one.
  doc.getElementById = name => nodes.findLast(n => n.id === name) || null;
  doc.querySelector = () => null;
  doc.querySelectorAll = () => nodes.filter(n => n.getAttribute('data-pg-consent'));
  doc.dispatchEvent = event => doc.fire(event.type, event.detail);
  function add(name, tag = 'div') { const n = doc.createElement(tag); n.id = name; return n; }
  const panel = add('pt-feedback'); panel.dataset = {lang, build: 'privacy-test', endpoint};
  const queries = new Map(); panel.querySelector = selector => queries.get(selector) || null;
  const game = add('community-builders'); game.dataset.currentStop = '0';
  const form = add('pt-feedback-form', 'form'); panel.appendChild(form);
  for (const name of ['stop','rating','category','worked','fix','status','entries','context','player','new-player','new-player-top','download','device','submit']) form.appendChild(add('pt-feedback-' + name));
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
  win.location = {href: 'https://game.test/index.html' + (closeout ? '?closeout=1' : ''), reload() { win.reloads = (win.reloads || 0) + 1; }};
  win.history = {state: null, replaceState(state, title, url) { win.location.href = url; }};
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
test('auto score option needs both switches; new player resets consent and hides prior drafts', async () => {
 const b=browser(); b.app.setConsent({scores:false,autoScores:true}); assert.equal(b.app.getConsent().autoScores,false);
 b.app.setConsent({scores:true,autoScores:true}); b.doc.fire('cb:screen',{stopN:5,phase:'result',score:88}); await b.tick(0); assert.equal(b.requests.length,1); assert.ok(b.requests[0].body.entries.every(e=>e.kind==='progress'));
 b.el('fix').value='previous player'; b.el('new-player').click(); const next=browser({store:b.store}); assert.equal(next.app.getConsent().scores,false); assert.equal(next.app.getConsent().autoScores,false); assert.equal(next.app.model.entries().some(e=>e.fix==='previous player'),false); assert.ok(next.app.model.entries(true).some(e=>e.fix==='previous player'));
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
  ['es','me llamo maría de la cruz y tengo 9 años','me llamo [quitado] y tengo [quitado]']
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
  ['es','Me llamo mucho la atención'], ['es','soy feliz con el mapa']
];
for (const [lang, input] of ordinary) test(`ordinary ${lang} sentence stays intact: ${input}`, () => assert.equal(api.scrubPII(input, lang), input));
test('every contact and child sample is unchanged by a second scrub', () => {
  for (const [lang, input] of [...samples, ...childSamples]) { const once = api.scrubPII(input, lang); assert.equal(api.scrubPII(once, lang), once, input); }
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
test('after a reload an unconfirmed note says it has not reached the team, nothing retries by itself, and the next player sees earlier notes are waiting', async () => {
  const b = browser({failure: true}); b.el('fix').value = 'stranded'; b.el('form').fire('submit'); approve(b); await settle(); b.win.fire('pagehide');
  const next = browser({store: b.store}); await next.tick(600000);
  assert.equal(next.requests.length, 0); assert.match(next.el('status').textContent, /has not reached the playtest team yet/);
  let warned = ''; next.win.confirm = message => { warned = message; return true; }; next.el('new-player').click();
  assert.match(warned, /has not received: 1/);
  const after = browser({store: b.store}); assert.match(after.el('status').textContent, /Notes from earlier players on this device have not been sent/);
  assert.equal(after.requests.length, 0);
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
    ['en', 'i am in 4th grade at lincoln elementary', ['lincoln elementary']], ['en', 'my snap is mayal22', ['mayal22']], ['es', 'mi tiktok es lucia_baila', ['lucia_baila']]
  ]) assert.deepEqual(api.privacyFlags(api.scrubPII(input, lang)), flags, input);
  for (const [lang, input] of [['en', "I'm Ana from the game"], ['en', 'I am so happy'], ['en', 'Grandma Ruth was kind'], ['es', 'soy feliz'], ['en', 'This is Stop 3'], ['en', 'Thanks for the game!'],
    ['es', 'La abuela Ruth me ayudó'], ['en', 'my insta is not working'], ['en', 'the elementary kids liked it'], ['es', 'Gracias por el juego'], ['en', 'I am the Fox']]) assert.deepEqual(api.privacyFlags(api.scrubPII(input, lang)), [], input);
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
  const b = browser(); b.el('fix').value = 'first player note with sam@example.com'; b.app.flush(); b.el('new-player').click();
  const c = browser({store: b.store}); c.el('worked').value = 'second player note'; c.app.flush();
  assert.equal(c.id('pt-player-back'), null, 'no button brings back the last player');
  c.el('device').click();
  const dialog = c.id('pt-device-dialog'); assert.equal(dialog.open, true); assert.equal(c.doc.activeElement, c.id('pt-device-title'));
  const notice = textOf(c.id('pt-device-privacy'));
  for (const fact of [/akeyvanf@kennesaw\.edu/, /Google Apps Script/, /nothing leaves this device until a grown-up reviews a note/, /random codes/, /when it started and last changed, and whether it has ended/, /eight most recent players/, /Erase all Pecan Grove data on this device/]) assert.match(notice, fact);
  assert.match(textOf(dialog), /Players: 2\. Notes: 2\. Not received by the playtest team: 2\./);
  assert.match(textOf(dialog), /only counts them.*close-out view/);
  assert.doesNotMatch(textOf(dialog), /first player note|second player note|sam@example\.com/);
  for (const id of ['pt-device-show', 'pt-device-notes', 'pt-device-confirm', 'pt-device-send', 'pt-device-download']) assert.equal(c.id(id), null, id);
  const status = c.id('pt-device-status');
  c.id('pt-device-erase').click(); assert.equal(c.doc.activeElement, c.id('pt-device-erase-no'));
  assert.equal(c.id('pt-device-status'), status, 'the polite status region is never replaced');
  assert.match(c.id('pt-device-erase-message').textContent, /Notes not received by the playtest team: 2\. Erasing deletes them\. .*download them first in the close-out view/);
  c.id('pt-device-erase-yes').click();
  assert.equal(c.win.reloads, 1); assert.equal([...c.store.data.keys()].some(key => key.startsWith('pecan-grove')), false);
  c.win.fire('pagehide'); c.doc.visibilityState = 'hidden'; c.doc.fire('visibilitychange');
  assert.equal([...c.store.data.keys()].some(key => key.startsWith('pecan-grove')), false, 'the closing page does not write notes back');
  assert.equal(c.requests.length, 0);
});
test('the close-out view opens only from ?closeout=1 after a grown-up confirms, and that confirmation is asked once', () => {
  const plain = browser(); assert.equal(plain.id('pt-closeout-ask'), null); assert.equal(plain.id('pt-closeout-dialog'), null);
  const b = browser({closeout: true}), ask = b.id('pt-closeout-ask');
  assert.equal(ask.open, true); assert.equal(b.doc.activeElement, b.id('pt-closeout-ask-cancel')); assert.equal(b.id('pt-closeout-dialog'), null);
  assert.match(textOf(ask), /only for the grown-up running the play-test/);
  b.id('pt-closeout-ask-cancel').click();
  assert.equal(ask.open, false); assert.equal(b.id('pt-closeout-dialog'), null); assert.equal(b.win.location.href, 'https://game.test/index.html');
  const e = browser({closeout: true, lang: 'es'}); assert.equal(e.id('pt-closeout-ask-confirm').textContent, 'Soy el adulto que dirige la prueba');
  const escape = e.id('pt-closeout-ask').fire('cancel'); assert.ok(escape); assert.equal(e.id('pt-closeout-ask').open, false); assert.equal(e.id('pt-closeout-dialog'), null);
});
test('close-out: a grown-up reads every player\'s notes, one check sends them, focus stays in the dialog, and Excel covers every player', async () => {
  const b = browser(); b.el('fix').value = 'first player note with sam@example.com'; b.app.flush(); b.el('new-player').click();
  const c = browser({store: b.store, closeout: true}); c.el('worked').value = 'second player note'; c.app.flush();
  c.id('pt-closeout-ask-confirm').click();
  const dialog = c.id('pt-closeout-dialog'); assert.equal(dialog.open, true); assert.equal(c.doc.activeElement, c.id('pt-closeout-title'));
  assert.equal(c.win.location.href, 'https://game.test/index.html', 'the address switch is used once');
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
  assert.ok(saved.includes(Buffer.from('first player note'))); assert.ok(saved.includes(Buffer.from('second player note')));
  c.id('pt-closeout-close').click(); assert.equal(dialog.open, false);
});
test('close-out with two tabs: a note written in another tab after the list was shown is never sent without being read', async () => {
  const b = browser(); b.el('fix').value = 'read note'; b.app.flush();
  const c = browser({store: b.store, closeout: true}); c.id('pt-closeout-ask-confirm').click();
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
test('Next player shows no way back to a child; the close-out view brings back a player chosen by mistake', () => {
  const b = browser(), first = b.app.model.active(); b.el('fix').value = 'first player draft'; b.el('new-player').click();
  const c = browser({store: b.store}), second = c.app.model.active();
  assert.equal(c.id('pt-player-back'), null); assert.match(c.id('pt-player-ready').textContent, /next player is ready/);
  assert.equal(textOf(c.panel).includes('Go back to the last player'), false);
  c.el('worked').value = 'second player typed'; c.el('worked').fire('input'); c.app.flush(); assert.equal(c.id('pt-player-ready').parentNode.children.includes(c.id('pt-player-ready')), false, 'typing removes the ready line');
  const d = browser({store: b.store, closeout: true}); d.id('pt-closeout-ask-confirm').click();
  assert.match(textOf(d.id('pt-closeout-body')), /Bring back a player/);
  const bring = d.allNodes().findLast(n => n.tagName === 'BUTTON' && n.textContent.startsWith('Bring back player ' + first.slice(-6).toUpperCase() + ' (last saved '));
  assert.ok(bring, 'every earlier player can be brought back');
  bring.click(); assert.equal(d.win.reloads, 1); assert.equal(d.win.location.href, 'https://game.test/index.html');
  const e = browser({store: b.store}); assert.equal(e.app.model.active(), first); assert.equal(e.el('fix').value, 'first player draft');
  assert.equal(e.app.getConsent().scores, false);
  assert.ok(e.app.model.entries(true).some(x => x.sessionId === second && x.kind === 'session' && x.sessionEnded), 'the player who was playing stays saved and ends');
  assert.ok(e.app.model.entries(true).some(x => x.sessionId === second && x.worked === 'second player typed'));
});
