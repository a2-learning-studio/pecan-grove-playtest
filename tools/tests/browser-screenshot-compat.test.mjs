import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { prepareScreenshotSource } from '../prepare-browser-screenshots.mjs';

const require = createRequire(import.meta.url);
const packagePath = require.resolve('playwright-core/package.json');
const version = JSON.parse(fs.readFileSync(packagePath, 'utf8')).version;
const source = fs.readFileSync(path.join(path.dirname(packagePath), 'lib/coreBundle.js'), 'utf8');
const updated = prepareScreenshotSource(source, version);
function screenshotPreparation(document) {
  const begin = updated.indexOf('function inPagePrepareForScreenshots(');
  const finish = updated.indexOf('\n  if (!screenshotStyle', begin);
  return vm.runInNewContext(`(${updated.slice(begin, finish)}\n})`, {
    document, URL, location: {origin: 'https://game.example'}
  });
}
test('the pinned dependency patch targets only the exact screenshot synchronization block and fails closed on drift', () => {
  assert.equal(prepareScreenshotSource(updated, version), updated);
  assert.throws(() => prepareScreenshotSource(source, '1.65.0'), /Review the screenshot workaround/);
  assert.throws(() => prepareScreenshotSource(source.replace('style.textContent = "body {}";', 'style.textContent = "body{color:red}";'), version), /exact upstream/);
  assert.equal(updated.match(/Pecan Grove CI: synchronize/g).length, 1);
  assert.equal(updated.includes('if (screenshotStyle) {'), true, 'Other screenshot behavior must remain present.');
});
test('screenshot synchronization inserts and removes the same no-op rule on an allowed sheet without inline style elements', () => {
  const calls = [];
  const sheet = {href: 'https://game.example/critical.css', disabled: false, cssRules: [{cssText: 'p {color:black}'}],
    insertRule(rule, index) {calls.push(['insert', rule, index]);this.cssRules.splice(index, 0, {cssText: rule});},
    deleteRule(index) {calls.push(['delete', index]);this.cssRules.splice(index, 1);}};
  const document = {baseURI: 'https://game.example/', styleSheets: [sheet],
    createElement() {throw new Error('An inline style element must not be created.');},
    documentElement: {getBoundingClientRect() {calls.push(['layout']);}}};
  screenshotPreparation(document)(undefined, false, false, true);
  assert.deepEqual(calls, [['insert', 'body {}', 1], ['layout'], ['delete', 1]]);
  assert.equal(sheet.cssRules.length, 1);
});
test('screenshot synchronization restores its rule when layout throws and safely handles a page without authored sheets', () => {
  const sheet = {href: 'https://game.example/critical.css', cssRules: [],
    insertRule(rule, index) {this.cssRules.splice(index, 0, {cssText: rule});},
    deleteRule(index) {this.cssRules.splice(index, 1);}};
  const document = {baseURI: 'https://game.example/', styleSheets: [sheet],
    documentElement: {getBoundingClientRect() {throw new Error('layout unavailable');}}};
  assert.throws(() => screenshotPreparation(document)(undefined, false, false, true), /layout unavailable/);
  assert.equal(sheet.cssRules.length, 0);
  let layouts = 0;
  screenshotPreparation({baseURI: document.baseURI, styleSheets: [],
    documentElement: {getBoundingClientRect() {layouts++;}}})(undefined, false, false, true);
  assert.equal(layouts, 1);
});
