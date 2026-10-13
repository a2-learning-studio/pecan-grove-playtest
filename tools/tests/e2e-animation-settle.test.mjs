import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const source = fs.readFileSync(new URL('../../tests/e2e/settle-animations.cjs', import.meta.url), 'utf8');
function helper(window) {
  const context = vm.createContext({module: {exports: {}}, document: window.document,
    getComputedStyle: window.getComputedStyle.bind(window)});
  vm.runInContext(source, context);
  return context.module.exports;
}
test('rendered-color scans wait for finite running fades and leave paused or infinite motion to motion assertions', () => {
  const dom = new JSDOM('<section class="scene"></section>');
  const target = dom.window.document.querySelector('section');
  const animation = (playState, endTime) => ({playState, currentTime: 63,
    effect: {target, getComputedTiming: () => ({endTime})}});
  dom.window.document.getAnimations = () => [animation('running', 120), animation('paused', 120),
    animation('running', Infinity), animation('finished', 120)];
  const result = helper(dom.window).runningFiniteAnimations();
  assert.equal(result.length, 1);
  assert.equal(result[0].target, 'scene');
  assert.equal(result[0].endTime, 120);
  dom.window.document.getAnimations = () => [animation('finished', 120)];
  assert.equal(helper(dom.window).runningFiniteAnimations().length, 0);
  dom.window.close();
});
test('axe failure diagnostics include actual ancestor opacity and running fade frames', async () => {
  const dom = new JSDOM('<section class="scene" style="opacity:.63"><p id="caption">Caption</p></section>');
  const target = dom.window.document.querySelector('section');
  dom.window.document.getAnimations = () => [{playState: 'running', currentTime: 63,
    effect: {target, getComputedTiming: () => ({endTime: 120}),
      getKeyframes: () => [{opacity: 0}, {opacity: 1}]}}];
  const page = {evaluate: (fn, value) => {
    const context = vm.createContext({document: dom.window.document,
      getComputedStyle: dom.window.getComputedStyle.bind(dom.window), value});
    return vm.runInContext(`(${fn.toString()})(value)`, context);
  }};
  const result = await helper(dom.window).accessibilityDiagnostics(page,
    [{nodes: [{target: ['#caption']}]}]);
  assert.equal(result[0].ancestors[1].opacity, '0.63');
  assert.equal(result[0].animations[0].keyframes[0].opacity, 0);
  dom.window.close();
});
