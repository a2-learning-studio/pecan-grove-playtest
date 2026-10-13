import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {parseColor,composite,contrastRatio}=createRequire(import.meta.url)('../../tests/e2e/contrast-probe.cjs');
test('rendered-background contrast math matches WCAG reference black/white and is symmetric',()=>{assert.equal(contrastRatio([0,0,0],[255,255,255]),21);assert.equal(contrastRatio([120,120,120],[120,120,120]),1);assert.equal(contrastRatio([22,58,48],[247,244,238]),contrastRatio([247,244,238],[22,58,48]));assert.ok(contrastRatio([22,58,48],[247,244,238])>10);});
test('computed RGB alpha and inherited opacity are composited before contrast comparison',()=>{assert.deepEqual(parseColor('rgb(22, 58, 48)'),[22,58,48,1]);assert.deepEqual(parseColor('rgba(22, 58, 48, 0.5)'),[22,58,48,.5]);assert.deepEqual(composite([0,0,0,.5],[255,255,255],.5),[191.25,191.25,191.25]);assert.ok(contrastRatio(composite([0,0,0,1],[255,255,255],.25),[255,255,255])<2);assert.throws(()=>parseColor('unparsed'),/Unsupported computed color/);});
