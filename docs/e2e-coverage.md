# Browser coverage and remaining checks

The suite is authored in `tests/e2e/modernization.spec.js`. Discovery on 2026-10-13 UTC found 92 scenarios in each of Chromium, Firefox, WebKit, Pixel and iPhone projects: 460 project/scenario combinations. Syntax and discovery succeeded locally; no local browser execution or screenshot generation is claimed here. Latest completed candidate `953364d8d35aa0ac3c8a7b7c98415249cc992af5`, run 38338523939: quality passed with 537/537 tests, zero skips and 83.37% line coverage; Python 27/27 passed. Performance and all five browser jobs failed; deployment was skipped. The next candidate's fixes await browser execution. Unrun/skipped scenarios are not passes.

| 953364d browser | Passed | Failed | Not run |
| --- | ---: | ---: | ---: |
| Chromium | 47 | 10 | 3 |
| Firefox | 29 | 11 | 22 |
| Pixel | 48 | 10 | 2 |
| WebKit | 49 | 11 | 2 |
| iPhone | 48 | 11 | 3 |

Optional visual skips are separate from these counts. Failure caps and parallel workers explain why failed counts may exceed ten; these were diagnostic runs, not passing release receipts.

Thirty scenarios are optional visual candidates, enabled with `PG_RUN_VISUAL=1`; they require corresponding screenshot files. Approval to change the art does not itself approve a captured pixel baseline. One family-flavor scenario is conditional on `PG_FAMILY_BASE_URL`. Python structural tests cover the family build independently. Skipped optional scenarios count as pending, not passed.

Every scenario uses a fresh browser context. The automatic fixture records receiver requests even before DOMContentLoaded and rejects any such request without the explicit-feedback test option. After DOMContentLoaded it also rejects other external requests against the configured server origin, including on reload while page.url() is still about:blank. Family has its own configured server origin. It rejects console warnings, console errors, page errors and CSP violations, retaining stacks/locations and policy samples. The sole send scenario intercepts the receiver and supplies an in-memory acknowledgement; it never sends test feedback to Drive. The classifier is the same function tested in [the actual legacy-mount regression proof](privacy-baseline-proof.md).

The real Start action requests native fullscreen; the helper exits native fullscreen and checks that expanded gameplay remains open before viewport resizing. Candidate 953364d exposed an asynchronous enter/exit race, assigned for correction. Synthetic controller edges remain pressed/released until the real RAF gamepad poll samples each state; no direct engine action dispatch substitutes for that input. Reachability failures retain the choice and hit-element classes/rectangles, viewport and fullscreen state. Map failures now retain pan/canvas dimensions. All product assertions remain in place.

Historical 70dc402 corrected native Document.title/NodeFilter errors and passed performance with title-to-map TBT 5.573–27.926 ms against the unchanged 50 ms gate (CLS 0), plus intro Performance 98/Accessibility 100/Best Practices 100 in all six runs. The subsequent 953364d title-to-map runs measured 82.033–123.834 ms and failed the same gate; the earlier passing measurement does not certify the changed candidate. Its performance correction is assigned.

The 70dc402 WebKit 27.2 probe passed all ten desktop/iPhone controls: strict native selects produced exact `text-overflow:inherit` style samples; the exact hash removed those violations; unrelated authored attributes/style elements stayed blocked. Candidate 953364d retained that ten-control pass. Remaining product/test findings included Firefox art-loading overlays, native fullscreen timing, an unnamed narrow player button, completed-map overflow, missing game H1 and rapid bot taps hitting Stop 1's real 350 ms input guard. Corrections are prepared, including explicit tap-state assertions. Firefox's scroll-linked positioning warning prompted passive, frame-batched callout positioning; actual warning elimination awaits CI.

The residual WebKit `style-src-elem` error was traced to Playwright's screenshot preparation creating an inline `body {}` stylesheet. A version/source-guarded CI dependency patch uses the same no-op rule/layout synchronization through an existing first-party stylesheet and restores its rules. It does not alter product CSP or filter violations. Two additional strict screenshot controls are authored but have not run yet. Accessibility and pixel probes now wait for actual finite running animations to finish before sampling rendered colors; violations remain failures, and failure diagnostics include ancestor opacity and active animations. Explicit feedback transport distinguishes empty CORS preflights from the one scrubbed submitted POST, with both mocked.

The floating/movement check explicitly uses a 1280px desktop viewport in every project. A separate 360px scenario checks the intended narrow modal behavior and single preserved draft. A mobile project is not expected to display desktop floating controls at its default narrow width.

## Section 10 checks

“Authored” below means ready for a browser run, not a passed result. An entry/first-play smoke check does not establish every branch, result screen or dialog in that stop.

| Check | Authored coverage | Remaining work or limit |
| --- | --- | --- |
| A: axe on every screen/dialog | EN/ES entry, first play, pause, live switch and restored Continue for all 15 stops; every traversed Stop 1/2 reference-playthrough screen; feedback popup | Corrected passing CI pending. Other answer paths, help/settings dialogs and Stops 3–15 later steps/results still need traversal. |
| B: keyboard-only completion | Native Enter advances all 15 entry screens; Tab/Shift+Tab round-trip in first play; separate Stop 2 pause/focus scenario | All-stop arrows/WASD/number-key completion paths are not yet authored. Pointer reference playthroughs are not keyboard-only proof. |
| C: text/art, UI and focus contrast | Axe on traversed screens; two EN/ES rendered-label probes for map and Stops 1–2, including narrow Stop 2 and changed Stop 1 states; optional screenshots | Probe removes foreground paint temporarily, samples screenshot backgrounds and composites computed foreground/ancestor opacity. WCAG/alpha unit tests pass. Browser execution, other-stop labels, ring sampling and high-contrast review remain pending. Axe alone is not pixel evidence. |
| D: gamepad-only completion | Stubbed `getGamepads` is actually polled; Start pauses and B closes pause in every stop/locale smoke | D-pad/stick/confirm completion paths, controller-only menus and real hardware remain pending. The smoke does not move focus programmatically and call that controller-only completion. |
| E: five viewport geometries | All 15 first-play screens EN/ES at360×640,600×500,600×800,1280×800,1920×1080; Stop 2 each row; six completed-map cases after1/2/15 stops at360/414/600/768/900/1280/1600px | Remaining steps/artwork need traversal. Completed-map cases assert all 15 discs stay>=44px/visible and no plate/tag covers another disc. Initial execution found overflow; corrected rendering remains pending. |
| F: calm/reduced motion | All 15 smoke scenarios emulate reduced motion, set Calm, reject running transform animations and verify FX does not create particles | Later transitions, score celebrations and flashing still require traversal/review. Static artwork crop transforms are not classified as motion. |
| G: intro/first-speaker consistency | Stop 2 runs twenty explicit seeds in EN and ES; seed-42 repeat-order test | Other character-bearing intros require stop-specific assertions; fixed/narrative intros need a documented applicability decision. |
| H: avoid a modal per action | Every found item in the Stop 1 playthrough must remain inline, with zero open dialogs | The sliding three-action threshold across all other stop actions is not yet authored. |
| I: keep step/progress on language switch | Every stop smoke calls the live public language API and compares the actual round state; Stop 2 UI language button also preserves a selected tile and translates feedback | Later steps/results/dialogs in each stop need additional cases. The API smoke is distinguished from clicking the language control. |
| J: pause/resume/restart/map and voice position | Every stop smoke pauses/resumes through polled controller input and compares round state; reference path returns to map; reload flow uses Quit and Continue | Restart/cancel/Map confirmations in every state and actual audio-line/time continuity require further traversal. Quiet-mode tests cannot prove audible playback continuity. |
| K: privacy network boundary | Automatic noNetwork guard on every browser scenario; explicit preview/hold/scrubbed fake-send test; family conditional browser test and unconditional structural test; real old/new mount proof passes without real network | Run family browser scenario against the separately built flavor. The build is allowed to fetch its own static assets; the guard targets receiver and external traffic. |
| L: zero console warnings/errors | Automatic assertion in every scenario, including all-stop smoke | Only completed browser runs establish this result. Intentional test failures must not be hidden by a blanket console allowlist. |
| M: placeholder ≤100 ms, image ≤2.5 s on Slow 4G | Build/performance work is separate from this suite | Timed cold-cache/throttled image tests and error/offline visual fallback checks are not yet authored here. Ordinary visible-image assertions are not Slow 4G proof. |
| N: persisted Continue after reload | All 15 EN/ES first-play snapshots/direct restore/language round-trip and actual persisted title Continue after fresh navigation | All 15 now use native authored controllers. Later browser answer/result states remain to traverse; native phase/score tests are separate evidence. |
| O: readability ≤5 or approved exception | Actual EN/ES JSON report and seven formula/extraction tests; all 15 extracted story/option banks included | 355 EN / 659 ES flags, native Spanish and exact-text exceptions remain open. Spanish ease is never described as a school grade. See [method](readability-method.md) and [full report](readability-report.md). |

## Per-stop scope

Each row has EN and ES smoke, snapshot/Continue, live-language, reduced-motion, controller pause/back, native Tab and five-size current-choice checks authored. Fresh play uses actual intro Start → title New game → animal chooser → map; persisted play uses actual title Continue. These are first entry/first play only unless stated otherwise. Native all 15 phase tests are additional evidence, not a substitute for browser traversal.

| Stop | Source ID | Additional authored traversal | Browser result |
| --- | --- | --- | --- |
| 1 | `notice-the-signs` | Full chosen reference path, twelve inline findings and result; axe throughout | Pending CI |
| 2 | `ask-a-good-question` | Four worries and result, selected-tile language/pause checks, each row geometry, twenty speaker seeds | Pending CI |
| 3 | `listen-to-every-neighbor` | Generic entry/first-play only | Pending CI |
| 4 | `fact-or-rumor` | Generic entry/first-play only | Pending CI; classification review assigned to Claude |
| 5 | `map-what-could-change` | Generic entry/first-play only | Pending CI |
| 6 | `who-decides` | Generic entry/first-play only | Pending CI |
| 7 | `speak-up-kindly` | Generic entry/first-play only | Pending CI |
| 8 | `disagree-kindly` | Generic entry/first-play only | Pending CI |
| 9 | `include-every-voice` | Generic entry/first-play only | Pending CI |
| 10 | `match-a-fix` | Generic entry/first-play only | Pending CI |
| 11 | `weigh-the-tradeoffs` | Generic entry/first-play only | Pending CI |
| 12 | `make-a-fair-deal` | Generic entry/first-play only | Pending CI |
| 13 | `spread-the-word-right` | Generic entry/first-play only | Pending CI |
| 14 | `keep-watch` | Generic entry/first-play only | Pending CI |
| 15 | `build-the-future-together` | Generic entry/first-play only | Pending CI |

The owner authorized the playtest release, privacy/receiver changes and art changes, and explicitly requested modern styling for every character. The workcopy now has eight modern animal avatars and six modern human portraits, preserving names, roles and identities. The humans have authoritative vector sources and reproducible 512px WebP output. Human recognition checks and reviewed pixel baselines remain pending. Spanish wording and classification reviews are assigned to Claude and remain unfinished; these are separate from permission to implement or publish. No unrecorded human approval is inferred for readability exceptions, Spanish phrasing, classification truth or screenshot files.

## Running and evidence

The root Playwright configuration serves `dist` on port 8890. Build the intended flavor first, then run the configured project matrix in CI. `playwright test --list` only lists cases and never establishes a pass. Keep the HTML report, traces/screenshots for failures and the exact build/commit metadata with the release record.

`node tools/readability.mjs` regenerates JSON/Markdown measurements; threshold warnings remain visible and do not fail CI per P1-18. `node tools/privacy-baseline-proof.mjs --write-report` regenerates the socket-free old/new integration proof from the recorded public Git commit. The proof requires the baseline checkout (`PG_BASELINE_ROOT` may override the sibling path); without it, the corresponding unit case is explicitly skipped and must not be reported as passed in that run.

Candidate visual files may be recorded with `PG_RUN_VISUAL=1` and Playwright's update-snapshot mode, then reviewed as artifacts. A generated image is a candidate until Ali approves it. The authored tolerance is a 0.2% pixel ratio; changing tolerance to suppress an unexplained difference is not approval.

