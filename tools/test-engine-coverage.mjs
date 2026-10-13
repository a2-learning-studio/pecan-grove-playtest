/* Native V8 coverage includes production engine and playtest modules only. */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tests = [];
for (const directory of ["tests", "tools/tests", "backend/feedback"])
  for (const name of fs.readdirSync(path.join(root, directory)))
    if (/\.test\.(cjs|mjs)$/.test(name)) tests.push(path.join(directory, name));

const args = [
  "--experimental-test-coverage",
  "--test",
  "--test-concurrency=4",
  "--test-coverage-include=**/assets/games/community-builders/engine/**/*.js",
  "--test-coverage-include=**/assets/playtest/**/*.js",
  "--test-coverage-lines=80",
  ...tests,
];
const result = spawnSync(process.execPath, args, {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024,
});
const output = (result.stdout || "") + (result.stderr || "");
process.stdout.write(output);
fs.mkdirSync(path.join(root, "docs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/engine-coverage.txt"), output);
const total = /all files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/.exec(
  output,
);
fs.writeFileSync(
  path.join(root, "docs/engine-coverage.json"),
  JSON.stringify(
    {
      at: new Date().toISOString(),
      minimumLineCoverage: 80,
      scope: [
        "assets/games/community-builders/engine/**/*.js",
        "assets/playtest/**/*.js",
      ],
      method:
        "Native Node/V8 test coverage; real ES-module boot and gameplay tests plus unit and DOM integration tests",
      command: "npm run test:coverage",
      files: tests.length,
      linePercent: total ? Number(total[1]) : null,
      branchPercent: total ? Number(total[2]) : null,
      functionPercent: total ? Number(total[3]) : null,
      passed: result.status === 0,
    },
    null,
    2,
  ) + "\n",
);
if (result.error) throw result.error;
process.exit(result.status === 0 && total ? 0 : result.status || 1);
