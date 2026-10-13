# Stop audit matrix

This matrix records source tests from the modernization work. It separates actual automated evidence from the broader physical-device and visual checks requested by section 10 of the spec.

| Stop | Authored logic | Partial same-language restore | EN→ES→EN partial restore | Saved slot → new core | Snapshot implementation |
| --- | --- | --- | --- | --- | --- |
| 1 Notice the Signs | First/repeat/wrong sign scoring | Pass | Pass | Pass | Explicit object order, signs, taps and view |
| 2 Ask a Good Question | All 12 worries, every tile combination, revision scoring | Pass | Pass | Pass | Explicit worries, tile orders, selections and answers |
| 3 Listen to Every Neighbor | All-listened/shared wishes/quote score 100 | Pass | Pass | Pass | Native listened IDs, pairs, quote/option order, answer and dialog |
| 4 Fact or Rumor? | Peek/correct/retry score branches; proposal wording | Pass | Pass | Pass | Native claim/source IDs, peek/classification assessments and phase |
| 5 Map What Could Change | First/correct/retry/shown branches | Pass | Pass | Pass | Native chain IDs, attempts, feedback and drawn links |
| 6 Who Decides? | Correct/retry/shown desk branches | Pass | Pass | Pass | Native question/neighbor/desk order, attempts and feedback |
| 7 Speak Up Kindly | Three-part card and correct helper | Pass | Pass | Pass | Native speaker/topic/tile/helper choices and resolving timer phase |
| 8 Disagree Kindly | Both reasons and shared solutions | Pass | Pass | Pass | Native neighbor/reason/shared-card IDs, attempts and last reactions |
| 9 Include Every Voice | Five chairs with retry branch | Pass | Pass | Pass | Native chairs, attempts, fill and room/aha/result phase |
| 10 Match a Fix | Five fixes with/without checking | Pass | Pass | Pass | Native problems, links, checked notes, selection and dialog state |
| 11 Weigh the Tradeoffs | Four paths, neighbors and changes | Pass | Pass | Pass | Native weighed paths, choices, feedback IDs, tray and phase |
| 12 Make a Fair Deal | Neighbor coverage, revision, who/what/when | Pass | Pass | Pass | Native selected/dealt promise IDs, changes and who/what/when fields |
| 13 Spread the Word Right | Rumor removal, stale claim, sources and dates | Pass | Pass | Pass | Native poster slots, replaced tray cards, source/date/headline/share state |
| 14 Keep Watch | Clues, promise status and follow-up | Pass | Pass | Pass | Native clue/status/follow-up assessments, notebook and confirmation phase |
| 15 Build the Future Together | Tradeoffs, wishes, annual check and missing voice | Pass | Pass | Pass | Native plan/tradeoff/check/invitation and scene phase |

The state checks execute the real core, lazy module loader, locale catalog and authored DOM callbacks in jsdom. The saved-slot check uses the real `Slots` implementation and transfers actual localStorage JSON to a new core instance. Each checks actual rendered game state, not only equality of the saved record. Tests exclude transient animation classes and generated ID serials when comparing equivalent screens.

These passes cover a meaningful partial path for every stop. They do not establish that every screen and every possible action sequence has been exhausted. The release report must list what was actually run.

Completed-result replay now has separate passing evidence: `modernization-gameplay-completed.test.cjs` runs all 15 stops in both English and Spanish (30 cases) through actual authored DOM controls. It checks the real score card and takeaway, exact same-language result restoration, a full bilingual round trip, unchanged saved scores, and uncaught runtime errors. This includes Stop 13 rumor removal/stale-date replacement and Stop 15 plan, annual check and missing-voice stages. It uses seeded authored choices and reduced motion; it does not claim exhaustive combinations.

All-stop strict-sink tests load every lazy module and activate its first gameplay screen with HTML assignment disabled. Shared-action tests cover Back in Stops 6, 9, 11 and 15, modal isolation and subscription disposal. Lifecycle checks cover dialog-close replay and Stop 8 pointer cleanup. Rapid-activation tests separately check the pointer-versus-keyboard guards in Stops 2, 13 and 15.

Narration media-double tests use the real voice index and word timings. They verify exact same-language seek, restarting the corresponding caption chunk in Spanish, and deferring playback through a paused language switch until Resume. They do not play a real audio device or validate perceived synchronization.

Native screen-reader speech, real gamepad hardware, pointer/touch accuracy, visual overlap at four viewport widths, forced-colors rendering and axe on every screen require their own evidence. Spanish copy, modern character art and content classification remain assigned human reviews; source tests cannot approve them.

Relevant sources: `tests/release-gameplay.test.cjs`, `tests/stop-02-question-fit.test.cjs`, `tools/tests/modernization-gameplay*.test.cjs`, `tools/tests/core-content.test.mjs`, `tools/tests/audio-controls.test.mjs`, and engine unit/DOM tests. Locale tests cover all 16 bilingual namespaces, key/formatter/placeholder parity and generated-catalog agreement with authored JSON.

Native phase coverage for Stops 3–15 passes 26 EN/ES cases in `modernization-gameplay-native.test.cjs`, including exact model/visible-state equality, actual open dialog content, live language round trips and no score writes while returning to prior phases. Eight additional wrong/shown-answer assessment cases pass for Stops 9/10/11/14. Stop 2 measured layout and art-collision behavior has a separate geometry-double regression. Actual screenshot/viewport, screen-reader and device evidence remains independent.
