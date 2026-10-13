import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { Bindings } from "../../assets/games/community-builders/engine/bindings.js";
import {
  annotateChoices,
  syncShortcutLabels,
} from "../../assets/games/community-builders/engine/choice-hints.js";
import {
  Hints,
  screenHints,
} from "../../assets/games/community-builders/engine/hints.js";
import {
  Gestures,
  zoomToPair,
} from "../../assets/games/community-builders/engine/gestures.js";
import { configureMotion } from "../../assets/games/community-builders/engine/motion.js";
import { chooseSpatial } from "../../assets/games/community-builders/engine/focus.js";
const storage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
};
function harness(
  markup = "<div data-cb-choices><button>A</button><button>B</button></div>",
) {
  const dom = new JSDOM(
    '<main id="root" data-screen="stop"><div class="cb-main">' +
      markup +
      "</div></main>",
    { url: "https://example.org/" },
  );
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: dom.window.document,
  });
  const root = dom.window.document.querySelector("#root");
  return {
    dom,
    root,
    close() {
      if (previous) Object.defineProperty(globalThis, "document", previous);
      else delete globalThis.document;
      dom.window.close();
    },
  };
}
test("rebindings retain the physical action and persist the actual keyboard-layout display key", () => {
  const data = storage(),
    bindings = new Bindings(data);
  assert.equal(bindings.assign("confirm", { code: "KeyJ", key: "é" }).ok, true);
  assert.equal(bindings.action({ code: "KeyJ", key: "é" }), "confirm");
  assert.equal(bindings.label("KeyJ"), "É");
  assert.equal(new Bindings(data).label("KeyJ"), "É");
  bindings.reset();
  assert.equal(new Bindings(data).label("KeyJ"), "J");
});
test("only the focused gamepad choice gets its controller glyph and all numeric annotations remain hidden from speech", () => {
  const h = harness();
  try {
    const [a, b] = h.root.querySelectorAll("button");
    h.root.dataset.input = "gamepad";
    a.focus();
    annotateChoices(h.root, {
      pad: () => ({ id: "DualSense" }),
      settings: () => ({ padLayout: "auto" }),
    });
    assert.equal(h.root.querySelectorAll(".cb-choice-glyph").length, 1);
    assert.ok(a.querySelector(".cb-choice-glyph path"));
    assert.equal(a.getAttribute("aria-keyshortcuts"), "1");
    assert.equal(b.getAttribute("aria-keyshortcuts"), "2");
    assert.equal(
      h.root.querySelectorAll('.cb-choice-badge[aria-hidden="true"]').length,
      2,
    );
    assert.equal(
      a.querySelector(".cb-keycap").getAttribute("aria-hidden"),
      "true",
    );
    b.focus();
    annotateChoices(h.root);
    assert.equal(a.querySelector(".cb-choice-glyph"), null);
    assert.ok(b.querySelector(".cb-choice-glyph"));
    h.root.dataset.input = "touch";
    annotateChoices(h.root);
    assert.equal(h.root.querySelectorAll(".cb-choice-glyph").length, 0);
  } finally {
    h.close();
  }
});
test("live shortcut labels follow rebindings without stacking old tooltip keys", () => {
  const h = harness(
    '<button class="cb-voice" title="Voice on (M)">Voice</button><button class="cb-vbtn" title="Hear again">Replay</button>',
  );
  try {
    const bindings = new Bindings(storage());
    syncShortcutLabels(h.root, bindings);
    assert.equal(h.root.querySelector(".cb-voice").title, "Voice on (M)");
    bindings.assign("voice.toggle", { code: "KeyJ", key: "j" });
    syncShortcutLabels(h.root, bindings);
    syncShortcutLabels(h.root, bindings);
    assert.equal(h.root.querySelector(".cb-voice").title, "Voice on (J)");
    assert.equal(
      h.root.querySelector(".cb-voice").getAttribute("aria-keyshortcuts"),
      "J",
    );
  } finally {
    h.close();
  }
});
test("applicable hint defaults derive the active choice row and successful taps, preserving authored declarations", () => {
  const h = harness(
    '<section><div data-cb-choices><button data-cb-choice="1">A</button><button data-cb-choice="2">B</button></div><div data-cb-choices><button data-cb-choice="1">C</button></div><p>Not an action</p></section>',
  );
  try {
    const i18n = {
      t: (key, params) =>
        key === "hintPickCount" ? "Pick 1–" + params.count : key,
    };
    const input = { device: "keyboard", bindings: new Bindings(storage()) };
    const cfg = { hints: "auto" };
    assert.equal(
      screenHints(h.root, i18n).find((item) => item.action === "choice").keys,
      "1–2",
    );
    h.root.querySelectorAll("button")[2].focus();
    assert.equal(
      screenHints(h.root, i18n).find((item) => item.action === "choice").keys,
      "1–1",
    );
    const hints = new Hints({ root: h.root, input, i18n, settings: () => cfg });
    hints.refresh();
    hints.set([{ action: "confirm", label: "Authored action" }]);
    hints.refresh();
    assert.equal(hints.items[0].label, "Authored action");
    input.device = "touch";
    for (let i = 0; i < 5; i++) h.root.querySelector("p").click();
    assert.equal(hints.taps, 0);
    h.root.querySelector("button").setAttribute("aria-disabled", "true");
    h.root.querySelector("button").click();
    assert.equal(hints.taps, 0);
    for (let i = 0; i < 3; i++) h.root.querySelectorAll("button")[1].click();
    assert.equal(hints.taps, 3);
    assert.ok(hints.node.classList.contains("is-hidden"));
    cfg.hints = "on";
    hints.render();
    assert.ok(!hints.node.classList.contains("is-hidden"));
    h.root.dataset.screen = "title";
    hints.refresh();
    assert.ok(hints.node.classList.contains("is-hidden"));
  } finally {
    h.close();
  }
});
test("zoom begins around the focused stop and predecessor, and bounded inertia is disabled by Calm", () => {
  const h = harness(
    '<div class="cb-world"><div class="cb-map-controls"></div><div class="cb-world__pan"><div class="cb-world__canvas"><button class="cb-stop" data-state="done">One</button><button class="cb-stop" data-state="next">Two</button></div></div></div>',
  );
  try {
    const bounds = {
        left: 0,
        top: 0,
        right: 600,
        bottom: 400,
        width: 600,
        height: 400,
      },
      rects = [
        { left: 60, top: 100, right: 104, bottom: 144 },
        { left: 110, top: 160, right: 154, bottom: 204 },
      ];
    const pair = zoomToPair(bounds, rects[1], rects[0]);
    assert.equal(pair.zoom, 1.8);
    assert.ok(pair.pan.x > 0 && pair.pan.y > 0);
    const frames = new Map();
    let id = 0;
    h.dom.window.requestAnimationFrame = (callback) => {
      frames.set(++id, callback);
      return id;
    };
    h.dom.window.cancelAnimationFrame = (key) => frames.delete(key);
    const g = new Gestures({
      root: h.root,
      i18n: { t: (key) => key },
      focus: {},
      core: () => null,
      settings: { get: () => ({}) },
    });
    h.root.querySelector(".cb-world__pan").getBoundingClientRect = () => bounds;
    [...h.root.querySelectorAll(".cb-stop")].forEach(
      (node, index) => (node.getBoundingClientRect = () => rects[index]),
    );
    g.refresh();
    assert.ok(h.root.querySelector(".cb-map-controls .cb-engine-zoom"));
    g.toggle();
    assert.equal(g.zoom, 1.8);
    assert.ok(g.pan.x > 0);
    configureMotion(
      () => ({ calm: false }),
      () => ({ matches: false }),
    );
    g.pan = { x: 0, y: 0 };
    g.velocity = { x: 0.2, y: 0.1 };
    g.coast();
    assert.equal(frames.size, 1);
    let [key, callback] = frames.entries().next().value;
    frames.delete(key);
    callback(h.dom.window.performance.now() + 16);
    assert.ok(g.pan.x > 0);
    g.stopCoast();
    assert.equal(frames.size, 0);
    configureMotion(
      () => ({ calm: true }),
      () => ({ matches: false }),
    );
    g.velocity = { x: 1, y: 1 };
    g.coast();
    assert.equal(frames.size, 0);
    const focused = h.root.querySelectorAll(".cb-stop")[1];
    focused.getBoundingClientRect = () => ({
      left: 550,
      top: 360,
      right: 630,
      bottom: 440,
      width: 80,
      height: 80,
    });
    g.pan = { x: 0, y: 0 };
    g.reveal(focused);
    assert.deepEqual(
      g.pan,
      { x: -42, y: -52 },
      "Directional focus reveals an offscreen stop within the zoomed viewport",
    );
    g.zoom = 1;
    g.map.getBoundingClientRect = () => {
      throw Error(
        "Fit zoom must not flush layout to calculate zero pan limits",
      );
    };
    g.pan = { x: 50, y: -25 };
    g.paint();
    assert.equal(g.map.style.getPropertyValue("touch-action"), "pan-y");
    assert.deepEqual(g.pan, { x: 0, y: 0 });
  } finally {
    configureMotion(
      () => ({}),
      () => ({ matches: false }),
    );
    h.close();
  }
});
test("a declared row can disable wrapping without changing spatial direction rules", () => {
  const h = harness(
    '<div data-cb-nav-group="row" data-cb-nav-wrap="false"><button>A</button><button>B</button></div>',
  );
  try {
    const [a, b] = h.root.querySelectorAll("button");
    a.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 44,
      height: 44,
    });
    b.getBoundingClientRect = () => ({
      left: 50,
      top: 0,
      width: 44,
      height: 44,
    });
    assert.equal(chooseSpatial(b, [a, b], "right"), null);
    a.parentNode.dataset.cbNavWrap = "true";
    assert.equal(chooseSpatial(b, [a, b], "right"), a);
  } finally {
    h.close();
  }
});
import { installTipPages } from "../../assets/games/community-builders/engine/result-presentation.js";
test("result tips have real bounded swipe pages and previous/next button equivalents", () => {
  const h = harness(
    '<section class="cb-card"><div class="cb-card__body"><div class="cb-tipcard">Think about every voice</div><div class="cb-tipcard cb-card__real">Ask at home</div></div></section>',
  );
  try {
    const i18n = {
      t: (key, p) =>
        key === "tipPageCount" ? `Tip ${p.current} of ${p.count}` : key,
    };
    installTipPages(h.root, i18n);
    installTipPages(h.root, i18n);
    const card = h.root.querySelector(".cb-card"),
      pages = [...card.querySelectorAll(".cb-tipcard")],
      [previous, next] = card.querySelectorAll("button");
    assert.equal(card.querySelectorAll(".cb-tip-pages").length, 1);
    assert.equal(card.dataset.cbPages, "2");
    assert.equal(pages[0].hidden, false);
    assert.equal(pages[1].hidden, true);
    assert.equal(previous.disabled, true);
    next.focus();
    next.click();
    assert.equal(pages[0].hidden, true);
    assert.equal(pages[1].hidden, false);
    assert.equal(h.dom.window.document.activeElement, previous);
    assert.equal(
      card.querySelector('[role="status"]').textContent,
      "Tip 2 of 2",
    );
    card.dispatchEvent(
      new h.dom.window.CustomEvent("cb:page", { detail: { delta: -1 } }),
    );
    assert.equal(pages[0].hidden, false);
    card.dispatchEvent(
      new h.dom.window.CustomEvent("cb:page", { detail: { delta: -1 } }),
    );
    assert.equal(pages[0].hidden, false);
    assert.equal(
      card.querySelector('[role="status"]').textContent,
      "Tip 1 of 2",
    );
  } finally {
    h.close();
  }
});
