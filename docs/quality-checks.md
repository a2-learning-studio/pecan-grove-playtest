# Quality checks and commit hooks

`tools/check-no-emoji.mjs` scans authored source, locale JSON and documentation with Unicode `Extended_Pictographic` and `Regional_Indicator` properties. It reports file, line, column and code point. Generated builds, publishing checkouts, backups, dependency directories, generated browser reports and coverage directories are excluded. Bilingual accents remain valid. Tests of untrusted pictographic input use Unicode escapes so the test still exercises that input without adding literal pictographs to source.

`tools/check-commit-message.mjs <message-file>` requires a known specification ticket in the commit subject, such as `P4-08: Add quality checks`. Multiple IDs and conventional prefixes are supported. Unknown IDs and pictographs anywhere in the message are rejected. The checker does not set or invent an author identity; keep the repository owner's existing Git identity.

Run `node tools/check-no-emoji.mjs` and `node --test tools/tests/modernization-hygiene.test.mjs` for these focused checks. The regular unit-test runner includes the hygiene tests automatically.

To enable the checked-in hooks in an actual Git checkout, run `git config core.hooksPath .githooks`. This mirror may be a source folder without Git metadata; hook files alone do not activate a repository setting. On Unix, the two hook files must also be executable. The hooks use Node on PATH, with a fallback to the standard Windows Node installation for Git Bash.

The pre-commit hook runs the no-emoji scan, the project's ESLint and Prettier engine/tool checks, and its unit-test runner. The commit-msg hook checks the proposed message. A failure blocks the commit and prints the relevant diagnostic. Tests and hooks never contact the feedback receiver.

The browser suite in `tests/e2e/modernization.spec.js` includes Chromium, Firefox, WebKit and mobile projects through the root Playwright configuration. These tests are authored independently of the DOM doubles; only a completed browser/CI run establishes their result. Playwright feedback tests intercept the receiver and return fake acknowledgements, avoiding real workbook writes. Screenshot baselines, native Spanish review and content neutrality review require the named human reviewers in the modernization specification.

The [browser coverage matrix](e2e-coverage.md) maps all fifteen definition-of-done checks to actual authored scenarios and remaining gaps. The [readability method](readability-method.md) explains the measured JSON scope and pending exceptions. The [privacy baseline proof](privacy-baseline-proof.md) records a passing, socket-free integration comparison of the committed original frontend against the revised mount, using the same request classifier as the browser fixture.
