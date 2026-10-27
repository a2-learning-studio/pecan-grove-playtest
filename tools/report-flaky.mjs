// Lists the browser tests that failed first and passed only on retry, from Playwright's JSON report.
// CI keeps one retry so a slow runner cannot block a release, but a flaky test must stay visible:
// each one becomes a warning on the run and a row in the job summary. Reporting never fails the job.
//   node tools/report-flaky.mjs test-results/results.json
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export function flakyTests(report) {
  const found = [];
  const walk = (suite, titles) => {
    for (const spec of suite.specs || []) for (const test of spec.tests || []) {
      if (test.status !== 'flaky') continue;
      const failures = (test.results || []).filter(result => result.status !== 'passed' && result.status !== 'skipped');
      found.push({ title: [...titles, spec.title].filter(Boolean).join(' › '), project: test.projectName || '', file: spec.file || suite.file || '', line: spec.line || 0,
        attempts: (test.results || []).length, error: String(failures[0]?.error?.message || '').split('\n')[0].slice(0, 200) });
    }
    for (const child of suite.suites || []) walk(child, [...titles, child.title]);
  };
  for (const suite of report.suites || []) walk(suite, []);
  return found;
}

function main(file) {
  if (!file || !fs.existsSync(file)) { console.log(`No Playwright JSON report at ${file || '(none)'}; nothing to report.`); return; }
  const flaky = flakyTests(JSON.parse(fs.readFileSync(file, 'utf8')));
  // GitHub workflow commands use %, CR and LF escapes.
  const clean = value => String(value).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  for (const test of flaky) console.log(`::warning file=${clean(test.file)},line=${test.line},title=Flaky test (${clean(test.project)})::${clean(test.title)} passed only after ${test.attempts - 1} retry. First failure: ${clean(test.error)}`);
  console.log(flaky.length ? `${flaky.length} flaky test(s) passed only on retry.` : 'No flaky tests: every test passed on its first attempt.');
  if (process.env.GITHUB_STEP_SUMMARY) {
    const cell = value => String(value).replace(/\|/g, '\\|');
    const rows = flaky.map(test => `| ${cell(test.project)} | ${cell(test.title)} | ${cell(test.file)}:${test.line} | ${cell(test.error)} |`);
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, flaky.length
      ? `### Flaky browser tests\n\nThese failed first and passed only on retry.\n\n| Project | Test | Where | First failure |\n| --- | --- | --- | --- |\n${rows.join('\n')}\n`
      : '### Flaky browser tests\n\nNone: every test passed on its first attempt.\n');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) main(process.argv[2]);
