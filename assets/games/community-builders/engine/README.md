# Game controls and presentation engine

The browser loads `main.js` as an ES module. It mounts against the compatible `window.CommunityBuilders` core after that core is ready. A failed engine load leaves the core's existing controls available. Native Tab and Enter activation remain browser behavior. The module never sends feedback or scores.

## Action contract

Stops use actions instead of raw keyboard or gamepad events:

```js
api.input.on("choice.1", chooseFirst);
api.hints([
  { action: "confirm", label: "Choose" },
  { action: "pause", label: "Pause" },
]);
api.hud.set({ progress: [2, 4] });
api.badge.unlock("process-5");
```

Actions are `nav.up`, `nav.down`, `nav.left`, `nav.right`, `confirm`, `back`, `pause`, `choice.1` through `choice.9`, `tab.prev`, `tab.next`, `voice.toggle`, `voice.replay`, `voice.stop`, `captions.toggle`, `fullscreen.toggle`, `help`, and `map.zoom`.

`input.on(action, handler, {scope})` returns an unsubscribe function. The active scope receives a bubbling `cb:action` with `{action,device,repeat}`. The active modal dialog takes priority. Opening a scope records its opener; closing restores focus. Optional scope subscriptions are limited to that scope. Stop modules must unsubscribe when their round ends.

The device is `keyboard`, `mouse`, `touch` or `gamepad`. It is mirrored to `data-input` and announced through `cb:input-device`. Typing, composition and browser modifier shortcuts are ignored. Native arrows remain available in sliders, radios, tablists, menus, listboxes and non-interactive text. Elements marked `data-pg-native` keep their own keyboard and hold behavior, including the grown-up feedback Send control.

Use `data-cb-choices` on a choice container and `data-cb-choice="1"` through `"9"` on buttons. Missing numbers are assigned in DOM order. Use `data-cb-nav-group="row"` for tile rows, and `data-cb-nav-entry` for the first control in a scope. The numbers are visual hints only and are hidden from assistive technology; `aria-keyshortcuts` exposes the shortcut accessibly.

## Persistence and motion

The journey key remains `pecan-grove-journey[:session]`. Migration to version 2 preserves existing scores and adds `created`, `updated`, `badges` and an optional complete core `resume:{v:1,session,mode,stopId,slot,state,rng,roundSeed,focusId,ts}` record per animal slot. The store adds an ISO timestamp and preserves the controller state and RNG fields. Screen and `cb:step` events save after 50ms; finishing cancels pending saves and removes the completed stop's resume record. Resume expires after seven days. Slots never offer name entry. Settings migrate to version 2 under their existing key, retaining all earlier preferences. Key bindings use `pecan-grove-bindings-v1`.

Every new effect calls `motion.allowed()` and respects both the player's Calm setting and the device setting. Canvas particles stop when paused and are removed when idle. There is no particle animation under Calm. High contrast and forced-colors use visible outlines instead of depending on shadows. Tokens live in `tokens.css`.

## Audio

AudioContext starts on a player gesture. Master, voice, music and effects have separate gain buses. Existing narration and karaoke remain in the core. Procedural effects use quiet sine tones, with a gentle try-again sound. Music is disabled until licensed chapter loops are supplied by the owner. Library/Class mode disables voice and music and lowers optional effects. Hidden and paused play is muted.

## Validation

Run `node --experimental-test-coverage --test tools/tests/modernization-engine*.test.mjs`. On 2026-10-12, 38 tests passed and Node measured **87.26% line coverage** across engine JavaScript, **76.09% branch coverage**. This aggregate is a unit and DOM integration measure; it is not a claim that every device or every stop was manually tested.

Action subscriptions may specify a connected board scope. The board must contain the current focus or event target within the active scope. Modal actions never reach a background board. The deepest matching scope runs before global fallback; return `false` to observe an action without consuming it. The returned unsubscribe function removes only that subscription and is safe when other handlers have already unsubscribed.

Coverage includes keyboard mappings and guards, binding conflicts, spatial navigation, gamepad polling and deadzones, migrations and isolated slots, badge rules, audio gain and ducking, locale key and placeholder parity, native ARIA tabs, pause background inertness, touch pinch/drag/preview/swipe, HUD updates, and the Calm particle gate. Root release checks cover browser behavior and the generated site.

All modules stay below 500 physical lines. Engine ESLint passes. New control strings are in `locales/en.json` and `locales/es.json`; they use `Intl.PluralRules`, `Intl.ListFormat` and `Intl.RelativeTimeFormat`.

## Required human review

Spanish copy still needs a native speaker's sign-off. Music needs supplied licensed assets. The revised otter needs the owner and a recognition check with five people. Assistive technology smoke tests with NVDA/Firefox and VoiceOver/Safari are not replaced by automated DOM tests. The compatibility core and its legacy stop content still require their separately tracked extraction and per-stop review; these modules do not imply that those tickets are complete.
