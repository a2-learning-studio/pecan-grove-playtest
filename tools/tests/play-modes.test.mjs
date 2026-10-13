import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mapOrderControl} from '../../assets/games/community-builders/engine/map-layout.js';
const require=createRequire(import.meta.url);
const {functionSource,sectionSource,objectStatementSource}=require('./core-fragments.cjs');
class Node {
  constructor(tag, attrs = {}, kids = []) { this.tag = tag; this.attrs = attrs || {}; this.children = kids; kids.forEach(k => { if (k) k.parent = this; }); }
  appendChild(n) { this.children.push(n); n.parent = this; }
  append(...nodes) { nodes.forEach(node => this.appendChild(node)); }
  addEventListener(name, handler) { (this.events ||= {})[name] = handler; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  get textContent() { return (this.attrs.text || '') + this.children.map(k => k?.textContent || '').join(' '); }
  closest(tag) { for (let p = this; p; p = p.parent) if (p.tag === tag) return p; return null; }
  get isConnected() { return true; }
}
function libraryHarness(lang) {
  const c = vm.createContext({ L: lang, window: {}, mapOrderControl,uid:0,CFG:{},cfgSave(){}, W: { library: lang === 'es' ? 'Modo biblioteca / clase' : 'Library / Class mode' }, vOn: true,
    h: (tag, attrs, kids = []) => new Node(tag, attrs, kids), stops: 0, settings: 0, groups: 0, identity: 'same-player-session',
    vStop() { c.stops++; }, setVoice(on) { c.vOn = on; }, openSettings(opener) { c.settings++; c.nextOpener = opener; },
    openWho(opener) { c.groups++; c.nextOpener = opener; },
    btn(label, cls, fn) { const n = new Node('button', { text: label, class: cls }); n.click = fn; return n; },
    dialog(title, body, opener, close, opt) { const d = new Node('dialog', { title, opt }, body); d.close = () => { d.closed = true; }; c.lastDialog = d; return d; }
  });
  vm.runInContext(readFileSync(new URL('../../assets/games/community-builders/locales/catalog.js', import.meta.url), 'utf8'), c);
  vm.runInContext(sectionSource('words'), c);
  vm.runInContext(functionSource('openLibraryMode'), c);
  return c;
}
function buttons(node) { return node.children.flatMap(n => n ? (n.tag === 'button' ? [n] : buttons(n)) : []); }
function publicHookFixture(context) {
  for (const name of ['snapshot', 'resume', 'pausePlay', 'resumePlay', 'startStop', 'showMap', 'showTitle', 'openSettings', 'motionAllowed']) {
    if (!context[name]) context[name] = () => {};
  }
  return context;
}

test('Library setup is bilingual and applies quiet play without changing player identity', () => {
  for (const lang of ['en', 'es']) {
    const c = libraryHarness(lang), opener = {};
    const d = c.openLibraryMode(opener), actions = buttons(d);
    assert.equal(c.vOn, true, 'Opening setup does not silently alter a saved preference');
    assert.equal(c.stops, 1, 'Current narration stops while setup opens');
    assert.equal(actions[0].attrs['aria-pressed'], 'false');
    assert.match(d.textContent, lang === 'es' ? /Todas las instrucciones siguen en pantalla/ : /All instructions stay on screen/);
    actions[0].click();
    assert.equal(c.vOn, false); assert.equal(d.closed, true); assert.equal(c.identity, 'same-player-session');
    const quiet = c.openLibraryMode(opener);
    assert.equal(buttons(quiet)[0].attrs['aria-pressed'], 'true');
    assert.match(quiet.textContent, lang === 'es' ? /modo silencioso está activado/ : /Quiet mode is on/);
  }
});
test('Library setup exposes sound/caption settings and the existing group tools', () => {
  for (const index of [1, 2]) {
    const c = libraryHarness('en'), opener = {};
    const d = c.openLibraryMode(opener); buttons(d)[index].click();
    assert.equal(d.closed, true); assert.equal(c.nextOpener, opener);
    assert.equal(c.settings, index === 1 ? 1 : 0); assert.equal(c.groups, index === 2 ? 1 : 0);
  }
});

test('Fullscreen keeps the surrounding feedback and toolbar in the fullscreen subtree', () => {
  for (const wrapped of [true, false]) {
    const c = vm.createContext({ document: { fullscreenEnabled: true }, window: {}, calls: [], root: { closest: () => wrapped ? c.stage : null,
      requestFullscreen() { c.calls.push('root'); return Promise.resolve(); } },
      stage: { requestFullscreen() { c.calls.push('stage'); return Promise.resolve(); } } });
    vm.runInContext(['fsTarget','fsEl','isGameFS','toggleFS'].map(functionSource).join('\n'), c);
    c.toggleFS(); assert.deepEqual([...c.calls], [wrapped ? 'stage' : 'root']);
    c.document.fullscreenElement = wrapped ? c.stage : c.root;
    c.document.exitFullscreen = () => c.calls.push('exit'); c.toggleFS();
    assert.equal(c.calls.at(-1), 'exit');
  }
});

test('Quiet mode blocks replay and sample audio until voice is explicitly enabled', () => {
  const played = [], c = vm.createContext({ vOn: false, vAudio: null, vEl: null, vHeard: {}, vLast: {}, BASE: 'game/', CFG: { vol: 1, rate: 1 },gamePaused:false,restoring:false,
    performance: { now: () => 1 }, vUnread() {}, vMark() {}, vFollow() {}, Audio: class { constructor(src) { played.push(src); } play() { return Promise.resolve(); } } });
  vm.runInContext(functionSource('vPlay'), c);
  c.vPlay({ f: 'en/line.mp3', k: 'guide' }, {}); c.vPlay({ f: 'en/sample.mp3', k: 'sample' }, {});
  assert.equal(played.length, 0);
  c.vOn = true; c.vPlay({ f: 'en/line.mp3', k: 'guide' }, {});
  assert.deepEqual(played, ['game/voice/en/line.mp3']);
});

test('Intro/review suspension stops audio without altering the saved voice choice', () => {
  const c = vm.createContext({ vSuspended: false, CFG: { voice: true }, stop: 0, ink: 0, vStop() { c.stop++; }, vInkClear() { c.ink++; } });
  vm.runInContext(functionSource('suspendVoice'), c);
  c.suspendVoice(true); assert.equal(c.stop, 1); assert.equal(c.ink, 1); assert.equal(c.vSuspended, true); assert.equal(c.CFG.voice, true);
  c.suspendVoice(false); assert.equal(c.stop, 1); assert.equal(c.vSuspended, false); assert.equal(c.CFG.voice, true);
});

test('Suspended screens still attach replay controls but never autoplay new lines', () => {
  const c = vm.createContext({ vIdx: {}, vSuspended: true, vOn: true, acted: true, CFG: { auto: true }, vHeard: {}, vAudio: null,gamePaused:false,restoring:false,restoreVoice:()=>false,
    root: { hasAttribute: () => false }, performance: { now: () => 10 }, played: [], vQueue: [],
    vFind: () => ({ f: 'en/line.mp3', k: 'guide' }), vWords() {}, vAttach(el, button) { el.button = button; },
    h: (tag, attrs) => ({ tag, attrs }), ico() {}, X: { replay: 'Replay', voiceOff: 'Voice is off' }, vStop() {}, vPlay(item) { c.played.push(item.f); } });
  vm.runInContext(functionSource('vScan'), c);
  const line = () => {const attrs={};return{querySelectorAll:()=>[],closest:()=>null,setAttribute(key,value){attrs[key]=String(value);},getAttribute:key=>attrs[key]??null,contains:()=>false};};
  const first = line(); c.vScan([first]); assert.ok(first.button); assert.equal(c.played.length, 0);
  c.vSuspended = false; c.vScan([line()]); assert.deepEqual([...c.played], ['en/line.mp3']);
});

test('Start opens the title menu from every prior screen and respects saved quiet preference', () => {
  for (const mode of ['title', 'map', 'stop']) {
    const c = vm.createContext({ mode, booted: true, acted: false, playRequested: false, window: {}, maps: 0,titles:0, muted: 0, scans: 0,
      root: { removeAttribute(k) { c.removed = k; } }, main: { querySelector: () => null }, suspendVoice(v) { c.suspended = v; },
      setVoice(v) { c.muted++; c.voice = v; }, showMap() { c.maps++; },showTitle(){c.titles++;}, vLoad() {}, vScan() { c.scans++; },
      openLibraryMode() {}, openGrownups() {} });
    publicHookFixture(c);
    vm.runInContext(objectStatementSource('CommunityBuilders'), c);
    c.window.CommunityBuilders.enterPlay({ quiet: false });
    assert.equal(c.removed, 'data-playtest-paused'); assert.equal(c.suspended, false); assert.equal(c.maps,0);assert.equal(c.titles,1);
    assert.equal(c.muted, 0, 'Regular Start respects the existing saved sound setting');
    c.window.CommunityBuilders.enterPlay({ quiet: true }); assert.equal(c.muted, 1); assert.equal(c.voice, false);
  }
});

test('Starting while stop modules load opens the title once and a late boot cannot replace the chosen screen', () => {
  const c = vm.createContext({ mode: 'title', booted: false, acted: false, playRequested: false, window: {}, maps: 0, titles: 0,
    store: { players: { you: { stops: {} } } }, root: { removeAttribute() {} }, main: { querySelector: () => null }, suspendVoice() {},
    setVoice() {}, showMap() { c.maps++; c.mode = 'map'; }, showTitle() { c.titles++; c.mode = 'title'; }, vLoad() {}, vScan() {},
    openLibraryMode() {}, openGrownups() {} });
  publicHookFixture(c);
  vm.runInContext(objectStatementSource('CommunityBuilders') + functionSource('boot'), c);
  c.window.CommunityBuilders.enterPlay({ quiet: false });assert.equal(c.mode,'title');assert.equal(c.titles,1);
  c.showMap();c.boot();
  assert.equal(c.mode, 'map'); assert.equal(c.maps, 1); assert.equal(c.titles, 1);
});

test('Changing Voice updates replay and sample disabled states together', () => {
  const replay = { classList: { contains: () => false } }, sample = { classList: { contains: () => true } };
  const c = vm.createContext({ vOn: true, CFG: { voice: true }, cfgSave() {}, vStop() {}, vInkClear() {}, say() {},
    root: { querySelectorAll: s => s === '.cb-voice' ? [] : [replay, sample], classList: { toggle() {} } },
    X: { sample: 'Hear a sample', replay: 'Hear it again', voiceOff: 'Voice is off' } });
  vm.runInContext(functionSource('setVoice'), c);
  c.setVoice(false, false); assert.equal(replay.disabled, true); assert.equal(sample.disabled, true); assert.equal(replay.title, 'Voice is off');
  c.setVoice(true, false); assert.equal(replay.disabled, false); assert.equal(sample.disabled, false); assert.equal(sample.title, 'Hear a sample');
});
