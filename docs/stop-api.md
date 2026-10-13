# Stop API and lifecycle

The public compatibility object remains `window.CommunityBuilders`. `getAPI()` returns the stop API after core initialization. The runtime fetches and validates fifteen metadata descriptors from `stops/manifest.json`; `manifest.js` remains a generated compatibility fallback. Opening a stop loads its bilingual JSON namespace, own JS and CSS, then runs its factory in the current language. Stops 3/4 use the same path as every other stop.

A module registers a factory with `CommunityBuilders.defineStop(factory)`. The factory receives a lifecycle with tracked `document`/`window` event listeners, timeouts, animation frames and `cleanup(fn)` for subscriptions or other resources. It returns `{id, steps, css, run(api, stop)}`; descriptor snapshot/restore callbacks are also supported. The fallback `register()` entry point supports older integrations. Factories must recreate their locale closures for a language switch; do not retain another player's state outside the factory.

| API | Current behavior |
| --- | --- |
| `h`, `btn`, `ico`, `img`, `crop`, `story`, `screen`, `dialog` | Existing DOM and painted-scene helpers. Labels use text nodes. |
| `clear(element)`, `setAuthoredMarkup(element,markup)` | Construct authored SVG nodes through the shared allowed-tag/attribute helper. Do not assign `innerHTML` or pass untrusted content as authored markup. Also exposed on the compatibility object. |
| `rng()`, `shuffle(items)`, `pick(items)` | One deterministic game RNG; `?seed=42` reproduces a run. Never use a separate random source for round content. |
| `setController({snapshot, restore, onPause?, onResume?})` | Install explicit JSON-safe state restoration. All 15 stops now use native models/controllers; the lifecycle pauses tracked work automatically, with optional callbacks for stop-owned behavior. |
| `hints([{action,label}])`, `hud.set({progress:[current,total],points?})` | Delegate to the engine's persistent hint and HUD layers. |
| `input.on/off`, `nav.group(element,{axis,wrap,entry})`, `nav.push/pop` | Actions, explicit navigation groups and focus scopes. Input subscriptions return an unsubscribe function registered for lifecycle cleanup. Return `false` to let navigation continue. Active dialogs exclude background stop scopes. |
| `choices(element)` / `data-cb-choices` | Explicit ordered choice groups for number keys, arrows, contextual hints and accessibility metadata. |
| `badge.unlock(id)`, `fx.burst/stamp/pulse/nudge`, `motion.allowed()/duration(ms)` | Delegate to the shared engine; respect Calm motion. |
| `callout(anchor,content,{title,closeLabel,onClose})` | A nonmodal anchored region. It closes outside, with Escape or its button. Used for Stop 1 discoveries. |
| `prefersFindCards()` | Reads the classic discovery-card preference. Library/Class defaults to it; ordinary play defaults to inline callouts. |
| `art(name,{priority,crop,alt,className})`, `resolveAsset(path)` | Responsive image/crop helpers and build asset mapping. |
| `t(key,params,namespace='core')`, `t2([en,es])` | JSON locale lookup and compatibility pair selection. Every authored bilingual message, including story banks, comes from JSON; formatter logic and classification IDs remain authored JS. |
| `save()` | Requests a step save; regular rendered screen changes are also autosaved by the slot engine. |
| `saveRound(id,score,meta)` | Records one completed round and emits `cb:result`; restoration does not repeat this mutation. |

## State format and compatibility adapter

`CommunityBuilders.snapshot()` returns `{v:1,mode,stopId,slot,session,ts,roundSeed,rng,screenKey,focusId,state,roundRecord,resultInfo,voice}`. A resume must keep the complete record, including version, session and RNG values. `roundRecord` and `resultInfo` preserve the original score baseline and completion messaging. `voice`, when present, contains `{file,kind,language,time,line,playing}`; `line` identifies a caption chunk. The engine stores this record on the selected slot, under that anonymous player's storage key. Passing only the stop ID loses state and is unsupported.

All fifteen stops now install native controllers. Stops 1/2 preserve explicit object/tile order, attempts and selections; Stops 3–15 use `{v:2,phase,...}` models with stable authored IDs, attempts, assessments, dialogs and presentation fields. English/Spanish prose and DOM nodes are rebuilt from JSON. Twenty-six native phase cases compare actual screens/open dialogs and exact model equality through restore and live EN/ES, with no result writes. Eight separate wrong/shown-answer cases cover 9/10/11/14. These are meaningful paths, not exhaustive action combinations.

Older saved records may still contain `{adapter:'actions-v1',actions:[...]}`. The core routes that format to seeded accepted-action replay before selecting the native restore path. This compatibility branch uses virtual debounce/shortened replay time and suppresses completion writes. New native models use real tracked timer durations, preserving a resolving phase. Replacing a round silently disposes its old authored dialogs; it must not run stale close callbacks or stack dialogs from different rounds.

The core pauses tracked module work and the active voice clip. Resume continues the same connected clip. Restoring a saved narration record seeks to its exact media time in the same language; switching languages rebuilds the game in place and starts the corresponding caption chunk in the translated clip. A language change while paused defers playback until Resume. Media-double tests exercise these paths with the real word timings. An introductory gate stays paused during a language switch.

Static state rendering must finish while paused. For example, Stop 10 creates saved SVG yarn links synchronously after mounting its board; a later animation frame only refreshes layout. Restoring a paused record must not leave authored content hidden until Resume.

## Required checks for future edits

Run the authored score/content tests, the modernization gameplay tests, locale parity checks and real browser acceptance checks. A DOM test cannot prove collision avoidance, viewport fit, screen-reader output, touch, gamepad hardware or actual media playback. Record those separately in the release report. Keep substantive Spanish wording, new animal art, music rights and factual neutrality marked for human review when that review has not occurred.
