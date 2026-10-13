const test = require('node:test'), assert = require('node:assert/strict');
const { fullCore } = require('./modernization-gameplay-fixture.cjs');

for (const language of ['en', 'es']) test(`${language}: native NodeFilter constants survive boot and nested Stop2 narration can be scanned`, async () => {
  const r = await fullCore(language, 42, false, null, { voice: true });
  const errors = [];
  const capture = event => { errors.push(event.error || new Error(event.message)); event.preventDefault(); };
  r.w.addEventListener('error', capture);
  try {
    assert.equal(typeof r.w.NodeFilter, 'function', 'the fixture exposes the browser constructor shape');
    assert.equal(r.w.NodeFilter.SHOW_TEXT, 4);
    const filters = [];
    const walk = r.w.document.createTreeWalker.bind(r.w.document);
    r.w.document.createTreeWalker = function (root, filter, accept) {
      if (new Error().stack.includes("voice-scan.js")) filters.push(filter);
      return walk(root, filter, accept);
    };
    await r.core.startStop('ask-a-good-question'); await r.tick();
    r.main().querySelector('.cb-s02-intro .cb-btn--go').click(); await r.tick();
    r.core.pause(); r.core.resumePlay(); await r.tick();
    assert.ok(filters.length > 0, 'the actual narration scanner walked the nested authored text');
    assert.deepEqual(errors.map(error => error.message), [], 'the actual scanner must not call trim on an element nodeValue');
    assert.ok(filters.every(value => value === r.w.NodeFilter.SHOW_TEXT), 'every narration walker requests text nodes rather than the default all-node traversal');
    assert.ok(r.main().querySelector('.cb-s02-say .cb-w'), 'the authentic worry is marked for read-along');
    assert.ok(r.main().querySelector('.cb-s02-say .cb-vbtn'), 'the authentic worry retains its replay control');
    assert.deepEqual(r.errors, []);
  } finally { r.w.removeEventListener('error', capture); r.close(); }
});

for (const language of ['en', 'es']) test(`${language}: player chip keeps a localized accessible name when narrow presentation hides its text`, async () => {
  const r = await fullCore(language);
  try {
    r.core.getState().store.current = 'fox';
    r.core.showTitle();
    const chip = r.root.querySelector('.cb-chip');
    assert.ok(chip);
    const label = chip.lastElementChild.textContent;
    chip.lastElementChild.hidden = true;
    assert.equal(chip.firstElementChild.getAttribute('aria-hidden'), 'true');
    assert.equal(chip.getAttribute('aria-label'), label);
    assert.ok(chip.getAttribute('aria-label').length > 0, 'the icon-only chip retains its actual localized player/action name');
    assert.match(label, language === 'es' ? /Zorro/ : /Fox/);
  } finally { r.close(); }
});
