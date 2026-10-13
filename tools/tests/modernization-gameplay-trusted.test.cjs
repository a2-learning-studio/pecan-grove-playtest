const test = require('node:test');
const assert = require('node:assert/strict');
const { fullCore } = require('./modernization-gameplay-fixture.cjs');
test('Every lazy stop opens and accepts its first choice with HTML assignment sinks disabled', async () => {
  const r = await fullCore('en', 42);
  const descriptor = Object.getOwnPropertyDescriptor(r.w.Element.prototype, 'innerHTML');
  const runtimeErrors=[];
  r.w.addEventListener('error',event=>{runtimeErrors.push(event.error||event.message);event.preventDefault();});
  try {
    Object.defineProperty(r.w.Element.prototype, 'innerHTML', {
      configurable: true,
      get: descriptor.get,
      set() { throw new TypeError('HTML assignment is disabled by the strict-sink test'); }
    });
    for (const stop of r.core.getAPI().STOPS) {
      assert.notEqual(await r.core.startStop(stop.id), false, stop.id + ' loads');
      const first = r.main().querySelector('.cb-btn--go');
      assert.ok(first, stop.id + ' has a start or continue action');
      first.click();
      await r.tick();
      assert.ok(r.main().children.length, stop.id + ' renders gameplay');
    }
    assert.equal(runtimeErrors.length,0,runtimeErrors.map(String).join('\n'));
    assert.equal(r.errors.length, 0, String(r.errors));
  } finally {
    Object.defineProperty(r.w.Element.prototype, 'innerHTML', descriptor);
    r.close();
  }
});
