# Modernization acceptance audit: implementation and evidence

Updated 2026-10-13 UTC against all 64 tickets in the owner-provided private modernization specification, including the final native stop controllers, map/input work, privacy, JSON extraction and quality gates. Latest inspected candidate: `1ee712de6472535fa2a769ce289117ff5743874c`, run38334884675: quality passed; all five browser projects and the scene performance gate failed; deployment was skipped. This is a source audit of a changing release candidate. Attach the final commit and actual browser/public-site results before certifying acceptance.

**Present** means the principal requested behavior exists and no additional code gap was identified in this inspection. Browser, hardware, human and performance acceptance may remain pending. **Partial** identifies concrete unfinished requirements or implementation differences. **Changing** identifies a task assigned to the release owner. Missing execution evidence is not reported as absent code.

## Remaining requirements and alternatives

- Readability remains incomplete: 1,928 EN and 1,928 ES strings measured, 355 English and 659 Spanish flags, no approved exceptions. Stops 1–2 kid-copy rewrite/exception criteria and Claude's assigned native Spanish/classification sign-offs remain open.
- Exact differences: chapter labels are in the legend rather than inside hulls; offline voice uses its own progress interface rather than the common loading screen. Selected-disc zoom1→1.15 and a filtered-noise paper swish are now implemented.
- Stop files remain lazy classic factories within a native ESM engine instead of literal native ESM imports per stop. Existing vector avatar/neighbor artwork is resolution independent instead of duplicated raster1x/2x portraits.
- Active language switching is live; the obsolete reload helper and its unused API exposure have now been removed.
- Intro is a compact team/privacy card over full-bleed town art before entering the game title. It preserves the owner's earlier team-first flow; title and gated intro remain separate DOM sections.
- Root completed idle larger-AVIF warming after Start, authored-step manifest validation and actual Git SHA metadata, with an independent content hash and build.json commit. Reconcile actual build/CI receipts against the release commit.
- The attempted browser matrix stopped at its failure cap and has not passed. Real native receiver/NodeFilter errors and narrow layout problems are being corrected separately from fullscreen-resize/network-origin/polled-controller fixture issues. Scene timespan TBT measured121–140ms against100ms; the Lighthouse step passed, including Best Practices100 after the manifest fix. Rendered contrast, Slow4G timing, physical controllers/screen readers and installed/offline play remain execution/review work. See [the bounded A–O coverage](e2e-coverage.md).

## Ticket ledger

### P0

| Ticket | Code status | Current implementation and remaining evidence |
| --- | --- | --- |
| P0-00 harness | Present | Seeded RNG, real native/jsdom tests, Playwright/axe and five-project CI. Shared noNetwork classifier runs actual committed old/current feedback mounts with stub fetch: old mount/unsent edit attempt POST, current does not. Browser runs pending. |
| P0-01 explicit sending | Present | Local drafts/save/Excel; explicit submitted-note path or separately opted-in result scores. No mount/typing/passive/legacy-unsent send. Three total requests at0/5/30s honor the AC cap; conflicting120s third retry is omitted. |
| P0-02 consent/flavors | Present | Per-player consent/sub-option off by default/reset New player. Intro/grown-up controls share helper. Family strips feedback UI/receiver and limits connections to self. Final built-flavor browser evidence pending. |
| P0-03 scrub/hold | Present | Client/server EN/ES contact-pattern scrub, editable preview, accessible two-second hold. Arbitrary names are not claimed detectable by this heuristic. |
| P0-04 privacy copy | Present | Copy distinguishes local drafts, explicit notes and optional scores. Ali approved privacy/receiver changes; acknowledgements/draft/player isolation have tests. |
| P0-05 external noise | Present | First-party script CSP, automatic browser console/network guard and EN/ES add-on noise note. Clean-profile matrix and Pages/custom-domain environment still need evidence. |
| P0-06 receiver/frame | Present |64KiB/content bounds, station/global rate limits/scrub, frame guard before game/feedback boot. Actual iframe case authored; no fictional Pages frame-ancestors response header. |
| P0-07 language/place | Present | Live snapshot/answer/narration-line restore, singleton feedback translation, document/URL update without navigation. All15 native controllers. The obsolete helper is removed. |
| P0-08 cold art | Present | Consumed LQIP/gradient, responsive AVIF/WebP, priority/preload/decode, DPR/crop sizes and idle larger-AVIF warming after Start exist. <=100ms placeholder and <=2.5s cold Slow4G criteria unmeasured. |
| P0-09 first speaker | Present | Stop 2 same seeded speaker/crop/caption; twenty-seed EN/ES browser checks authored. Other character-intro order has native state support; rendered checkG remains pending. |
| P0-10 collisions | Present | Every visible plate/tag uses four-position obstacle checks, hides if no fit, updates on fonts/resize/focus/hover/zoom. Zoom coordinates/clipping regression passes; six completed-map browser scenarios unrun. |
| P0-11 top bar | Present | Grid/nowrap tools, compact icons, chapter-key removal, responsive HUD More. Exact320–2560/40px height/clipping sweep remains unauthored/unrun. |
| P0-12 fullscreen | Present | Shared enclosing-stage target/state and live toolbar/Settings labels; Settings stays open. Native/blocked/exit permutations need browser evidence. |
| P0-13 narrow map | Present | Geographic1376:768 fit with all 15 separated>=44px discs, focus/predecessor Zoom, pan and below480 Map/List. Zoomed focus reveal tested; browser geometry pending. |
| P0-14 Stop 2 overlap | Present | Measured compact mode/strip height, scroll padding and guarded floating Ask action; native layout checks. Selected-row five-size browser tests authored; all scroll positions need rendered evidence. |
| P0-15 feedback sheet | Present | One form moves across equal-width dock/popup/floating/<=70dvh narrow sheet; narrow default collapse, drag/keyboard move, both collapse modes/More/Excel. Browser geometry pending. |
| P0-16 storage | Present | Save errors emit persistent once/session warning; play continues. Quota/thrown-storage browser evidence pending. |
| P0-17 landmarks | Present | Distinct landmarks and one noscript element from one template; structural tests. Axe execution pending. |

### P1

| Ticket | Code status | Current implementation and remaining evidence |
| --- | --- | --- |
| P1-01 input/motion | Present | Shared guarded actions, device/rebinding/voice-stop/motion policy; scoped lifecycle subscription cleanup and explicit off. |
| P1-02 focus | Present | Stacked/return focus, spatial/row/entry/wrap/map-path/native-control navigation and zoom reveal. NVDA/VoiceOver/full controller traversal pending. |
| P1-03 choices | Present | Group1–9/aria-keyshortcuts, keyboard-only caps and focused gamepad-layout confirm glyph. Decorative annotations hidden from speech. |
| P1-04 controller | Present | Standard mapping, edge/repeat, connection/visibility polling, layout/swap/rumble/disconnect pause. Actual polled stubs tested; hardware/full completions pending. |
| P1-05 pause | Present | Inert pause/Settings stack, timers/media/animations, resume/restart/map confirmations, hidden/disconnect pause and Quit. Legacy map Escape tooltip interception removed. Audible continuity pending. |
| P1-06 HUD | Present | Avatar/stop/pause/stars/progress, responsive More and1.5s star announcement throttle. Live points only supplied by computing stops. Geometry/assistive evidence pending. |
| P1-07 settings | Present | Five accessible tabs/migration/mixers/display/controls/accessibility/language/reset. Classic finds consumed; library/quiet defaults. Music intentionally disabled pending licensed loops. |
| P1-08 bindings | Present | e.code actions with captured e.key display; persistence/conflicts/swap/reserved/reset. Actual control/tooltips update from current bindings. |
| P1-09 hints | Present | Applicable map/stop hints derive active group and retain explicit declarations; live device/bindings. Three successful enabled touch actions hide auto hints; explicit on/off retained. |
| P1-10 focus style | Present | Shared keyboard/gamepad/thick/forced-color focus. Rendered ring contrast and manual review pending. |
| P1-11 gestures | Present | Pinch/drag/motion-gated bounded inertia/double-tap fit/touch two-tap/long-press stars preview/Settings swipe/feedback swipe and real tip pager/buttons. Physical touch/scroll pending. |
| P1-12 slots/title | Present | Natural title New/Load/Settings/grown-ups, saved Continue avatar/next/stars, V1 migration/eight anonymous slots/partial autosave/relative dates/Turtle Undo/shared Library-team list. Real reload Continue authored all 15 EN/ES. |
| P1-13 badges | Present | Per-slot process rules, distinct24-unit icons, rule-specific locked hints, gallery/polite toast/inline results. Actual gallery/controller accessibility pending. |
| P1-14 mixer | Present | Separate buses/routing/fallback/ducking/procedural SFX/quiet/pause/hidden mute; page uses seeded, filtered noise for a soft paper swish. Licensed music permitted off; sound/peak review pending. |
| P1-15 findings | Present | Nonmodal status/avoid targets/retain focus/next-action Escape B/6s after voice. Classic setting consumed, Library enables, forced-colors conservative heuristic. Reliable screen-reader detection is not claimed. |
| P1-16 map clarity | Present | Adult order lock/default off, started Keep going resume, focused/next plates, selection cursor/chapter regions/legend. Actual replay/completed visual states pending. |
| P1-17 loading | Partial | Weighted determinate tasks,>300ms,25% announcements, bilingual tips, title handoff/lazy Retry. Voice-download uses separate accessible progress instead of same screen. Slow4G pending. |
| P1-18 readability | Partial | Actual all-bank report/formula tests/CI warning.355 EN / 659 ES flags/no exceptions and native Spanish sign-off unresolved; required Stops 1–2 rewrite pass incomplete. |

### P2

| Ticket | Code status | Current implementation and remaining evidence |
| --- | --- | --- |
| P2-01 tokens | Present | Shared type/color/space/radius/shadow/motion,18px body. All game/playtest CSS checked; palette hex centralized in tokens.css, forbidden elsewhere. SVG art paint remains art. |
| P2-02 title | Present with design choice | Full-art gated20s/8px drift, vertical menu, summarized Continue/crest/build/language and compact team/privacy overlay. Intro remains separate gated section. LCP/keyboard/gamepad/touch pending. |
| P2-03 transitions | Present | ViewTransition synchronous swap, selected map-disc1→1.15/320ms, step16px/200ms, dialog.96/160ms, lifecycle disposal and Calm120ms opacity. Input/CLS evidence pending. |
| P2-04 FX | Present | Reusable burst/stamp/pulse/nudge, strict24 pool/<900ms, pause/Calm and feedback/stars/badge hooks. <2ms/frame timing pending. |
| P2-05 selection | Present | Shared tint/3px/bold/gated scale/32px check/forced-color state. Actual snapshots/contrast pending. |
| P2-06 chapters | Partial | Four hulls/corner legend/completed trails/motion-gated upcoming shimmer/state rings. Labels currently legend-only rather than inside regions.10 ring/art sample/browser collision criteria pending. |
| P2-07 animals | Present | All eight revised vectors; Ali approved baseline. Five-person otter and actual32px recognition unperformed. |
| P2-08 art labels | Present principal behavior | Stop 1 min.8125rem/status/full-opacity/solid dark outline fixed. Real screenshot-background map/Stops 1–2 contrast probe plus two WCAG/alpha tests authored. Browser ratios/all-other-stop label coverage pending. |
| P2-09 results | Present | I-can first/largest, gated medal/stars, tip paging/buttons/swipe, inline badges and1–3/default-focus actions; team presentation. Gamepad/announcement-order evidence pending. |
| P2-10 chrome | Present | Compact unified bar/stage fallback/48px icons/400ms visible delegated tooltips/EN|ES segmented control/live binding labels. Height and gamepad tooltip checks pending. |
| P2-11 contrast | Present | High/system contrast and forced-color focus/selection rules. Rendered7:1 coverage/reviewed snapshots remain evidence requirements. |

### P3

| Ticket | Code status | Current implementation and remaining evidence |
| --- | --- | --- |
| P3-01 build/CSP | Present | Vite hashes/mapped assets/external boot/styles/tight CSP/Pages workflow. Actual Git SHA meta/build.json plus independent content hash; attach final build/CSP/CI/public receipts. |
| P3-02 lazy stops | Partial alternative | Manifest.json controls PLAYABLE/selected JS CSS content/idle next prefetch; Stops3/4 external. Lazy classic factory scripts, not literal per-stop ESM imports. Authored steps validated atomically with native loader cases;120KB entry gate enforced. |
| P3-03 art | Present vector alternative | Five AVIF/WebP widths, consumed LQIP/DPR crops/priority/decode/preload. Existing vector neighbor/animal artwork needs no raster1x2x duplication. Image/LCP browser criteria pending. |
| P3-04 CSS/fonts | Present | <=15KB critical/game CSS-on-Start split; variable Inter/Geist Latin/Extended-A preload/swap, no built Mono. Root reported~10KB critical/~74KB fonts; final gates authoritative. |
| P3-05 install | Present | Scoped EN/ES manifests/icons/standalone/maskable/apple, adult explicit Install with no-auto-prompt test. iOS/Android install pending. |
| P3-06 offline | Present | Scoped SW/network-first timeout/cache/1376map/first-two stops+content/voice/safe update resume/offline status. Later stops need prior cache; actual install/update/offline traversal pending. |
| P3-07 packs | Present | EN/ES byte size before download/progress/pause/cancel/remove/persist/estimate/adult context. Actual offline ES narration/karaoke/quota pending. |
| P3-08 performance | Present | Enforced JS/CSS/critical/font budgets, Lighthouse intro EN/ES and actual title/map/Stops 1–2 snapshot/timespan scenarios, performance docs. No unrecorded Lighthouse scores/timing claimed. |

### P4

| Ticket | Code status | Current implementation and remaining evidence |
| --- | --- | --- |
| P4-01 modules | Present | Small compatibility cb.js/native ESM boot/factory graph/public API; actual native-import tests. No engine module>500 lines at inspection. |
| P4-02 locale | Present | Real EN/ES JSON for core/all 15 story+option banks/engine/shell PWA/feedback, parity/placeholders/Intl/live restore. Obsolete navigateLanguage reload helper is removed. |
| P4-03 template | Present | One Python template EN/ES; structural parity and catalogs. |
| P4-04 SVG/TT | Present | Allowlisted namespaced cached SVG clones/replaceChildren/Trusted Types script policy; no raw stop innerHTML. Native strict-sink first-action tests pass; real Chromium CSP console pending. |
| P4-05 API rollout | Present principal behavior | All15 native authored snapshot/restore/pause/resume controllers plus section9 choices/nav/input/hints/hud/effects/art/badges/save/docs/types. Native phase/wrong-answer tests. Spec does not require localeKey/summary hooks. Full section10 browser acceptance remains pending. |
| P4-06 coverage | Present | Meaningful production native/input/store/state/score/content/media/shell/privacy/receiver tests; V8 engine/playtest>=80% line gate. Latest owner-recorded local receipt:520/520,82.07% lines. Inspected2427d1b GitHub quality:520/520,zero skips,82.07% lines/76.50% branches/72.51% functions.1ee quality also passed; its browser failures remain separate. Distinct runs are not interchangeable. |
| P4-07 browser matrix | Partial | Five projects,92 scenarios each, all15 EN/ES smoke/Continue/axe, full selected Stops1–2, six completed-map cases/pixel probes, desktop float and narrow modal feedback.1ee failed in all five projects and stopped at the failure cap. Full all-stop keyboard/gamepad completion/every branch/dialog/forced-color/reviewed screenshots still lack traversal; passing execution pending. |
| P4-08 hygiene | Present principal behavior | Flat ESLint/compat, all CSS token/Stylelint, Prettier, no-emoji/ticket commit checks/hooks. Last-two-browser targets exist; exactSafari15/Chrome100 minimum runtime evidence not established. Final precommit/CI result pending. |
| P4-09 neutrality | Present code; human pending | Generic AST/JSON fact-source validator handles real/future banks/missing/unknown IDs/derived records. Inspectable dated fictional proposal in Stop 4 Peek; canonical [content review](content-review.md) covers Stop 4/13. References are not truth proof; Claude review unfinished. |

## Human, environment and test evidence

Ali approved privacy/receiver/art baseline and release at the existing playtest URL. Root reports receiver deployment to the existing endpoint/private workbook and passing64KiB/content/scrub acknowledgement plus seven upsert/invalidation/player-isolation HTTP checks. This audit agent did not deploy or send real feedback; no unobserved version number is invented. Public-game publication requires its final receipt.

The release owner reports the fifteen separate Stop 1–15 PRs (#4–#18) merged onto main. Platform PR #3 remains unmerged and the public Pages site remains the previous release. Main-branch source merges are not a public-site deployment receipt.

Historical ec21898 quality job115086006240 passed515/515 Node tests with82.07% line coverage. The earlier a0a7f53 run passed515/515 with81.99%; the earlier local82.01% receipt is separate. ec21898 Lighthouse Best Practices96 failed because a Vite-hashed manifest resolved an icon to `/assets/assets/icons/icon-192.png` (404). The corrected1ee run passed its Lighthouse step: EN Performance88/98/98, ES97/97/98, Accessibility100 and Best Practices100 in all six intro runs. Its six title-to-map timespans still failed the100ms TBT limit at121–140ms (CLS0). No complete performance acceptance is inferred.

Actual1ee browser logs show native Document.title setter invocation errors in Stops9–11, a native NodeFilter/voice scanning error, native-select WebKit CSP warnings and narrow control reachability failures. Owners are correcting these. Separate fixture fixes preserve the strict checks while using the configured server origin, waiting for the hidden intro-mounted host correctly, exiting native fullscreen before viewport resizing and holding synthetic controller edges until the real poll samples them. A CI-only ten-case WebKit isolation probe now requires the exact declaration hash to eliminate native-select violations while unrelated authored style attributes/elements remain blocked. It has not yet been executed; the candidate exception is unproven until its controls and full-game matrix pass.

Pending: Claude native Spanish/classification; exact readability exceptions; five-person otter/32px recognition; sound quality; pixel-baseline review; physical controller/rumble/disconnect and phone gestures; NVDA/Firefox and VoiceOver/Safari; installation/offline narration/eviction; final matrix/rendered contrast/Slow4G/CLS/Lighthouse and same-link deployment. Licensed music may remain disabled per spec.

Real focused local results from this agent:31 native core/map/input cases, two WCAG/compositing tests, six generic fact-source tests, four callout cases, seven readability cases and socket-free committed old/new privacy proof. These are not an invented full-suite total. Source owner reports26 native EN/ES phase checks for Stops3–15 plus eight wrong/shown assessment paths. Root/engine own final full-suite/coverage receipts after concurrent source changes settle.

Browser syntax/discovery succeeded:460 combinations (92 scenarios in five projects). This agent inspected CI receipts but ran no local browser, screenshot generation, Lighthouse or physical-device test. The1ee matrix completed with failures in all five projects; each log reports10 optional skips and71 scenarios not run after the failure cap. Older superseded runs were cancelled. Thirty visual scenarios per project remain optional pending actual files/review; family browser check needs its separate flavor server while structural family tests run independently. Platform PR3 remains unmerged and no improved public deployment is claimed.

A report can comprehensively cover every ticket while clearly retaining unfinished acceptance work. Do not describe the entire specification as complete until these implementation differences, required reviews and actual evidence are resolved or explicitly deferred.





