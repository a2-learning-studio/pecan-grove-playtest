/* DOM-double regressions for authored shell callbacks. Browser checks prove layout/native top layer. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = process.env.PECAN_SOURCE_ROOT || fileURLToPath(new URL('../../', import.meta.url));
function load(file) {
  const c = vm.createContext({ module: { exports: {} }, require: createRequire(path.join(root, file)), TextEncoder, Uint8Array, DataView, Date, Map, Number, JSON, Math });
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), c);
  return c.module.exports;
}
const shell = load('assets/playtest/shell.js');
const feedback = load('assets/playtest/feedback.js');
let serial = 0;

class Element {
  constructor(doc, id = '') {
    this.doc = doc; this.id = id; this.dataset = {}; this.children = []; this.listeners = new Map();
    this.attrs = new Map(); this.classes = new Set(); this.value = ''; this.textContent = ''; this.hidden = false; this.open = false;
    this.style = { setProperty(name, value) { this[name] = String(value); }, removeProperty(name) { delete this[name]; } };
    this.rect = { width: 560, height: 500 }; this.captures = new Set();
    this.classList = { add: (...names) => names.forEach(n => this.classes.add(n)), remove: (...names) => names.forEach(n => this.classes.delete(n)),
      contains: n => this.classes.has(n), toggle: (n, value) => { value ??= !this.classes.has(n); if (value) this.classes.add(n); else this.classes.delete(n); return value; } };
  }
  get isConnected() { return this === this.doc.body || !!this.parentNode?.isConnected; }
  setAttribute(k, v) { this.attrs.set(k, String(v)); if (k.startsWith('data-')) this.dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(v); }
  getAttribute(k) { return this.attrs.get(k) ?? null; }
  removeAttribute(k) { this.attrs.delete(k); }
  addEventListener(type, fn) { const list = this.listeners.get(type) || []; list.push(fn); this.listeners.set(type, list); }
  dispatchEvent(event) { event.target ??= this; event.currentTarget = this; for (const fn of [...(this.listeners.get(event.type) || [])]) fn(event); return !event.defaultPrevented; }
  fire(type, fields = {}) { return this.dispatchEvent({ type, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.stopped = true; }, ...fields }); }
  click() { return this.fire('click'); }
  appendChild(node) { if (node.parentNode) node.parentNode.removeChild(node); this.children.push(node); node.parentNode = this; return node; }
  removeChild(node) { const at = this.children.indexOf(node); assert.ok(at >= 0); this.children.splice(at, 1); node.parentNode = null; return node; }
  get firstChild() { return this.children[0] || null; }
  remove() { this.parentNode?.removeChild(this); }
  contains(node) { return node === this || this.children.some(c => c.contains(node)); }
  focus() { this.doc.activeElement = this; }
  setPointerCapture(id) { this.captures.add(id); }
  hasPointerCapture(id) { return this.captures.has(id); }
  releasePointerCapture(id) { this.captures.delete(id); }
  getBoundingClientRect() {
    const win = this.doc.defaultView || { innerWidth: 1024, innerHeight: 768 };
    const floating = this.classes.has('is-floating');
    const collapsed = this.id === 'pt-review-dialog' && this.doc.getElementById('pt-feedback-window')?.hidden;
    const availableWidth = parseFloat(this.style['--pt-review-available-width']) || win.innerWidth - 16;
    const availableHeight = parseFloat(this.style['--pt-review-available-height']) || win.innerHeight - 16;
    const width = Math.min(collapsed ? 360 : parseFloat(this.style.width) || this.rect.width, floating ? availableWidth : win.innerWidth);
    const height = Math.min(collapsed ? 72 : parseFloat(this.style.height) || this.rect.height, floating ? availableHeight : win.innerHeight - 16);
    const left = parseFloat(this.style.left) || (floating ? win.innerWidth - width - 16 : (win.innerWidth - width) / 2);
    const top = parseFloat(this.style.top) || (floating ? win.innerHeight - height - 16 : 16);
    return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top };
  }
  scrollIntoView() { this.scrolled = true; }
  show() { assert.equal(this.open, false); this.open = true; this.modal = false; }
  showModal() { assert.equal(this.open, false); this.open = true; this.modal = true; }
  close() { if (!this.open) return; this.open = false; this.doc.closeEvents.push(() => this.fire('close')); }
}

function harness({ lang = 'en', fullscreen = 'success', liveFeedback = false, visualViewport = null } = {}) {
  const doc = { closeEvents: [], activeElement: null, documentElement: { lang }, visibilityState: 'visible' };
  const events = new Element(doc); doc.body = new Element(doc);
  doc.addEventListener = events.addEventListener.bind(events); doc.dispatchEvent = events.dispatchEvent.bind(events);
  const ids = ['stage', 'intro', 'feedback', 'feedback-home', 'feedback-window', 'review-dialog', 'review-tab', 'review-float', 'quiet', 'play-status',
    'start', 'exit', 'review-close', 'review-dock', 'review-move', 'review-collapse', 'review-tools', 'feedback-h', 'h', 'library-tab', 'grownups-tab', 'feedback-form', 'feedback-stop', 'feedback-rating',
    'feedback-category', 'feedback-worked', 'feedback-fix', 'feedback-status', 'feedback-entries', 'feedback-context', 'feedback-player',
    'feedback-new-player', 'feedback-new-player-top', 'feedback-download', 'feedback-dock-header', 'feedback-dock-collapse', 'feedback-dock-float'];
  const nodes = new Map(ids.map(id => ['pt-' + id, new Element(doc, 'pt-' + id)]));
  const game = new Element(doc, 'community-builders'); nodes.set(game.id, game);
  doc.getElementById = id => nodes.get(id) || null; doc.createElement = () => new Element(doc);
  const field = id => nodes.get('pt-' + id), stage = field('stage'), panel = field('feedback');
  doc.body.appendChild(field('intro')); doc.body.appendChild(stage); field('intro').appendChild(field('h')); field('intro').appendChild(field('start')); field('intro').appendChild(field('quiet'));
  [game, field('feedback-home'), field('review-dialog'), field('review-tab'), field('library-tab'), field('grownups-tab'), field('exit'), field('play-status')].forEach(n => stage.appendChild(n));
  field('feedback-home').appendChild(field('feedback-dock-header'));
  ['feedback-dock-collapse', 'feedback-dock-float'].forEach(id => field('feedback-dock-header').appendChild(field(id)));
  field('feedback-home').appendChild(panel);
  ['review-move', 'review-collapse', 'review-close', 'review-tools', 'feedback-window'].forEach(id => field('review-dialog').appendChild(field(id)));
  ['review-float', 'review-dock'].forEach(id => field('review-tools').appendChild(field(id)));
  for (const [id, node] of nodes) if (id.startsWith('pt-feedback-') && !['pt-feedback-home', 'pt-feedback-window', 'pt-feedback-dock-header', 'pt-feedback-dock-collapse', 'pt-feedback-dock-float'].includes(id)) panel.appendChild(node);
  field('review-float').setAttribute('data-float-label', lang === 'es' ? 'Flotante' : 'Float');
  field('review-float').setAttribute('data-popup-label', lang === 'es' ? 'Ventana' : 'Popup');
  field('review-collapse').setAttribute('data-collapse-label', lang === 'es' ? 'Contraer' : 'Collapse');
  field('review-collapse').setAttribute('data-expand-label', lang === 'es' ? 'Expandir' : 'Expand');
  field('feedback-dock-collapse').setAttribute('data-collapse-label', lang === 'es' ? 'Contraer comentarios' : 'Collapse feedback');
  field('feedback-dock-collapse').setAttribute('data-expand-label', lang === 'es' ? 'Expandir comentarios' : 'Expand feedback');
  panel.dataset = { lang, build: 'shell-test', endpoint: '' }; game.dataset.currentStop = '0';
  const win = new Element(doc), calls = [], timers = new Map(), saved = new Map(); let timerId = 0;
  win.PGShellLocale = Object.fromEntries(['en','es'].map(language => [language, JSON.parse(fs.readFileSync(path.join(root, 'assets/playtest/locales', language + '.json'), 'utf8'))]));
  win.innerWidth = 1024; win.innerHeight = 768; doc.defaultView = win;
  if (visualViewport) Object.assign(win.visualViewport = new Element(doc), visualViewport);
  const observers = [];
  win.ResizeObserver = class { constructor(fn) { this.fn = fn; observers.push(this); } observe(target) { this.target = target; } disconnect() { this.target = null; } };
  win.CustomEvent = class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } };
  win.setTimeout = (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId; }; win.clearTimeout = id => timers.delete(id);
  win.localStorage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, String(value)), removeItem: key => saved.delete(key) };
  win.crypto = { randomUUID: () => 'shell-' + String(++serial).padStart(24, '0') };
  win.location = { reloads: 0, reload() { this.reloads++; } }; win.confirm = () => true;
  win.CommunityBuilders = { enterPlay: options => calls.push(['enter', options]), suspendVoice: value => calls.push(['suspend', value]),
    openLibraryMode: node => calls.push(['library', node]), openGrownups: node => calls.push(['grownups', node]) };
  if (fullscreen !== 'missing') stage.requestFullscreen = () => { calls.push(['requestFullscreen']); if (fullscreen === 'throw') throw Error('blocked'); if (fullscreen === 'reject') return Promise.reject(Error('blocked')); doc.fullscreenElement = stage; return Promise.resolve(); };
  doc.exitFullscreen = () => { calls.push(['exitFullscreen']); doc.fullscreenElement = null; return Promise.resolve(); };
  const feedbackApp = liveFeedback ? feedback.mount(doc, win) : null;
  const app = shell.mount(doc, win);
  return { app, feedbackApp, doc, win, stage, panel, game, field, calls, saved, timers,
    resize(width, height) { win.innerWidth = width; win.innerHeight = height; win.fire('resize'); },
    observedResize() { for (const observer of observers) if (observer.target) observer.fn([{ target: observer.target }]); },
    emit: (type, detail) => doc.dispatchEvent(new win.CustomEvent(type, { detail })),
    closeEvents() { for (const fn of doc.closeEvents.splice(0)) fn(); },
    run(ms) { for (const [id, task] of [...timers]) if (task.ms === ms) { timers.delete(id); task.fn(); } } };
}

test('Start opens expanded play and requests fullscreen on the common stage; quiet choice reaches the engine', () => {
  const h = harness(); assert.deepEqual(h.calls[0], ['suspend', true]);
  h.field('quiet').checked = true; h.field('start').click();
  assert.equal(h.field('intro').hidden, true); assert.equal(h.stage.classList.contains('is-expanded'), true);
  assert.equal(h.doc.body.classList.contains('pt-playing'), true); assert.equal(h.doc.fullscreenElement, h.stage);
  assert.equal(h.calls.findIndex(c => c[0] === 'requestFullscreen') < h.calls.findIndex(c => c[0] === 'enter'), true);
  assert.equal(h.calls.find(c => c[0] === 'enter')[1].quiet, true); assert.equal(h.doc.activeElement, h.game);
  assert.equal(h.stage.contains(h.field('review-tab')), true); assert.equal(h.stage.contains(h.field('review-dialog')), true);
});

test('Start requests fullscreen immediately but waits for game styles, and Exit cancels a pending entry', async () => {
  const h = harness(); let resolve;
  h.win.PGStyles = {required:true,load:()=>new Promise(done=>{resolve=done;})};
  const starting = h.app.start();
  assert.equal(h.calls.some(call=>call[0]==='requestFullscreen'),true);
  assert.equal(h.calls.some(call=>call[0]==='enter'),false);
  assert.equal(h.game.getAttribute('aria-busy'),'true');
  assert.equal(h.field('start').disabled,true);
  h.app.exit();resolve();await starting;
  assert.equal(h.calls.some(call=>call[0]==='enter'),false);
  assert.equal(h.field('intro').hidden,false);assert.equal(h.game.getAttribute('inert'),null);
  h.win.PGStyles = {required:true,load:()=>Promise.resolve()};
  await h.app.start();assert.equal(h.calls.some(call=>call[0]==='enter'),true);
});

test('a stylesheet failure returns to an accessible introduction with a localized retry message', async () => {
  const h = harness({lang:'es'});
  h.win.PGStyles = {required:true,load:()=>Promise.reject(new Error('offline'))};
  await h.app.start();
  assert.equal(h.field('intro').hidden,false);assert.equal(h.stage.classList.contains('is-playing'),false);
  assert.equal(h.field('start').disabled,false);assert.equal(h.doc.activeElement,h.field('start'));
  const message=h.field('intro').children.find(node=>node.id==='pt-style-error');
  assert.match(message.textContent,/conexión/);assert.equal(message.getAttribute('role'),'alert');
  assert.equal(h.calls.some(call=>call[0]==='enter'),false);
});

test('Denied, throwing or unavailable fullscreen leaves a usable expanded play view', async () => {
  for (const fullscreen of ['reject', 'throw', 'missing']) {
    const h = harness({ fullscreen }); assert.doesNotThrow(() => h.field('start').click()); await Promise.resolve();
    assert.equal(h.stage.classList.contains('is-playing'), true); assert.equal(h.field('intro').hidden, true); assert.equal(h.doc.activeElement, h.game);
  }
});

test('Review modal, floating view and dock move the same live form and preserve current stop drafts', () => {
  const h = harness({ liveFeedback: true }); h.field('start').click();
  h.emit('cb:screen', { stopN: 3, phase: 'playing' }); h.field('feedback-worked').value = 'A note before the debounce'; h.field('feedback-worked').fire('input');
  h.field('review-tab').click();
  assert.equal(h.panel.parentNode, h.field('feedback-window')); assert.equal(h.field('review-dialog').modal, true);
  assert.equal(h.feedbackApp.model.find('feedback', 3).worked, 'A note before the debounce');
  h.field('feedback-fix').value = 'Keep the wording'; h.field('feedback-fix').fire('input'); h.field('review-float').click(); h.closeEvents();
  assert.equal(h.panel.parentNode, h.field('feedback-window')); assert.equal(h.field('review-dialog').open, true); assert.equal(h.field('review-dialog').modal, false);
  assert.equal(h.field('review-float').getAttribute('aria-pressed'), 'true'); assert.equal(h.field('review-tab').getAttribute('aria-expanded'), 'true');
  assert.equal(h.feedbackApp.model.find('feedback', 3).fix, 'Keep the wording');
  h.field('review-float').click(); h.closeEvents(); assert.equal(h.field('review-dialog').modal, true); assert.equal(h.panel.parentNode, h.field('feedback-window'));
  h.field('review-dock').click(); h.closeEvents();
  assert.equal(h.panel.parentNode, h.field('feedback-home')); assert.equal(h.field('review-dialog').open, false);
  assert.equal(h.field('feedback-worked').value, 'A note before the debounce'); assert.equal(h.field('feedback-fix').value, 'Keep the wording');
  assert.equal(h.doc.activeElement, h.field('feedback-h')); assert.equal(h.field('review-tab').getAttribute('aria-expanded'), 'false');
  h.emit('cb:screen', { stopN: 4, phase: 'playing' }); assert.equal(h.field('feedback-worked').value, '');
  h.emit('cb:screen', { stopN: 3, phase: 'playing' }); assert.equal(h.field('feedback-worked').value, 'A note before the debounce');
});

test('Escape closes review, flushes the last keystrokes and returns focus to the persistent tab', () => {
  const h = harness({ liveFeedback: true }); h.field('start').click(); h.field('review-tab').click();
  h.field('feedback-fix').value = 'Typed just before Escape'; h.field('feedback-fix').fire('input');
  h.field('review-dialog').fire('keydown', { key: 'Escape' }); h.closeEvents();
  assert.equal(h.field('review-dialog').open, false); assert.equal(h.feedbackApp.model.find('feedback', 0).fix, 'Typed just before Escape');
  assert.equal(h.doc.activeElement, h.field('review-tab')); assert.equal(h.panel.parentNode, h.field('feedback-home'));
});

test('Delayed native close events cannot steal focus after returning to the introduction', () => {
  const h = harness(); h.field('start').click(); h.field('review-tab').click(); h.field('exit').click();
  assert.equal(h.doc.activeElement, h.field('h')); h.closeEvents();
  assert.equal(h.doc.activeElement, h.field('h')); assert.equal(h.field('intro').hidden, false);
  assert.equal(h.stage.classList.contains('is-expanded'), false); assert.equal(h.doc.body.classList.contains('pt-playing'), false);
  assert.equal(h.game.dataset.playtestPaused, 'true'); assert.equal(h.doc.fullscreenElement, null);
});

test('Fullscreen Escape preserves the current scene and the persistent review tools', () => {
  const h = harness(); h.field('start').click(); h.emit('fullscreenchange'); assert.equal(h.stage.classList.contains('is-native-fullscreen'), true);
  h.doc.fullscreenElement = null; h.emit('fullscreenchange');
  assert.equal(h.stage.classList.contains('is-native-fullscreen'), false); assert.equal(h.stage.classList.contains('is-expanded'), true);
  assert.equal(h.field('intro').hidden, true); assert.equal(h.stage.contains(h.field('review-tab')), true);
  h.emit('cb:screen', { stopN: 15, phase: 'result', score: 100 }); h.field('review-tab').click(); assert.equal(h.field('review-dialog').open, true);
});

test('Library and grown-up tools use the current engine and Spanish status is localized', () => {
  const h = harness({ lang: 'es' }); h.field('start').click(); h.field('library-tab').click(); h.field('grownups-tab').click();
  assert.equal(h.calls.find(c => c[0] === 'library')[1], h.field('library-tab')); assert.equal(h.calls.find(c => c[0] === 'grownups')[1], h.field('grownups-tab'));
  assert.match(h.field('play-status').textContent, /Vista de juego abierta/); assert.doesNotMatch(h.field('play-status').textContent, /Play view/);
});

function openFloating(h) {
  h.field('start').click(); h.field('review-tab').click(); h.field('review-float').click(); h.closeEvents();
  return h.field('review-dialog');
}
function countElements(node, id) {
  return Number(node.id === id) + node.children.reduce((total, child) => total + countElements(child, id), 0);
}
function drag(h, dx, dy, pointerId = 7) {
  const handle = h.field('review-move'), rect = h.field('review-dialog').getBoundingClientRect();
  const clientX = rect.left + 20, clientY = rect.top + 20;
  handle.fire('pointerdown', { button: 0, isPrimary: true, pointerId, clientX, clientY, pointerType: 'mouse' });
  handle.fire('pointermove', { pointerId, clientX: clientX + dx, clientY: clientY + dy });
  handle.fire('pointerup', { pointerId, clientX: clientX + dx, clientY: clientY + dy });
}
function assertWithinViewport(h) {
  const rect = h.field('review-dialog').getBoundingClientRect();
  assert.ok(rect.left >= 8, `left ${rect.left} must keep the titlebar inside the viewport`);
  assert.ok(rect.top >= 8, `top ${rect.top} must keep the titlebar inside the viewport`);
  assert.ok(rect.right <= h.win.innerWidth - 8, `right ${rect.right} must fit the viewport`);
  assert.ok(rect.bottom <= h.win.innerHeight - 8, `bottom ${rect.bottom} must fit the viewport`);
}

test('Floating review drags from its handle, captures the active pointer and releases on completion', () => {
  const h = harness(), dialog = openFloating(h), handle = h.field('review-move');
  const initial = dialog.getBoundingClientRect(), pointerId = 23;
  handle.fire('pointerdown', { button: 0, isPrimary: true, pointerId, clientX: initial.left + 20, clientY: initial.top + 20 });
  assert.equal(handle.hasPointerCapture(pointerId), true);
  handle.fire('pointermove', { pointerId: 24, clientX: 10, clientY: 10 });
  assert.equal(dialog.getBoundingClientRect().left, initial.left, 'another touch must not move this drag');
  handle.fire('pointermove', { pointerId, clientX: initial.left - 100, clientY: initial.top - 100 });
  assert.equal(dialog.getBoundingClientRect().left, initial.left - 120);
  assert.equal(dialog.getBoundingClientRect().top, initial.top - 120);
  handle.fire('pointerup', { pointerId }); assert.equal(handle.hasPointerCapture(pointerId), false);
  const ended = dialog.getBoundingClientRect();
  handle.fire('pointermove', { pointerId, clientX: 900, clientY: 600 });
  assert.deepEqual(dialog.getBoundingClientRect(), ended, 'released pointer movement must not move the window');
});

test('Drag is limited to floating mode and the primary handle; cancelled drags cannot keep moving', () => {
  const h = harness(), handle = h.field('review-move'), dialog = h.field('review-dialog');
  h.field('start').click(); h.field('review-tab').click(); const modal = dialog.getBoundingClientRect();
  drag(h, -100, 100); handle.fire('keydown', { key: 'ArrowLeft' });
  assert.deepEqual(dialog.getBoundingClientRect(), modal);
  h.field('review-float').click(); h.closeEvents(); const initial = dialog.getBoundingClientRect();
  handle.fire('pointerdown', { button: 2, isPrimary: true, pointerId: 1, clientX: 900, clientY: 20 });
  handle.fire('pointermove', { pointerId: 1, clientX: 100, clientY: 500 }); assert.deepEqual(dialog.getBoundingClientRect(), initial);
  handle.fire('pointerdown', { button: 0, isPrimary: false, pointerId: 2, clientX: 900, clientY: 20 });
  handle.fire('pointermove', { pointerId: 2, clientX: 100, clientY: 500 }); assert.deepEqual(dialog.getBoundingClientRect(), initial);
  h.field('review-collapse').fire('pointerdown', { button: 0, isPrimary: true, pointerId: 3, clientX: 900, clientY: 20 });
  handle.fire('pointermove', { pointerId: 3, clientX: 100, clientY: 500 }); assert.deepEqual(dialog.getBoundingClientRect(), initial);
  handle.fire('pointerdown', { button: 0, isPrimary: true, pointerId: 4, clientX: 900, clientY: 20 });
  handle.fire('pointercancel', { pointerId: 4 }); assert.equal(handle.hasPointerCapture(4), false);
  handle.fire('pointermove', { pointerId: 4, clientX: 100, clientY: 500 }); assert.deepEqual(dialog.getBoundingClientRect(), initial);
});

test('Pointer movement, viewport changes and a native resize keep the floating window reachable', () => {
  const h = harness(), dialog = openFloating(h);
  drag(h, -5000, -5000); assertWithinViewport(h); assert.equal(dialog.getBoundingClientRect().left, 8); assert.equal(dialog.getBoundingClientRect().top, 8);
  drag(h, 5000, 5000); assertWithinViewport(h);
  dialog.rect.width = 700; dialog.rect.height = 600; h.observedResize(); assertWithinViewport(h);
  h.resize(375, 640); assertWithinViewport(h);
  h.resize(640, 375); assertWithinViewport(h);
});

test('Move handle supports keyboard steps and Home resets the preferred corner without intercepting text fields', () => {
  const h = harness(), dialog = openFloating(h), handle = h.field('review-move');
  drag(h, -100, -100); const initial = dialog.getBoundingClientRect(); handle.focus();
  handle.fire('keydown', { key: 'ArrowLeft' }); assert.equal(dialog.getBoundingClientRect().left, initial.left - 10);
  handle.fire('keydown', { key: 'ArrowDown', shiftKey: true }); assert.equal(dialog.getBoundingClientRect().top, initial.top + 40);
  const beforeTextKey = dialog.getBoundingClientRect(); h.field('feedback-worked').fire('keydown', { key: 'ArrowRight' });
  assert.deepEqual(dialog.getBoundingClientRect(), beforeTextKey);
  handle.fire('keydown', { key: 'Home' }); assertWithinViewport(h);
  assert.equal(dialog.getBoundingClientRect().left, h.win.innerWidth - dialog.getBoundingClientRect().width - 8);
  assert.equal(dialog.getBoundingClientRect().top, 8); assert.equal(h.doc.activeElement, handle);
});

test('Collapsing preserves the live draft, flushes pending typing and leaves a movable titlebar while the scene changes', () => {
  const h = harness({ liveFeedback: true }), dialog = openFloating(h), toggle = h.field('review-collapse');
  h.emit('cb:screen', { stopN: 3, phase: 'playing' });
  h.field('feedback-fix').value = 'Keep this note while I play'; h.field('feedback-fix').fire('input');
  h.field('feedback-fix').focus(); toggle.click();
  assert.equal(dialog.open, true); assert.equal(dialog.modal, false); assert.equal(h.panel.parentNode, h.field('feedback-window'));
  assert.equal(toggle.getAttribute('aria-expanded'), 'false'); assert.equal(h.field('feedback-window').hidden, true); assert.equal(h.field('review-tools').hidden, true);
  assert.equal(h.doc.activeElement, toggle, 'focus must not stay in hidden form content');
  assert.equal(h.feedbackApp.model.find('feedback', 3).fix, 'Keep this note while I play');
  drag(h, -100, 120); assertWithinViewport(h);
  h.emit('cb:screen', { stopN: 4, phase: 'playing' }); assert.equal(h.field('feedback-fix').value, '');
  toggle.click(); assert.equal(toggle.getAttribute('aria-expanded'), 'true'); assert.equal(h.field('feedback-window').hidden, false); assert.equal(h.field('review-tools').hidden, false);
  assertWithinViewport(h); assert.equal(h.doc.activeElement, toggle);
  h.emit('cb:screen', { stopN: 3, phase: 'playing' }); assert.equal(h.field('feedback-fix').value, 'Keep this note while I play');
});

test('Docking and reopening retain the chosen floating position; popup mode is expanded and centered', () => {
  const h = harness({ liveFeedback: true }), dialog = openFloating(h), toggle = h.field('review-collapse');
  drag(h, -100, 100); const moved = dialog.getBoundingClientRect();
  toggle.click(); h.field('review-close').click(); h.closeEvents();
  assert.equal(h.panel.parentNode, h.field('feedback-home')); assert.equal(h.doc.activeElement, h.field('review-tab'));
  h.field('review-tab').click(); h.closeEvents();
  assert.equal(dialog.modal, true); assert.equal(h.field('feedback-window').hidden, false); assert.equal(h.field('review-tools').hidden, false);
  assert.ok(!dialog.style.left && !dialog.style.top, 'modal must not keep floating position overrides');
  assert.equal(dialog.style['--pt-review-available-width'], undefined); assert.equal(dialog.style['--pt-review-available-height'], undefined);
  h.field('review-float').click(); h.closeEvents();
  assert.equal(toggle.getAttribute('aria-expanded'), 'true'); assert.equal(dialog.getBoundingClientRect().left, moved.left); assert.equal(dialog.getBoundingClientRect().top, moved.top);
  h.field('review-dock').click(); h.closeEvents(); h.field('review-tab').click(); h.field('review-float').click(); h.closeEvents();
  assert.equal(dialog.getBoundingClientRect().left, moved.left); assert.equal(dialog.getBoundingClientRect().top, moved.top);
});

test('Spanish collapse and expand controls are localized and collapse is unavailable in popup mode', () => {
  const h = harness({ lang: 'es' }); h.field('start').click(); h.field('review-tab').click();
  assert.equal(h.field('review-collapse').hidden, true); assert.equal(h.field('review-move').disabled, true);
  h.field('review-float').click(); h.closeEvents(); assert.equal(h.field('review-collapse').hidden, false); assert.equal(h.field('review-move').disabled, false);
  h.field('review-collapse').click(); assert.equal(h.field('review-collapse').textContent, 'Expandir');
  h.field('review-collapse').click(); assert.equal(h.field('review-collapse').textContent, 'Contraer');
});

test('Zoomed visual viewport changes and Home keep the titlebar inside the visible region', () => {
  const h = harness({ visualViewport: { width: 800, height: 650, offsetLeft: 30, offsetTop: 50 } });
  const dialog = openFloating(h), handle = h.field('review-move'); drag(h, -5000, -5000);
  assert.equal(dialog.getBoundingClientRect().left, 38); assert.equal(dialog.getBoundingClientRect().top, 58);
  handle.fire('keydown', { key: 'Home' });
  assert.equal(dialog.getBoundingClientRect().right, 822); assert.equal(dialog.getBoundingClientRect().top, 58);
  h.win.visualViewport.offsetLeft = 80; h.win.visualViewport.offsetTop = 70; h.win.visualViewport.fire('scroll');
  assert.ok(dialog.getBoundingClientRect().left >= 88); assert.equal(dialog.getBoundingClientRect().top, 78);
  h.win.visualViewport.height = 610; h.win.visualViewport.fire('resize');
  assert.ok(dialog.getBoundingClientRect().bottom <= 672);
});

test('Closing during a drag releases capture and the restored dialog cannot be moved by stale events', () => {
  const h = harness(), dialog = openFloating(h), handle = h.field('review-move'), pointerId = 31;
  handle.fire('pointerdown', { button: 0, isPrimary: true, pointerId, clientX: 900, clientY: 20 });
  assert.equal(handle.hasPointerCapture(pointerId), true);
  h.field('review-close').click(); h.closeEvents(); assert.equal(handle.hasPointerCapture(pointerId), false);
  h.field('review-tab').click(); h.closeEvents(); const modal = dialog.getBoundingClientRect();
  handle.fire('pointermove', { pointerId, clientX: 100, clientY: 500 }); assert.deepEqual(dialog.getBoundingClientRect(), modal);
  assert.equal(dialog.classList.contains('is-dragging'), false);
});

test('A pinch-zoomed viewport narrower than the layout constrains expanded and collapsed review through scroll and rotation', () => {
  const h = harness({ visualViewport: { width: 280, height: 400, offsetLeft: 200, offsetTop: 100 } });
  const dialog = openFloating(h), viewport = h.win.visualViewport, toggle = h.field('review-collapse');
  function withinVisibleRegion() {
    const r = dialog.getBoundingClientRect();
    assert.ok(r.left >= viewport.offsetLeft + 8); assert.ok(r.top >= viewport.offsetTop + 8);
    assert.ok(r.right <= viewport.offsetLeft + viewport.width - 8);
    assert.ok(r.bottom <= viewport.offsetTop + viewport.height - 8);
  }
  assert.equal(dialog.getBoundingClientRect().width, 264); assert.equal(dialog.getBoundingClientRect().height, 384); withinVisibleRegion();
  drag(h, 5000, 5000); withinVisibleRegion();
  dialog.rect.width = 900; dialog.rect.height = 900; h.observedResize(); withinVisibleRegion();
  toggle.click(); assert.equal(dialog.getBoundingClientRect().width, 264); assert.equal(dialog.getBoundingClientRect().height, 72); withinVisibleRegion();
  drag(h, -5000, -5000); withinVisibleRegion();
  viewport.offsetLeft = 500; viewport.offsetTop = 200; viewport.fire('scroll'); withinVisibleRegion();
  toggle.click(); withinVisibleRegion(); assert.equal(dialog.getBoundingClientRect().height, 384);
  Object.assign(viewport, { width: 400, height: 280, offsetLeft: 100, offsetTop: 150 }); viewport.fire('resize'); withinVisibleRegion();
  assert.equal(dialog.getBoundingClientRect().height, 264);
  toggle.click(); withinVisibleRegion(); toggle.click(); withinVisibleRegion();
  h.field('review-float').click(); h.closeEvents();
  assert.equal(dialog.modal, true); assert.equal(dialog.style['--pt-review-available-width'], undefined); assert.equal(dialog.style['--pt-review-available-height'], undefined);
});

test('Losing window focus ends an active drag and prevents stale captured motion', () => {
  const h = harness(), dialog = openFloating(h), handle = h.field('review-move'), pointerId = 41;
  const r = dialog.getBoundingClientRect();
  handle.fire('pointerdown', { button: 0, isPrimary: true, pointerId, clientX: r.left + 20, clientY: r.top + 20 });
  assert.equal(handle.hasPointerCapture(pointerId), true); assert.equal(dialog.classList.contains('is-dragging'), true);
  h.win.fire('blur'); assert.equal(handle.hasPointerCapture(pointerId), false); assert.equal(dialog.classList.contains('is-dragging'), false);
  handle.fire('pointermove', { pointerId, clientX: 100, clientY: 100 }); assert.deepEqual(dialog.getBoundingClientRect(), r);
});

test('Docked feedback collapse saves pending typing and expands the same live draft with reachable focus', () => {
  const h = harness({ liveFeedback: true }), toggle = h.field('feedback-dock-collapse'); h.field('start').click();
  h.emit('cb:screen', { stopN: 8, phase: 'playing' });
  h.field('feedback-worked').value = 'The trail made sense'; h.field('feedback-worked').fire('input'); h.field('feedback-worked').focus();
  toggle.click();
  assert.equal(h.panel.parentNode, h.field('feedback-home')); assert.equal(h.panel.hidden, true);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false'); assert.equal(toggle.textContent, 'Expand feedback'); assert.equal(h.doc.activeElement, toggle);
  assert.equal(h.feedbackApp.model.find('feedback', 8).worked, 'The trail made sense');
  assert.equal(h.field('feedback-dock-header').hidden, false); assert.equal(h.field('review-dialog').open, false);
  toggle.click(); assert.equal(h.panel.hidden, false); assert.equal(toggle.getAttribute('aria-expanded'), 'true'); assert.equal(toggle.textContent, 'Collapse feedback');
  assert.equal(h.field('feedback-worked').value, 'The trail made sense'); assert.equal(h.doc.activeElement, toggle);
});

test('Opening Review from a collapsed dock unhides the shared form and plain close restores dock preference', () => {
  const h = harness({ liveFeedback: true }), toggle = h.field('feedback-dock-collapse'); h.field('start').click();
  h.field('feedback-fix').value = 'Before opening Review'; h.field('feedback-fix').fire('input'); toggle.click(); h.field('review-tab').click();
  assert.equal(h.panel.parentNode, h.field('feedback-window')); assert.equal(h.panel.hidden, false); assert.equal(h.field('review-dialog').modal, true);
  assert.equal(h.field('feedback-dock-header').hidden, true); assert.equal(h.field('feedback-fix').value, 'Before opening Review');
  h.field('feedback-fix').value = 'Edited in the popup'; h.field('feedback-fix').fire('input');
  h.field('review-close').click(); h.closeEvents();
  assert.equal(h.panel.parentNode, h.field('feedback-home')); assert.equal(h.panel.hidden, true); assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(h.field('feedback-dock-header').hidden, false); assert.equal(h.doc.activeElement, h.field('review-tab'));
  assert.equal(h.feedbackApp.model.find('feedback', 0).fix, 'Edited in the popup');
  toggle.click(); assert.equal(h.panel.hidden, false); assert.equal(h.field('feedback-fix').value, 'Edited in the popup');
});

test('Dock Float opens a collapsed panel, preserves its draft through floating collapse and returns focus to its opener', () => {
  const h = harness({ liveFeedback: true }), toggle = h.field('feedback-dock-collapse'), float = h.field('feedback-dock-float'); h.field('start').click();
  h.emit('cb:screen', { stopN: 5, phase: 'playing' }); toggle.click(); float.click();
  assert.equal(h.field('review-dialog').open, true); assert.equal(h.field('review-dialog').modal, false); assert.equal(h.panel.hidden, false);
  assert.equal(h.field('feedback-dock-header').hidden, true); assert.equal(h.panel.parentNode, h.field('feedback-window'));
  h.field('feedback-fix').value = 'A floating note'; h.field('feedback-fix').fire('input'); h.field('review-collapse').click();
  assert.equal(h.feedbackApp.model.find('feedback', 5).fix, 'A floating note');
  h.field('review-close').click(); h.closeEvents();
  assert.equal(h.panel.hidden, true); assert.equal(h.panel.parentNode, h.field('feedback-home')); assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(h.field('feedback-dock-header').hidden, false); assert.equal(h.doc.activeElement, float);
  float.click(); assert.equal(h.panel.hidden, false); assert.equal(h.field('feedback-window').hidden, false); assert.equal(h.field('review-collapse').getAttribute('aria-expanded'), 'true');
  assert.equal(h.field('feedback-fix').value, 'A floating note');
  h.field('review-close').click(); h.closeEvents();
  for (let cycle = 0; cycle < 3; cycle++) {
    toggle.click(); float.click(); assert.equal(h.field('feedback-dock-header').hidden, true);
    h.field('review-collapse').click(); h.field('review-collapse').click(); h.field('review-close').click(); h.closeEvents();
    assert.equal(h.field('feedback-dock-header').hidden, false); assert.equal(h.panel.parentNode, h.field('feedback-home'));
    assert.equal(countElements(h.doc.body, 'pt-feedback'), 1); assert.equal(countElements(h.doc.body, 'pt-feedback-form'), 1);
    assert.equal(h.field('feedback-fix').value, 'A floating note');
  }
});

test('Show below game explicitly expands a previously collapsed dock and focuses its visible heading', () => {
  const h = harness({ liveFeedback: true }), toggle = h.field('feedback-dock-collapse'); h.field('start').click(); toggle.click();
  h.field('feedback-dock-float').click(); h.field('feedback-fix').value = 'Show this saved note below'; h.field('feedback-fix').fire('input');
  h.field('review-dock').click(); h.closeEvents();
  assert.equal(h.field('review-dialog').open, false); assert.equal(h.panel.parentNode, h.field('feedback-home')); assert.equal(h.panel.hidden, false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true'); assert.equal(h.field('feedback-dock-header').hidden, false);
  assert.equal(h.doc.activeElement, h.field('feedback-h')); assert.equal(h.panel.scrolled, true);
  assert.equal(h.feedbackApp.model.find('feedback', 0).fix, 'Show this saved note below');
  h.field('review-tab').click(); h.field('review-close').click(); h.closeEvents(); assert.equal(h.panel.hidden, false);
});

test('Spanish dock controls stay localized and collapsed feedback follows scene changes without losing earlier notes', () => {
  const h = harness({ lang: 'es', liveFeedback: true }), toggle = h.field('feedback-dock-collapse'); h.field('start').click();
  h.emit('cb:screen', { stopN: 2, phase: 'playing' }); h.field('feedback-fix').value = 'Una sugerencia'; h.field('feedback-fix').fire('input'); toggle.click();
  assert.equal(toggle.textContent, 'Expandir comentarios'); h.emit('cb:screen', { stopN: 3, phase: 'playing' });
  assert.equal(h.panel.hidden, true); assert.equal(h.field('feedback-fix').value, '');
  toggle.click(); assert.equal(toggle.textContent, 'Contraer comentarios'); assert.equal(h.panel.hidden, false);
  h.emit('cb:screen', { stopN: 2, phase: 'playing' }); assert.equal(h.field('feedback-fix').value, 'Una sugerencia');
});
