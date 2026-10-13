/* No browser package or network is required. Load the actual stop in an isolated context, expose its private
   rubric only in this test, then exercise both the authored questions and the real revision/finish callbacks. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/games/community-builders/stops/02-ask-a-good-question.js'), 'utf8');

function load(lang) {
  let registration;
  const context = vm.createContext({
    window: { CommunityBuilders: { register(stop) { registration = stop; } } },
    document: { documentElement: { lang } },
    Date: { now: () => context.clock },
    clock: 1000, setTimeout(fn) { fn(); return 0; }, clearTimeout() {}, requestAnimationFrame(fn) { fn(); return 0; }, cancelAnimationFrame() {}
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/games/community-builders/locales/catalog.js'), 'utf8'), context);
  const exposed = source.replace('  CB.register({',
    '  globalThis.rubric = { question: question, judge: judge, startWord: startWord, WORRIES: WORRIES, QUESTIONS: QUESTIONS, START: START, TOPIC: TOPIC, DETAIL: DETAIL, T: T };\n  CB.register({');
  vm.runInContext(exposed, context, { filename: '02-ask-a-good-question.js' });
  return { context, registration, ...context.rubric };
}

for (const lang of ['en', 'es']) {
  test(`${lang}: all 12 worries have specific authored questions for every open start`, () => {
    const r = load(lang);
    assert.equal(r.WORRIES.length, 12);
    assert.equal(Object.keys(r.QUESTIONS).length, 12);
    for (const w of r.WORRIES) {
      const questions = new Set();
      for (const start of ['how', 'when', 'who', 'whatif']) {
        const question = r.question(w, start, w.topic, w.d[0]);
        questions.add(question);
        assert.equal(typeof question, 'string');
        assert.ok(question.length > 30, `${w.id}/${start} is more than a generic tile fragment`);
        assert.doesNotMatch(question, /\{[td]\}|undefined|When will we know more about|Cuándo vamos a saber más sobre/);
        assert.ok(question.endsWith('?'));
        const judged = r.judge(w, { start, topic: w.topic, detail: w.d[0] });
        assert.equal(judged.pts, 25, `${w.id}/${start}`);
        assert.equal(judged.line, r.T.ans3);
      }
      assert.equal(questions.size, 4, `${w.id}: each open start teaches a distinct purpose`);
    }
  });

  test(`${lang}: engine worry asks about frequency and the schedule instead of vague future knowledge`, () => {
    const r = load(lang);
    const w = r.WORRIES.find(w => w.id === 'A-lee');
    assert.match(r.startWord(w, 'how'), lang === 'en' ? /How often/ : /Cada cuánto/);
    assert.match(r.question(w, 'how', 'engines', 'd2'), lang === 'en' ? /How often.*tested/ : /Cada cuánto.*probar/);
    assert.match(r.question(w, 'when', 'engines', 'd2'), lang === 'en' ? /testing.*how often/ : /probar.*cada cuánto/);
    assert.match(r.question(w, 'who', 'engines', 'd2'), lang === 'en' ? /testing schedule/ : /calendario de pruebas/);
    assert.match(r.question(w, 'whatif', 'engines', 'd2'), lang === 'en' ? /more often than planned/ : /más seguido de lo previsto/);
  });

  test(`${lang}: shared topic tiles still produce questions about each neighbor's distinct concern`, () => {
    const r = load(lang);
    const concerns = {
      'A-johnson': [/^(?=.*mud)(?=.*creek)(?=.*wells)/, /lodo.*arroyo.*pozos/],
      'A-ana': [/jobs.*construction|construction jobs/, /empleos.*construcción/],
      'A-ruth': [/old grave/, /tumba.*antigua/],
      'A-patel': [/construction trucks/, /camiones de construcción/],
      'A-jayden': [/young people.*training/, /jóvenes.*capacitación|capacitación.*jóvenes/],
      'B-lee': [/outdoor lights/, /luces.*afuera/],
      'B-johnson': [/wells?.*tested|test.*wells/, /anali.*pozo/],
      'B-ana': [/mud.*creek|creek.*mud/, /lodo.*arroyo|arroyo.*lodo/],
      'B-ruth': [/household.*power bills|power bills/, /recibos de luz/],
      'B-patel': [/shop.*rent/, /renta/],
      'B-jayden': [/nighttime.*noise|nighttime hum/, /ruido nocturno|zumbido nocturno/]
    };
    for (const [id, patterns] of Object.entries(concerns)) {
      const w = r.WORRIES.find(w => w.id === id);
      for (const start of ['how', 'when', 'who', 'whatif']) {
        assert.match(r.question(w, start, w.topic, w.d[0]), patterns[lang === 'es' ? 1 : 0], `${id}/${start}`);
      }
    }
  });

  test(`${lang}: every possible tile combination stays within 25 and full praise requires all three components`, () => {
    const r = load(lang);
    for (const w of r.WORRIES) {
      for (const [start] of r.START) {
        for (const [topic] of r.TOPIC) {
          for (const detail of [null, ...r.DETAIL.map(tile => tile[0])]) {
            const judged = r.judge(w, { start, topic, detail });
            const full = topic === w.topic && start !== 'will' && w.d.includes(detail);
            assert.ok(Number.isInteger(judged.pts) && judged.pts >= 0 && judged.pts <= 25);
            assert.equal(judged.pts === 25, full, `${w.id}/${start}/${topic}/${detail}`);
            assert.equal(judged.line === r.T.ans3, full);
            assert.equal(judged.notes.filter(note => note[0]).length === 3, full);
            assert.doesNotMatch(r.question(w, start, topic, detail), /\{[td]\}|undefined/);
            if (topic !== w.topic) {
              assert.equal(judged.dOk, false, 'a detail cannot make an unrelated topic specific to this worry');
              assert.equal(judged.notes[2][1], r.T.detTopic);
            }
          }
        }
      }
    }
  });

  test(`${lang}: missing detail and yes/no questions get actionable revision advice`, () => {
    const r = load(lang);
    for (const w of r.WORRIES) {
      const missing = r.judge(w, { start: 'how', topic: w.topic, detail: null });
      assert.equal(missing.pts, 18);
      assert.equal(missing.notes[2][1], r.T.detNone);
      const yesNo = r.judge(w, { start: 'will', topic: w.topic, detail: w.d[0] });
      assert.equal(yesNo.pts, 17);
      assert.equal(yesNo.notes[1][1], r.T.startWill);
      assert.notEqual(yesNo.line, r.T.ans3);
      assert.equal(r.judge(w, { start: null, topic: w.topic, detail: w.d[0] }).sOk, false);
      assert.equal(r.judge(w, { start: 'unknown', topic: w.topic, detail: w.d[0] }).sOk, false);
    }
  });

  test(`${lang}: construction detail supports the creek, truck and shop-rent worries`, () => {
    const r = load(lang);
    for (const id of ['A-johnson', 'A-patel', 'B-ana', 'B-patel']) {
      const w = r.WORRIES.find(w => w.id === id);
      assert.ok(w.d.includes('d7'));
      assert.equal(r.judge(w, { start: 'how', topic: w.topic, detail: 'd7' }).pts, 25);
    }
    const rent = r.WORRIES.find(w => w.id === 'B-patel');
    assert.match(r.question(rent, 'how', 'bills', 'd7'), lang === 'en' ? /shop rents.*during construction/ : /renta de los locales.*durante la construcción/);
    assert.doesNotMatch(r.question(rent, 'how', 'bills', 'd7'), /will.*go up|van a subir/);
  });
}

test('English and Spanish use the same scores for all tile combinations', () => {
  const en = load('en');
  const es = load('es');
  en.WORRIES.forEach((w, i) => {
    for (const [start] of en.START) for (const [topic] of en.TOPIC) for (const detail of [null, ...en.DETAIL.map(t => t[0])]) {
      const a = { start, topic, detail };
      assert.equal(en.judge(w, a).pts, es.judge(es.WORRIES[i], a).pts);
    }
  });
});

/* A deliberately small DOM double for this stop's own callback flow. It performs no layout, speech, storage or
   accessibility emulation; browser checks cover those. It tests selection, hints, revision and real score saving. */
class Element {
  constructor(tag, attrs = {}, children = []) {
    this.tagName = tag;
    this.attrs = { ...(attrs || {}) };
    this.children = [];
    this.style = { setProperty() {} };
    this.offsetHeight = 70;
    this.isConnected = true;
    this.classList = {
      contains: token => this.classes().includes(token),
      toggle: (token, force) => {
        const on = force === undefined ? !this.classes().includes(token) : force;
        this.attrs.class = [...new Set(this.classes().filter(c => c !== token).concat(on ? token : []))].join(' ');
      },
      remove: token => { this.attrs.class = this.classes().filter(c => c !== token).join(' '); }
    };
    children.filter(child => child !== null && child !== undefined).forEach(child => this.appendChild(child));
  }
  classes() { return (this.attrs.class || '').split(/\s+/).filter(Boolean); }
  appendChild(child) { this.children.push(child); if (child instanceof Element) child.parentNode = this; return child; }
  removeChild(child) { this.children.splice(this.children.indexOf(child), 1); if (child instanceof Element) child.parentNode = null; }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); this.isConnected = false; }
  replaceChild(next, prev) { const i = this.children.indexOf(prev); assert.ok(i >= 0); this.children[i] = next; next.parentNode = this; prev.parentNode = null; }
  setAttribute(key, value) { this.attrs[key] = value; }
  getAttribute(key) { return this.attrs[key] === undefined ? null : this.attrs[key]; }
  get textContent() { return (this.attrs.text || '') + this.children.map(c => c instanceof Element ? c.textContent : c).join(''); }
  set textContent(value) { this.attrs.text = value; this.children = []; }
  matches(selector) {
    const tag = selector.match(/^[a-z]+/);
    if (tag && this.tagName !== tag[0]) return false;
    for (const match of selector.matchAll(/\.([\w-]+)/g)) if (!this.classes().includes(match[1])) return false;
    for (const match of selector.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)) {
      if (this.attrs[match[1]] === undefined || (match[2] !== undefined && String(this.attrs[match[1]]) !== match[2])) return false;
    }
    return true;
  }
  closest(selector) { for (let el = this; el; el = el.parentNode) if (el.matches(selector)) return el; return null; }
  querySelectorAll(selector) {
    const parts = selector.split(' ');
    const result = [];
    const walk = el => el.children.forEach(child => {
      if (!(child instanceof Element)) return;
      if (child.matches(parts[parts.length - 1])) {
        let ancestor = child.parentNode;
        let part = parts.length - 2;
        while (ancestor && part >= 0) { if (ancestor.matches(parts[part])) part--; ancestor = ancestor.parentNode; }
        if (part < 0) result.push(child);
      }
      walk(child);
    });
    walk(this);
    return result;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  focus() { this.focused = true; }
  scrollIntoView() {}
}

for (const lang of ['en', 'es']) {
  test(`${lang}: revision highlights useful tiles and keeps original points while displaying the revised question`, () => {
    const r = load(lang);
    const h = (tag, attrs, children = []) => new Element(tag, attrs, children);
    const neighbors = ['lee', 'johnson', 'ana', 'ruth'].map(id => ({ id, img: id, name: id }));
    const chosen = ['A-lee', 'B-johnson', 'A-ana', 'B-ruth'];
    let screen;
    let saved;
    let scoreCard;
    const api = {
      h, REDUCED: true, W: { score: 'Score' }, NB: neighbors,
      rec: () => null, team: () => null, shuffle: list => list.slice(),
      pick: choices => choices.find(w => chosen.includes(w.id)),
      nbById: id => neighbors.find(n => n.id === id), nm: n => n.name, nmCap: n => n.name,
      img: () => h('img'), ico: () => h('svg'), story: () => h('svg'), crop: () => h('div'),
      btn: (text, css, onclick) => h('button', { text, class: css, onclick }),
      coach: text => h('p', { text }), stopHud: () => h('div'),
      screen: children => { screen = h('main', {}, children); }, frame() {}, say() {}, endPlay() {},
      saveRound: (id, score, detail) => { saved = { id, score, detail }; return {}; },
      scoreCard: (stop, score, info, tip) => { scoreCard = { score, tip }; return h('div'); },
      finishRound() {}, cardButtons: () => [], restart: () => () => {}, dialog() {}
    };
    const click = element => { assert.ok(element, 'button exists'); r.context.clock += 500; element.attrs.onclick(); };
    const button = label => screen.querySelectorAll('button').find(el => el.textContent === label);
    const tile = (row, id) => screen.querySelector(`[data-row="${row}"][data-id="${id}"]`);
    r.registration.run(api, { id: 'ask-a-good-question' });
    click(button(r.T.start));
    click(tile('start', 'will'));
    click(tile('topic', 'engines'));
    click(tile('detail', 'd1'));
    click(button(r.T.ask));
    assert.ok(screen.querySelector('[data-s02="answer"]').attrs['data-cb-novoice'] !== undefined);
    click(button(r.T.fix));
    assert.ok(tile('start', 'how').classList.contains('is-hint'));
    assert.ok(tile('detail', 'd2').classList.contains('is-hint'));
    click(tile('start', 'how'));
    click(tile('detail', 'd2'));
    click(button(r.T.ask));
    assert.equal(button(r.T.fix), undefined, 'a corrected question no longer needs a fix button');
    assert.match(screen.querySelector('.cb-s02-board').textContent, lang === 'en' ? /How often.*tested/ : /Cada cuánto.*probar/);
    click(button(r.T.next));
    for (let index = 1; index < 4; index++) {
      const w = r.WORRIES.find(w => w.id === chosen[index]);
      click(tile('start', 'how'));
      click(tile('topic', w.topic));
      click(tile('detail', w.d[0]));
      click(button(r.T.ask));
      click(button(index === 3 ? r.T.see : r.T.next));
    }
    assert.equal(saved.score, 85, 'first try 10 + three full questions; revision does not inflate points');
    assert.equal(scoreCard.score, 85);
    assert.equal(scoreCard.tip, r.T.tipWill, 'tips and score refer to the same original attempt');
    assert.equal(saved.detail.lastRound.join(','), chosen.join(','));
    assert.equal(Object.keys(saved.detail).sort().join(','), 'lastOrder,lastRound', 'no question text or personal information is persisted');
  });
}
