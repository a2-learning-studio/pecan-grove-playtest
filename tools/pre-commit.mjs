import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const checks = [
  ['tools/check-no-emoji.mjs'],
  ['node_modules/eslint/bin/eslint.js', 'assets/games/community-builders/engine', 'tools/*.mjs'],
  ['node_modules/prettier/bin/prettier.cjs', '--check', 'assets/games/community-builders/engine'],
  ['tools/run-tests.cjs', '--unit'],
];
for (const args of checks) {
  const result = spawnSync(process.execPath, args, {cwd:root, stdio:'inherit'});
  if (result.error) { console.error(result.error.message); process.exit(1); }
  if (result.status !== 0) process.exit(result.status || 1);
}
