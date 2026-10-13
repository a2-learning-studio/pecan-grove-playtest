import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
const root = new URL('../../', import.meta.url);
const read = name => fs.readFileSync(new URL(name, root), 'utf8');
const settle = async () => { for (let i=0;i<50;i++) await Promise.resolve(); };
function setup() {
  const dom = new JSDOM('<!doctype html><html lang="en"><body><nav class="pt-toolbar"></nav><section id="packs"></section></body></html>', {url:'https://game.test/',runScripts:'outside-only'});
  const w = dom.window, requests = [], deleted = [], stored = new Map();
  w.PGShellLocale = Object.fromEntries(['en','es'].map(lang=>[lang,JSON.parse(read(`assets/playtest/locales/${lang}.json`))]));
  w.fetch = async url => {
    requests.push(String(url));
    if (String(url).endsWith('pack.json')) return {ok:true,json:async()=>({lang:String(url).includes('/es/')?'es':'en',files:[{file:'first.mp3',bytes:1048576},{file:'second.mp3',bytes:1048576}]})};
    return {ok:true};
  };
  w.caches = {open:async()=>({match:async url=>stored.get(url),put:async(url,value)=>stored.set(url,value)}),delete:async key=>{deleted.push(key);stored.clear();return true;}};
  vm.runInContext(read('assets/playtest/pwa.js').replace(/^import .*;$/m,''), dom.getInternalVMContext());
  return {dom,w,requests,stored,deleted,container:w.document.getElementById('packs')};
}
test('voice sizes are shown before consent and no MP3 is fetched until Download is chosen', async()=>{
  const h=setup(); await h.w.PecanGroveOffline.openVoicePacks(h.container); await settle();
  assert.equal(h.requests.length,2); assert.ok(h.requests.every(url=>url.endsWith('pack.json')));
  assert.match(h.container.textContent,/English: 2.0 MB/); assert.match(h.container.textContent,/Español: 2.0 MB/);
  h.container.querySelector('button').click(); await settle();
  assert.equal(h.requests.filter(url=>url.endsWith('.mp3')).length,2);
  assert.match(h.container.textContent,/English is ready offline/);
  h.container.querySelectorAll('section button')[3].click(); await settle();
  assert.deepEqual(h.deleted,['pecan-grove-voice-en']); h.dom.window.close();
});
test('live language switching translates offline controls without rebuilding or losing download progress', async()=>{
  const h=setup(); await h.w.PecanGroveOffline.openVoicePacks(h.container); await settle();
  const section=h.container.querySelector('section'), progress=section.querySelector('progress');
  progress.value=1; progress.max=2;
  h.w.document.documentElement.lang='es'; h.w.document.dispatchEvent(new h.w.CustomEvent('pg:language-change',{detail:{language:'es'}}));
  assert.match(h.container.textContent,/Descargar English/); assert.match(h.container.textContent,/un adulto/);
  assert.equal(h.container.querySelector('section'),section); assert.equal(progress.value,1);
  assert.equal(h.requests.length,2); h.dom.window.close();
});
