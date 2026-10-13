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

function worker({ fetcher, putError, putWait } = {}) {
  const handlers = {}, stores = new Map(), network = [], waits = [], deleted = [];
  const key = value => typeof value === 'string' ? value : value.url;
  const caches = { keys: async () => [...stores.keys()], delete: async name => { deleted.push(name); return stores.delete(name); },
    open: async name => {
      if (!stores.has(name)) stores.set(name, new Map()); const store = stores.get(name);
      return { addAll: async urls => urls.forEach(url => store.set(url, new Response('cached'))),
        match: async (request, options) => store.get(key(request)) || (options?.ignoreSearch ? [...store].find(([url]) => url.split('?')[0] === key(request).split('?')[0])?.[1] : undefined),
        put: async (request, response) => { if (putError) throw putError; if (putWait) await putWait; if (response.status === 206) throw new TypeError("Partial responses cannot be cached"); store.set(key(request), response); } };
    } };
  const self = { location: { origin: 'https://example.test' }, registration: { scope: 'https://example.test/game/' },
    clients: { claim: async () => {} }, skipWaiting() { self.skipped = true; }, addEventListener: (name, handler) => { handlers[name] = handler; } };
  let offline = false;
  const source = fs.readFileSync(new URL('tools/sw-template.js', root), 'utf8').replace('__BUILD__', 'test').replace('__PRECACHE__', JSON.stringify(['index.html', 'espanol.html', 'assets/map.webp']));
  vm.runInNewContext(source, { self, caches, URL, Response, AbortController, setTimeout, clearTimeout,
    fetch: async (request, options) => { network.push(key(request)); if (offline) throw new Error('offline'); return fetcher ? fetcher(request, options) : new Response('fresh'); } });
  async function fetchEvent(url, options = {}) {
    let response;
    handlers.fetch({ request: { url, method: 'GET', ...options }, respondWith(value) { response = value; }, waitUntil(value) { waits.push(value); } });
    return response ? await response : undefined;
  }
  return { self, stores, network, deleted, handlers, fetchEvent, settle: () => Promise.all(waits), offline: () => { offline = true; } };
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


test('responsive image replacement cannot abort the worker-owned transfer or its offline cache', async () => {
  const client = new AbortController();
  let begin, finish;
  const started = new Promise(resolve => { begin = resolve; });
  const w = worker({ fetcher: (request, options) => new Promise((resolve, reject) => {
    const signal = options?.signal || request.signal;
    const fail = () => reject(new DOMException('Responsive image was replaced', 'AbortError'));
    if (signal.aborted) { fail(); return; }
    signal.addEventListener('abort', fail, { once: true });
    finish = () => resolve(new Response('complete image'));
    begin(signal);
  }) });
  const url = 'https://example.test/game/assets/town-map-2752.abcd.avif';
  const pending = w.fetchEvent(url, { destination: 'image', signal: client.signal });
  const transferSignal = await started;
  client.abort(); finish();
  const outcome = await pending.then(response => ({ response }), error => ({ error }));
  assert.equal(outcome.error, undefined, 'client cancellation must not reject respondWith');
  assert.equal(transferSignal.aborted, false, 'the worker owns its image transfer while the browser replaces its candidate');
  assert.equal(await outcome.response.text(), 'complete image');
  await w.settle(); w.offline();
  assert.equal(await (await w.fetchEvent(url, { destination: 'image' })).text(), 'complete image');
  assert.equal(w.network.length, 1, 'the completed image remains available without another network request');
});

test('a failed optional cache write cannot turn a valid network image into a rejected interception', async () => {
  const w = worker({ putError: new DOMException('Device storage is full', 'QuotaExceededError') });
  const response = await w.fetchEvent('https://example.test/game/assets/map.webp', { destination: 'image' });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'fresh');
  await w.settle();
});

test('partial voice responses are returned without attempting an invalid Cache.put', async () => {
  const w = worker({ fetcher: async () => new Response('partial clip', { status: 206, headers: { 'Content-Range': 'bytes 0-11/100' } }) });
  const url = 'https://example.test/game/assets/games/community-builders/voice/en/hello.mp3';
  const response = await w.fetchEvent(url, { destination: 'audio' });
  assert.equal(response.status, 206);
  assert.equal(await response.text(), 'partial clip');
  assert.equal(w.stores.get('pecan-grove-voice-en').has(url), false, 'a partial clip must not poison the full offline recording');
});

test('a genuine uncached network failure produces an explicit error response without inventing cached content', async () => {
  const w = worker(); w.offline();
  const response = await w.fetchEvent('https://example.test/game/assets/missing.webp', { destination: 'image' });
  assert.equal(response.type, 'error');
  assert.equal(response.status, 0);
  assert.equal(w.stores.get('pecan-grove-test').size, 0);
});


test('an unfinished cache body write stays in worker lifetime work without delaying the response', async () => {
  let release;
  const putWait = new Promise(resolve => { release = resolve; });
  const w = worker({ putWait });
  let answered = false;
  const pending = w.fetchEvent('https://example.test/game/assets/map.webp', { destination: 'image' }).then(response => { answered = true; return response; });
  try {
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(answered, true, 'respondWith resolves while optional cache storage is still pending');
    assert.equal(w.stores.get('pecan-grove-test').size, 0);
  } finally { release(); }
  assert.equal(await (await pending).text(), 'fresh');
  await w.settle();
  assert.equal(w.stores.get('pecan-grove-test').size, 1, 'waitUntil still finishes the offline copy');
});

test('explicit audio cancellation retains the client signal rather than using the image-transfer signal', async () => {
  const client = new AbortController();
  let begin;
  const started = new Promise(resolve => { begin = resolve; });
  const w = worker({ fetcher: (request, options) => new Promise((resolve, reject) => {
    const signal = options?.signal || request.signal;
    signal.addEventListener('abort', () => reject(new DOMException('Voice download cancelled', 'AbortError')), { once: true });
    begin(signal);
  }) });
  const url = 'https://example.test/game/assets/games/community-builders/voice/es/hello.mp3';
  const pending = w.fetchEvent(url, { destination: 'audio', signal: client.signal });
  assert.equal(await started, client.signal);
  client.abort();
  assert.equal((await pending).type, 'error');
  assert.equal(w.stores.get('pecan-grove-voice-es').size, 0);
});
