/* Real authored callbacks with a DOM double. Geometry and device checks need browsers. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const releasePath = path.join(__dirname, '../../tests/release-gameplay.test.cjs');
const source = fs.readFileSync(releasePath, 'utf8');
const fixture = { exports: {} };
vm.runInNewContext(source.slice(0, source.indexOf("for (const lang of ['en', 'es'])")) + '\nmodule.exports = { harness, Element, core };', {
  require, module: fixture, __dirname: path.dirname(releasePath), console, URL, URLSearchParams
});
const { harness, Element, core } = fixture.exports;
const fragments = require('./core-fragments.cjs');
function open(lang, file, seed = 42) {
  const r = harness(lang, seed);
  r.api.setController = controller => { r.controller = controller; };
  r.open(file);
  return r;
}
const clone = value => JSON.parse(JSON.stringify(value));

test('Stop 2 announces the same first neighbor on its intro and question across 20 seeds and both languages', () => {
  for (const lang of ['en', 'es']) for (let seed = 1; seed <= 20; seed++) {
    const r = open(lang, '02-ask-a-good-question.js', seed);
    const first = r.screen.querySelector('.cb-s02-nb[data-s="up-next"] .cb-s02-nb__name').textContent;
    assert.ok(r.screen.querySelector('.cb-s02-first').textContent.endsWith(first));
    r.click(r.screen.querySelector('.cb-btn--go'));
    assert.equal(r.screen.querySelector('.cb-s02-nb[data-s="now"] .cb-s02-nb__name').textContent, first);
    assert.ok(r.screen.querySelector('.cb-s02-say .cb-vh').textContent.startsWith(first));
  }
});

test('Stop 1 language restoration preserves the same twelve objects, three found signs and Today view', () => {
  const en = open('en', '01-notice-the-signs.js');
  en.click(en.screen.querySelector('.cb-btn--go'));
  en.click(en.screen.querySelector('[data-view="today"]'));
  const initial = en.controller.snapshot();
  for (const b of en.screen.querySelectorAll('.cb-s01-spot')) { en.click(b); en.dialog.close(); if (en.controller.snapshot().found.length === 3) break; }
  // Use the authored sign classification retained by the snapshot, then select an exact partial state.
  const found = en.controller.snapshot().found.slice(0, 3);
  assert.equal(found.length, 3);
  const state = { ...clone(initial), screenKey: 'look', found, tapped: [], view: 'today', seenToday: true };
  const es = open('es', '01-notice-the-signs.js', 99); es.controller.restore(state);
  const restored = es.controller.snapshot();
  assert.deepEqual(clone(restored.order), clone(initial.order));
  assert.deepEqual(clone(restored.found), clone(found));
  assert.equal(restored.view, 'today');
  assert.equal(es.screen.querySelector('[data-view="today"]').getAttribute('aria-pressed'), 'true');
  assert.equal(es.screen.querySelectorAll('.cb-s01-spot.is-found').length, 3);
  assert.equal(es.saves.length, 0);
});

test('Stop 2 restores worry two, the same neighbors/order and two selected tiles in the other language', () => {
  const en = open('en', '02-ask-a-good-question.js'); en.click(en.screen.querySelector('.cb-btn--go'));
  const initial = clone(en.controller.snapshot());
  const row = name => en.screen.querySelectorAll(`.cb-s02-tile[data-row="${name}"]`)[0].getAttribute('data-id');
  const state = { ...initial, screenKey: 'worry', wi: 1, sel: { start: row('start'), topic: row('topic'), detail: null } };
  const es = open('es', '02-ask-a-good-question.js', 987); es.controller.restore(state);
  const restored = clone(es.controller.snapshot());
  assert.deepEqual(restored.round, initial.round);
  assert.deepEqual(restored.orders, initial.orders);
  assert.equal(restored.wi, 1);
  assert.deepEqual(restored.sel, state.sel);
  assert.equal(es.screen.querySelectorAll('.cb-s02-tile[aria-pressed="true"]').length, 2);
  assert.equal(es.saves.length, 0);
});

test('Seeded core RNG yields identical choices and does not mutate its shuffled input', () => {
  function make(seed) {
    const c = vm.createContext({ rngState: 0, location: { search: `?seed=${seed}` }, URLSearchParams, Uint32Array, Math, Date, window: {} });
    vm.runInContext(fragments.functionSource('seedValue') + fragments.functionSource('rng'), c);
    vm.runInContext('rngState = seedValue();', c);
    vm.runInContext(fragments.functionSource('shuffle') + fragments.functionSource('pick'), c);
    return c;
  }
  const a = make(42), b = make(42), other = make(43), original = [1, 2, 3, 4, 5, 6];
  assert.deepEqual(clone(a.shuffle(original)), clone(b.shuffle(original)));
  assert.deepEqual(original, [1, 2, 3, 4, 5, 6]);
  assert.equal(a.rng(), b.rng()); assert.notEqual(a.rng(), other.rng());
});

test('Failed progress writes return false, announce once per session and emit a storage error each time', () => {
  const root = new Element('div'), events = [];
  const c = vm.createContext({ root, L: 'en', KEY: 'key', store: {}, localStorage: { setItem() { throw Error('quota'); } },
    h: (tag, attrs) => new Element(tag, attrs), emit: (type, detail) => events.push({ type, detail }) });
  vm.runInContext(fragments.variableSource('storageWarned') + fragments.variableSource('saveLocked') + fragments.functionSource('storageError') + fragments.functionSource('save'), c);
  assert.equal(c.save(), false); assert.equal(c.save(), false);
  assert.equal(root.querySelectorAll('.cb-storage-warning').length, 1);
  assert.equal(root.querySelector('.cb-storage-warning').getAttribute('role'), 'status');
  assert.equal(events.filter(e => e.type === 'cb:storage-error').length, 2);
});

test('Fullscreen labels follow the game target and update while Settings stays open', () => {
  const stage = {}, other = {}, root = new Element('div'), events = {}, doc = { fullscreenElement: null, fullscreenEnabled: true, addEventListener: (type, fn) => { events[type] = fn; } };
  stage.requestFullscreen = () => { doc.fullscreenElement = stage; };
  root.closest = () => stage; doc.exitFullscreen = () => { doc.fullscreenElement = null; };
  const c = vm.createContext({ root, document: doc, X: { fsOn: 'Full screen', fsOff: 'Exit full screen' },
    h: (tag, attrs, children) => new Element(tag, attrs, children), ico: () => new Element('svg') });
  vm.runInContext(fragments.variableSource('canFS') + ['fsTarget','fsEl','isGameFS','toggleFS','fsBtn','syncFS'].map(fragments.functionSource).join('\n'), c);
  const button = c.fsBtn(false); root.appendChild(button);
  assert.equal(button.getAttribute('aria-label'), 'Full screen');
  doc.fullscreenElement = other; c.syncFS(); assert.equal(button.getAttribute('aria-label'), 'Full screen');
  doc.fullscreenElement = stage; c.syncFS(); assert.equal(button.getAttribute('aria-label'), 'Exit full screen');
  doc.fullscreenElement = null; c.syncFS(); assert.equal(button.getAttribute('aria-label'), 'Full screen');
});
