# Community Builders: how to build one stop module

This guide is for building one stop of **Community Builders of Pecan Grove**, the kids' civic-skills game. The game shell (`assets/games/community-builders/cb.js` and `cb.css`) is finished: hub map, Stops 3 and 4, score card, Library / Team modes and full screen. Each remaining stop is a plug-in file that registers itself with the shell.

## Files you own (and the only files you may write)

- `assets/games/community-builders/stops/NN-<stop-id>.js` holds the module.
- `assets/games/community-builders/stops/NN-<stop-id>.css` is optional, for this stop's own styles only.
- Copy both into `docs/assets/games/community-builders/stops/` so the running local server can serve them. Never run `tools/build.py`: other builders are testing at the same time, and a rebuild empties `docs/`.
- Test URL: `http://localhost:8765/kids/community-builders/?cbstop=NN-<stop-id>` (English) and `http://localhost:8765/es/ninos/constructores-de-comunidad/?cbstop=NN-<stop-id>` (Spanish). The `cbstop` parameter loads your module even though `manifest.js` is still empty.
- **Do not edit** cb.js, cb.css, manifest.js, templates, content or any other stop's files. If the shell lacks something, build it inside your module and name it in your report.

## Module shape

```js
(function () {
  "use strict";
  var CB = window.CommunityBuilders; if (!CB) return;
  CB.register({
    id: "notice-the-signs",            // must equal the stop id in cb.js STOPS
    steps: ["Look", "Check"],          // part labels for the header stepper; use null entries for unlabelled dots
    css: "01-notice-the-signs.css",    // optional; the shell adds the <link>
    run: function (api, stop) { /* draw your first screen with api.screen(...) */ }
  });
})();
```

`steps` labels must be in the page language. Build them as `{ en: [...], es: [...] }[lang]` at register time; read the language from `document.documentElement.lang` (es / en).

`stop` is `{ id, name, chap, n }`: the stop number `n`, the chapter `chap` (1–4), and `name` in the current language.

## The API (`api`)

**Data**

| Item | What it holds |
|---|---|
| `api.L` | "en" or "es" |
| `api.W` | Shared UI strings: `next`, `back`, `townmap`, `score`, `stars(n)`, `part(n)` and the rest |
| `api.STOPS` | All 15 stops |
| `api.NB` | The six neighbors: `{ id, en, es, esCap, role{en,es}, plain{en,es}, img }`. Ids: lee, johnson, ana, ruth, patel, jayden |
| `api.CHAP` | Chapter colours |
| `api.ANIMALS` | Library-mode animals |
| `api.REDUCED` | Whether reduced motion is on |
| `api.BASE` | The game's asset folder |
| `api.STAR_ON` / `api.STAR_OFF` | Star SVGs |
| `api.BASKET_ICON` | Icons for fact / rumor / dontknow |
| `api.IC` | Icon path data |

**Helpers**

- `api.h(tag, attrs, kids)` builds DOM. Attribute keys starting with `on` become listeners; `text` sets textContent; `html` takes authored constant markup only.
- `api.ico(name, cls)` returns an icon SVG. Names: back, go, check, close, lock, sun, cloud, bulb, home, replay, people, family, peek, trophy, star, flyer, chat, expand, shrink, ear.
- `api.img(name, alt, cls, eager)` loads `img/<name>.webp`. Available: town-map, ms-lee, mr-johnson, ana, grandma-ruth, mr-patel, jayden, unity.
- `api.btn(label, cls, onclick, icon, iconAfter)` builds a pill button. cls is one of `cb-btn--go` (clay, primary), `cb-btn--primary` (pine), `cb-btn--big`, `cb-btn--quiet`.
- `api.shuffle(arr)` and `api.pick(arr)`.
- `api.t2([en, es])` picks the string for the current language.
- `api.nm(nb)` returns a name ("la Sra. Lee"); `api.nmCap(nb)` returns it capitalised ("La Sra. Lee").
- `api.nbById(id)`.

**Screen**

- `api.screen([kids], focusSelector)` replaces the stage content. Always pass `[api.stopHud(...), boardElement]`.
- `api.stopHud(stop, steps, currentIndex, caption)` draws the dark header: back button, full-screen button, stop badge, name and stepper. For unlabelled dot steppers, pass a caption such as "Claim 2 of 5".
- `api.coach(text, iconName)` draws the white instruction line.
- `api.fb(text, ok)` draws the feedback card: ok=true is pine with a check, false is a blue "good try" with a bulb.
- `api.frame()` keeps the stage in view after a screen change. Call it when moving to a new part or question, not on every tap re-render.
- `api.say(text)` speaks through the polite live region. Call it on every feedback and result.
- `api.dialog(title, [bodyNodes], openerButton, onClose, { face: "ms-lee", sub: "role line", wide: true })` opens a modal; focus returns to the opener.
- `api.crop([x0, y0, x1, y1], cls, [overlayKids])` returns a `.cb-art` panel showing a **painted crop of the town map**. The panel keeps the map's 1376:768 aspect unless your CSS changes it. The zoom comes from the crop width; the vertical window centres from y0, so y1 is ignored. Keep `x1 - x0 >= 0.33` so the paint stays sharp. Overlays such as name plates, hotspot buttons and badges go in `overlayKids`; position them with % in your CSS or with `el.style.setProperty(...)`.

**Scoring and finishing a round (always in this order)**

```js
var info = api.saveRound(stop.id, score, { lastRound: roundKey });   // extra fields are saved for "never repeat the same round"
api.endPlay();
var card = api.scoreCard(stop, score, info, tipText, takeawayText, tryItForRealText, optionalExtraNode);
api.finishRound(stop.id, card, api.cardButtons(stop.id, api.restart(stop.id), optionalExtraButton));
api.say(api.W.score + " " + score + " / 100");
```

- `api.rec(stop.id)` returns the saved record (`best`, `first`, `last5`, `rounds`, plus your extra fields). Use it so a new round differs from the last one.
- Team challenge and Library mode work automatically through `finishRound` and `cardButtons`; do not special-case them.

## Painted map: where places are (fractions of the map, x then y)

| Place | Area |
|---|---|
| Sky and hills | y 0–0.22 |
| Farm fields and orchard (the Old Miller Farm land, upper middle and right) | x 0.30–0.92, y 0.15–0.38 |
| Homes (left side) | x 0.00–0.40, y 0.28–0.62 |
| Big clock-tower building (use as Town Hall / Community building, or School when the stop says so) | x 0.42–0.58, y 0.32–0.52 |
| Main Street shops, including Mr. Patel's bakery with the striped awning | x 0.60–0.98, y 0.36–0.52 |
| Homes by Main Street | x 0.70–0.92, y 0.48–0.68 |
| Community garden plots | x 0.15–0.55, y 0.53–0.68 |
| Pecan River | full width, y 0.70–0.80; the wooden bridge is at x 0.66–0.73 |
| Dirt road and meadow | y 0.80–1.00 |

There is no painted clinic, chapel or library interior. When a spec asks for a "new picture" of a place that is not on the map, use the closest painted crop as the scene and put the place's elements on top as cards or plates. Never draw a fake painted scene in SVG or CSS. Small items ("stickers": a sign, flags, a truck, a letter) may be authored SVG icons in the same 24-grid, 2px round-stroke style as `api.IC`, shown inside white discs or cards. Never use emoji or Unicode glyphs as icons. Neighbor faces always use the painted portraits.

## The spec is the source of truth, translated from Playground to this shell

The spec file (`.../Game prompts (Google AI Studio)/Community Builders (kids civic modules)/NN - <id>.md`) and `00 - Series design (read first).md` were written as Google Playground prompts.

**Take from the spec, exactly:**
- every player-facing string, EN and ES, word for word, with no rephrasing;
- the mechanic;
- the round randomisation and pools;
- the scoring rubric: score out of 100, stars at 40/70/90, process only, never a side, outcome or speed;
- the tip rules in their stated priority;
- the takeaway (score-card "I can…" line);
- "Try it for real";
- the "For grown-ups" text for the stop, if the spec has one (offer it as the extra score-card button, as Stop 4 does);
- accessibility notes.

**Ignore, because the shell already does it:**
- paste and check instructions and "Where to paste";
- the top bar, language toggle, sound and player chip;
- how to save to localStorage (use `api.saveRound`);
- the Town Map hub and score-card layout;
- Library / Team mode;
- image-generation instructions (use painted crops and authored icons as above).

**Where the spec and this guide conflict on visuals or tech, this guide wins.** Where they conflict on words or scoring, the spec wins.

## Design and craft rules (DESIGN.md "Community Builders game stage")

- **Reuse the shared classes:**
  - layout: `cb-board`, `cb-actions` (sticky bottom bar holding feedback and the primary button), `cb-actions__info`, `cb-msg`, `cb-vh` (visually hidden)
  - speech and choices: `cb-bubble` (speech bubble), `cb-face-btn` inside `ul.cb-pick` (portrait choice grid), `cb-note` (notebook card)
  - sorting: `cb-baskets` / `cb-basket` with `data-k`
  - scenes and slots: `cb-wishslots` (target slots), `cb-art` (scene panel)
- **Colours:** only `var(--cb-*)` tokens. These are the stage, board, card, sunken, line, ink, clay, pine-soft, info-soft / info-ink and warn-soft / warn-ink, plus chapter colours `--cb-c1..c4`. Per-stop classes are prefixed `.cb-sNN-`.
- **Never:**
  - red/green "good vs bad" coding of views;
  - hard offset shadows, gradient text, or side-stripe borders thicker than 1px;
  - uppercase eyebrow labels above headings;
  - glyph or emoji icons;
  - bounce or elastic easing (use `var(--cb-ease)`);
  - decorative motion. Feedback-level motion only; reduced motion is already enforced by cb.css.
- **Content Security Policy (strict):**
  - never set a `style` attribute through `h()` or `setAttribute`; use `el.style.setProperty(...)`;
  - no `<style>` elements, `eval` or network calls;
  - `innerHTML` only with your own constant markup;
  - no text inputs anywhere.
- **Accessibility (WCAG 2.1 AA):**
  - real `<button>`s at least 44×44 CSS px, or the spec's larger size;
  - visible focus (inherited);
  - every control named in the current language;
  - keyboard operable;
  - no drag-only interaction (tap to pick, tap to place);
  - `aria-pressed` for toggles;
  - announce feedback with `api.say`;
  - after re-rendering on a tap, pass a focus selector to `api.screen` so focus stays on the tapped control (use `data-*` attributes);
  - contrast at least 4.5:1.
- **Layout:**
  - it must work at 1440×900, the 1366×768 floor and a 390×844 phone, with no horizontal page scroll;
  - the stage is a CSS container named `cb`; use `@container cb (max-width: 899.98px)` for the phone layout;
  - hotspots placed in % on a scene need a stacked or list fallback on the phone layout when they would fall under 44px or overlap.

## Self-test before you return (required)

- **How:** write a Playwright (Python, sync, headless chromium) script in your own scratch folder and run it with `python -I`. Do not use the in-app Browser pane or MCP browser tools; the site owner is playing in them.
- **Play patterns:**
  - English and Spanish;
  - 1440×900 and 390×844;
  - at least a careful/perfect round and a careless round;
  - assert the score equals the rubric's arithmetic for the moves you scripted;
  - play twice and assert the second round is a new random round.
- **Collect:** CSP violations through a `securitypolicyviolation` listener in `add_init_script`, and console errors. Both must be zero.
- **Inspect:** Read your screenshots at full size and fix what is broken or ugly (overlap, clipping, overflow, cramped spacing, unreadable text) before returning.
