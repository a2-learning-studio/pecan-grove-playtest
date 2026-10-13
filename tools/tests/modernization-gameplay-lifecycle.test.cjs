const test = require('node:test');
const assert = require('node:assert/strict');
const { fullCore } = require('./modernization-gameplay-fixture.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
test('Closing a stop dialog with Escape is preserved by snapshot restoration', async () => {
  const r = await fullCore('en', 42);
  try {
    await r.core.startStop('listen-to-every-neighbor');
    await new Promise(resolve => setTimeout(resolve, 400));
    r.main().querySelector('.cb-nbr').click();
    await r.tick();
    const dialog = r.root.querySelector('dialog[open]');
    assert.ok(dialog, 'the neighbor note opens');
    dialog.dispatchEvent(new r.w.Event('cancel', { cancelable: true }));
    await r.tick();
    assert.equal(r.root.querySelectorAll('dialog[open]').length, 0);
    const record = copy(r.core.snapshot());
    assert.equal(await r.core.resume(record), true);
    await r.tick();
    assert.equal(r.root.querySelectorAll('dialog[open]').length, 0, 'a dismissed note must stay dismissed after resume');
  } finally { r.close(); }
});
test('Leaving Stop 8 disposes its pointer guard before another stop opens', async () => {
  const r = await fullCore('en', 42);
  try {
    await r.core.startStop('disagree-kindly');
    r.main().querySelector('.cb-btn--go').click();
    await r.core.startStop('notice-the-signs');
    const go = r.main().querySelector('.cb-btn--go');
    const event = new r.w.MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 });
    go.dispatchEvent(event);
    await r.tick();
    assert.equal(event.defaultPrevented, false, 'a previous stop must not cancel the new stop pointer event');
    assert.ok(r.main().querySelector('[data-view="today"]'), 'the new stop starts on the first pointer tap');
  } finally { r.close(); }
});
