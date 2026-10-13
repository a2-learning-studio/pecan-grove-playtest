import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import { I18n } from "../../assets/games/community-builders/engine/i18n.js";
import { HUD } from "../../assets/games/community-builders/engine/hud.js";
import { Tooltips } from "../../assets/games/community-builders/engine/tooltips.js";
import { enhanceTitle } from "../../assets/games/community-builders/engine/title-menu.js";
import {
  badgeIcon,
  badgeHint,
} from "../../assets/games/community-builders/engine/badge-art.js";
import { BADGE_IDS } from "../../assets/games/community-builders/engine/badges.js";
import {
  showResultBadges,
  observeFeedback,
} from "../../assets/games/community-builders/engine/result-presentation.js";
import {
  transitionScene,
  animateScene,
  zoomMapDisc,
} from "../../assets/games/community-builders/engine/transitions.js";
import { titleParallax } from "../../assets/games/community-builders/engine/title-parallax.js";
import { AudioMixer } from "../../assets/games/community-builders/engine/audio.js";

function fixture(markup = "") {
  const dom = new JSDOM("<main>" + markup + "</main>", {
    url: "https://example.test/",
  });
  const old = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", {
    value: dom.window.document,
    configurable: true,
  });
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new dom.window.Event("close"));
  };
  const i18n = new I18n(
    "en",
    JSON.parse(
      fs.readFileSync(
        new URL(
          "../../assets/games/community-builders/engine/locales/en.json",
          import.meta.url,
        ),
      ),
    ),
  );
  return {
    root: dom.window.document.querySelector("main"),
    w: dom.window,
    i18n,
    close() {
      if (old) Object.defineProperty(globalThis, "document", old);
      else delete globalThis.document;
      dom.window.close();
    },
  };
}

test("fine-pointer title depth stays bounded and resets under Calm, Pause or touch", () => {
  const r = fixture(
    '<section class="cb-hero"><img class="cb-hero__art"></section>',
  );
  try {
    const hero = r.root.querySelector("section"),
      art = hero.querySelector("img");
    hero.getBoundingClientRect = () => ({
      left: 10,
      top: 20,
      width: 200,
      height: 100,
    });
    r.root.dataset.motion = "full";
    titleParallax(r.root, hero);
    titleParallax(r.root, hero);
    const move = (x, y, type = "mouse") => {
      const event = new r.w.Event("pointermove");
      Object.assign(event, { clientX: x, clientY: y, pointerType: type });
      hero.dispatchEvent(event);
    };
    move(210, 120);
    assert.equal(art.style.getPropertyValue("--cb-title-pointer-x"), "4px");
    assert.equal(art.style.getPropertyValue("--cb-title-pointer-y"), "4px");
    move(-50, -50);
    assert.equal(art.style.getPropertyValue("--cb-title-pointer-x"), "-4px");
    move(100, 80, "touch");
    assert.equal(art.style.getPropertyValue("--cb-title-pointer-x"), "");
    r.root.dataset.motion = "calm";
    move(210, 120);
    assert.equal(art.style.getPropertyValue("--cb-title-pointer-x"), "");
    r.root.dataset.motion = "full";
    r.root.classList.add("is-paused");
    move(210, 120);
    assert.equal(art.style.getPropertyValue("--cb-title-pointer-x"), "");
    r.root.classList.remove("is-paused");
    move(210, 120);
    hero.dispatchEvent(new r.w.Event("pointerleave"));
    assert.equal(art.style.getPropertyValue("--cb-title-pointer-x"), "");
  } finally {
    r.close();
  }
});

test("map transition grows the chosen disc at its actual position and removes its decorative clone", async () => {
  const r = fixture(
    '<button class="cb-stop" data-stop-id="second"><span class="cb-stop__disc">2</span></button>',
  );
  try {
    const disc = r.root.querySelector("span");
    let frames, options, finish;
    r.w.Element.prototype.animate = (a, b) => {
      frames = a;
      options = b;
      return {
        finished: new Promise((resolve) => (finish = resolve)),
        cancel() {},
      };
    };
    disc.getBoundingClientRect = () => ({
      left: 100,
      top: 160,
      width: 64,
      height: 64,
    });
    r.root.getBoundingClientRect = () => ({ left: 20, top: 40 });
    const ctx = {
      root: r.root,
      document: r.w.document,
      window: r.w,
      feedbackStop: "second",
      motionAllowed: () => true,
    };
    const effect = zoomMapDisc(ctx),
      token = r.root.querySelector(".cb-map-zoom-token");
    assert.equal(token.style.left, "80px");
    assert.equal(token.style.top, "120px");
    assert.equal(token.style.width, "64px");
    assert.equal(options.duration, 320);
    assert.deepEqual(frames, [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(1.15)" },
    ]);
    assert.equal(token.getAttribute("aria-hidden"), "true");
    finish();
    await Promise.resolve();
    assert.equal(token.isConnected, false);
    ctx.motionAllowed = () => false;
    assert.equal(zoomMapDisc(ctx), null);
    assert.ok(effect.animation);
  } finally {
    r.close();
  }
});

test("page effects synthesize a quiet filtered paper swish only after the audio gesture", () => {
  const calls = [],
    samples = new Float32Array(180),
    param = {
      setValueAtTime: (...a) => calls.push(["set", ...a]),
      linearRampToValueAtTime: (...a) => calls.push(["ramp", ...a]),
      exponentialRampToValueAtTime: (...a) => calls.push(["end", ...a]),
    };
  const connect = {
    connect() {},
    disconnect() {
      calls.push(["disconnect"]);
    },
  };
  const context = {
    currentTime: 1,
    sampleRate: 1000,
    createBuffer(channels, length, rate) {
      assert.deepEqual([channels, length, rate], [1, 180, 1000]);
      return { getChannelData: () => samples };
    },
    createBufferSource() {
      return {
        ...connect,
        start: (at) => calls.push(["start", at]),
        stop: (at) => calls.push(["stop", at]),
      };
    },
    createGain: () => ({ ...connect, gain: param }),
    createBiquadFilter: () => ({ ...connect, frequency: { value: 0 } }),
  };
  const mixer = new AudioMixer();
  mixer.play("page");
  assert.equal(calls.length, 0);
  mixer.context = context;
  mixer.buses.sfx = {};
  mixer.play("page");
  assert.ok(samples.some((value) => value !== 0));
  assert.ok(samples.every((value) => Math.abs(value) <= 0.4));
  assert.ok(calls.some(([kind, value]) => kind === "ramp" && value === 0.08));
  assert.ok(calls.some(([kind, at]) => kind === "stop" && at === 1.18));
  mixer.muted = true;
  const count = calls.length;
  mixer.play("page");
  assert.equal(calls.length, count);
});

test("fresh default state has New game without a false Continue summary", () => {
  const r = fixture(
    '<div class="cb-hero__copy"><div class="cb-row"><button>Start</button></div></div>',
  );
  try {
    enhanceTitle({
      root: r.root,
      slots: {
        store: () => ({
          players: { you: { stops: {}, resume: { v: 1, mode: "title" } } },
        }),
      },
      api: () => ({ ANIMALS: [], STOPS: [] }),
      i18n: r.i18n,
      openSlots() {},
      settings: { open() {} },
    });
    assert.equal(r.root.querySelector(".cb-continue"), null);
    assert.equal(
      r.root.querySelector(".cb-engine-title-actions button").textContent,
      "New game",
    );
    assert.equal(r.root.querySelector(".cb-hero__copy > .cb-row"), null);
  } finally {
    r.close();
  }
});

test("Continue shows the real saved animal, next stop and stars; New/Load/Settings keep their actions", () => {
  const r = fixture(
    '<div class="cb-hero__copy"><button class="cb-btn--onstage">Grown-ups</button></div>',
  );
  try {
    const calls = [],
      player = {
        stops: { first: { best: 90, rounds: 1 } },
        updated: new Date().toISOString(),
      },
      store = { current: "fox", players: { fox: player } };
    const api = () => ({
      ANIMALS: [{ id: "fox", name: "Fox" }],
      STOPS: [
        { id: "first", n: 1 },
        { id: "second", n: 2 },
      ],
      animalFace: () => document.createElement("svg"),
    });
    const options = {
      root: r.root,
      slots: { store: () => store, select: (id) => calls.push(id) },
      api,
      i18n: r.i18n,
      resumeCurrent: () => calls.push("resume"),
      openSlots: (_, isNew) => calls.push(isNew ? "new" : "load"),
      settings: { open: () => calls.push("settings") },
    };
    enhanceTitle(options);
    enhanceTitle(options);
    assert.equal(r.root.querySelectorAll(".cb-engine-title-actions").length, 1);
    const buttons = [
      ...r.root.querySelectorAll(".cb-engine-title-actions button"),
    ];
    assert.match(buttons[0].textContent, /Fox.*Stop 2 next.*3 stars/);
    assert.ok(buttons[0].querySelector("svg"));
    buttons.slice(0, 4).forEach((button) => button.click());
    assert.deepEqual(calls, ["fox", "resume", "new", "load", "settings"]);
  } finally {
    r.close();
  }
});

test("every badge has distinct SVG geometry and a concrete locked hint; results show earned badges once", () => {
  const r = fixture(
    '<section class="cb-card"><div class="cb-card__body"></div></section>',
  );
  try {
    const paths = BADGE_IDS.map((id) =>
      badgeIcon(id).querySelector("path").getAttribute("d"),
    );
    assert.equal(new Set(paths).size, 25);
    for (const id of BADGE_IDS)
      assert.notEqual(badgeHint(r.i18n, id), "badgeHint." + id);
    showResultBadges(r.root, ["good-question", "three-stars"], r.i18n);
    showResultBadges(r.root, ["good-question"], r.i18n);
    assert.equal(r.root.querySelectorAll(".cb-result-badge").length, 2);
    assert.match(r.root.textContent, /New badge/);
  } finally {
    r.close();
  }
});

test("a finished stop fills the progress bar and the current step fills it partway", () => {
  const r = fixture(
    '<div class="cb-stophud"><div class="cb-stophud__tools"><button class="cb-stophud__back">Map</button></div><ol><li class="cb-step" data-s="done"></li><li class="cb-step" data-s="done"></li></ol></div>',
  );
  try {
    const hud = new HUD({
      root: r.root,
      core: () => ({ getState: () => ({ stopId: "one" }) }),
      slots: { current: () => ({ stops: {}, badges: {} }) },
      pause: { control: () => r.w.document.createElement("button") },
      i18n: r.i18n,
      focus: { push() {}, pop() {} },
      onSlots() {},
      onBadges() {},
    });
    hud.render();
    const done = r.root.querySelector("progress");
    assert.equal(Number(done.max), 2);
    assert.equal(Number(done.value), 2);
    r.root.querySelectorAll(".cb-step")[1].setAttribute("data-s", "now");
    r.root.querySelectorAll(".cb-step")[1].setAttribute("aria-current", "step");
    hud.render();
    assert.equal(Number(r.root.querySelector("progress").value), 2);
    r.root.querySelectorAll(".cb-step")[1].setAttribute("data-s", "todo");
    r.root.querySelectorAll(".cb-step")[1].removeAttribute("aria-current");
    r.root.querySelector(".cb-step").setAttribute("aria-current", "step");
    r.root.querySelector(".cb-step").setAttribute("data-s", "now");
    hud.render();
    assert.equal(Number(r.root.querySelector("progress").value), 1);
  } finally {
    r.close();
  }
});

test("HUD More invokes real tool actions and restores focus scope; only newly earned stars are announced", (t) => {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 1000 });
  const r = fixture(
    '<div class="cb-stophud"><div class="cb-stophud__tools"><button class="cb-stophud__back">Map</button><button aria-label="Sound">S</button></div></div>',
  );
  let hud;
  try {
    const calls = [],
      player = { stops: { one: { best: 90 } }, badges: {} },
      tools = r.root.querySelector(".cb-stophud__tools");
    tools.lastChild.onclick = () => calls.push("sound");
    hud = new HUD({
      root: r.root,
      core: () => ({ getState: () => ({ stopId: "one" }) }),
      slots: { current: () => player },
      pause: { control: () => document.createElement("button") },
      i18n: r.i18n,
      focus: { push: () => calls.push("push"), pop: () => calls.push("pop") },
    });
    hud.openMore(tools.lastChild, tools, "Best: 3 / 3");
    assert.equal(hud.dialog.querySelectorAll("button").length, 2);
    hud.dialog.querySelector("button").click();
    assert.deepEqual(calls, ["push", "pop", "sound"]);
    hud.earned(90, 70);
    assert.match(hud.live.textContent, /1 star/);
    hud.earned(90, 90);
    assert.match(hud.live.textContent, /1 star/);
    hud.earned(70, 0);
    assert.match(hud.live.textContent, /1 star/);
    t.mock.timers.tick(1499);
    assert.match(hud.live.textContent, /1 star/);
    t.mock.timers.tick(1);
    assert.match(hud.live.textContent, /2 stars/);
  } finally {
    hud?.destroy();
    r.close();
  }
});

test("visible tooltips appear after 400ms on keyboard focus and dismiss without losing existing descriptions", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const r = fixture(
      '<button aria-label="Pause" aria-describedby="help">P</button>',
    ),
    tooltips = new Tooltips(r.root);
  try {
    const b = r.root.querySelector("button");
    b.focus();
    t.mock.timers.tick(399);
    assert.equal(r.root.querySelector('[role="tooltip"]'), null);
    t.mock.timers.tick(1);
    assert.equal(r.root.querySelector('[role="tooltip"]').textContent, "Pause");
    assert.match(b.getAttribute("aria-describedby"), /^help cb-tooltip/);
    b.dispatchEvent(
      new r.w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    assert.equal(b.getAttribute("aria-describedby"), "help");
    assert.equal(r.root.querySelector('[role="tooltip"]'), null);
    b.dispatchEvent(new r.w.Event("pointerover", { bubbles: true }));
    t.mock.timers.tick(400);
    b.dispatchEvent(new r.w.Event("pointerdown", { bubbles: true }));
    assert.equal(r.root.querySelector('[role="tooltip"]'), null);
  } finally {
    tooltips.destroy();
    r.close();
  }
});

test("scene swaps expose controls before animations finish; Calm keeps readable text with an instant swap", async () => {
  const r = fixture(),
    calls = [];
  try {
    const ctx = {
      root: r.root,
      document: r.w.document,
      motionAllowed: () => true,
    };
    ctx.document.startViewTransition = (render) => {
      calls.push("start");
      render();
      return {
        updateCallbackDone: Promise.resolve(),
        finished: new Promise(() => {}),
      };
    };
    await transitionScene(
      ctx,
      () => {
        r.root.append(document.createElement("button"));
        calls.push("render");
      },
      "stop",
    );
    assert.deepEqual(calls, ["start", "render"]);
    assert.ok(r.root.querySelector("button"));
    let frames, options;
    r.root.animate = (a, b) => {
      frames = a;
      options = b;
      return { cancel() {} };
    };
    ctx.motionAllowed = () => false;
    animateScene(ctx, r.root);
    assert.equal(options, undefined, "Calm does not create a WAAPI fade");
    assert.equal(frames, undefined);
    await transitionScene(ctx, () => calls.push("calm"));
    assert.deepEqual(calls, ["start", "render", "calm"]);
  } finally {
    r.close();
  }
});

test("normal scene transitions retain their authored animation and owned lifecycle", () => {
  const r = fixture(),
    owned = [],
    calls = [];
  try {
    const animation = { cancel() {}, pause() {}, play() {} };
    r.root.animate = (frames, options) => {
      calls.push({ frames, options });
      return animation;
    };
    const ctx = {
      motionAllowed: () => true,
      activeLifecycle: { animation: (value) => owned.push(value) },
    };
    animateScene(ctx, r.root, "stop");
    animateScene(ctx, r.root, "step");
    assert.deepEqual(owned, [animation, animation]);
    assert.equal(calls[0].options.duration, 320);
    assert.equal(calls[1].options.duration, 200);
    assert.equal(calls[0].frames[0].transform, "translateY(16px) scale(.985)");
    assert.equal(calls[1].frames[0].transform, "translateY(12px)");
    ctx.restoring = true;
    animateScene(ctx, r.root);
    assert.equal(calls.length, 2, "Restoring does not start a new fade");
  } finally {
    r.close();
  }
});

test("feedback effects observe actual new successes and tries once", async () => {
  const r = fixture(),
    calls = [],
    disconnect = observeFeedback(
      r.root,
      { pulse: () => calls.push("pulse"), nudge: () => calls.push("nudge") },
      { play: (key) => calls.push(key) },
    );
  try {
    for (const kind of ["ok", "try"]) {
      const node = document.createElement("div");
      node.dataset.cbFeedback = kind;
      r.root.append(node);
    }
    await new Promise((resolve) => r.w.queueMicrotask(resolve));
    assert.deepEqual(calls, ["pulse", "ok", "nudge", "try"]);
    r.root.firstChild.append(document.createElement("span"));
    await new Promise((resolve) => r.w.queueMicrotask(resolve));
    assert.equal(calls.length, 4);
  } finally {
    disconnect();
    r.close();
  }
});
