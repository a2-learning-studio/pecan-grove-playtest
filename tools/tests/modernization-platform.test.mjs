import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { JSDOM } from 'jsdom';
const require = createRequire(import.meta.url);
const { mount } = require('../../assets/playtest/shell.js');
const root = new URL('../../', import.meta.url);
const words = Object.fromEntries(['en', 'es'].map(lang => [lang,
  JSON.parse(fs.readFileSync(new URL(`assets/playtest/locales/${lang}.json`, root)))]));
function page(flavor = 'playtest') {
  const script = `import tools.make_playtest as m; print(m.page('en','',flavor='${flavor}'))`;
  const generated = spawnSync('python', ['-B', '-c', script], { cwd: root, encoding: 'utf8' });
  assert.equal(generated.status, 0, generated.stderr);
  const dom = new JSDOM(generated.stdout, { url: 'https://example.test/game/' });
  const win = dom.window;
  win.fetch = async url => ({ ok: true, json: async () => words[url.includes('/es.') ? 'es' : 'en'] });
  win.CommunityBuilders = { enterPlay() {}, suspendVoice() {} };
  return dom;
}
test('live shell language changes keep the same form and typed draft', async () => {
  const dom = page(), win = dom.window, doc = win.document;
  const shell = mount(doc, win), form = doc.getElementById('pt-feedback-form');
  doc.getElementById('pt-feedback-worked').value = 'Test draft stays';
  shell.start({ requestFullscreen: false });
  doc.documentElement.lang = 'es';
  doc.dispatchEvent(new win.CustomEvent('pg:language-change', { detail: { language: 'es', previousLanguage: 'en' } }));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(doc.getElementById('pt-review-tab').textContent, words.es.review_tab);
  assert.equal(doc.getElementById('pt-start').textContent, words.es.play);
  assert.equal(doc.querySelector('.pt-lang').getAttribute('href'), 'index.html');
  assert.equal(doc.getElementById('pt-feedback-form'), form);
  assert.equal(doc.getElementById('pt-feedback-worked').value, 'Test draft stays');
  assert.equal(doc.getElementById('pt-intro').hidden, true);
  dom.window.close();
});
test('family shell starts and exits without feedback elements or a receiver', () => {
  const dom = page('family'), doc = dom.window.document, shell = mount(doc, dom.window);
  assert.equal(doc.getElementById('pt-feedback'), null);
  assert.equal(doc.querySelector('[data-endpoint]'), null);
  shell.start(); assert.equal(doc.getElementById('pt-intro').hidden, true);
  shell.exit(); assert.equal(doc.getElementById('pt-intro').hidden, false);
  dom.window.close();
});

function worker() {
  const handlers = {}, stores = new Map(), network = [], waits = [], deleted = [];
  const key = value => typeof value === 'string' ? value : value.url;
  const caches = { keys: async () => [...stores.keys()], delete: async name => { deleted.push(name); return stores.delete(name); },
    open: async name => {
      if (!stores.has(name)) stores.set(name, new Map()); const store = stores.get(name);
      return { addAll: async urls => urls.forEach(url => store.set(url, new Response('cached'))),
        match: async (request, options) => store.get(key(request)) || (options?.ignoreSearch ? [...store].find(([url]) => url.split('?')[0] === key(request).split('?')[0])?.[1] : undefined),
        put: async (request, response) => store.set(key(request), response) };
    } };
  const self = { location: { origin: 'https://example.test' }, registration: { scope: 'https://example.test/game/' },
    clients: { claim: async () => {} }, skipWaiting() { self.skipped = true; }, addEventListener: (name, handler) => { handlers[name] = handler; } };
  let offline = false;
  const source = fs.readFileSync(new URL('tools/sw-template.js', root), 'utf8').replace('__BUILD__', 'test').replace('__PRECACHE__', JSON.stringify(['index.html', 'espanol.html', 'assets/map.webp']));
  vm.runInNewContext(source, { self, caches, URL, Response, AbortController, setTimeout, clearTimeout,
    fetch: async request => { network.push(key(request)); if (offline) throw new Error('offline'); return new Response('fresh'); } });
  async function fetchEvent(url, options = {}) {
    let response;
    handlers.fetch({ request: { url, method: 'GET', ...options }, respondWith(value) { response = value; }, waitUntil(value) { waits.push(value); } });
    return response ? await response : undefined;
  }
  return { self, stores, network, deleted, handlers, fetchEvent, offline: () => { offline = true; } };
}
test('offline worker never intercepts submissions, receivers, foreign hosts or outside scope', async () => {
  const w = worker();
  for (const [url, options] of [['https://script.google.com/macros/s/test/exec', {}], ['https://example.test/game/macros/test', {}], ['https://example.test/game/note', { method: 'POST' }], ['https://example.test/elsewhere', {}]]) {
    assert.equal(await w.fetchEvent(url, options), undefined);
  }
  assert.equal(w.network.length, 0);
});
test('offline worker caches first-party files and preserves explicit voice packs across updates', async () => {
  const w = worker();
  let installed; w.handlers.install({ waitUntil: value => { installed = value; } }); await installed;
  w.stores.set('pecan-grove-old', new Map()); w.stores.set('pecan-grove-voice-es', new Map()); w.stores.set('another-app', new Map());
  let activated; w.handlers.activate({ waitUntil: value => { activated = value; } }); await activated;
  assert.deepEqual(w.deleted, ['pecan-grove-old']);
  await w.fetchEvent('https://example.test/game/assets/stop.js');
  w.offline();
  assert.equal(await (await w.fetchEvent('https://example.test/game/assets/stop.js')).text(), 'fresh');
  assert.equal(await (await w.fetchEvent('https://example.test/game/espanol.html?resume=1', { mode: 'navigate' })).text(), 'cached');
  assert.equal(w.self.skipped, undefined);
  w.handlers.message({ data: { type: 'SKIP_WAITING' } }); assert.equal(w.self.skipped, true);
});
test('heard voice clips stay available offline in their own language cache', async () => {
  const w = worker(), url = 'https://example.test/game/assets/games/community-builders/voice/en/hello.mp3';
  await w.fetchEvent(url); w.offline();
  assert.equal(await (await w.fetchEvent(url)).text(), 'fresh');
  assert.ok(w.stores.get('pecan-grove-voice-en')?.has(url));
  assert.equal(w.network.length, 1);
});
