import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Input } from '../../assets/games/community-builders/engine/input.js';
import { Bindings } from '../../assets/games/community-builders/engine/bindings.js';
const { fullCore } = createRequire(import.meta.url)('./modernization-gameplay-fixture.cjs');
async function withInput(run) {
  const r = await fullCore('en', 42), previous = globalThis.CustomEvent;
  globalThis.CustomEvent = r.w.CustomEvent;
  const input = new Input({ root: r.root, document: r.w.document, bindings: new Bindings(r.w.localStorage), scope: () => r.root.querySelector('dialog[open]') || r.root });
  r.w.PecanGroveEngine = { input };
  try { await run(r, input); }
  finally { input.destroy(); globalThis.CustomEvent = previous; r.close(); }
}
const back = (input) => input.emit('back', { device: 'keyboard' });
test('Stop 9 intro Back starts play and Finish waits for every chair', () => withInput(async (r, input) => {
  await r.core.startStop('include-every-voice');
  r.main().querySelector('[data-s09="start"]').focus();
  assert.equal(back(input), true);
  assert.ok(r.main().querySelector('.cb-s09-ways'));
  r.main().querySelector('.cb-s09-chair').click(); await r.tick();
  assert.equal(r.main().querySelector('[data-s09="finish"]'), null);
}));
test('Stop 6 answer Back advances once and its subscription is disposed on leaving', () => withInput(async (r, input) => {
  await r.core.startStop('who-decides'); r.main().querySelector('.cb-btn--go').click(); await r.tick();
  const ids = [...r.main().querySelectorAll('[data-desk]')].map(b => b.dataset.desk);
  for (const id of ids) {
    if (r.main().querySelector('[data-s06-next]')) break;
    r.main().querySelector('[data-desk="' + id + '"]').click(); await r.tick();
  }
  const next = r.main().querySelector('[data-s06-next]'); assert.ok(next); next.focus();
  const before = r.main().textContent; assert.equal(back(input), true);
  assert.notEqual(r.main().textContent, before, 'the next question is shown');
  assert.equal((input.handlers.get('back') || []).length, 0, 'answer subscription handles only once');
  await r.core.startStop('who-decides'); r.main().querySelector('.cb-btn--go').click(); await r.tick();
  for (const id of ids) { if (r.main().querySelector('[data-s06-next]')) break; r.main().querySelector('[data-desk="' + id + '"]').click(); await r.tick(); }
  assert.ok((input.handlers.get('back') || []).length > 0);
  await r.core.startStop('notice-the-signs');
  assert.equal((input.handlers.get('back') || []).length, 0, 'leaving disposes the old stop subscription');
}));
test('Stop 11 shared Back returns from the inline early-choice question', () => withInput(async (r, input) => {
  await r.core.startStop('weigh-the-tradeoffs'); r.main().querySelector('.cb-btn--go').click(); await r.tick();
  r.main().querySelector('.cb-s11-sign').click(); await r.tick();
  r.main().querySelector('.cb-s11-choose').click(); await r.tick();
  const more = r.main().querySelector('.cb-s11-more'); assert.ok(more); more.focus();
  assert.equal(back(input), true);
  assert.equal(r.main().querySelector('.cb-s11-askbar'), null);
  assert.ok(r.main().querySelector('.cb-s11-sign'));
}));
test('Stop 15 tray Back closes the tray and leaves background state untouched under a dialog', () => withInput(async (r, input) => {
  await r.core.startStop('build-the-future-together'); r.main().querySelector('.cb-btn--go').click(); await r.tick();
  r.main().querySelector('.cb-s15-place').click(); await r.tick();
  assert.ok(r.main().querySelector('.cb-s15-tray'));
  const trayButton = r.main().querySelector('.cb-s15-tray button'); trayButton.focus();
  const dialog = r.core.getAPI().dialog('Test modal', [r.core.getAPI().h('p', { text: 'Pause the tray' })], trayButton);
  assert.equal(back(input), false, 'a background stop does not receive a modal action');
  assert.ok(r.main().querySelector('.cb-s15-tray'));
  dialog.close(); trayButton.focus();
  assert.equal(back(input), true);
  assert.equal(r.main().querySelector('.cb-s15-tray'), null);
}));
