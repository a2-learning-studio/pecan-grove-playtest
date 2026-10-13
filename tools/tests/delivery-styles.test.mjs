import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { splitStyles } from '../critical-css.mjs';
const directory = new URL('../../', import.meta.url);
const source = name => fs.readFileSync(new URL(name, directory), 'utf8');
const scope = {module:{exports:{}}, Promise};
vm.runInNewContext(source('assets/playtest/styles.js'), scope);

test('full game styles wait for the explicit start request, share one request and allow error retry', async () => {
  const dom = new JSDOM('<!doctype html><head></head><body></body>');
  const styles = scope.module.exports.create(dom.window.document, 'game.hash.css');
  assert.equal(dom.window.document.querySelectorAll('link').length, 0);
  const first = styles.load(); assert.equal(styles.load(), first);
  let link = dom.window.document.querySelector('link');
  assert.equal(link.getAttribute('href'), 'game.hash.css');
  link.dispatchEvent(new dom.window.Event('error'));
  await assert.rejects(first, /unavailable/);
  assert.equal(dom.window.document.querySelectorAll('link').length, 0);
  const second = styles.load(); link = dom.window.document.querySelector('link');
  link.dispatchEvent(new dom.window.Event('load')); await second;
  assert.equal(styles.required, false); await styles.load();
  assert.equal(dom.window.document.querySelectorAll('link').length, 1);
  dom.window.close();
});

test('critical split keeps font faces, title tokens and nested responsive title styles but defers game board styles', () => {
  const result = splitStyles({studio:'@font-face{font-family:Inter;src:url(font.woff2)} :root{--space:8px} .a2-hub{color:red}',
    tokens:':root{--pg-stage:green}', game:'.cb-hero{display:grid}.cb-board{display:grid}@media(max-width:400px){.cb-hero{padding:4px}.cb-board{padding:10px}}',
    engine:'.cb-engine-title-actions{display:grid}.cb-stop-navigator{color:green}',page:'.pt-intro{display:grid}',shell:'[hidden]{display:none}'});
  assert.match(result.critical, /@font-face/); assert.match(result.critical, /@media.*cb-hero/);
  assert.doesNotMatch(result.critical, /cb-board|a2-hub|cb-stop-navigator/);
  assert.match(result.full, /cb-board/); assert.ok(result.criticalGzipBytes < 15000);
});

test('both authoritative UI catalogs are valid UTF-8 with Spanish punctuation intact', () => {
  for (const area of ['playtest', 'games/community-builders']) for (const language of ['en','es']) {
    const value = source(`assets/${area}/locales/${area === 'playtest' ? language : language+'/core'}.json`);
    assert.doesNotMatch(value, /\uFFFD|Ã[\u0080-\u00ff]|Â[\u0080-\u00ff]/);
    assert.doesNotThrow(() => JSON.parse(value));
  }
  const spanish = JSON.parse(source('assets/playtest/locales/es.json'));
  assert.match(spanish.shell_styles_error, /conexión/);
  assert.ok(source('assets/games/community-builders/locales/es/core.json').includes('¿'));
});
