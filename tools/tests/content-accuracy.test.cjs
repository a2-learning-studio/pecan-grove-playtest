const test = require('node:test'), assert = require('node:assert/strict');
const { fullCore } = require('./modernization-gameplay-fixture.cjs');
const { expose, complete } = require('./modernization-gameplay-flow.cjs');
const words = (language, file) => require(`../../assets/games/community-builders/locales/${language}/${file}.json`);

test('the in-game footer shows the package version in both languages', () => {
  const { version } = require('../../package.json');
  for (const language of ['en', 'es']) assert.match(words(language, 'core').W.footer, new RegExp(` v${version.replace(/\./g, '\\.')}$`));
});

for (const language of ['en', 'es']) {
  test(`${language} Stop 1 explains a data center to kids and keeps the module summary for grown-ups`, async () => {
    const r = await fullCore(language, 42, false, null, { reduced: true, transformStopSource: (source, filename) => filename.startsWith('01') ? expose(1, source) : source });
    try {
      const T = words(language, 'stop-01').T;
      await r.core.startStop(r.core.getAPI().STOPS[0].id);
      const intro = r.main().textContent;
      assert.ok(intro.includes(T.whatH) && intro.includes(T.what), 'the kid definition is on the intro');
      assert.ok(!intro.includes(T.about), 'the adult module summary is not on the kids\' intro');
      await complete(r, 1);
      const button = [...r.main().querySelectorAll('.cb-card__btns button')].find(b => b.textContent.includes(T.ask));
      assert.ok(button, 'the result offers the grown-up note');
      button.click(); await r.tick();
      const dialog = [...r.root.querySelectorAll('dialog[open]')].at(-1);
      assert.ok(dialog.textContent.includes(T.about) && dialog.textContent.includes(T.guText));
      assert.equal(r.errors.length, 0, String(r.errors));
    } finally { r.close(); }
  });

  test(`${language} Stop 3 result offers its grown-up note like every other stop`, async () => {
    const r = await fullCore(language, 42, false, null, { reduced: true, transformStopSource: (source, filename) => filename.startsWith('03') ? expose(3, source) : source });
    try {
      const T = words(language, 'stop-03').T;
      await r.core.startStop(r.core.getAPI().STOPS[2].id);
      await complete(r, 3);
      const button = [...r.main().querySelectorAll('.cb-card__btns button')].find(b => b.textContent.includes(T.gu));
      assert.ok(button, 'the result offers the grown-up note');
      button.click(); await r.tick();
      assert.ok([...r.root.querySelectorAll('dialog[open]')].at(-1).textContent.includes(T.guText));
      assert.equal(r.errors.length, 0, String(r.errors));
    } finally { r.close(); }
  });
}
