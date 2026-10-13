/* Offline release regression. This is a DOM double, not browser automation: it exercises
   actual authored callbacks but cannot prove layout, focus, speech, touch or screen-reader behavior. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.join(__dirname, '../assets/games/community-builders');
const core = fs.readFileSync(path.join(base, 'cb.js'), 'utf8');
const fragments = require(path.join(__dirname, '../tools/tests/core-fragments.cjs'));

class Element {
  constructor(tag, attrs = {}, children = []) {
    this.tagName = tag.toLowerCase(); this.attrs = {}; this.children = []; this.listeners = {};
    this.style = { setProperty() {}, removeProperty() {}, getPropertyValue() { return ''; } };
    this.offsetHeight = this.clientHeight = 70; this.clientWidth = this.scrollWidth = 900;
    this.scrollTop = this.scrollLeft = 0; this.isConnected = true;
    this.classList = {
      contains: t => this.classes().includes(t),
      toggle: (t, force) => { const on = force === undefined ? !this.classes().includes(t) : force;
        this.attrs.class = [...new Set(this.classes().filter(c => c !== t).concat(on ? t : []))].join(' '); },
      add: (...ts) => { ts.forEach(t => this.classList.toggle(t, true)); },
      remove: (...ts) => { ts.forEach(t => this.classList.toggle(t, false)); }
    };
    for (const [k, v] of Object.entries(attrs || {})) if (v !== null && v !== undefined && v !== false) {
      if (k === 'text') this.textContent = v;
      else if (k.startsWith('on')) this.addEventListener(k.slice(2), v);
      else this.setAttribute(k, v === true ? '' : v);
    }
    children.filter(c => c !== null && c !== undefined && c !== false).forEach(c => this.appendChild(c));
  }
  classes() { return String(this.attrs.class || '').split(/\s+/).filter(Boolean); }
  appendChild(c) { if (c instanceof Element && c.parentNode) c.parentNode.removeChild(c); this.children.push(c); if (c instanceof Element) c.parentNode = this; return c; }
  removeChild(c) { const i = this.children.indexOf(c); assert.ok(i >= 0); this.children.splice(i, 1); if (c instanceof Element) c.parentNode = null; }
  replaceChild(next, prev) { const i = this.children.indexOf(prev); assert.ok(i >= 0); this.children[i] = next; next.parentNode = this; prev.parentNode = null; }
  insertBefore(c, before) { if (!before) return this.appendChild(c); const i = this.children.indexOf(before); assert.ok(i >= 0); this.children.splice(i, 0, c); c.parentNode = this; return c; }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
  get firstChild() { return this.children[0] || null; } get lastChild() { return this.children[this.children.length - 1] || null; }
  get nextSibling() { return this.parentNode ? this.parentNode.children[this.parentNode.children.indexOf(this) + 1] : null; }
  get parentElement() { return this.parentNode || null; }
  get className() { return this.attrs.class || ''; } set className(v) { this.attrs.class = v; }
  setAttribute(k, v) { this.attrs[k] = String(v); } getAttribute(k) { return this.attrs[k] === undefined ? null : this.attrs[k]; }
  removeAttribute(k) { delete this.attrs[k]; } hasAttribute(k) { return this.attrs[k] !== undefined; }
  get disabled() { return this.hasAttribute('disabled'); } set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
  get textContent() { return String(this.attrs.text || '') + this.children.map(c => c instanceof Element ? c.textContent : String(c)).join(''); }
  set textContent(v) { this.attrs.text = String(v); this.children = []; }
  set innerHTML(v) { this.attrs.html = v; this.children = []; } get innerHTML() { return this.attrs.html || ''; }
  matches(selector) {
    if (selector.includes(',')) return selector.split(',').some(s => this.matches(s.trim()));
    const tag = selector.match(/^[a-z]+/); if (tag && this.tagName !== tag[0]) return false;
    for (const m of selector.matchAll(/\.([\w-]+)/g)) if (!this.classes().includes(m[1])) return false;
    for (const m of selector.matchAll(/\[([\w-]+)(?:=["']?([^"'\]]*)["']?)?\]/g)) {
      if (!this.hasAttribute(m[1]) || (m[2] !== undefined && this.getAttribute(m[1]) !== m[2])) return false;
    }
    return true;
  }
  closest(sel) { for (let e = this; e; e = e.parentNode) if (e.matches(sel)) return e; return null; }
  querySelectorAll(sel) {
    if (sel.includes(',')) return [...new Set(sel.split(',').flatMap(s => this.querySelectorAll(s.trim())))];
    const parts = sel.replace(/\s*>\s*/g, ' ').split(/\s+/), out = [];
    const walk = e => e.children.forEach(c => { if (!(c instanceof Element)) return;
      if (c.matches(parts[parts.length - 1])) { let a = c.parentNode, p = parts.length - 2;
        while (a && p >= 0) { if (a.matches(parts[p])) p--; a = a.parentNode; } if (p < 0) out.push(c); }
      walk(c); }); walk(this); return out;
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  addEventListener(k, fn) { (this.listeners[k] ||= []).push(fn); }
  removeEventListener(k, fn) { this.listeners[k] = (this.listeners[k] || []).filter(x => x !== fn); }
  contains(c) { return c === this || this.children.some(x => x instanceof Element && x.contains(c)); }
  focus() { this.focused = true; } scrollIntoView() {} scrollTo() {} scrollBy() {}
  getBoundingClientRect() { return { top: 0, left: 0, right: 900, bottom: 70, width: 900, height: 70 }; }
}

function harness(lang, seed = 1, savedRecords = {}) {
  let screen = new Element('main'), registration, dialog, finished = false;
  const saves = [], timers = [];
  const h = (tag, attrs, children = []) => new Element(tag, attrs, children);
  const doc = { documentElement: { lang }, title: '', activeElement: null,
    createElement: tag => h(tag), createElementNS: (_, tag) => h(tag),
    createTextNode: text => String(text), querySelector: sel => screen.querySelector(sel), getElementById: id => screen.querySelectorAll('[id]').find(e => e.getAttribute('id') === id),
    querySelectorAll: sel => screen.querySelectorAll(sel), addEventListener() {}, removeEventListener() {} };
  let rng = seed;
  const random = () => { rng = (1664525 * rng + 1013904223) >>> 0; return rng / 4294967296; };
  const context = vm.createContext({ L: lang, document: doc, console, URL, URLSearchParams, getComputedStyle: () => ({ display: 'block', position: 'static' }),
    window: { CommunityBuilders: { register: x => { registration = x; }, setAuthoredMarkup(element, markup) { element.authoredMarkup = markup; return element; }, clear(element) { while (element.firstChild) element.removeChild(element.firstChild); return element; } }, innerHeight: 1000, pageYOffset: 0,
      matchMedia: () => ({ matches: true }), scrollTo() {}, scrollBy() {}, addEventListener() {}, removeEventListener() {} },
    Date: { now: () => context.clock }, clock: 1000, Math: Object.assign(Object.create(Math), { random }),
    setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout() {},
    requestAnimationFrame: fn => { timers.push(fn); return timers.length; }, cancelAnimationFrame() {} });
  vm.runInContext(fs.readFileSync(path.join(base, 'locales/catalog.js'), 'utf8'), context);
  vm.runInContext(fragments.dataSource(), context);
  const api = {
    ...context, L: lang, REDUCED: true, h, input: { on() { return () => {}; } },
    t2: p => Array.isArray(p) ? p[lang === 'es' ? 1 : 0] : p,
    nm: context.nm, nmCap: context.nmCap, nbById: id => context.NB.find(n => n.id === id), IC: {},
    rec: id => savedRecords[id] || null, team: () => null,
    shuffle: arr => { arr = arr.slice(); for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; },
    pick: arr => arr[Math.floor(random() * arr.length)],
    img: () => h('img'), ico: () => h('svg'), story: () => h('svg'), mono: () => h('span'),
    crop: (_, cls, children = []) => h('div', { class: cls }, children),
    btn: (text, cls, onclick) => h('button', { class: cls, onclick }, [h('svg'), h('span', { text })]),
    coach: text => h('p', {}, [h('svg'), h('span', { text })]), fb: text => h('div', { class: 'cb-feedback' }, [h('svg'), h('p', { text })]), stopHud: () => h('div'),
    setTitle() {}, X: { parts3: [null, null, null] }, screen: children => { screen = h('main', {}, children); }, frame() {}, say() {}, endPlay() {},
    saveRound: (id, score, detail) => { assert.ok(Number.isInteger(score) && score >= 0 && score <= 100, `valid score ${id}: ${score}`);
      saves.push({ id, score, detail }); savedRecords[id] = { ...savedRecords[id], ...detail, best: score }; return { first: true, best: score }; },
    scoreCard: (_, score, info, tip) => h('div', { class: 'cb-card' }, [h('p', { class: 'cb-card__tip', text: tip }), h('div', { class: 'cb-card__can' })]),
    finishRound: (_, card, row) => { screen = h('main', {}, [card, row]); finished = true; },
    cardButtons: (_, restart, gu) => h('div', { class: 'cb-card__btns' }, [api.btn('Again', '', restart), gu]),
    restart: () => () => {}, showMap() {},
    dialog: (title, children, opener, close) => { dialog = h('dialog', { text: title }, children);
      dialog.close = () => { const old = dialog; dialog = null; if (close) close(); return old; }; return dialog; }
  };
  context.L = lang; // data uses L during evaluation below
  const flush = () => { let n = 0; while (timers.length && n++ < 100) timers.shift()(); assert.ok(n < 100, 'timers settle'); };
  const click = el => { assert.ok(el, 'control exists'); assert.ok(!el.disabled, 'native disabled control cannot be clicked'); context.clock += 1000;
    for (const fn of [...(el.listeners.click || [])]) fn({ detail: 0, target: el, currentTarget: el, preventDefault() {}, stopPropagation() {} }); flush(); };
  return { api, context, saves, flush, click, get screen() { return screen; }, get dialog() { return dialog; }, get finished() { return finished; },
    button: text => screen.querySelectorAll('button').find(b => b.textContent === text),
    openCore(n) {
      api.X = { parts3: [null, null, null] }; api.setTitle = function () {};
      const file = n === 3 ? '03-listen-to-every-neighbor.js' : '04-fact-or-rumor.js';
      let source = fs.readFileSync(path.join(base, 'stops', file), 'utf8');
      source = n === 3 ? source.replace('\n    part1();', '\n    globalThis.flow = {lines: lines, set: set}; globalThis.WISHES = WISHES;\n    part1();') : source.replace('\n    startScreen();', '\n    globalThis.flow = {round: round}; globalThis.S4 = S4;\n    startScreen();');
      vm.runInContext(source, context, { filename: file }); assert.ok(registration?.run); registration.run(api, context.STOPS.find(s => s.id === registration.id)); flush();
    },
    open(file, expose = '') { let source = fs.readFileSync(path.join(base, 'stops', file), 'utf8');
      if (expose) { const re = /\n(\s+)(intro|start)\(\);\r?\n(\s+)\}/;
        assert.match(source, re); source = source.replace(re, `\n$1globalThis.flow = ${expose};\n$1$2();\n$3}`); }
      vm.runInContext(source, context, { filename: file }); assert.ok(registration?.run); registration.run(api, context.STOPS.find(s => s.id === registration.id)); flush(); return registration; }
  };
}

for (const lang of ['en', 'es']) {
  test(`${lang}: Stop 8 asks both reasons, finds two shared solutions, finishes at100`, () => {
    const r = harness(lang, 17); r.open('08-disagree-kindly.js', '{round: round, fits: fits}'); r.click(r.screen.querySelector('.cb-btn--go'));
    for (const side of ['A', 'B']) { r.click(r.screen.querySelector(`[data-s08="nb-${side}"]`)); r.click(r.screen.querySelector(`[data-s08="ask-${side}"]`)); }
    for (const card of r.context.flow.round.cards.filter(c => r.context.flow.fits(c, 'A') && r.context.flow.fits(c, 'B'))) r.click(r.screen.querySelector(`[data-s08="card-${card.i}"]`));
    r.click(r.screen.querySelector('[data-s08="see"]')); r.click(r.screen.querySelector('.cb-btn--go'));
    assert.equal(r.saves.length, 1); assert.equal(r.saves[0].score, 100);
  });
  for (const retry of [false, true]) test(`${lang}: Stop 9 allfive chairs with retry=${retry}`, () => {
    const r = harness(lang, 5); r.open('09-include-every-voice.js', '{seats: seats}'); r.click(r.screen.querySelector('.cb-btn--go'));
    for (let i = 0; i < 5; i++) {
      const seat = r.context.flow.seats[i]; r.click(r.screen.querySelector(`[data-s09-chair="${i}"]`));
      if (retry) r.click(r.screen.querySelectorAll('[data-s09-way]').find(b => !seat.p.helps.includes(b.getAttribute('data-s09-way'))));
      r.click(r.screen.querySelector(`[data-s09-way="${seat.p.helps[0]}"]`)); r.click(r.screen.querySelector('[data-s09="done"]'));
    }
    r.click(r.screen.querySelector('[data-s09="finish"]')); r.click(r.screen.querySelector('[data-s09="see"]'));
    assert.equal(r.saves.length, 1); assert.equal(r.saves[0].score, retry ? 70 : 100);
  });
  for (const checked of [false, true]) test(`${lang}: Stop 10 allfive linked fixes with notes=${checked}`, () => {
    const r = harness(lang, 33); r.open('10-match-a-fix.js', '{round: R}'); r.click(r.screen.querySelector('.cb-btn--go'));
    for (const code of r.context.flow.round.probs) {
      r.click(r.screen.querySelector(`[data-p="${code}"]`)); r.click(r.screen.querySelector(`[data-f="${code}"]`));
      if (checked) { r.click(r.screen.querySelector('[data-b="check"]')); r.dialog.close(); }
      r.click(r.screen.querySelector('[data-b="link"]'));
    }
    r.click(r.screen.querySelector('.cb-s10-see')); assert.equal(r.saves.length, 1); assert.equal(r.saves[0].score, checked ? 100 : 60);
  });
  test(`${lang}: Stop 11 weighs allfour paths and completes neighbor/change checks at100`, () => {
    const r = harness(lang, 12); r.open('11-weigh-the-tradeoffs.js', '{order: order, rightNbs: rightNbs, fitIds: fitIds}'); r.click(r.screen.querySelector('.cb-btn--go'));
    for (const id of r.context.flow.order) r.click(r.screen.querySelector(`[data-path="${id}"]`));
    r.click(r.screen.querySelector('.cb-s11-choose'));
    for (let step = 0; step < 2; step++) { r.click(r.screen.querySelector(`[data-nb="${r.context.flow.rightNbs(step)[0]}"]`)); r.click(r.screen.querySelector('.cb-s11-next')); }
    r.click(r.screen.querySelector(`[data-chg="${r.context.flow.fitIds()[0]}"]`)); r.click(r.screen.querySelector('.cb-s11-next')); r.click(r.screen.querySelector('.cb-s11-see'));
    assert.equal(r.saves.length, 1); assert.equal(r.saves[0].score, 100);
  });
  test(`${lang}: Stop 12 covers neighbors, revises hard promises, clarifies and signs at100`, () => {
    const r = harness(lang, 13); r.open('12-make-a-fair-deal.js', '{deck: deck, state: S}'); r.click(r.screen.querySelector('.cb-btn--go'));
    const deck = r.context.flow.deck; let selected;
    for (let a = 0; a < deck.length && !selected; a++) for (let b = a + 1; b < deck.length && !selected; b++) for (let c = b + 1; c < deck.length && !selected; c++) for (let d = c + 1; d < deck.length && !selected; d++) {
      const four = [deck[a], deck[b], deck[c], deck[d]]; if (new Set(four.flatMap(c => [...c.helps])).size >= 5) selected = four;
    }
    assert.ok(selected, 'a fair four-promise combination exists');
    for (const c of selected) r.click(r.screen.querySelector(`[data-s12="card-${c.id}"]`));
    r.click(r.screen.querySelector('[data-s12="show"]')); r.click(r.screen.querySelector('[data-s12="ask"]'));
    for (let i = 0; i < 4; i++) { const opt = r.screen.querySelector('[data-s12="opt-0"]'); if (opt) r.click(opt); r.click(r.screen.querySelector('[data-s12="next"]')); }
    for (let i = 0; i < 4; i++) for (const key of ['who', 'what', 'when']) { r.click(r.screen.querySelector(`[data-s12="f-${i}-${key}"]`)); if (key !== 'what') r.click(r.screen.querySelector(`[data-s12="ch-${i}-${key}-0"]`)); }
    r.click(r.screen.querySelector('[data-s12="sign"]')); r.click(r.screen.querySelector('[data-s12="see"]'));
    assert.equal(r.saves.length, 1); assert.equal(r.saves[0].score, 100);
  });
  test(`${lang}: Stop 14 checks everyclue/status and followsup at100`, () => {
    const r = harness(lang, 19); r.open('14-keep-watch.js', '{items: items, followups: FU}'); r.click(r.screen.querySelector('.cb-btn--go'));
    for (const it of r.context.flow.items) {
      r.click(it.state === 'none' ? r.screen.querySelector('[data-s14="none"]') : r.screen.querySelector(`[data-clue="${it.p.clue}"]`));
      r.click(r.screen.querySelector(`button[data-st="${it.truth}"]`)); r.click(r.screen.querySelector('.cb-btn--go'));
    }
    for (let i = 0; i < r.context.flow.items.length; i++) if (r.context.flow.items[i].truth !== 'kept') r.click(r.screen.querySelector(`[data-row="${i}"][data-fu="${r.context.flow.followups[0]}"]`));
    r.click(r.screen.querySelector('.cb-btn--go')); r.click(r.screen.querySelector('[data-s14="see"]'));
    assert.equal(r.saves.length, 1); assert.equal(r.saves[0].score, 100);
  });
  test(`${lang}: Stop 15 considers tradeoffs, answers allwishes, checks annually and includesmissingvoice`, () => {
    const r = harness(lang, 27); r.open('15-build-the-future-together.js', '{places: PLACES, trays: trays, tiles: TILES, deal: deal, keyPlace: KEY_PLACE, missing: missing}'); r.click(r.screen.querySelector('.cb-btn--go'));
    const f = r.context.flow;
    for (const place of f.places) {
      const wishes = Object.values(f.deal).filter(w => f.keyPlace[w[1]] === place.id);
      const tid = f.trays[place.id].slice().sort((a, b) => wishes.filter(w => f.tiles[b].ans.includes(w)).length - wishes.filter(w => f.tiles[a].ans.includes(w)).length)[0];
      r.click(r.screen.querySelector(`[data-s15-place="${place.id}"]`)); r.click(r.screen.querySelector(`[data-s15-see="${tid}"]`)); r.click(r.screen.querySelector(`[data-s15-put="${tid}"]`));
    }
    r.click(r.screen.querySelector('[data-s15="next"]')); r.click(r.screen.querySelector('[data-s15-check]')); r.click(r.screen.querySelector('[data-s15="next"]'));
    r.click(r.screen.querySelector(`[data-s15-person="${f.missing[0]}"]`)); r.click(r.screen.querySelector('[data-s15="finish"]'));
    r.click(r.screen.querySelector('[data-s15="picnic"]')); r.click(r.screen.querySelector('[data-s15="see"]'));
    assert.equal(r.saves.length, 1); assert.equal(r.saves[0].score, 100);
  });
  test(`${lang}: Stop 1 finds signs, rereading does not change score, wrong objects reduce score`, () => {
    for (const wrong of [false, true]) {
      const r = harness(lang, 11); r.open('01-notice-the-signs.js', '{spots: spots}');
      r.click(r.screen.querySelector('.cb-btn--go')); r.click(r.screen.querySelector('[data-view="today"]'));
      for (const s of r.context.flow.spots.filter(s => s.item.sign || wrong)) {
        const b = r.screen.querySelector(`[data-spot="${s.i}"]`); r.click(b); r.dialog.close(); r.click(b); r.dialog.close();
      }
      r.click(r.screen.querySelector('.cb-btn--go')); assert.equal(r.saves.length, 1);
      assert.equal(r.saves[0].score, wrong ? 76 : 100); // six everyday objects, six signs
    }
  });
  test(`${lang}: Stop 3 listens, finds four shared wishes, identifies speakers, finishes at100`, () => {
    const r = harness(lang, 11); r.openCore(3);
    for (const n of r.context.NB) { r.click(r.screen.querySelector(`[data-nb="${n.id}"]`)); r.dialog.close(); }
    r.click(r.button(r.api.W.next));
    const lines = r.context.flow.lines;
    for (const wish of r.context.WISHES[r.context.flow.set]) {
      const pair = r.context.NB.filter(n => [lines[n.id][1], lines[n.id][3]].includes(wish)).slice(0, 2);
      assert.equal(pair.length, 2);
      for (const n of pair) r.click(r.screen.querySelector(`[data-nb="${n.id}"]`));
    }
    r.click(r.button(r.api.W.next));
    for (let i = 0; i < 4; i++) {
      const line = r.screen.querySelector('.cb-bubble p').textContent;
      const n = r.context.NB.find(n => [r.api.t2(lines[n.id][0]), r.api.t2(lines[n.id][2])].includes(line));
      assert.ok(n); r.click(r.screen.querySelectorAll('.cb-face-btn').find(b => b.getAttribute('aria-label') === r.api.nmCap(n)));
      assert.ok(r.screen.querySelectorAll('.cb-face-btn').every(b => b.disabled));
      r.click(r.button(r.api.W.next));
    }
    assert.equal(r.saves.length, 1); assert.equal(r.saves[0].score, 100);
  });
  for (const peek of [false, true]) for (const correct of [false, true]) {
    test(`${lang}: Stop 4 peek=${peek} correct=${correct} saves once and guards duplicate choice`, () => {
      const r = harness(lang, 8); r.openCore(4); r.click(r.screen.querySelector('.cb-btn--go'));
      for (const c of r.context.flow.round) {
        if (peek) r.click(r.screen.querySelector('.cb-peekbtn'));
        const kind = correct ? c.right : ['fact', 'rumor', 'dontknow'].find(k => k !== c.right);
        const b = r.screen.querySelector(`.cb-basket[data-k="${kind}"]`); r.click(b);
        assert.ok(r.screen.querySelectorAll('.cb-basket').every(b => b.disabled), 'all baskets have native disabled after answer');
        const savedChoice = c.sorted;
        for (const cb of b.listeners.click) cb();
        assert.equal(c.sorted, savedChoice, 'the original callback ignores repeat activation');
        r.click(r.button(r.context.S4.nextClaim));
      }
      assert.equal(r.saves.length, 1); assert.equal(r.saves[0].score, (peek ? 30 : 0) + (correct ? 70 : 0));
    });
  }
  test(`${lang}: Stop 7 builds matching three-part card and routes to proper helper`, () => {
    const r = harness(lang, 8); r.open('07-speak-up-kindly.js', '{round: round, decider: decider}'); r.click(r.screen.querySelector('.cb-btn--go'));
    for (const row of ['n', 'w', 'i']) {
      const tile = r.context.flow.round.rows[row].find(t => t.topic === r.context.flow.round.spark.topic);
      r.click(r.screen.querySelector(`[data-tile="${tile.key}"]`));
    }
    r.click(r.screen.querySelector('.cb-s07-ready')); r.click(r.screen.querySelector(`[data-h="${r.context.flow.decider()}"]`));
    r.click(r.screen.querySelectorAll('.cb-btn--go').at(-1)); assert.equal(r.saves.length, 1); assert.equal(r.saves[0].score, 100);
  });
  test(`${lang}: Stop 13 replaces stale claim, removes rumor, checks sources/dates and shares at100`, () => {
    const r = harness(lang, 6); r.open('13-spread-the-word-right.js', '{tray: tray, heads: HEADS, slots: slots}'); r.click(r.screen.querySelector('.cb-btn--go'));
    const f = r.context.flow;
    const rumor = f.tray.findIndex(c => c.kind === 'rumor'); r.click(r.screen.querySelector(`[data-s13card="${rumor}"]`));
    r.click(r.screen.querySelector('[data-s13act="src-0"]')); r.click(r.screen.querySelector('[data-s13act="off-0"]'));
    const old = f.tray.findIndex(c => c.kind === 'old'); r.click(r.screen.querySelector(`[data-s13card="${old}"]`));
    r.click(r.screen.querySelector('[data-s13act="date-0"]')); r.click(r.screen.querySelector('[data-s13act="swap-0"]'));
    const oldTag = f.slots[0].card.tag;
    const other = f.tray.findIndex(c => c.kind === 'fact' && c.tag !== oldTag);
    r.click(r.screen.querySelector(`[data-s13card="${other}"]`));
    const third = f.tray.findIndex((c, i) => c.kind === 'fact' && i !== old && i !== other);
    r.click(r.screen.querySelector(`[data-s13card="${third}"]`));
    for (let i = 0; i < 3; i++) { r.click(r.screen.querySelector(`[data-s13act="src-${i}"]`)); r.click(r.screen.querySelector(`[data-s13act="date-${i}"]`)); }
    r.click(r.screen.querySelector(`[data-s13head="${f.heads.findIndex(h => h.tells)}"]`)); r.click(r.screen.querySelector('[data-s13next]'));
    r.click(r.screen.querySelector('[data-s13share="family"]')); const see = r.screen.querySelector('[data-s13see]'); r.click(see);
    for (const cb of see.listeners.click) cb(); assert.equal(r.saves.length, 1); assert.equal(r.saves[0].score, 100);
  });
}

test('core saving keeps game usable when browser storage is blocked', () => {
  const context = vm.createContext({ KEY: 'test', localStorage: { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } } });
  vm.runInContext(fragments.sectionSource('store'), context);
  assert.equal(context.saveRound('fact-or-rumor', 100, {}).best, 100);
  assert.equal(context.rec('fact-or-rumor').best, 100);
});

test('malformed JSON and an unsupported saved version recover to a fresh usable journey', () => {
  for (const input of ['{broken', '{"version":999,"players":{}}']) {
    const context = vm.createContext({ KEY: 'test', localStorage: { getItem: () => input, setItem() {} } });
    vm.runInContext(fragments.sectionSource('store'), context);
    assert.equal(context.journeyOf(context.player()), 0);
    assert.equal(context.saveRound('fact-or-rumor', 70, {}).best, 70);
  }
});

const modules = fs.readdirSync(path.join(base, 'stops')).filter(f => /^\d\d-.*\.js$/.test(f));
for (const lang of ['en', 'es']) for (const file of modules) {
  test(`${lang}: ${file} intro and first action run without callback errors`, () => {
    const r = harness(lang); r.open(file);
    const go = r.screen.querySelectorAll('button').find(b => b.classes().includes('cb-btn--go'));
    r.click(go); assert.ok(r.screen.children.length > 0);
    assert.doesNotMatch(r.screen.textContent, /\bundefined\b|\[object Object\]/);
  });
}

for (const lang of ['en', 'es']) for (const mode of ['correct', 'retry', 'shown']) {
  test(`${lang}: Stop 5 ${mode} choices through real score callback`, () => {
    const r = harness(lang, 40); r.open('05-map-what-could-change.js', '{round: round}');
    r.click(r.screen.querySelector('.cb-btn--go'));
    for (const row of r.context.flow.round) for (let stage = 0; stage < 2; stage++) {
      const selector = stage ? '[data-nb]' : '[data-p]'; const attr = stage ? 'data-nb' : 'data-p';
      const choices = stage ? row.c.next : row.c.first;
      const wrong = r.screen.querySelectorAll(selector).filter(b => !choices.includes(b.getAttribute(attr)));
      if (mode !== 'correct') r.click(wrong[0]);
      if (mode === 'shown') r.click(r.screen.querySelectorAll(selector).find(b => !choices.includes(b.getAttribute(attr)) && b.getAttribute(attr) !== wrong[0].getAttribute(attr)));
      else r.click(r.screen.querySelectorAll(selector).find(b => choices.includes(b.getAttribute(attr))));
      r.click(r.screen.querySelector('.cb-s05-next'));
    }
    r.click(r.screen.querySelector('.cb-s05-see')); assert.equal(r.saves.length, 1);
    assert.equal(r.saves[0].score, { correct: 100, retry: 50, shown: 0 }[mode]);
  });
  test(`${lang}: Stop 6 ${mode} desk choices through real score callback`, () => {
    const r = harness(lang, 9); r.open('06-who-decides.js', '{round: round}'); r.click(r.screen.querySelector('.cb-btn--go'));
    for (const row of r.context.flow.round) {
      const wrong = r.screen.querySelectorAll('[data-desk]').filter(b => b.getAttribute('data-desk') !== row.desk);
      if (mode !== 'correct') r.click(wrong[0]);
      if (mode === 'shown') r.click(r.screen.querySelectorAll('[data-desk]').find(b => b.getAttribute('data-desk') !== row.desk && b.getAttribute('data-desk') !== wrong[0].getAttribute('data-desk')));
      else r.click(r.screen.querySelector(`[data-desk="${row.desk}"]`));
      r.click(r.screen.querySelector('[data-s06-next]'));
    }
    r.click(r.screen.querySelector('[data-s06-see]')); assert.equal(r.saves.length, 1);
    assert.equal(r.saves[0].score, { correct: 100, retry: 50, shown: 0 }[mode]);
  });
}

for (const lang of ['en', 'es']) {
  test(`${lang}: core saving preserves best across lower/equal/higher replay and reload`, () => {
    let stored;
    const context = vm.createContext({ KEY: 'test', localStorage: { getItem: () => stored, setItem: (_, v) => { stored = v; } } });
    const block = fragments.sectionSource('store');
    vm.runInContext(block, context);
    assert.equal(context.saveRound('fact-or-rumor', 80, {}).best, 80);
    assert.equal(context.saveRound('fact-or-rumor', 20, {}).best, 80);
    assert.equal(context.saveRound('fact-or-rumor', 80, {}).newBest, false);
    assert.equal(context.saveRound('fact-or-rumor', 100, {}).newBest, true);
    assert.equal(context.journeyOf(context.player()), 100);
    for (let i = 0; i < 55; i++) context.saveRound('fact-or-rumor', 50, {});
    assert.equal(context.rec('fact-or-rumor').last5.length, 5); assert.equal(context.rec('fact-or-rumor').all.length, 50);
    vm.runInContext(block, context); assert.equal(context.rec('fact-or-rumor').best, 100);
    assert.equal(context.journeyOf(context.player()), 100);
  });
}
