import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../../assets/games/community-builders/stops/04-fact-or-rumor.js', import.meta.url), 'utf8');
function content(lang) {
  const start = source.indexOf('  var S4 =');
  const end = source.indexOf('    return {id:', start);
  assert.ok(start > 0 && end > start);
  const context = vm.createContext({ L: lang, window: {} });
  vm.runInContext(readFileSync(new URL('../../assets/games/community-builders/locales/catalog.js', import.meta.url), 'utf8'), context);
  vm.runInContext(source.slice(start, end), context);
  return context;
}

test('all Stop 4 checked facts describe the proposal rather than guarantee future behavior', () => {
  for (const lang of ['en', 'es']) {
    const { CLAIMS, S4 } = content(lang);
    const facts = CLAIMS.filter(c => c[0] === 'fact');
    assert.equal(facts.length, 3);
    for (const claim of facts) {
      assert.equal(claim[2], 'plan');
      assert.match(claim[lang === 'en' ? 3 : 4], lang === 'en' ? /^The company's September 3 proposal/ : /^La propuesta de la empresa del 3 de septiembre/);
    }
    assert.match(S4.ok.fact, lang === 'en' ? /not a promise/ : /no es una promesa/);
  }
});

test('fact bank still includes hopeful and worried rumors and unresolved study questions', () => {
  const { CLAIMS } = content('en');
  assert.equal(CLAIMS.length, 15);
  assert.ok(CLAIMS.some(c => c[0] === 'rumor' && c[1] === 'hopeful'));
  assert.ok(CLAIMS.some(c => c[0] === 'rumor' && c[1] === 'worried'));
  assert.ok(CLAIMS.some(c => c[0] === 'dontknow' && c[2] === 'air'));
  assert.ok(CLAIMS.some(c => c[0] === 'dontknow' && c[2] === 'sound'));
});
