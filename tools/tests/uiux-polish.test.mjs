// The 2026-10-30 UI/UX round, on the real mounted game (engine + core + stops in JSDOM).
// Each test names the audit finding it guards (PG-UX-C.., A.., B..).
import test from "node:test";
import assert from "node:assert/strict";
import { setTimeout as sleep } from "node:timers/promises";
import { mountedGame, until } from "./modernization-mounted-game-fixture.mjs";
import {
  Tooltips,
  saysItAlready,
} from "../../assets/games/community-builders/engine/tooltips.js";
import { annotateChoices } from "../../assets/games/community-builders/engine/choice-hints.js";
import { scrollport } from "../../assets/games/community-builders/engine/scene-layout.js";

// The fixture answers every media query with "reduce" (reduced motion), which
// also reads as forced colors and so as classic find cards. These tests want
// the default nonmodal finding: reduced motion on, forced colors off.
function motionOnly(r) {
  r.w.matchMedia = (query) => ({
    matches: /reduced-motion/.test(query),
    addEventListener() {},
    removeEventListener() {},
  });
}
function key(r, target, name) {
  const event = new r.w.KeyboardEvent("keydown", {
    key: name,
    code: name,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}
async function stop1Today(r) {
  motionOnly(r);
  r.core.enterPlay({ quiet: true });
  // Quiet play from the page also picks classic cards (Library mode); these tests want the nonmodal finding.
  r.engine.settings.update({ findCards: false });
  await r.core.startStop("notice-the-signs");
  r.main().querySelector(".cb-s01-intro .cb-btn--go").click();
  r.main().querySelector('[data-view="today"]').click();
}
const words = {
  en: { map: "Town map", cancel: "Cancel", keep: "Keep looking" },
  es: { map: "Mapa del pueblo", cancel: "Cancelar", keep: "Sigue buscando" },
};

for (const language of ["en", "es"]) {
  test(`${language}: Escape on an open finding closes the finding only; the next Escape opens Pause (PG-UX-C02)`, async () => {
    const r = await mountedGame(language);
    try {
      await stop1Today(r);
      const spot = r.main().querySelector('[data-spot="0"]');
      spot.focus();
      spot.click();
      const finding = r.root.querySelector(".cb-callout");
      assert.ok(finding, "the nonmodal finding is open");
      assert.equal(finding.querySelector(".cb-btn").textContent, words[language].keep);
      key(r, spot, "Escape");
      assert.equal(r.root.querySelector(".cb-callout"), null, "Escape closed the finding");
      assert.equal(r.root.querySelector(".cb-pause"), null, "and did not open Pause");
      assert.equal(r.w.document.activeElement, spot, "focus is back on the chosen thing");
      key(r, spot, "Escape");
      assert.ok(r.root.querySelector(".cb-pause[open]"), "with nothing else open, Escape is Pause");
      assert.equal(r.runtimeErrors.length, 0, String(r.runtimeErrors));
    } finally {
      r.close();
    }
  });

  test(`${language}: a finding is one polite announcement through the game's live region, and each item's name starts with its visible tag (PG-UX-C14, PG-UX-C11)`, async () => {
    const r = await mountedGame(language);
    try {
      await stop1Today(r);
      for (const spot of r.main().querySelectorAll(".cb-s01-spot")) {
        const tag = spot.querySelector(".cb-s01-tag__n").textContent;
        assert.ok(
          spot.getAttribute("aria-label").toLowerCase().startsWith(tag.toLowerCase()),
          `"${spot.getAttribute("aria-label")}" starts with "${tag}" (WCAG 2.5.3)`,
        );
      }
      const sign = r.w.__stopTestFlow.spots.find((spot) => spot.item.sign);
      r.main().querySelector(`[data-spot="${sign.i}"]`).click();
      const finding = r.root.querySelector(".cb-callout");
      assert.equal(finding.getAttribute("role"), null);
      assert.equal(finding.hasAttribute("aria-live"), false);
      assert.ok(finding.querySelector(".cb-s01-line .cb-ico"), "the lesson row has its check icon, as on the classic card");
      assert.ok(finding.querySelector(".cb-callout__sub"), "a sign's finding names the thing");
      assert.ok(finding.querySelector(".cb-btn--primary"), "Keep looking is a pill, not a quiet close");
      const live = r.root.querySelector(".cb-main ~ .cb-live, .cb-live"),
        title = finding.querySelector("h3").textContent;
      await until(() => live.textContent.startsWith(title), "the live region speaks the finding");
      assert.match(live.textContent, /1/, "the count is part of the same announcement");
      assert.ok(live.textContent.includes(finding.querySelector("h3").textContent));
      assert.equal(live.textContent.includes(words[language].keep), false, "the button is not read as the lesson");
    } finally {
      r.close();
    }
  });

  test(`${language}: Pause leads with Resume and asks before leaving with the action's own name, safe choice focused (PG-UX-C12, PG-UX-B09)`, async () => {
    const r = await mountedGame(language);
    try {
      motionOnly(r);
      r.core.enterPlay({ quiet: true });
      await r.core.startStop("ask-a-good-question");
      r.engine.pause.open();
      const pause = r.root.querySelector(".cb-pause[open]");
      const items = [...pause.children].filter((node) => node.tagName !== "H2");
      assert.ok(items[0].classList.contains("cb-btn--primary"), "Resume is the main choice");
      assert.equal(r.w.document.activeElement, items[0]);
      const rule = items.findIndex((node) => node.classList.contains("cb-pause__rule"));
      const leave = items.slice(rule + 1).map((node) => node.textContent);
      assert.ok(leave.includes(words[language].map), "the ways out sit below the line");
      [...pause.querySelectorAll(".cb-btn")].find((b) => b.textContent === words[language].map).click();
      const confirm = [...r.root.querySelectorAll("dialog[open]")].at(-1);
      const name = r.w.document.getElementById(confirm.getAttribute("aria-labelledby"));
      assert.equal(name.tagName, "H2", "the question names the dialog");
      const buttons = [...confirm.querySelectorAll("button")].map((b) => b.textContent);
      assert.deepEqual(buttons, [words[language].cancel, words[language].map]);
      assert.equal(r.w.document.activeElement.textContent, words[language].cancel, "Enter keeps the round");
      assert.equal(r.core.getState().mode, "stop");
    } finally {
      r.close();
    }
  });
}

test("Escape and Back close a tooltip first, then Pause; tooltips skip words already on screen and touch (PG-UX-A01, PG-UX-C22)", async () => {
  const r = await mountedGame("en");
  try {
    motionOnly(r);
    r.core.enterPlay({ quiet: true });
    await r.core.startStop("ask-a-good-question");
    const icon = r.root.querySelector(".cb-stophud .cb-setbtn");
    assert.equal(icon.getAttribute("aria-keyshortcuts"), null, "Settings names no Escape shortcut (Escape is Pause)");
    assert.equal(icon.hasAttribute("title"), false);
    icon.focus();
    await until(() => r.root.querySelector(".cb-tooltip"), "an icon-only button shows its name");
    key(r, icon, "Escape");
    assert.equal(r.root.querySelector(".cb-tooltip"), null, "Escape dismissed the tooltip (WCAG 1.4.13)");
    assert.equal(r.root.querySelector(".cb-pause"), null, "without opening Pause");
    key(r, icon, "Escape");
    assert.ok(r.root.querySelector(".cb-pause[open]"));
  } finally {
    r.close();
  }
});

test("tooltip rules: visible words, touch and the pointer resting on the tip (PG-UX-A01)", async () => {
  const r = await mountedGame("en");
  const tips = r.engine.tooltips;
  try {
    motionOnly(r);
    const host = r.w.document.createElement("div");
    host.innerHTML =
      '<button aria-label="Stop 2, Ask a Good Question, not played"><span>2</span><b>Ask a Good Question</b></button>' +
      '<button aria-label="Pause"><svg></svg></button>';
    r.root.append(host);
    const [named, icon] = host.querySelectorAll("button");
    assert.equal(saysItAlready(named, named.getAttribute("aria-label")), true);
    assert.equal(saysItAlready(icon, "Pause"), false);
    named.dispatchEvent(new r.w.Event("focusin", { bubbles: true }));
    await sleep(450);
    assert.equal(r.root.querySelector(".cb-tooltip"), null, "a stop whose plate shows its name needs no tooltip");
    r.root.dataset.input = "touch";
    icon.dispatchEvent(new r.w.Event("focusin", { bubbles: true }));
    await sleep(450);
    assert.equal(r.root.querySelector(".cb-tooltip"), null, "a tap gives no tooltip to clear");
    r.root.dataset.input = "mouse";
    icon.dispatchEvent(new r.w.Event("pointerover", { bubbles: true }));
    await until(() => r.root.querySelector(".cb-tooltip"), "a mouse hover shows the name");
    const tip = r.root.querySelector(".cb-tooltip");
    assert.equal(icon.hasAttribute("title"), false, "no second, native tooltip");
    icon.dispatchEvent(new r.w.MouseEvent("pointerout", { bubbles: true, relatedTarget: tip }));
    assert.ok(tip.isConnected, "moving onto the tooltip keeps it");
    tip.dispatchEvent(new r.w.MouseEvent("pointerout", { bubbles: true, relatedTarget: r.w.document.body }));
    assert.equal(tip.isConnected, false);
  } finally {
    tips.hide();
    r.close();
  }
});

test("number keys: only the group they act on shows keycaps, and a card's second button takes no number (PG-UX-B07, PG-UX-C23)", async () => {
  const r = await mountedGame("en");
  try {
    const host = r.w.document.createElement("div");
    host.innerHTML =
      '<ul data-cb-choices id="a"><li><button>One</button></li><li><button>Two</button></li></ul>' +
      '<ul data-cb-choices id="b"><li><button>Fix</button><button data-cb-choice-skip>Did it work?</button></li><li><button>Other fix</button><button data-cb-choice-skip>Did it work?</button></li></ul>';
    r.main().append(host);
    for (const node of host.querySelectorAll("ul"))
      node.getBoundingClientRect = () => ({ width: 300, height: 100, top: 0, left: 0, right: 300, bottom: 100 });
    annotateChoices(r.root, {});
    const a = host.querySelector("#a"),
      b = host.querySelector("#b");
    assert.equal(a.classList.contains("cb-choices-keyed"), true, "the first group in view is keyed");
    assert.equal(b.classList.contains("cb-choices-keyed"), false);
    assert.deepEqual(
      [...b.querySelectorAll("[data-cb-choice]")].map((node) => node.textContent.replace(/\d+$/, "")),
      ["Fix", "Other fix"],
    );
    assert.deepEqual([...b.querySelectorAll("[data-cb-choice]")].map((node) => node.dataset.cbChoice), ["1", "2"]);
    b.querySelector("button").focus();
    annotateChoices(r.root, {});
    assert.equal(b.classList.contains("cb-choices-keyed"), true, "focus moves the keycaps to its group");
    assert.equal(a.classList.contains("cb-choices-keyed"), false);
  } finally {
    r.close();
  }
});

test("Settings: Calm shows on and says why when the device asks for less motion; no placeholder music rows (PG-UX-A04, PG-UX-C26)", async () => {
  for (const language of ["en", "es"]) {
    const r = await mountedGame(language);
    try {
      motionOnly(r);
      globalThis.matchMedia = r.w.matchMedia;
      const d = r.engine.settings.open(null, "accessibility");
      const calm = d.querySelector('[data-panel="accessibility"] input[type="checkbox"]');
      assert.equal(calm.checked, true);
      assert.equal(calm.disabled, true);
      const hint = r.w.document.getElementById(calm.getAttribute("aria-describedby"));
      assert.equal(hint.textContent, r.engine.i18n.t("calmSystem"));
      assert.equal(d.querySelector('[data-panel="audio"]').textContent.includes(r.engine.i18n.t("musicSoon")), false);
      for (const reset of d.querySelectorAll(".cb-engine-reset"))
        assert.equal(reset.classList.contains("cb-btn--quiet"), false, "the reset buttons look pressable");
      d.close();
    } finally {
      r.close();
    }
  }
});

test("the round result reads the score first and puts Play again before the tips (PG-UX-A07, PG-UX-C21)", async () => {
  const r = await mountedGame("es");
  try {
    await stop1Today(r);
    const flow = r.w.__stopTestFlow;
    for (const spot of flow.spots) r.main().querySelector(`[data-spot="${spot.i}"]`).click();
    r.root.querySelector(".cb-callout")?.dismiss();
    [...r.main().querySelectorAll(".cb-btn--go")].at(-1).click();
    await until(() => r.main().querySelector(".cb-card__can"), "the result card");
    const score = r.main().querySelector(".cb-card__score");
    assert.equal(r.w.document.activeElement, score, "focus starts on the score and stars line");
    const actions = r.main().querySelector(".cb-card__btns"),
      tip = r.main().querySelector(".cb-tipcard");
    if (tip)
      assert.ok(actions.compareDocumentPosition(tip) & r.w.Node.DOCUMENT_POSITION_FOLLOWING, "Play again comes before the tips");
    const host = r.root.querySelector(".cb-engine-toast-host");
    assert.equal(host.getAttribute("aria-live"), "polite", "one polite region for the badge toasts");
    for (const toast of host.querySelectorAll(".cb-engine-toast"))
      assert.equal(toast.getAttribute("role"), null);
  } finally {
    r.close();
  }
});

test("a toast shows in the language on screen, even after a switch (PG-UX-C20)", async () => {
  const r = await mountedGame("en");
  try {
    r.engine.badge.notify?.("quiet-pro");
    r.engine.store.current().badges["quiet-pro"] = true;
    // The badge notifier queues a function, so the text is built when it shows.
    const host = r.root.querySelector(".cb-engine-toast-host");
    const before = host.textContent;
    r.w.document.documentElement.lang = "es";
    await r.engine.i18n.load("es");
    r.w.document.dispatchEvent(new r.w.CustomEvent("pg:language-change", { detail: { language: "es" } }));
    await until(() => !host.textContent || host.textContent !== before, "the visible toast follows the language");
    if (host.textContent) assert.match(host.textContent, /Nueva insignia/);
  } finally {
    r.close();
  }
});

test("the map keeps each finished stop's number and adds a check; Last 5 explains an empty list (PG-UX-B10, PG-UX-C36)", async () => {
  for (const language of ["en", "es"]) {
    const r = await mountedGame(language);
    try {
      r.core.enterPlay({ quiet: true });
      const state = r.core.getState(),
        player = state.store.players[state.store.current] || state.store.players.you;
      r.core.getAPI().STOPS.slice(0, 2).forEach((stop) => (player.stops[stop.id] = { best: 90, rounds: 1, last5: [90] }));
      r.core.showMap();
      await sleep(20);
      const done = r.main().querySelector('.cb-stop[data-state="done"]');
      assert.ok(done);
      assert.equal(done.querySelector(".cb-stop__disc > span").textContent, done.dataset.stopN);
      assert.ok(done.querySelector(".cb-stop__done svg"));
      for (const stop of Object.keys(player.stops)) delete player.stops[stop];
      r.core.getAPI();
      const opener = r.main().querySelector(".cb-jscore");
      opener.click();
      const dialog = [...r.root.querySelectorAll("dialog[open]")].at(-1);
      assert.match(dialog.textContent, language === "es" ? /Todavía no hay intentos/ : /No tries yet/);
    } finally {
      r.close();
    }
  }
});

test("the engine finds the box that scrolls the game (PG-UX-A02)", async () => {
  const r = await mountedGame("en");
  try {
    const stage = r.root.closest("[data-playtest-stage]");
    assert.equal(scrollport(r.root), null, "with nothing scrollable, the page scrolls");
    const port = r.w.document.createElement("div");
    port.className = "pt-stage-content";
    r.root.before(port);
    port.append(r.root);
    r.w.getComputedStyle = (node) => ({ overflowY: node === port ? "auto" : "visible" });
    Object.defineProperty(port, "clientHeight", { value: 600, configurable: true });
    Object.defineProperty(port, "scrollHeight", { value: 1400, configurable: true });
    assert.equal(scrollport(r.root), port, "the play view's own scrollport");
    assert.equal(r.core.getAPI().scrollport(), port, "stops reach it through the API");
    assert.ok(stage);
  } finally {
    r.close();
  }
});

test("the Settings language list switches the game and comes back to itself (PG-UX-A05)", async () => {
  const r = await mountedGame("en");
  try {
    r.core.enterPlay({ quiet: true });
    r.engine.settings.open(null, "language");
    const select = r.root.querySelector("#cb-engine-language");
    select.value = "es";
    select.dispatchEvent(new r.w.Event("change", { bubbles: true }));
    await until(() => r.w.document.documentElement.lang === "es" && r.root.querySelector(".cb-engine-settings[open]"), "Settings reopens after the switch", 4000);
    const dialog = r.root.querySelector(".cb-engine-settings[open]");
    assert.equal(dialog.querySelector('[role="tab"][aria-selected="true"]').dataset.tab, "language");
    assert.equal(r.w.document.activeElement.id, "cb-engine-language");
    assert.equal(dialog.querySelector("h2").textContent, "Ajustes");
  } finally {
    r.close();
  }
});
