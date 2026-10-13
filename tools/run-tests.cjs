'use strict';
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const files = [];
for (const dir of ['tests', 'tools/tests', 'backend/feedback']) {
  for (const name of fs.readdirSync(path.join(root, dir))) {
    if (/\.test\.(?:cjs|mjs)$/.test(name)) files.push(path.join(dir, name));
  }
}
let result = spawnSync(process.execPath, ['--test', '--test-concurrency=4', ...files], { cwd: root, stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status || 1);
if (!process.argv.includes('--unit')) {
  result = spawnSync('python', ['-B', '-m', 'unittest', 'discover', '-s', 'tools/tests', '-p', 'test_*.py', '-v'], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
