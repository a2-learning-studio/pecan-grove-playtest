import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { flakyTests } from '../report-flaky.mjs';

const script = fileURLToPath(new URL('../report-flaky.mjs', import.meta.url));
const report = { suites: [{ title: 'modernization.spec.js', file: 'modernization.spec.js', specs: [
  { title: 'steady', file: 'modernization.spec.js', line: 3, tests: [{ projectName: 'chromium', status: 'expected', results: [{ status: 'passed' }] }] },
  { title: 'wobbly', file: 'modernization.spec.js', line: 9, tests: [{ projectName: 'webkit', status: 'flaky', results: [{ status: 'timedOut', error: { message: 'Timeout 45000ms exceeded.\nstack' } }, { status: 'passed' }] }] },
], suites: [{ title: 'serial group', specs: [
  { title: 'inner', file: 'modernization.spec.js', line: 20, tests: [{ projectName: 'pixel', status: 'flaky', results: [{ status: 'failed', error: { message: 'expect failed' } }, { status: 'passed' }] }] },
] }] }] };

test('flaky tests are the ones that passed only after a retry, with their first failure', () => {
  const flaky = flakyTests(report);
  assert.deepEqual(flaky.map(t => [t.project, t.title, t.attempts, t.error]), [
    ['webkit', 'wobbly', 2, 'Timeout 45000ms exceeded.'],
    ['pixel', 'serial group › inner', 2, 'expect failed'],
  ]);
});

test('the CI step warns about each flaky test, writes a summary and never fails the job', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pg-flaky-'));
  try {
    const file = path.join(dir, 'results.json'), summary = path.join(dir, 'summary.md');
    fs.writeFileSync(file, JSON.stringify(report));
    const run = spawnSync(process.execPath, [script, file], { encoding: 'utf8', env: { ...process.env, GITHUB_STEP_SUMMARY: summary } });
    assert.equal(run.status, 0);
    assert.equal(run.stdout.match(/^::warning /gm).length, 2);
    assert.match(fs.readFileSync(summary, 'utf8'), /\| webkit \| wobbly \|/);
    const missing = spawnSync(process.execPath, [script, path.join(dir, 'absent.json')], { encoding: 'utf8' });
    assert.equal(missing.status, 0);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
