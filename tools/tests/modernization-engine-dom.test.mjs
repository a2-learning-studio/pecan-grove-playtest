import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { mount } from "../../assets/games/community-builders/engine/main.js";
import { Gestures } from "../../assets/games/community-builders/engine/gestures.js";
import { FX } from "../../assets/games/community-builders/engine/fx.js";
import { configureMotion } from "../../assets/games/community-builders/engine/motion.js";
import { controllerGlyph } from "../../assets/games/community-builders/engine/hints.js";
import {
  trustedScriptURL,
  trustedWorkerURL,
} from "../../assets/games/community-builders/engine/assets.js";
import createLegacyInput from "../../assets/games/community-builders/engine/core/legacy-input.js";
import {
  clear,
  setAuthoredMarkup,
} from "../../assets/games/community-builders/engine/authored-markup.js";
const messages = JSON.parse(
  await readFile(
    new URL(
      "../../assets/games/community-builders/engine/locales/en.json",
      import.meta.url,
    ),
  ),
);

test("script URL policy admits only authored local game modules and caches the scoped policy", () => {
  const dom = new JSDOM("", { url: "https://example.org/play/" });
  const window = dom.window;
  const stop = "/play/assets/games/community-builders/stops/03-listen.ab12.js";
  assert.equal(trustedScriptURL(window, stop), stop);
  let creations = 0;
  window.trustedTypes = {
    createPolicy(name, rules) {
      creations++;
      assert.equal(name, "pg-svg");
      assert.deepEqual(Object.keys(rules), ["createScriptURL"]);
      return {
        createScriptURL: (value) => ({ trusted: rules.createScriptURL(value) }),
      };
    },
  };
  assert.deepEqual(trustedScriptURL(window, stop), { trusted: stop });
  const voice = "/play/assets/games/community-builders/voice/index.abc12.js";
  assert.deepEqual(trustedScriptURL(window, voice), { trusted: voice });
  assert.deepEqual(trustedWorkerURL(window, "/play/sw.js"), {
    trusted: "/play/sw.js",
  });
  assert.throws(() => trustedScriptURL(window, "/play/sw.js"), TypeError);
  for (const candidate of [
    voice,
    "/sw.js",
    "/play/sw.js?different=1",
    "https://external.test/play/sw.js",
  ])
    assert.throws(() => trustedWorkerURL(window, candidate), TypeError);
  assert.equal(creations, 1);
  for (const url of [
    "https://untrusted.org/assets/games/community-builders/stops/03.js",
    "/play/other.js",
    "javascript:alert(1)",
    "/assets/games/community-builders/voice/en/clip.mp3",
  ])
    assert.throws(() => trustedScriptURL(window, url), TypeError);
  dom.window.close();
});

test("fallback native shortcuts invoke settings, help and captions through the module context", () => {
  const dom = new JSDOM("<main><button>Play</button></main>");
  const document = dom.window.document;
  const root = document.querySelector("main"),
    button = root.querySelector("button"),
    calls = [];
  createLegacyInput({
    document,
    root,
    CFG: { cap: true },
    bind() {},
    fsEl: () => null,
    openSettings: (opener, help) => calls.push(["settings", opener, !!help]),
    setCap: (on, tell) => calls.push(["captions", on, tell]),
  });
  button.focus();
  for (const key of ["Escape", "?", "c"])
    button.dispatchEvent(
      new dom.window.KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      }),
    );
  assert.deepEqual(calls, [
    ["settings", button, false],
    ["settings", button, true],
    ["captions", false, true],
  ]);
  root.setAttribute("data-engine-input", "true");
  button.dispatchEvent(
    new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  assert.equal(
    calls.length,
    3,
    "the shared engine owns shortcuts after mounting",
  );
  dom.window.close();
});

test("authored SVG builds and caches nodes while HTML parsing sinks are disabled", () => {
  const dom = new JSDOM("<div id=target></div>");
  const { document, Element } = dom.window;
  const descriptor = Object.getOwnPropertyDescriptor(
    Element.prototype,
    "innerHTML",
  );
  Object.defineProperty(Element.prototype, "innerHTML", {
    configurable: true,
    set() {
      throw new Error("Trusted Types sink");
    },
  });
  const target = document.querySelector("#target");
  const artwork =
    '<svg viewBox="0 0 64 64"><title>Otter &amp; pebble</title><path d="M1 2h3" fill="#882255"/><g aria-hidden="true"><circle cx="12" cy="3" r="2"/></g></svg>';
  setAuthoredMarkup(target, artwork);
  assert.equal(target.firstChild.namespaceURI, "http://www.w3.org/2000/svg");
  assert.equal(target.querySelector("title").textContent, "Otter & pebble");
  const original = target.firstChild;
  setAuthoredMarkup(target, artwork);
  assert.notEqual(target.firstChild, original);
  assert.equal(target.querySelectorAll("circle").length, 1);
  clear(target);
  assert.equal(target.childNodes.length, 0);
  Object.defineProperty(Element.prototype, "innerHTML", descriptor);
  dom.window.close();
});

test("authored SVG rejects scripts, event attributes and external references", () => {
  const dom = new JSDOM("<div id=target></div>");
  const target = dom.window.document.querySelector("#target");
  for (const markup of [
    "<script/>",
    '<path onclick="x()"/>',
    '<use href="https://example.com/x"/>',
    '<path fill="url(https://example.com/x)"/>',
    "<svg><g></svg>",
    "<svg><g>",
  ]) {
    assert.throws(() => setAuthoredMarkup(target, markup));
  }
  setAuthoredMarkup(
    target,
    '<svg><defs><path id="mark" d="M1 1h2"/></defs><use href="#mark"/></svg>',
  );
  assert.equal(target.querySelector("use").getAttribute("href"), "#mark");
  dom.window.close();
});

async function harness() {
  const dom = new JSDOM(
    '<html lang="en"><body><section id="pt-stage"><div id="community-builders" class="cb" data-screen="map"><main class="cb-main"><h2>Town map</h2><div class="cb-world"><div class="cb-world__pan"><div class="cb-world__canvas"><button class="cb-stop" data-stop-id="stop-1">Stop 1</button><button class="cb-stop" data-stop-id="stop-2">Stop 2</button></div></div><div class="cb-world__hud"></div></div><div data-cb-choices><button id="choice-a">First</button><button id="choice-b">Second</button></div></main></div></section></body></html>',
    { url: "https://example.test/game/" },
  );
  const win = dom.window;
  win.matchMedia = () => ({ matches: false, addEventListener() {} });
  win.navigator.getGamepads = () => [];
  const frames = new Map();
  let frameId = 0;
  win.requestAnimationFrame = (run) => {
    const id = ++frameId;
    frames.set(id, run);
    return id;
  };
  win.cancelAnimationFrame = (id) => frames.delete(id);
  win.HTMLElement.prototype.scrollIntoView = function () {};
  win.HTMLElement.prototype.getBoundingClientRect = function () {
    return {
      left: 0,
      top: 0,
      width: this.hidden ? 0 : 100,
      height: this.hidden ? 0 : 40,
    };
  };
  win.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  win.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new win.Event("close"));
  };
  const saved = new Map();
  const storage = {
    getItem: (key) => saved.get(key) || null,
    setItem: (key, value) => saved.set(key, value),
  };
  const old = new Map();
  for (const [key, value] of Object.entries({
    window: win,
    document: win.document,
    navigator: win.navigator,
    localStorage: storage,
    CustomEvent: win.CustomEvent,
    Event: win.Event,
    innerWidth: 1024,
    matchMedia: win.matchMedia,
    fetch: async () => ({ ok: true, json: async () => messages }),
  })) {
    old.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, {
      value,
      writable: true,
      configurable: true,
    });
  }
  const root = win.document.getElementById("community-builders"),
    calls = [];
  const state = {
    mode: "map",
    stopId: null,
    inStop: false,
    storageKey: "pecan-grove-journey:test",
    store: { version: 1, current: "you", players: { you: { stops: {} } } },
    settings: {},
    quiet: false,
  };
  const animals = [
    "fox",
    "owl",
    "turtle",
    "rabbit",
    "deer",
    "heron",
    "bee",
    "otter",
  ].map((id) => ({ id, name: id }));
  globalThis.CommunityBuilders = {
    getState: () => state,
    getAPI: () => ({
      STOPS: Array.from({ length: 15 }, (_, i) => ({
        id: "stop-" + (i + 1),
        n: i + 1,
        chap: Math.min(4, Math.floor(i / 4) + 1),
        name: "Stop " + (i + 1),
      })),
      ANIMALS: animals,
      W: { chapters: ["One", "Two", "Three", "Four"] },
      animalFace: (a) => {
        const span = win.document.createElement("span");
        span.textContent = a.name;
        return span;
      },
    }),
    updateSettings: (patch) => calls.push(["settings", patch]),
    pause: () => calls.push(["pause"]),
    resumePlay: () => calls.push(["resume"]),
    performAction: (action) => calls.push(["action", action]),
    showMap: () => calls.push(["map"]),
    showTitle: () => calls.push(["title"]),
    startStop: (id) => calls.push(["start", id]),
    resume: (record) => calls.push(["restore", record]),
    snapshot: () => ({
      v: 1,
      session: "test-session",
      mode: "stop",
      stopId: state.stopId,
      state: { step: 2 },
      ts: new Date().toISOString(),
    }),
  };
  const engine = await mount(root);
  return {
    dom,
    root,
    state,
    engine,
    calls,
    saved,
    paint() {
      const runs = [...frames.values()];
      frames.clear();
      runs.forEach((run) => run());
    },
    cleanup() {
      engine.slotTransition.destroy();
      engine.pause.close();
      engine.settings.dialog?.close();
      clearTimeout(engine.input.hold?.timer);
      for (const [key, descriptor] of old)
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      delete globalThis.PecanGroveEngine;
      delete globalThis.CommunityBuilders;
      dom.window.close();
    },
  };
}

test("real engine mount annotates one choice group and keeps drafts out of its controls", async () => {
  const h = await harness();
  try {
    assert.equal(h.root.dataset.engineInput, "true");
    assert.equal(h.root.dataset.engineMounted, "true");
    assert.equal(h.root.querySelectorAll(".cb-engine-hud").length, 1);
    assert.equal(
      h.root.querySelector("#choice-b").getAttribute("aria-keyshortcuts"),
      "2",
    );
    assert.equal(h.root.querySelectorAll("#choice-b .cb-keycap").length, 1);
    let clicked = 0;
    h.root
      .querySelector("#choice-b")
      .addEventListener("click", () => clicked++);
    h.engine.input.emit("choice.2", { device: "keyboard" });
    assert.equal(clicked, 1);
    assert.equal(
      JSON.parse(h.saved.get("pecan-grove-journey:test")).version,
      2,
    );
  } finally {
    h.cleanup();
  }
});

test("board action scopes take priority while modal scopes isolate background handlers", async () => {
  const h = await harness();
  try {
    const board = h.root.querySelector("[data-cb-choices]");
    let backs = 0;
    const unsubscribe = h.engine.input.on(
      "back",
      () => {
        backs++;
        return true;
      },
      { scope: board },
    );
    board.querySelector("button").focus();
    h.engine.input.emit("back", { device: "gamepad" });
    assert.equal(backs, 1);
    assert.equal(!!h.engine.pause.dialog?.open, false);
    const dialog = h.engine.settings.open();
    dialog.querySelector("button").focus();
    h.engine.input.emit("back", { device: "gamepad" });
    assert.equal(backs, 1, "Background board cannot receive a modal action");
    assert.equal(dialog.open, false);
    unsubscribe();
    const one = h.engine.input.on(
      "scope-test",
      () => {
        throw new Error("Removed handler");
      },
      { scope: board },
    );
    const two = h.engine.input.on(
      "scope-test",
      () => {
        throw new Error("Removed handler");
      },
      { scope: board },
    );
    one();
    two();
    board.querySelector("button").focus();
    assert.equal(
      h.engine.input.emit("scope-test"),
      false,
      "Unsubscribing another handler cannot resurrect the first",
    );
  } finally {
    h.cleanup();
  }
});
test("pause makes background inert; settings stacks and closes back to pause", async () => {
  const h = await harness();
  try {
    const main = h.root.querySelector("main");
    h.engine.pause.open(main.querySelector("button"));
    assert.equal(main.inert, true);
    assert.equal(h.root.classList.contains("is-paused"), true);
    assert.equal(h.engine.pause.dialog.open, true);
    h.engine.settings.open(
      h.engine.pause.dialog.querySelector("button"),
      "controls",
    );
    assert.equal(h.engine.settings.dialog.open, true);
    assert.equal(
      h.engine.settings.dialog
        .querySelector('[data-tab="controls"]')
        .getAttribute("aria-selected"),
      "true",
    );
    h.engine.settings.dialog.close();
    assert.equal(h.engine.pause.dialog.open, true);
    h.engine.pause.close();
    assert.equal(main.inert, undefined);
    assert.equal(h.root.classList.contains("is-paused"), false);
    assert.ok(h.calls.some((call) => call[0] === "resume"));
  } finally {
    h.cleanup();
  }
});
test("all settings tabs have matching ARIA panels, separate bus controls and working native tabs", async () => {
  const h = await harness();
  try {
    const d = h.engine.settings.open();
    const tabs = [...d.querySelectorAll('[role="tab"]')];
    assert.equal(tabs.length, 5);
    for (const tab of tabs) {
      const panel = d.querySelector("#" + tab.getAttribute("aria-controls"));
      assert.equal(panel.getAttribute("aria-labelledby"), tab.id);
    }
    assert.equal(d.querySelectorAll('input[type="range"]').length, 4);
    assert.equal(
      d
        .querySelector('input[type="range"]:disabled')
        .closest(".cb-engine-setting")
        .querySelector("label").textContent,
      "Music volume",
    );
    tabs[0].dispatchEvent(
      new h.dom.window.KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
      }),
    );
    assert.equal(h.engine.settings.active, "display");
    assert.equal(d.querySelector('[data-panel="audio"]').hidden, true);
    assert.equal(d.querySelector('[data-panel="display"]').hidden, false);
    h.engine.settings.choose("controls");
    const row = [...d.querySelectorAll(".cb-engine-bindings tbody tr")].find(
      (row) => row.querySelector("th").textContent === "Choose",
    );
    h.engine.settings.capture("confirm", row.querySelector("button"));
    h.engine.input.keydown({
      code: "KeyJ",
      key: "j",
      preventDefault() {},
      stopImmediatePropagation() {},
    });
    assert.equal(h.engine.input.bindings.value.confirm[0], "KeyJ");
    assert.equal(h.engine.settings.active, "controls");
    assert.equal(
      JSON.parse(h.saved.get("pecan-grove-bindings-v1")).confirm[0],
      "KeyJ",
    );
  } finally {
    h.cleanup();
  }
});

test("gamepad can adjust settings ranges and selects while keyboard controls keep native behavior", async () => {
  const h = await harness();
  try {
    const d = h.engine.settings.open();
    const range = d.querySelector('input[type="range"]');
    range.focus();
    h.engine.input.emit("nav.left", { device: "gamepad" });
    assert.equal(range.value, "85");
    assert.equal(h.engine.settings.get().master, 85);
    h.engine.input.emit("nav.right", { device: "gamepad" });
    assert.equal(range.value, "90");
    const select = d.querySelector("select");
    select.focus();
    h.engine.input.emit("nav.right", { device: "gamepad" });
    assert.equal(h.engine.settings.get().rate, 1.15);
    h.engine.input.emit("nav.left", { device: "gamepad" });
    assert.equal(h.engine.settings.get().rate, 1);
  } finally {
    h.cleanup();
  }
});
test("save slot screen has eight animal choices and no text input", async () => {
  const h = await harness();
  try {
    const d = h.engine.openSlots(h.root.querySelector("button"), true);
    assert.equal(d.querySelectorAll(".cb-engine-slot-pick").length, 8);
    assert.equal(d.querySelector('input[type="text"],textarea'), null);
    d.querySelector(".cb-engine-slot-pick").click();
    assert.ok(h.state.store.players.fox);
    assert.equal(h.state.store.current, "fox");
    assert.equal(h.root.dataset.slotTransition, "pending");
    assert.equal(
      h.calls.some((call) => call[0] === "map"),
      false,
    );
    h.paint();
    h.paint();
    assert.equal(h.calls.at(-1)[0], "map");
  } finally {
    h.cleanup();
  }
});

test("a saved core record keeps its version, session and controller state when continuing", async () => {
  const h = await harness();
  try {
    const record = {
      v: 1,
      slot: "you",
      session: "test-session",
      mode: "stop",
      stopId: "one",
      state: { step: 3 },
      rng: 14,
      roundSeed: 9,
    };
    Object.assign(h.state, {
      mode: "stop",
      stopId: "one",
      inStop: true,
      session: "test-session",
    });
    h.root.dataset.feedbackPhase = "playing";
    h.dom.window.document.dispatchEvent(
      new h.dom.window.CustomEvent("cb:step", { detail: { snapshot: record } }),
    );
    await new Promise((resolve) => setTimeout(resolve, 65));
    assert.deepEqual(h.engine.store.current().resume.state, { step: 3 });
    const d = h.engine.openSlots(h.root.querySelector("button"));
    d.querySelector(".cb-engine-slot-pick").click();
    h.paint();
    h.paint();
    const restored = h.calls.find((call) => call[0] === "restore")?.[1];
    assert.equal(restored.v, 1);
    assert.equal(restored.session, "test-session");
    assert.equal(restored.rng, 14);
    assert.equal(restored.roundSeed, 9);
    assert.deepEqual(restored.state, { step: 3 });
  } finally {
    h.cleanup();
  }
});

test("audio, display and accessibility controls persist independently; reset and capture cancel work", async () => {
  const h = await harness();
  try {
    const d = h.engine.settings.open();
    const range = d.querySelector('input[type="range"]');
    range.value = "45";
    range.dispatchEvent(new h.dom.window.Event("input"));
    assert.equal(h.engine.settings.get().master, 45);
    assert.equal(h.engine.settings.get().voiceVolume, 90);
    const toggle = d.querySelector('input[type="checkbox"]');
    toggle.checked = false;
    toggle.dispatchEvent(new h.dom.window.Event("change"));
    assert.equal(h.engine.settings.get().voice, false);
    const scale = d.querySelector("#cb-engine-panel-display select");
    scale.value = "l";
    scale.dispatchEvent(new h.dom.window.Event("change"));
    assert.equal(h.engine.settings.get().capSize, "l");
    h.engine.settings.choose("controls");
    const opener = d.querySelector(".cb-engine-bindings button");
    h.engine.settings.capture("confirm", opener);
    h.engine.input.capture({
      code: "F5",
      preventDefault() {},
      stopImmediatePropagation() {},
    });
    assert.match(d.textContent, /kept for your browser/);
    h.engine.input.capture({
      code: "Escape",
      preventDefault() {},
      stopImmediatePropagation() {},
    });
    assert.equal(h.engine.input.capture, null);
    h.engine.settings.capture("confirm", opener);
    h.engine.input.capture({
      code: "KeyR",
      key: "r",
      preventDefault() {},
      stopImmediatePropagation() {},
    });
    const conflict = [...h.root.querySelectorAll("dialog[open]")].at(-1);
    assert.match(conflict.textContent, /Already used by Hear it again/);
    conflict.querySelector("button").click();
    assert.equal(h.engine.input.bindings.value.confirm[0], "KeyR");
    assert.equal(h.engine.input.bindings.value["voice.replay"][0], "Enter");
    const reset = [...d.querySelectorAll("button")].find(
      (button) => button.textContent === "Reset all settings",
    );
    reset.click();
    assert.equal(h.engine.settings.get().master, 90);
    assert.equal(h.engine.settings.get().voice, true);
    assert.equal(h.engine.settings.fsListeners.length, 1);
  } finally {
    h.cleanup();
  }
});

test("HUD progress and device hints update without duplicating controls", async () => {
  const h = await harness();
  try {
    h.state.mode = "stop";
    h.state.stopId = "stop-1";
    h.state.inStop = true;
    h.state.store.players.you.stops["stop-1"] = { best: 90, rounds: 1 };
    const hud = document.createElement("div");
    hud.className = "cb-stophud";
    hud.innerHTML =
      '<ol><li class="cb-step" aria-current="step">One</li><li class="cb-step">Two</li></ol>';
    h.root.querySelector("main").prepend(hud);
    h.engine.hud.render();
    assert.match(hud.textContent, /Best: 3 \/ 3/);
    h.engine.hud.set({ progress: [2, 4], points: 18 });
    assert.equal(hud.querySelector("progress").value, 2);
    assert.equal(hud.querySelector("progress").max, 4);
    assert.match(hud.textContent, /Points this round: 18/);
    h.engine.hud.render();
    assert.equal(hud.querySelectorAll(".cb-engine-hud").length, 1);
    h.engine.hints([{ action: "confirm", label: "Choose" }]);
    h.engine.input.setDevice("gamepad");
    assert.ok(h.root.querySelector(".cb-hints svg"));
    h.engine.input.setDevice("keyboard");
    assert.equal(h.root.querySelector(".cb-hints kbd").textContent, "Enter");
    h.engine.input.setDevice("touch");
    h.root.dispatchEvent(new h.dom.window.Event("click"));
    assert.equal(
      h.root.querySelector(".cb-hints").classList.contains("is-hidden"),
      false,
      "background taps do not count as successful choices",
    );
    for (let n = 0; n < 3; n++) h.root.querySelector("#choice-a").click();
    assert.equal(
      h.root.querySelector(".cb-hints").classList.contains("is-hidden"),
      true,
    );
    for (const layout of ["xbox", "playstation", "nintendo"])
      for (const action of ["confirm", "back", "voice.replay", "help"])
        assert.equal(controllerGlyph(action, layout).tagName, "svg");
  } finally {
    h.cleanup();
  }
});

test("touch pinch, drag, two taps, preview and settings swipe have button equivalents", async () => {
  const h = await harness();
  try {
    const g = new Gestures({
      root: h.root,
      i18n: h.engine.i18n,
      focus: h.engine.focus,
      core: () => globalThis.CommunityBuilders,
      settings: h.engine.settings,
    });
    g.refresh();
    assert.ok(h.root.querySelector(".cb-engine-zoom"));
    g.toggle();
    assert.equal(g.zoom, 1.8);
    g.toggle();
    assert.equal(g.zoom, 1);
    const map = g.map;
    g.down({
      pointerType: "touch",
      pointerId: 1,
      clientX: 100,
      clientY: 100,
      target: map,
    });
    g.down({
      pointerType: "touch",
      pointerId: 2,
      clientX: 200,
      clientY: 100,
      target: map,
    });
    g.move({ pointerId: 2, clientX: 300, clientY: 100 });
    assert.equal(g.zoom, 2);
    assert.equal(map.classList.contains("is-zoomed"), true);
    g.up({ pointerType: "touch", pointerId: 2, clientX: 300, clientY: 100 });
    g.cancel({ pointerId: 1 });
    assert.equal(g.points.size, 0);
    g.down({
      pointerType: "touch",
      pointerId: 3,
      clientX: 100,
      clientY: 100,
      target: map,
    });
    g.move({ pointerId: 3, clientX: 125, clientY: 115 });
    assert.equal(g.pan.x, 25);
    g.cancel({ pointerId: 3 });
    const token = map.querySelector(".cb-stop");
    h.root.dataset.input = "touch";
    g.suppressClick = false;
    let prevented = 0;
    const click = {
      target: token,
      preventDefault: () => prevented++,
      stopImmediatePropagation() {},
    };
    g.click(click);
    assert.equal(prevented, 1);
    g.click(click);
    assert.equal(prevented, 1);
    g.preview(token);
    let preview = [...h.root.querySelectorAll("dialog[open]")].at(-1);
    assert.match(preview.textContent, /Stop 1/);
    [...preview.querySelectorAll("button")]
      .find((button) => button.textContent === "Play this stop")
      .click();
    assert.deepEqual(h.calls.at(-1), ["start", "stop-1"]);
    const settings = h.engine.settings.open();
    g.down({
      pointerType: "touch",
      pointerId: 4,
      clientX: 200,
      clientY: 100,
      target: settings,
    });
    g.up({ pointerType: "touch", pointerId: 4, clientX: 70, clientY: 100 });
    assert.equal(h.engine.settings.active, "display");
  } finally {
    h.cleanup();
  }
});

test("FX uses bounded particles, stops idle frames, freezes on pause and obeys Calm", async () => {
  const h = await harness();
  try {
    const frames = new Map();
    let next = 0;
    const context = { clearRect() {}, fillRect() {} };
    h.dom.window.HTMLCanvasElement.prototype.getContext = () => context;
    const win = {
      requestAnimationFrame: (callback) => {
        frames.set(++next, callback);
        return next;
      },
      cancelAnimationFrame: (id) => frames.delete(id),
      getComputedStyle: () => ({ getPropertyValue: () => "gold" }),
    };
    const fx = new FX(h.root, win);
    configureMotion(
      () => ({ calm: true }),
      () => ({ matches: false }),
    );
    fx.burst(10, 10);
    assert.equal(fx.canvas, null);
    configureMotion(
      () => ({ calm: false }),
      () => ({ matches: false }),
    );
    fx.burst(10, 10, { kind: "pecans" });
    assert.equal(fx.pool.length, 24);
    fx.burst(10, 10, { kind: "leaves" });
    assert.equal(fx.pool.length, 24);
    fx.pause(true);
    assert.equal(frames.size, 0);
    fx.pause(false);
    assert.equal(frames.size, 1);
    let stamps = 0;
    let paused = 0,
      played = 0,
      cancelled = 0;
    const target = {
      animate: () => {
        stamps++;
        return {
          pause: () => paused++,
          play: () => played++,
          cancel: () => cancelled++,
        };
      },
    };
    fx.stamp(target);
    fx.pulse(target);
    fx.nudge(target);
    assert.equal(stamps, 3);
    fx.pause(true);
    assert.equal(paused, 3);
    fx.pause(false);
    assert.equal(played, 3);
    for (let i = 0; i < 70 && frames.size; i++) {
      const [id, callback] = frames.entries().next().value;
      frames.delete(id);
      callback(i * 16);
    }
    assert.equal(fx.canvas, null);
    assert.equal(cancelled, 3);
    assert.equal(frames.size, 0);
    fx.burst(10, 10);
    configureMotion(
      () => ({ calm: true }),
      () => ({ matches: false }),
    );
    const [id, callback] = frames.entries().next().value;
    frames.delete(id);
    callback(1200);
    assert.equal(fx.canvas, null);
  } finally {
    h.cleanup();
    configureMotion(
      () => ({}),
      () => ({ matches: false }),
    );
  }
});
