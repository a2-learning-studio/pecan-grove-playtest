import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = process.env.PECAN_SOURCE_ROOT || fileURLToPath(new URL('../../', import.meta.url));
const source = fs.readFileSync(path.join(root, 'assets/playtest/feedback.js'), 'utf8');
const context = vm.createContext({ module: { exports: {} }, require: createRequire(path.join(root, 'assets/playtest/feedback.js')), TextEncoder, Uint8Array, DataView, Date, Map, Number, JSON, Math });
vm.runInContext(source, context);
const api = context.module.exports;
const endpoint = 'https://script.google.com/macros/s/deployed-test-id/exec';
const plain = value => JSON.parse(JSON.stringify(value));

function storage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return { data, blocked: false, get length() { return data.size; }, key(i) { return [...data.keys()][i] ?? null; }, getItem(k) { if (this.blocked) throw Error('denied'); return data.get(k) ?? null; },
    setItem(k, v) { if (this.blocked) throw Error('quota'); data.set(k, String(v)); },
    removeItem(k) { if (this.blocked) throw Error('denied'); data.delete(k); } };
}
let serial = 0;
function model(store = storage()) {
  let clock = 0;
  return api.createModel({ storage: store, language: 'en', build: 'test-build',
    id: () => `anonymous-${String(++serial).padStart(20, '0')}`,
    now: () => new Date(Date.UTC(2026, 9, 12, 12, 0, 0, ++clock)).toISOString() });
}
function comment(m, stop = 1, text = 'The directions helped') { return m.upsert('feedback', stop, { worked: text }); }
function submittedComment(m, stop = 1, text = 'The directions helped') { const entry = comment(m, stop, text); m.submit(entry.entryId, false); return entry; }
function acknowledgeBody(options, mutate) {
  const body = JSON.parse(options.body); if (mutate) mutate(body);
  return { ok: true, json: async () => ({ ok: true, schemaVersion: 1,
    acknowledged: body.entries.map(e => ({ sessionId: e.sessionId, entryId: e.entryId, revision: e.revision })) }) };
}
function unzip(data) {
  const buffer = Buffer.from(data), files = new Map(); let offset = 0;
  while (buffer.readUInt32LE(offset) === 0x04034b50) {
    assert.equal(buffer.readUInt16LE(offset + 8), 0, 'stored ZIP member');
    const size = buffer.readUInt32LE(offset + 18), nameSize = buffer.readUInt16LE(offset + 26), extraSize = buffer.readUInt16LE(offset + 28);
    const name = buffer.subarray(offset + 30, offset + 30 + nameSize).toString('utf8');
    const start = offset + 30 + nameSize + extraSize, content = buffer.subarray(start, start + size);
    let crc = 0xffffffff;
    for (const byte of content) { crc ^= byte; for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
    assert.equal((crc ^ 0xffffffff) >>> 0, buffer.readUInt32LE(offset + 14), `CRC ${name}`);
    files.set(name, content.toString('utf8')); offset = start + size;
  }
  assert.equal(buffer.readUInt32LE(offset), 0x02014b50, 'central directory present');
  assert.equal(buffer.readUInt32LE(buffer.length - 22), 0x06054b50, 'ZIP end present');
  assert.equal(buffer.readUInt16LE(buffer.length - 12), files.size, 'member count agrees');
  return files;
}

test('A draft persists across reload and keeps anonymous session/station identifiers', () => {
  const store = storage(), m = model(store); comment(m, 5, 'Spanish ñ and a question');
  const loaded = model(store);
  assert.equal(loaded.active(), m.active()); assert.equal(loaded.find('feedback', 5).worked, 'Spanish ñ and a question');
  assert.equal(loaded.entries()[0].stationId, m.entries()[0].stationId); assert.equal(loaded.fresh, false);
});
test('Different stops keep independent drafts and edits increment revisions only on actual changes', () => {
  const m = model(); const first = comment(m, 1, 'one'); comment(m, 2, 'two');
  assert.equal(comment(m, 1, 'one').revision, first.revision);
  assert.equal(comment(m, 1, 'updated').revision, first.revision + 1);
  assert.equal(m.find('feedback', 2).worked, 'two');
});
test('Clearing a previous answer is saved as a revision rather than reviving old text', () => {
  const m = model(); comment(m); const e = comment(m, 1, '');
  assert.equal(e.worked, ''); assert.equal(e.revision, 2);
});
test('Text length and control characters are constrained; valid multilingual text survives', () => {
  const m = model(); const e = comment(m, 1, '\0Hola\u000b\u007f\t\nñ\uD83D\uDE42' + 'a'.repeat(1300));
  assert.equal(e.worked.length, 1200); assert.doesNotMatch(e.worked, /[\0\u000b\u007f]/); assert.match(e.worked, /Hola\t\nñ\uD83D\uDE42/);
});
test('New player hides prior comments, keeps the earlier outbox and gives the next player a new device code', () => {
  const store = storage(), m = model(store), firstSession = m.active(); const e = comment(m, 3, 'private previous comment');
  assert.ok(m.rotate()); assert.notEqual(m.active(), firstSession);
  assert.equal(m.entries().some(x => x.worked.includes('previous')), false);
  assert.equal(m.entries(true).some(x => x.entryId === e.entryId), true);
  assert.notEqual(m.entries().at(-1).stationId, e.stationId, 'no field links two players on one computer');
  assert.equal(m.entries(true).find(x => x.entryId === e.entryId).stationId, e.stationId);
  const loaded = model(store); assert.equal(loaded.active(), m.active()); assert.ok(loaded.entries(true).some(x => x.entryId === e.entryId));
});
test('Blocked/quota storage keeps draft in memory and prevents destructive player rotation', () => {
  const store = storage(), m = model(store); comment(m); const active = m.active(); store.blocked = true; comment(m, 2, 'unsaved text');
  assert.equal(m.warning(), 'storage'); assert.equal(m.rotate(), null); assert.equal(m.active(), active);
  assert.equal(m.find('feedback', 2).worked, 'unsaved text');
});
test('Malformed saved state is retained in recovery storage with a visible recovery flag', () => {
  const broken = '{"schemaVersion":1,"entries":[', store = storage({ [api.KEY]: broken });
  const m = model(store); comment(m);
  assert.equal(store.getItem(api.KEY + '-recovery'), broken); assert.equal(m.recovery, true);
  assert.equal(model(store).recovery, true); assert.notEqual(store.getItem(api.KEY), broken);
});
test('Partially invalid saved state is not silently discarded without retaining original', () => {
  const store = storage(), m = model(store); comment(m); const state = JSON.parse(store.getItem(api.KEY)); state.entries.push({ invalid: true });
  const broken = JSON.stringify(state); store.setItem(api.KEY, broken); const loaded = model(store); comment(loaded, 2);
  assert.equal(store.getItem(api.KEY + '-recovery'), broken); assert.equal(loaded.recovery, true);
});
test('One unrecognised entry keeps the player, the game save key and the other notes, with a recovery copy', () => {
  const store = storage(), m = model(store); comment(m, 2, 'keep me'); const session = m.active();
  const state = JSON.parse(store.getItem(api.KEY)); state.entries.push({ ...state.entries[0], entryId: 'from-a-newer-version-0001', category: 'newer-category' });
  const raw = JSON.stringify(state); store.setItem(api.KEY, raw);
  const b = browser({ store });
  assert.equal(b.app.model.active(), session); assert.equal(b.game.dataset.feedbackSession, session);
  assert.equal(b.app.model.find('feedback', 2).worked, 'keep me'); assert.equal(b.app.model.warning(), '');
  assert.equal(store.getItem(api.KEY + '-recovery'), raw); assert.equal(b.app.model.recovery, true);
  assert.equal(model(store).active(), session);
});
test('A later corrupt snapshot is preserved separately instead of replacing or discarding earlier recovery data', () => {
  const store = storage({ [api.KEY]: '{second broken', [api.KEY + '-recovery']: '{first broken' }); const m = model(store); comment(m);
  assert.equal(store.getItem(api.KEY + '-recovery'), '{first broken');
  assert.ok([...store.data].some(([key, value]) => key.startsWith(api.KEY + '-recovery-') && value === '{second broken'));
  assert.equal(m.recovery, true);
});
test('Unwritable recovery storage leaves original corrupt state intact and blocks rotation', () => {
  const store = storage({ [api.KEY]: '{broken' }); const originalSet = store.setItem;
  store.setItem = function(k, v) { if (k.endsWith('-recovery')) throw Error('quota'); return originalSet.call(this, k, v); };
  const m = model(store); comment(m);
  assert.equal(store.getItem(api.KEY), '{broken'); assert.equal(m.warning(), 'storage'); assert.equal(m.rotate(), null);
});
test('Two tabs preserve independent stop drafts and read latest revision before editing', () => {
  const store = storage(), a = model(store); comment(a, 1, 'initial'); const b = model(store);
  comment(a, 1, 'tab A'); comment(b, 2, 'tab B'); comment(b, 1, 'newest');
  const loaded = model(store); assert.equal(loaded.find('feedback', 1).revision, 3);
  assert.equal(loaded.find('feedback', 1).worked, 'newest'); assert.equal(loaded.find('feedback', 2).worked, 'tab B');
});
test('Stale tab cannot overwrite session or reassign old notes after another tab starts new player', () => {
  const store = storage(), a = model(store); comment(a); const b = model(store); const old = a.active(); b.rotate();
  const next = b.active(); assert.notEqual(next, old); assert.equal(comment(a, 2, 'stale player text'), null);
  assert.equal(a.changedSession(), true); assert.equal(a.rotate(), null);
  const loaded = model(store); assert.equal(loaded.active(), next); assert.equal(loaded.entries().some(e => e.worked === 'stale player text'), false);
});
test('A stale player can archive final text under the old session without switching the shared active session', () => {
  const store = storage(), a = model(store); comment(a); const old = a.active(), b = model(store); b.rotate(); const next = b.active();
  a.stash('feedback', 2, { fix: 'old player final keystrokes' }); assert.equal(a.archive(), true);
  const loaded = model(store); assert.equal(loaded.active(), next);
  assert.equal(loaded.entries().some(e => e.fix === 'old player final keystrokes'), false);
  assert.ok(loaded.entries(true).some(e => e.sessionId === old && e.fix === 'old player final keystrokes'));
});
test('Unconfigured and non-Apps-Script endpoints are rejected before network access', async () => {
  for (const url of ['', 'http://script.google.com/macros/s/x/exec', 'https://evil.example/exec', 'https://script.google.com.evil.example/macros/s/x/exec', endpoint + '?secret=abc']) {
    assert.equal(api.endpointAllowed(url), false); await assert.rejects(api.sendBatch(model(), url, () => { throw Error('must not fetch'); }));
  }
  assert.equal(api.endpointAllowed(endpoint), true);
});
test('Cloud transport uses readable CORS plain-text POST, no credentials, and only acknowledged entries leave queue', async () => {
  const m = model(); submittedComment(m); let wire;
  assert.equal(await api.sendBatch(m, endpoint, async (url, options) => { wire = options; return acknowledgeBody(options); }), 1);
  assert.equal(wire.mode, 'cors'); assert.equal(wire.credentials, 'omit'); assert.equal(wire.redirect, 'follow');
  assert.equal(wire.headers['Content-Type'], 'text/plain;charset=UTF-8'); assert.equal(m.pending().length, 0);
  const body = JSON.parse(wire.body); assert.equal(body.schemaVersion, 1); assert.ok(body.entries[0].stationId);
  assert.equal(Object.hasOwn(body.entries[0], 'ackRevision'), false);
});
test('Offline, HTTP error, unreadable CORS JSON and false/empty acknowledgments never lose queued text', async () => {
  const failures = [async () => { throw Error('offline'); }, async () => ({ ok: false }), async () => ({ ok: true, json: async () => { throw Error('CORS'); } }),
    async () => ({ ok: true, json: async () => ({ ok: false, schemaVersion: 1, acknowledged: [] }) }),
    async () => ({ ok: true, json: async () => ({ ok: true, schemaVersion: 1, acknowledged: [] }) })];
  for (const fetcher of failures) { const m = model(); submittedComment(m, 4, 'retain this'); await assert.rejects(api.sendBatch(m, endpoint, fetcher)); assert.equal(m.pending().length, 1); assert.equal(m.pending()[0].worked, 'retain this'); }
});
test('A revision N response cannot mark newer revision N+1 as backed up', async () => {
  const m = model(); submittedComment(m, 1, 'old');
  await api.sendBatch(m, endpoint, async (url, options) => acknowledgeBody(options, () => comment(m, 1, 'new unsent')));
  assert.equal(m.pending().length, 0); assert.equal(m.find('feedback', 1).worked, 'new unsent'); assert.equal(m.find('feedback', 1).revision, 2); assert.equal(m.find('feedback', 1).ackRevision, 0);
});
test('A server revision greater than the sent revision is not proof of matching content', async () => {
  const m = model(); submittedComment(m);
  await assert.rejects(api.sendBatch(m, endpoint, async (url, options) => { const e = JSON.parse(options.body).entries[0]; return { ok: true, json: async () => ({ ok: true, schemaVersion: 1, acknowledged: [{ ...e, revision: e.revision + 1 }] }) }; }));
  assert.equal(m.pending().length, 1);
});
test('An equal-revision response never acknowledges a different draft merged while request was in flight', async () => {
  const store = storage(), m = model(store); submittedComment(m, 1, 'payload A');
  await api.sendBatch(m, endpoint, async (url, options) => acknowledgeBody(options, () => {
    const state = JSON.parse(store.getItem(api.KEY)); state.entries[0].worked = 'payload B'; state.entries[0].updatedAt = '2026-10-12T12:01:00.000Z'; store.setItem(api.KEY, JSON.stringify(state)); m.persist();
  }));
  assert.equal(m.find('feedback', 1).worked, 'payload B'); assert.equal(m.pending().length, 1);
  assert.equal(m.find('feedback', 1).ackRevision, 0);
});
test('Merging equal revision/different content never copies another payload acknowledgment', () => {
  const m = model(), e = plain(comment(m, 1, 'A'));
  const a = { ...e, ackRevision: 1 }, b = { ...e, worked: 'B', updatedAt: '2026-10-12T12:01:00.000Z', ackRevision: 0 };
  const merged = api.mergeEntries([a], [b]); assert.equal(merged[0].worked, 'B'); assert.equal(merged[0].ackRevision, 0);
});
test('Server conflicts bump current draft beyond server revision for safe retry', async () => {
  const m = model(); submittedComment(m, 1, 'correct latest');
  await api.sendBatch(m, endpoint, async (url, options) => { const e = JSON.parse(options.body).entries[0]; return { ok: true, json: async () => ({ ok: true, schemaVersion: 1, acknowledged: [], conflicts: [{ sessionId: e.sessionId, entryId: e.entryId, revision: 4 }] }) }; });
  assert.equal(m.pending()[0].revision, 5); assert.equal(m.pending()[0].worked, 'correct latest');
  await api.sendBatch(m, endpoint, async (url, options) => acknowledgeBody(options)); assert.equal(m.pending().length, 0);
});
test('Conflict resolution merges latest disk text before bumping instead of restoring stale text', () => {
  const store = storage(), a = model(store); const e = comment(a, 1, 'old'); const b = model(store); comment(b, 1, 'newest on disk');
  a.resolveConflicts([{ sessionId: e.sessionId, entryId: e.entryId, revision: 2 }]);
  assert.equal(a.find('feedback', 1).worked, 'newest on disk'); assert.equal(a.find('feedback', 1).revision, 3);
});
test('Long Unicode drafts are packed by UTF-8 bytes below backend limit and all eventually sync', async () => {
  const m = model(); for (let i = 0; i < 16; i++) { comment(m, i, '界'.repeat(1200)); const e = m.upsert('feedback', i, { fix: '\uD83D\uDE42'.repeat(600) }); m.submit(e.entryId, false); }
  let calls = 0; while (m.pending().length) {
    await api.sendBatch(m, endpoint, async (url, options) => { calls++; assert.ok(Buffer.byteLength(options.body, 'utf8') <= 58000); assert.ok(JSON.parse(options.body).entries.length <= 20); return acknowledgeBody(options); });
    assert.ok(calls < 30);
  }
  assert.ok(calls > 1);
});
test('Unknown acknowledgments cannot empty queue', async () => {
  const m = model(); submittedComment(m);
  await assert.rejects(api.sendBatch(m, endpoint, async () => ({ ok: true, json: async () => ({ ok: true, schemaVersion: 1, acknowledged: [{ sessionId: 'unknown-000000000000', entryId: 'unknown-000000000000', revision: 1 }] }) })));
  assert.equal(m.pending().length, 1);
});
test('Excel is a CRC-valid OOXML ZIP with typed numbers, multilingual text, frozen header and filter', () => {
  const m = model(); comment(m, 7, 'La voz ayudó ñ 界 \uD83D\uDE42'); m.upsert('progress', 7, { score: 85, phase: 'result' });
  const files = unzip(api.excel(m.entries())); assert.equal(files.size, 5);
  assert.match(files.get('[Content_Types].xml'), /spreadsheetml\.sheet\.main/);
  const sheet = files.get('xl/worksheets/sheet1.xml'); assert.match(sheet, /La voz ayudó ñ 界 \uD83D\uDE42/);
  assert.match(sheet, /<c r="A1" t="inlineStr"><is><t xml:space="preserve">Check before sharing\./);
  assert.match(sheet, /<c r="D3"><v>7<\/v><\/c>/); assert.match(sheet, /<c r="N4"><v>85<\/v><\/c>/);
  assert.match(sheet, /<pane ySplit="2" topLeftCell="A3"[^>]*state="frozen"/); assert.match(sheet, /autoFilter ref="A2:R4"/);
});
test('Excel comment cells always remain strings even with formula-like malicious input', () => {
  const m = model(); comment(m, 1, '=HYPERLINK("evil","click") & <svg>\0'); m.upsert('feedback', 1, { fix: '+SUM(1,2) @danger -1' });
  const sheet = unzip(api.excel(m.entries())).get('xl/worksheets/sheet1.xml');
  assert.match(sheet, /<c r="L3" t="inlineStr">/); assert.match(sheet, /<c r="M3" t="inlineStr">/);
  assert.match(sheet, /=HYPERLINK\(&quot;evil&quot;,&quot;click&quot;\) &amp; &lt;svg&gt;/); assert.doesNotMatch(sheet, /<f[ >]|\0/);
});
test('Every Excel note has the same scrub as a sent note, under a check-before-sharing row in the page language', () => {
  const m = model(); comment(m, 2, 'hi im maya lopez, call 404 555 0199 or maya.l@gmail.com'); m.upsert('feedback', 3, { worked: 'Me llamo Sofía y tengo 9 años', language: 'es' });
  const sheet = unzip(api.excel(m.entries(), api.WORDS.es.excelCheck)).get('xl/worksheets/sheet1.xml');
  assert.match(sheet, /<c r="A1" t="inlineStr"><is><t xml:space="preserve">Revisa antes de compartir\./);
  assert.doesNotMatch(sheet, /404 555 0199|maya\.l@gmail\.com|Sofía|9 años/);
  assert.match(sheet, /hi im maya lopez, call \[removed\] or \[removed\]/); assert.match(sheet, /Me llamo \[quitado\] y tengo \[quitado\]/);
  assert.equal(m.find('feedback', 2).worked, 'hi im maya lopez, call 404 555 0199 or maya.l@gmail.com', 'the saved draft itself is unchanged');
});
test('Current player Excel omits all previous player comments but keeps current player rows', () => {
  const m = model(); comment(m, 2, 'previous-child-secret'); m.rotate(); comment(m, 2, 'current-child-comment');
  const sheet = unzip(api.excel(m.entries())).get('xl/worksheets/sheet1.xml');
  assert.doesNotMatch(sheet, /previous-child-secret/); assert.match(sheet, /current-child-comment/);
});

class Element {
  constructor(id = '') { this.id = id; this.dataset = {}; this.children = []; this.listeners = new Map(); this.value = ''; this.textContent = ''; }
  setAttribute(k, v) { if (k.startsWith('data-')) this.dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(v); else this[k] = String(v); }
  getAttribute(k) { return k.startsWith('data-') ? this.dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] ?? null : this[k] ?? null; }
  addEventListener(type, fn) { const handlers = this.listeners.get(type) || []; handlers.push(fn); this.listeners.set(type, handlers); }
  fire(type, detail) { const event = { detail, currentTarget: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } }; for (const fn of this.listeners.get(type) || []) fn(event); return event; }
  get firstChild() { return this.children[0]; }
  get childNodes() { return this.children; }
  get parentNode() { return this.parent; }
  appendChild(node) { if (node.parent) node.parent.removeChild(node); this.children.push(node); node.parent = this; return node; }
  insertBefore(node, ref) { if (node.parent) node.parent.removeChild(node); const at = this.children.indexOf(ref); this.children.splice(at < 0 ? this.children.length : at, 0, node); node.parent = this; return node; }
  removeChild(node) { const at = this.children.indexOf(node); if (at >= 0) this.children.splice(at, 1); node.parent = null; }
  remove() { if (this.parent) this.parent.removeChild(this); }
  click() { this.clicked = true; this.fire('click'); }
  focus() { this.focused = true; if (this.ownerDocument) this.ownerDocument.activeElement = this; }
  showModal() { this.open = true; }
  close() { this.open = false; this.fire('close'); }
}
function browser({ store = storage(), lang = 'en', backup = '', initialStop = 0, dialog = false, introPaused = false, reviewModal = false } = {}) {
  const names = ['form', 'stop', 'rating', 'category', 'worked', 'fix', 'status', 'entries', 'context', 'player', 'new-player', 'new-player-top', 'download'];
  const nodes = new Map(names.map(name => [`pt-feedback-${name}`, new Element(`pt-feedback-${name}`)]));
  const panel = new Element('pt-feedback'); panel.dataset = { lang, build: 'test-build', endpoint: backup }; nodes.set(panel.id, panel);
  const game = new Element('community-builders'); game.dataset.currentStop = String(initialStop); nodes.set(game.id, game);
  game.setAttribute('data-playtest-paused', String(introPaused));
  if (dialog) for (const name of ['dialog', 'title', 'message', 'cancel', 'confirm']) nodes.set('pt-new-player-' + name, new Element('pt-new-player-' + name));
  const doc = new Element(); doc.body = new Element(); doc.getElementById = id => nodes.get(id); doc.createElement = () => new Element(); doc.visibilityState = 'visible';
  for (const node of nodes.values()) node.ownerDocument = doc;
  doc.querySelector = () => reviewModal ? new Element('pt-review-dialog') : null;
  const win = new Element(); win.localStorage = store; win.crypto = { randomUUID: () => `browser-${String(++serial).padStart(22, '0')}` };
  const timers = new Map(); let timerId = 0; win.setTimeout = (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId; }; win.clearTimeout = id => timers.delete(id);
  win.location = { reloads: 0, reload() { this.reloads++; } }; win.confirmCalls = 0; win.confirm = () => { win.confirmCalls++; return true; }; win.AbortController = AbortController;
  const voicePauses = []; win.CommunityBuilders = { suspendVoice(value) { voicePauses.push(value); } };
  win.fetch = async (url, options) => acknowledgeBody(options); win.Blob = Blob; win.URL = { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} };
  const app = api.mount(doc, win);
  return { app, doc, win, nodes, store, game, timers, voicePauses, field: name => nodes.get(`pt-feedback-${name}`), newPlayer: name => nodes.get('pt-new-player-' + name),
    run(ms) { for (const [id, item] of [...timers]) if (item.ms === ms) { timers.delete(id); item.fn(); } } };
}
test('The form autosaves typed text and game stop changes restore the correct independent draft', () => {
  const b = browser({ initialStop: 3 }); assert.equal(b.field('stop').value, '3');
  b.field('worked').value = 'Stop three notes'; b.field('worked').fire('input'); b.run(350);
  assert.equal(b.app.model.find('feedback', 3).worked, 'Stop three notes');
  b.doc.fire('cb:screen', { stopN: 4, phase: 'playing' }); assert.equal(b.field('worked').value, '');
  b.field('fix').value = 'Stop four fix'; b.field('fix').fire('change'); b.doc.fire('cb:screen', { stopN: 3, phase: 'playing' });
  assert.equal(b.field('worked').value, 'Stop three notes'); assert.equal(b.app.model.find('feedback', 4).fix, 'Stop four fix');
});
test('Feedback establishes session-specific game storage before engine boot, and legacy progress migrates only once', () => {
  const legacy = JSON.stringify({ version: 1, players: { you: { stops: { one: { best: 90 } } } } });
  const store = storage({ [api.GAME_KEY]: legacy }), b = browser({ store }); const first = b.app.model.active();
  assert.equal(b.game.dataset.feedbackSession, first); assert.equal(store.getItem(api.GAME_KEY + ':' + first), legacy);
  b.field('new-player').click(); const fresh = browser({ store }); assert.notEqual(fresh.app.model.active(), first);
  assert.equal(store.getItem(api.GAME_KEY + ':' + fresh.app.model.active()), null);
});
test('Top and bottom New player controls isolate sessions; with no receiver or close-out code the leaving notes are deleted', () => {
  for (const name of ['new-player', 'new-player-top']) {
    const b = browser(); b.field('fix').value = 'previous private note'; const previous = b.app.model.active();
    let asked = ''; b.win.confirm = message => { asked = message; return true; }; b.field(name).click();
    assert.match(asked, /has not received: 1\. Delete them\? Nobody can bring them back\. To keep the notes, choose Keep playing and download Excel first\./);
    assert.equal(b.win.location.reloads, 1); assert.notEqual(b.app.model.active(), previous);
    assert.equal(b.app.model.entries(true).some(e => e.fix === 'previous private note'), false);
    assert.ok(b.app.model.entries(true).some(e => e.sessionId === previous && e.kind === 'feedback' && e.fix === '' && e.revision === 2), 'an emptied newer revision, so no older copy can return');
    assert.doesNotMatch([...b.store.data.values()].join(''), /previous private note/);
    assert.equal(b.app.model.entries().some(e => e.fix), false);
  }
  const keep = browser(); keep.field('fix').value = 'cancel keeps it'; keep.win.confirm = () => false; keep.field('new-player').click();
  assert.equal(keep.win.location.reloads, 0); assert.equal(keep.app.model.find('feedback', 0).fix, 'cancel keeps it');
});

test('In-page New player confirmation saves first, focuses Keep playing, and cancellation preserves the current player', () => {
  for (const name of ['new-player', 'new-player-top']) {
    const b = browser({ dialog: true }); const active = b.app.model.active(), trigger = b.field(name);
    b.field('fix').value = 'keep this unfinished note'; trigger.focus(); trigger.click();
    assert.equal(b.newPlayer('dialog').open, true); assert.equal(b.win.confirmCalls, 0);
    assert.equal(b.doc.activeElement, b.newPlayer('cancel')); assert.equal(b.app.model.active(), active);
    assert.equal(b.app.model.find('feedback', 0).fix, 'keep this unfinished note');
    assert.deepEqual(b.voicePauses, [true]);
    b.newPlayer('cancel').click();
    assert.equal(b.newPlayer('dialog').open, false); assert.equal(b.win.location.reloads, 0);
    assert.equal(b.app.model.active(), active); assert.equal(b.field('fix').value, 'keep this unfinished note');
    assert.equal(b.doc.activeElement, trigger); assert.deepEqual(b.voicePauses, [true, false]);
  }
});

test('Escape cancels the in-page confirmation and restores focus without discarding feedback', () => {
  const b = browser({ dialog: true }), active = b.app.model.active();
  b.field('worked').value = 'saved before Escape'; b.field('new-player-top').click();
  const escape = b.newPlayer('dialog').fire('cancel');
  assert.equal(escape.defaultPrevented, true); assert.equal(b.newPlayer('dialog').open, false);
  assert.equal(b.doc.activeElement, b.field('new-player-top')); assert.equal(b.win.location.reloads, 0);
  assert.equal(b.app.model.active(), active); assert.equal(b.app.model.find('feedback', 0).worked, 'saved before Escape');
});

test('In-page confirmation flushes the latest text first, so the delete covers it, then starts a fresh player', () => {
  const b = browser({ dialog: true }), previous = b.app.model.active();
  b.field('fix').value = 'initial note'; b.field('new-player').click();
  assert.match(b.newPlayer('message').textContent, /has not received: 1\. Delete them\?/); assert.equal(b.newPlayer('confirm').textContent, 'Delete and start the next player');
  assert.equal(b.doc.activeElement, b.newPlayer('cancel'), 'Keep playing is the safe default');
  b.field('fix').value = 'latest text before confirmation'; b.newPlayer('confirm').click();
  assert.notEqual(b.app.model.active(), previous); assert.equal(b.win.location.reloads, 1);
  assert.equal(b.newPlayer('dialog').open, false); assert.equal(b.app.model.entries().some(e => e.fix), false);
  assert.doesNotMatch([...b.store.data.values()].join(''), /initial note|latest text before confirmation/);
  assert.ok(b.app.model.entries(true).some(e => e.sessionId === previous && e.sessionEnded));
});

test('A storage failure after opening confirmation prevents rotation and explains the problem inside the dialog', () => {
  const b = browser({ dialog: true }), active = b.app.model.active(); b.field('new-player').click();
  b.store.blocked = true; b.field('fix').value = 'preserve even if storage fills'; b.newPlayer('confirm').click();
  assert.equal(b.app.model.active(), active); assert.equal(b.win.location.reloads, 0); assert.equal(b.newPlayer('dialog').open, true);
  assert.match(b.newPlayer('message').textContent, /cannot save/);
  assert.equal(b.app.model.find('feedback', 0).fix, 'preserve even if storage fills');
  b.newPlayer('cancel').click(); assert.equal(b.newPlayer('dialog').open, false);
});

test('Confirmation detects another tab changing players even before a storage event, and archives old text safely', () => {
  const store = storage(), a = browser({ store, dialog: true }), previous = a.app.model.active();
  a.field('new-player').click(); a.field('fix').value = 'final old-player text';
  const other = model(store); other.rotate(); const next = other.active(); a.newPlayer('confirm').click();
  assert.equal(a.newPlayer('dialog').open, false); assert.equal(a.win.location.reloads, 1);
  const loaded = model(store); assert.equal(loaded.active(), next); assert.equal(loaded.entries().some(e => e.fix), false);
  assert.ok(loaded.entries(true).some(e => e.sessionId === previous && e.fix === 'final old-player text'));
});

test('An open confirmation closes when another tab starts a player; a late confirm cannot rotate that new session', () => {
  const store = storage(), a = browser({ store, dialog: true }), b = browser({ store });
  a.field('new-player').click(); a.field('fix').value = 'buffered before storage event'; b.field('new-player').click();
  const next = b.app.model.active();
  for (const fn of a.win.listeners.get('storage')) fn({ key: api.KEY });
  a.newPlayer('confirm').click();
  assert.equal(a.newPlayer('dialog').open, false); assert.equal(a.win.location.reloads, 1);
  assert.equal(model(store).active(), next); assert.ok(model(store).entries(true).some(e => e.fix === 'buffered before storage event'));
});

test('Closing New player keeps narration paused underneath the introduction or a modal review panel', () => {
  for (const options of [{ introPaused: true }, { reviewModal: true }]) {
    const b = browser({ dialog: true, ...options }); b.field('new-player').click(); b.newPlayer('cancel').click();
    assert.deepEqual(b.voicePauses, [true, true]);
  }
});

test('The in-page New player confirmation is fully localized in Spanish', () => {
  const b = browser({ dialog: true, lang: 'es' }); b.field('new-player-top').click();
  assert.equal(b.newPlayer('title').textContent, '¿Listo para otro jugador?');
  assert.equal(b.newPlayer('cancel').textContent, 'Seguir jugando');
  assert.equal(b.newPlayer('confirm').textContent, 'Empezar con el siguiente jugador');
  assert.match(b.newPlayer('message').textContent, /La partida de este jugador se queda guardada en este dispositivo\.$/);
  b.newPlayer('cancel').click(); b.field('worked').value = 'una nota'; b.field('new-player-top').click();
  assert.equal(b.newPlayer('message').textContent, 'Notas de este jugador que el equipo de prueba no ha recibido: 1. ¿Borrarlas? Nadie podrá recuperarlas. Para conservar las notas, elige Seguir jugando y descarga Excel primero.');
  assert.equal(b.newPlayer('confirm').textContent, 'Borrar y empezar con el siguiente jugador');
});
test('Blocked storage aborts New player without reload and keeps typed notes available for Excel', () => {
  const b = browser(); const active = b.app.model.active(); b.store.blocked = true; b.field('fix').value = 'must not lose'; b.field('new-player').click();
  assert.equal(b.win.location.reloads, 0); assert.equal(b.app.model.active(), active);
  assert.equal(b.app.model.find('feedback', 0).fix, 'must not lose'); assert.match(b.field('status').textContent, /cannot save/);
});
test('Another tab starting a new player preserves the old tab buffered keystrokes before reloading', () => {
  const store = storage(), a = browser({ store }), b = browser({ store }); const old = a.app.model.active();
  a.field('fix').value = 'not yet debounced'; a.field('fix').fire('input'); b.field('new-player').click(); const next = b.app.model.active();
  for (const fn of a.win.listeners.get('storage')) fn({ key: api.KEY });
  assert.equal(a.win.location.reloads, 1); const loaded = model(store); assert.equal(loaded.active(), next);
  assert.ok(loaded.entries(true).some(e => e.sessionId === old && e.fix === 'not yet debounced'));
  assert.equal(loaded.entries().some(e => e.fix === 'not yet debounced'), false);
});
test('A stale tab refuses automatic reload if its final text cannot be durably archived', () => {
  const store = storage(), a = browser({ store }), b = browser({ store }); a.field('fix').value = 'retain when full'; a.field('fix').fire('input'); b.field('new-player').click();
  const original = store.setItem; store.setItem = () => { throw Error('quota'); };
  for (const fn of a.win.listeners.get('storage')) fn({ key: api.KEY });
  assert.equal(a.win.location.reloads, 0); assert.equal(a.app.model.find('feedback', 0).fix, 'retain when full'); assert.match(a.field('status').textContent, /cannot save/);
  store.setItem = original;
  for (const fn of a.win.listeners.get('storage')) fn({ key: api.KEY });
  assert.equal(a.win.location.reloads, 1); assert.ok(model(store).entries(true).some(e => e.fix === 'retain when full'));
});
test('Storage events only read, so a tab with an old copy cannot undo another tab New player', () => {
  const store = storage(), a = browser({ store }), b = browser({ store });
  const old = a.app.model.active(), staleFeedback = store.getItem(api.KEY);
  a.field('new-player').click(); const next = a.app.model.active(); assert.notEqual(next, old);
  const current = store.getItem(api.KEY), currentConsent = store.getItem(api.CONSENT_KEY);
  // Browsers copy storage between tabs a moment later, so the other tab may still read the old player.
  store.data.set(api.KEY, staleFeedback); store.data.delete(api.CONSENT_KEY);
  const writes = [], set = store.setItem; store.setItem = function (k, v) { writes.push(k); return set.call(this, k, v); };
  for (const fn of b.win.listeners.get('storage')) { fn({ key: api.KEY }); fn({ key: api.CONSENT_KEY }); }
  assert.deepEqual(writes, []); assert.equal(b.win.location.reloads, 0);
  store.data.set(api.KEY, current); store.data.set(api.CONSENT_KEY, currentConsent);
  for (const fn of b.win.listeners.get('storage')) fn({ key: api.KEY });
  assert.equal(b.win.location.reloads, 1); assert.equal(model(store).active(), next);
});
test('Closing an older tab keeps the newer note written in another tab', () => {
  const store = storage(), a = browser({ store }), b = browser({ store });
  a.field('worked').value = 'older note'; a.field('worked').fire('input'); a.run(350);
  for (const fn of b.win.listeners.get('storage')) fn({ key: api.KEY });
  assert.equal(b.field('worked').value, 'older note');
  b.field('worked').value = 'newer note'; b.field('worked').fire('input'); b.run(350);
  // The older tab closes before or after it hears about the change: either way the newer note stays.
  a.win.fire('pagehide'); assert.equal(model(store).find('feedback', 0).worked, 'newer note');
  for (const fn of a.win.listeners.get('storage')) fn({ key: api.KEY });
  assert.equal(a.field('worked').value, 'newer note');
  a.field('fix').value = 'only this field'; a.win.fire('pagehide');
  const saved = model(store).find('feedback', 0); assert.equal(saved.worked, 'newer note'); assert.equal(saved.fix, 'only this field');
});
test('Page hiding flushes latest text immediately; no unconfigured backup is claimed', () => {
  const b = browser(); b.field('worked').value = 'last keystrokes'; b.win.fire('pagehide');
  assert.equal(b.app.model.find('feedback', 0).worked, 'last keystrokes'); assert.match(b.field('status').textContent, /not connected yet/);
});

test('Moving or closing the feedback window synchronously saves buffered text before the panel moves', () => {
  const b = browser(); b.field('fix').value = 'last keystrokes before floating'; b.field('fix').fire('input');
  b.doc.fire('pt:feedback-flush');
  assert.equal(b.app.model.find('feedback', 0).fix, 'last keystrokes before floating');
  assert.equal([...b.timers.values()].some(timer => timer.ms === 350), false);
});
test('Completed stop score is queued once; UI uses safe text nodes for untrusted comments', () => {
  const b = browser(); b.app.setConsent({ scores: true }); b.doc.fire('cb:screen', { stopN: 8, phase: 'result', score: 77 }); b.doc.fire('cb:screen', { stopN: 8, phase: 'result', score: 77 });
  assert.equal(b.app.model.find('progress', 8).score, 77); assert.equal(b.app.model.find('progress', 8).revision, 1);
  b.field('fix').value = '<img src=x onerror=alert(1)>'; b.app.flush();
  assert.equal(b.field('entries').children[0].children[1].textContent, '<img src=x onerror=alert(1)>');
});
test('Cloud unavailable/recovered statuses reflect actual acknowledgment instead of optimistic saving', async () => {
  const b = browser({ backup: endpoint }); b.field('worked').value = 'queued'; b.app.flush(); b.app.model.submit(b.app.model.find('feedback', 0).entryId, false);
  b.win.fetch = async () => { throw Error('offline'); }; await b.app.sync();
  assert.match(b.field('status').textContent, /could not be sent/); assert.ok(b.app.model.pending().length);
  b.win.fetch = async (url, options) => acknowledgeBody(options); await b.app.sync();
  assert.match(b.field('status').textContent, /received by the playtest team/); assert.equal(b.app.model.pending().length, 0);
});
test('Spanish runtime saves identical schema and shows Spanish status', () => {
  const b = browser({ lang: 'es' }); b.field('category').value = 'spanish'; b.field('worked').value = 'Se entendió bien'; b.app.flush();
  assert.equal(b.app.model.find('feedback', 0).language, 'es'); assert.equal(b.app.model.find('feedback', 0).category, 'spanish');
  assert.match(b.field('status').textContent, /Guardado en este dispositivo/);
});

for (const lang of ['en', 'es']) test(`New player clears the on-screen note so the reload's page-hide save cannot copy it to the next player (${lang})`, () => {
  const b = browser({ dialog: true, lang }), previous = b.app.model.active();
  b.field('fix').value = 'PREVIOUS CHILD SECRET'; b.field('fix').fire('input');
  b.field('new-player-top').click(); b.newPlayer('confirm').click();
  assert.equal(b.win.location.reloads, 1); assert.equal(b.field('fix').value, '');
  // A real reload fires page hide and visibility changes after the rotation; neither may save the old text.
  b.win.fire('pagehide'); b.doc.visibilityState = 'hidden'; b.doc.fire('visibilitychange'); b.run(350);
  const loaded = model(b.store);
  assert.notEqual(loaded.active(), previous);
  assert.equal(loaded.entries().some(e => e.fix.includes('SECRET')), false);
  assert.doesNotMatch([...b.store.data.values()].join(''), /SECRET/, 'the deleted note is nowhere on the device');
  assert.equal(browser({ store: b.store, lang }).field('fix').value, '');
});
test('Bringing back an earlier player restores that player, their device code and their notes, and ends the player who was playing', () => {
  const store = storage(), m = model(store), first = m.active(), station = comment(m, 2, 'first player note').stationId;
  const second = m.rotate(); assert.equal(m.previousPlayer().id, first);
  assert.equal(m.restore('not-a-known-player-0000001'), null); assert.equal(m.restore(second), null, 'the player playing now is not brought back');
  assert.equal(m.restore(first), first); assert.equal(m.active(), first); assert.equal(m.previousPlayer(), null);
  assert.ok(m.entries(true).some(e => e.sessionId === second && e.kind === 'session' && e.sessionEnded === true));
  assert.equal(m.find('feedback', 2).worked, 'first player note'); assert.equal(m.find('session', 0).sessionEnded, false);
  assert.equal(comment(m, 3, 'more').stationId, station);
  assert.equal(model(store).active(), first);
});
test('A grown-up can send every waiting note on the device, one device code per request; earlier scores stay local', async () => {
  const m = model(); comment(m, 1, 'first player'); m.upsert('progress', 1, { score: 80, phase: 'result' });
  m.rotate(); comment(m, 2, 'second player, email kid@example.com'); m.upsert('feedback', 3, { rating: 'good' }); m.upsert('feedback', 4, { worked: '  ' });
  assert.equal(m.submitAll(false), 0, 'nothing is sent that a grown-up did not read in the list');
  assert.equal(m.submitAll(false, m.waiting()), 3, 'blank notes are not sent');
  const bodies = [];
  while (m.pending(true).length) await api.sendBatch(m, endpoint, async (url, options) => { bodies.push(JSON.parse(options.body)); return acknowledgeBody(options); }, null, true);
  assert.equal(bodies.length, 2);
  for (const body of bodies) assert.equal(new Set(body.entries.map(e => e.stationId)).size, 1);
  const sent = bodies.flatMap(body => body.entries);
  assert.equal(sent.some(e => e.kind === 'progress'), false);
  assert.doesNotMatch(JSON.stringify(sent), /kid@example\.com/);
  assert.ok(sent.some(e => e.kind === 'session' && e.sessionEnded === true), 'an ended player record now fills Session ended');
  assert.ok(m.players().every(p => p.notes.every(e => e.ackRevision >= e.revision)));
});
test('Close-out Send sends only the notes still exactly as the grown-up read them, even when another tab changes or adds one', async () => {
  const store = storage(), a = model(store); comment(a, 1, 'listed note'); comment(a, 2, 'listed then edited');
  const reviewed = a.waiting();
  assert.deepEqual(plain(reviewed.map(e => e.worked)), ['listed note', 'listed then edited']);
  const other = model(store); comment(other, 2, 'edited in the other tab'); comment(other, 3, 'added in the other tab');
  assert.equal(a.submitAll(false, reviewed), 1);
  const bodies = [];
  while (a.pending(true).length) await api.sendBatch(a, endpoint, async (url, options) => { bodies.push(JSON.parse(options.body)); return acknowledgeBody(options); }, null, true);
  assert.deepEqual(bodies.flatMap(body => body.entries).filter(e => e.kind === 'feedback').map(e => e.worked), ['listed note']);
  const loaded = model(store);
  for (const stop of [2, 3]) assert.equal(loaded.find('feedback', stop).submitted, false, `stop ${stop} stays a local draft`);
  assert.equal(loaded.find('feedback', 2).worked, 'edited in the other tab');
  assert.deepEqual(plain(loaded.waiting().map(e => e.worked)).sort(), ['added in the other tab', 'edited in the other tab']);
});
test('With site data blocked from the start, Next player asks first and then starts over as a new player', () => {
  for (const dialog of [false, true]) {
    const store = storage(); store.blocked = true;
    const b = browser({ store, dialog }); b.field('fix').value = 'never saved'; b.field('fix').fire('input');
    assert.match(b.field('status').textContent, /not saving anything on this device/);
    let asked = ''; b.win.confirm = message => { asked = message; return true; };
    b.field('new-player-top').click();
    if (dialog) {
      assert.equal(b.newPlayer('dialog').open, true); assert.equal(b.win.location.reloads, 0);
      asked = b.newPlayer('message').textContent; b.newPlayer('confirm').click();
    }
    assert.match(asked, /not saving anything on this device, so this player's game and notes will be gone/);
    assert.equal(b.win.location.reloads, 1); assert.equal(b.field('fix').value, '', 'the form is cleared before the reload');
  }
  const store = storage(); store.blocked = true;
  const c = browser({ store, dialog: true }); c.field('fix').value = 'keep me'; c.field('new-player').click(); c.newPlayer('cancel').click();
  assert.equal(c.win.location.reloads, 0); assert.equal(c.field('fix').value, 'keep me'); assert.equal(c.app.model.find('feedback', 0).fix, 'keep me');
});
test('Queued text that never passed the preview scrub goes back to a local draft instead of being sent', async () => {
  const store = storage(), m = model(store), e = submittedComment(m, 1, 'clean note');
  // Another page on the shared github.io origin rewrites the saved queue with raw text.
  const state = JSON.parse(store.getItem(api.KEY)); state.entries.find(x => x.entryId === e.entryId).worked = 'My name is Sofia Ramirez'; store.setItem(api.KEY, JSON.stringify(state));
  const forged = model(store); let body = null;
  await api.sendBatch(forged, endpoint, async (url, options) => { body = JSON.parse(options.body); return acknowledgeBody(options); });
  assert.ok(!body || body.entries.every(x => x.kind !== 'feedback'));
  assert.equal(forged.find('feedback', 1).submitted, false); assert.equal(forged.find('feedback', 1).worked, 'My name is Sofia Ramirez');
});
test('Erase all removes every Pecan Grove key on this device and repeats once after the reload', () => {
  const local = storage({ [api.KEY]: '{}', [api.KEY + '-recovery']: '{}', [api.CONSENT_KEY]: '{}', [api.GAME_KEY + ':abc']: '{}', 'pecan-grove-settings': '{}', 'other-site': 'keep' });
  const session = storage({ 'pecan-grove-resume': '{}' });
  assert.equal(api.eraseAll(local, session), true);
  assert.deepEqual([...local.data.keys()], ['other-site']); assert.equal(session.data.size, 0);
  session.setItem(api.ERASE_FLAG, '1'); local.setItem(api.GAME_KEY + ':abc', 'saved by the closing page');
  api.finishErase({ sessionStorage: session, localStorage: local });
  assert.deepEqual([...local.data.keys()], ['other-site']); assert.equal(session.getItem(api.ERASE_FLAG), null);
  local.setItem(api.KEY, '{}'); api.finishErase({ sessionStorage: session, localStorage: local });
  assert.equal(local.getItem(api.KEY), '{}', 'without the flag a normal load erases nothing');
});
test('Erase all also removes the step log and every recovery copy the game and the notes keep', async () => {
  const { stepKey } = await import(pathToFileURL(path.join(root, 'assets/games/community-builders/engine/interaction-log.js')).href);
  const local = storage(), m = model(local), journey = api.GAME_KEY + ':' + m.active();
  // The notes keep a copy of a saved list they cannot fully read, and a second, different one beside it.
  for (const bad of ['first unreadable entry', 'second unreadable entry']) {
    const state = JSON.parse(local.getItem(api.KEY) || JSON.stringify({ schemaVersion: 1, activeSession: m.active(), entries: [] }));
    state.entries.push({ kind: 'feedback', note: bad }); local.setItem(api.KEY, JSON.stringify(state)); model(local);
  }
  // The game's own names: core/store.js copies a damaged save to <key>-recovery and then <key>-recovery-<time>.
  local.setItem(journey, '{}'); local.setItem(journey + '-recovery', '{"players":1}'); local.setItem(journey + '-recovery-1767225600000', '{"players":2}');
  local.setItem(stepKey(journey), '[]'); local.setItem('other-site', 'keep');
  const recoveries = [...local.data.keys()].filter(k => k.startsWith(api.KEY + '-recovery'));
  assert.equal(recoveries.length, 2, 'both damaged copies were kept');
  assert.equal(stepKey(journey), 'pecan-grove-steps:' + m.active());
  assert.equal(api.eraseAll(local, storage()), true);
  assert.deepEqual([...local.data.keys()], ['other-site']);
});
test("The game's own titled characters are never flagged as private names", () => {
  const titled = new Set();
  for (const lang of ['en', 'es']) {
    const folder = path.join(root, 'assets/games/community-builders/locales', lang);
    for (const file of fs.readdirSync(folder).filter(name => name.endsWith('.json'))) for (const match of fs.readFileSync(path.join(folder, file), 'utf8').matchAll(/\b(?:Mr|Mrs|Ms|Miss|Dr|Sr|Sra|Srta)\. [A-Z][a-zñáéíóú]+/g)) titled.add(match[0]);
  }
  assert.ok(titled.size >= 8);
  for (const name of titled) assert.deepEqual(plain(api.privacyFlags(`I liked ${name}'s idea.`)), [], name);
  assert.deepEqual(plain(api.privacyFlags('Mr. Smith read it with me')), ['Mr. Smith']);
});
test('The collector README example lists exactly the fields the game sends (contract v1)', async () => {
  const readme = fs.readFileSync(path.join(root, 'backend/feedback/README.md'), 'utf8');
  const example = JSON.parse(readme.match(/```json\n(\{\n  "schemaVersion": 1,\n  "entries"[\s\S]*?)\n```/)[1]);
  const m = model(); submittedComment(m); let body;
  await api.sendBatch(m, endpoint, async (url, options) => { body = JSON.parse(options.body); return acknowledgeBody(options); });
  assert.deepEqual(Object.keys(example.entries[0]).sort(), Object.keys(body.entries[0]).sort());
  assert.equal(example.schemaVersion, body.schemaVersion);
});
