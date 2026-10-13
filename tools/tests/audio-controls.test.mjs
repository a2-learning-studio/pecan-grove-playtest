import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {functionSource}=require('./core-fragments.cjs');
function harness() {
  const events = [];
  const button = { setAttribute(k, v) { this[k] = v; }, querySelector() { return null; } };
  class Audio {
    constructor(src) { this.src = src; this.paused = false; this.currentTime = 0; events.push(['new', src]); }
    pause() { this.paused = true; events.push(['pause', this.src]); }
    play() { this.paused = false; events.push(['play', this.src]); return Promise.resolve(); }
  }
  const c = vm.createContext({ Audio, BASE: 'game/', performance: { now: () => 1000 },
    CFG: { voice: true, vol: 0.6, rate: 1.15 }, vOn: true, vAudio: null, vEl: null,
    restoring:false,gamePaused:false,restoreVoice:()=>false,pendingVoice:null,voiceSnapshot:()=>null,
    clear:()=>{},setAuthoredMarkup:()=>{},
    vQueue: [], vRead: {}, vLast: {}, vLastItem: null, vLastEl: null, vHeard: {},
    vUnread() { c.vRead = null; events.push(['unread']); },
    vMark(el, on) { if (el) el.speaking = on; },
    vFollow(a, item, el) { events.push(['follow', item.f]); },
    cfgSave() { events.push(['save']); }, vInkClear() { events.push(['clear']); },
    root: { querySelectorAll(sel) { return sel === '.cb-voice' ? [button] : []; }, querySelector() { return null; }, classList: { toggle() {} } },
    ico: () => ({}), X: { voiceOn: 'on', voiceOff: 'off', settings: 'Settings' },
    say: s => events.push(['say', s]),
    main: { querySelectorAll: () => [] }, window: { innerHeight: 800 },
    setOpen: false, vSuspended: false, vLoad: () => {}, h: () => ({}), fillSettings: () => {},
    mode: 'stop', dialog(title, body, opener, close) { c.closeDialog = close; return {}; },
  });
  const functions = ['vStop','suspendVoice','vPlay','setVoice','replayNow','openSettings'].map(functionSource);
  vm.runInContext(functions.join('\n'), c);
  return { c, events, button, el: () => ({ isConnected: true, speaking: false }) };
}

test('Playback interrupts the previous clip and applies volume/rate', () => {
  const { c, el } = harness();
  const firstEl = el(), secondEl = el();
  c.vPlay({ f: 'en/one.mp3', k: 'guide' }, firstEl);
  const first = c.vAudio;
  c.vPlay({ f: 'en/two.mp3', k: 'guide' }, secondEl);
  assert.equal(first.paused, true);
  assert.equal(firstEl.speaking, false);
  assert.equal(secondEl.speaking, true);
  assert.equal(c.vAudio.volume, 0.6);
  assert.equal(c.vAudio.playbackRate, 1.15);
  assert.equal(c.vHeard['en/two.mp3'], 1);
  assert.equal(c.vLastItem.f, 'en/two.mp3');
});

test('Stop clears queue, highlight, read-along state, and active audio', () => {
  const { c, el } = harness();
  const line = el(); c.vPlay({ f: 'en/one.mp3', k: 'guide' }, line);
  const active = c.vAudio; c.vQueue = [{ item: { f: 'en/next.mp3' }, el: el() }];
  c.vStop();
  assert.equal(active.paused, true);
  assert.equal(c.vAudio, null); assert.equal(c.vEl, null); assert.equal(c.vRead, null);
  assert.equal(c.vQueue.length, 0); assert.equal(line.speaking, false);
});

test('End and media error advance only to connected lines; stale callbacks are ignored', () => {
  const { c, el } = harness();
  c.vPlay({ f: 'en/one.mp3', k: 'guide' }, el());
  const first = c.vAudio;
  c.vQueue = [{ item: { f: 'en/two.mp3', k: 'guide' }, el: el() }];
  first.onended(); const second = c.vAudio;
  assert.equal(second.src, 'game/voice/en/two.mp3');
  first.onerror(); assert.equal(c.vAudio, second);
  c.vQueue = [{ item: { f: 'en/removed.mp3' }, el: { isConnected: false } }];
  second.onerror(); assert.equal(c.vAudio, null); assert.equal(c.vQueue.length, 0);
});

test('Rejected play promise cleans up without throwing', async () => {
  const { c, el } = harness();
  c.Audio.prototype.play = function () { return Promise.reject(new Error('blocked')); };
  const line = el(); c.vPlay({ f: 'es/one.mp3', k: 'guide' }, line);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(c.vAudio, null); assert.equal(line.speaking, false);
});

test('Voice off stops playback and updates persisted state and controls', () => {
  const { c, el, events, button } = harness();
  c.vPlay({ f: 'es/one.mp3', k: 'guide' }, el());
  c.setVoice(false, true);
  assert.equal(c.vAudio, null); assert.equal(c.vOn, false); assert.equal(c.CFG.voice, false);
  assert.equal(button['aria-pressed'], 'false'); assert.ok(events.some(e => e[0] === 'save'));
});

test('Replay restarts the last connected line, then falls back to a visible replay control', () => {
  const { c, el } = harness();
  c.vPlay({ f: 'en/one.mp3', k: 'guide' }, el());
  const first = c.vAudio; c.replayNow();
  assert.notEqual(c.vAudio, first); assert.equal(c.vAudio.src, first.src);
  c.vLastEl.isConnected = false;
  let clicks = 0;
  c.main.querySelectorAll = () => [{ getBoundingClientRect: () => ({ width: 20, top: 10, bottom: 30 }), click: () => clicks++ }];
  c.replayNow(); assert.equal(clicks, 1);
});

test('Settings pauses and resumes the same connected active line', () => {
  const { c, el } = harness();
  c.vPlay({ f: 'en/one.mp3', k: 'guide' }, el());
  const held = c.vAudio;
  c.openSettings(el()); assert.equal(held.paused, true);
  c.closeDialog(); assert.equal(held.paused, false); assert.equal(c.setOpen, false);
});

test('Closing Settings cannot resume replaced audio or audio disabled while open', () => {
  for (const action of ['replace', 'disable', 'detach']) {
    const { c, el } = harness();
    c.vPlay({ f: 'en/one.mp3', k: 'guide' }, el());
    const held = c.vAudio;
    c.openSettings(el());
    if (action === 'replace') c.vPlay({ f: 'en/new.mp3', k: 'guide' }, el());
    if (action === 'disable') c.setVoice(false, false);
    if (action === 'detach') c.vEl.isConnected = false;
    c.closeDialog(); assert.equal(held.paused, true);
  }
});

test('Read-along advances from media time and clears the final word at the clip endpoint', () => {
  const { c } = harness();
  function word(textContent) {
    return { textContent, classList: { active: false, toggle(k, on) { this.active = on; }, add() { this.active = true; }, remove() { this.active = false; } } };
  }
  const words = ['one', 'two', 'three'].map(word);
  c.vClips = { 'en/line.mp3': { s: 'one two three', t: [0, 100, 200, 300], h: 0 } };
  c.vTok = s => s; c.vAlign = () => 0; c.vCues = () => []; c.vWho = () => 'Guide';
  c.capChunks = () => [[0, 2]]; c.capDraw = i => { c.lastCaptionWord = i; };
  c.requestAnimationFrame = f => { c.nextFrame = f; return 1; };
  c.CFG.words = true; c.CFG.cap = true; c.capBox = {}; c.cap = { hidden: true };
  const line = { isConnected: true, querySelectorAll: () => words, closest: () => null };
  const audio = { currentTime: 0 }; c.vAudio = audio;
  vm.runInContext(functionSource('vFollow'), c);
  c.vFollow(audio, { f: 'en/line.mp3' }, line);
  assert.equal(c.cap.hidden, false);
  audio.currentTime = 0.15; c.nextFrame();
  assert.equal(c.lastCaptionWord, 1); assert.equal(words[1].classList.active, true);
  audio.currentTime = 0.3; c.nextFrame();
  assert.equal(c.lastCaptionWord, -1); assert.equal(words[1].classList.active, false);
});

test('Voice scan excludes an explicitly unvoiced subtree before text matching', () => {
  const { c } = harness();
  let matches = 0;
  const ignored = { querySelectorAll: () => [], closest: selector => selector.includes('[data-cb-novoice]') ? {} : null };
  c.vIdx = {}; c.vFind = () => { matches++; return null; };
  vm.runInContext(functionSource('vScan'), c);
  c.vScan([ignored]);
  assert.equal(matches, 0);
});
