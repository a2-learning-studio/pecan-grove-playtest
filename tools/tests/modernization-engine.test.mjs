import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  Bindings,
  DEFAULT_BINDINGS,
  reserved,
} from "../../assets/games/community-builders/engine/bindings.js";
import {
  Input,
  ACTIONS,
  guarded,
  typingContext,
  nativeArrows,
} from "../../assets/games/community-builders/engine/input.js";
import {
  spatialScore,
  chooseSpatial,
} from "../../assets/games/community-builders/engine/focus.js";
import {
  Gamepad,
  padActions,
  padLayout,
} from "../../assets/games/community-builders/engine/gamepad.js";
import {
  migrateStore,
  Slots,
  ANIMAL_IDS,
  resumable,
  slotStars,
  starsFor,
} from "../../assets/games/community-builders/engine/store.js";
import { createLifecycle } from "../../assets/games/community-builders/engine/lifecycle.js";
import { migrateSettings } from "../../assets/games/community-builders/engine/settings.js";

test("stop lifecycle pauses timers and logical time and disposes subscriptions once", () => {
  let time = 1000,
    nextId = 0,
    clicks = 0,
    completed = 0,
    cleaned = 0;
  const effects = [];
  const pending = new Map();
  const target = new EventTarget();
  const window = Object.assign(new EventTarget(), {
    Date: class extends Date {
      static now() {
        return time;
      }
    },
    setTimeout(fn, delay) {
      const id = ++nextId;
      pending.set(id, { fn, delay });
      return id;
    },
    clearTimeout(id) {
      pending.delete(id);
    },
    requestAnimationFrame(fn) {
      const id = ++nextId;
      pending.set(id, { fn, frame: true });
      return id;
    },
    cancelAnimationFrame(id) {
      pending.delete(id);
    },
  });
  const lifecycle = createLifecycle({
    root: { getAttribute: () => null },
    document: target,
    window,
  });
  lifecycle.document.addEventListener("click", () => clicks++);
  lifecycle.cleanup(() => cleaned++);
  lifecycle.animation({
    pause: () => effects.push("pause"),
    play: () => effects.push("play"),
    cancel: () => effects.push("cancel"),
  });
  lifecycle.setTimeout(() => completed++, 50);
  time += 20;
  lifecycle.pause();
  assert.equal(pending.size, 0);
  target.dispatchEvent(new Event("click"));
  assert.equal(clicks, 0);
  time = 5000;
  assert.equal(lifecycle.Date.now(), 1020);
  lifecycle.resume();
  assert.equal([...pending.values()][0].delay, 30);
  assert.equal(lifecycle.Date.now(), 1020);
  const [timerId, timer] = [...pending.entries()][0];
  pending.delete(timerId);
  timer.fn();
  assert.equal(completed, 1);
  target.dispatchEvent(new Event("click"));
  assert.equal(clicks, 1);
  lifecycle.requestAnimationFrame(() => {});
  lifecycle.dispose();
  lifecycle.dispose();
  assert.equal(cleaned, 1);
  assert.deepEqual(effects, ["pause", "play", "cancel"]);
  assert.equal(pending.size, 0);
  target.dispatchEvent(new Event("click"));
  assert.equal(clicks, 1);
});
import {
  evaluateBadges,
  Badges,
} from "../../assets/games/community-builders/engine/badges.js";
import { AudioMixer } from "../../assets/games/community-builders/engine/audio.js";
import {
  motion,
  configureMotion,
} from "../../assets/games/community-builders/engine/motion.js";
import {
  I18n,
  interpolate,
} from "../../assets/games/community-builders/engine/i18n.js";
import { clampZoom } from "../../assets/games/community-builders/engine/gestures.js";
if (!globalThis.CustomEvent)
  globalThis.CustomEvent = class extends Event {
    constructor(type, options = {}) {
      super(type, options);
      this.detail = options.detail;
    }
  };
const storage = () => {
  const values = new Map();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};
function rootStub() {
  return Object.assign(new EventTarget(), {
    dataset: {},
    hasAttribute: () => false,
    contains: () => true,
    matches: () => false,
  });
}
const key = (code, key = code) => ({
  code,
  key,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
});

test("all documented keyboard actions have defaults; numbers use both keyboards", () => {
  const b = new Bindings(storage());
  for (const [action, codes] of Object.entries(DEFAULT_BINDINGS))
    for (const code of codes)
      assert.equal(b.action(key(code, code === "Slash" ? "?" : code)), action);
  for (let n = 1; n <= 9; n++) {
    assert.equal(b.action(key("Digit" + n)), `choice.${n}`);
    assert.equal(b.action(key("Numpad" + n)), `choice.${n}`);
  }
  assert.equal(b.action(key("KeyS")), "nav.down");
  assert.equal(b.action(key("KeyV")), "voice.stop");
  assert.equal(b.action(key("Slash", "/")), null);
  assert.equal(ACTIONS.length, new Set(ACTIONS).size);
});
test("reserved browser keys and modifier combos cannot be rebound", () => {
  const b = new Bindings(storage());
  for (const code of [
    "Tab",
    "F5",
    "F11",
    "MetaLeft",
    "AltLeft",
    "ControlLeft",
  ]) {
    assert.equal(reserved(key(code)), true);
    assert.equal(b.assign("confirm", key(code)).ok, false);
  }
  assert.equal(b.assign("confirm", { code: "KeyJ", ctrlKey: true }).ok, false);
});
test("rebind conflict is explicit, swaps preserve the other action, reset persists", () => {
  const s = storage(),
    b = new Bindings(s);
  assert.deepEqual(b.assign("confirm", key("KeyR")), {
    ok: false,
    reason: "conflict",
    conflict: "voice.replay",
  });
  assert.equal(b.value.confirm[0], "Enter");
  assert.equal(b.assign("confirm", key("KeyR"), true).ok, true);
  assert.equal(b.value["voice.replay"][0], "Enter");
  assert.equal(new Bindings(s).action(key("KeyR")), "confirm");
  b.reset();
  assert.deepEqual(b.value.confirm, ["Enter", "Space"]);
  assert.equal(new Bindings(s).action(key("KeyR")), "voice.replay");
});
test("typing and IME never activate game actions", () => {
  const root = rootStub(),
    scope = root;
  const textarea = {
    tagName: "TEXTAREA",
    closest: (selector) => (selector.includes("textarea") ? {} : null),
  };
  assert.equal(typingContext(textarea), true);
  assert.equal(
    guarded({ ...key("KeyM"), target: textarea }, root, scope),
    true,
  );
  const target = {
    tagName: "BUTTON",
    closest: (selector) =>
      selector.includes("textarea")
        ? null
        : selector.includes("button")
          ? {}
          : null,
  };
  for (const field of ["ctrlKey", "metaKey", "altKey", "isComposing"])
    assert.equal(
      guarded({ ...key("KeyM"), target, [field]: true }, root, scope),
      true,
    );
  assert.equal(guarded({ ...key("KeyM"), target }, root, scope), false);
});
test("arrows pass through sliders, tablists and browse-mode text", () => {
  assert.equal(nativeArrows({ tagName: "BODY" }), true);
  assert.equal(nativeArrows({ tagName: "H2", closest: () => null }), true);
  assert.equal(
    nativeArrows({
      tagName: "INPUT",
      closest: (selector) => (selector.includes("range") ? {} : null),
    }),
    true,
  );
  assert.equal(
    nativeArrows({
      tagName: "BUTTON",
      closest: (selector) => (selector.includes("tablist") ? {} : null),
    }),
    true,
  );
  assert.equal(
    nativeArrows({
      tagName: "BUTTON",
      closest: (selector) =>
        selector.includes("range")
          ? null
          : selector.includes("button")
            ? {}
            : null,
    }),
    false,
  );
});
test("device events, active scope and native Enter behavior stay intact", () => {
  const doc = new EventTarget(),
    root = rootStub();
  const input = new Input({
    root,
    document: doc,
    bindings: new Bindings(storage()),
    scope: () => root,
  });
  const devices = [];
  doc.addEventListener("cb:input-device", (e) => devices.push(e.detail.device));
  let confirmed = 0;
  input.on("confirm", () => {
    confirmed++;
    return true;
  });
  input.emit("confirm", { device: "gamepad" });
  assert.equal(confirmed, 1);
  assert.equal(root.dataset.input, "gamepad");
  input.setDevice("touch");
  assert.deepEqual(devices, ["gamepad", "touch"]);
  let prevented = false;
  input.keydown({
    ...key("Enter", "Enter"),
    target: {
      tagName: "BUTTON",
      closest: (selector) =>
        selector.includes("textarea")
          ? null
          : selector.includes("button")
            ? {}
            : null,
    },
    preventDefault: () => {
      prevented = true;
    },
    stopPropagation: () => {},
  });
  assert.equal(confirmed, 1);
  assert.equal(prevented, false);
  input.destroy();
});

test("hold to confirm fires once per key hold, cancels on focus change and preserves native feedback controls", () => {
  const oldSet = globalThis.setTimeout,
    oldClear = globalThis.clearTimeout,
    timers = new Map();
  let next = 0;
  globalThis.setTimeout = (callback) => {
    timers.set(++next, callback);
    return next;
  };
  globalThis.clearTimeout = (id) => timers.delete(id);
  const doc = new EventTarget(),
    root = rootStub(),
    input = new Input({
      root,
      document: doc,
      scope: () => root,
      bindings: new Bindings(storage()),
      settings: () => ({ holdConfirm: true }),
    });
  const target = {
    tagName: "BUTTON",
    closest: (selector) => (selector.startsWith("input") ? null : target),
  };
  let confirmed = 0;
  input.on("confirm", () => {
    confirmed++;
    return true;
  });
  const event = {
    ...key("Enter", "Enter"),
    target,
    preventDefault() {},
    stopPropagation() {},
  };
  try {
    input.keydown(event);
    assert.equal(timers.size, 1);
    const callback = [...timers.values()][0];
    callback();
    input.keydown({ ...event, repeat: true });
    assert.equal(confirmed, 1);
    assert.equal(timers.size, 1);
    input.keyup(event);
    assert.equal(timers.size, 0);
    input.keydown(event);
    input.focusin({ target: {} });
    assert.equal(timers.size, 0);
    input.keydown({
      ...event,
      target: {
        tagName: "BUTTON",
        closest: (selector) =>
          selector.includes("data-pg-native") ? {} : target,
      },
    });
    assert.equal(timers.size, 0);
  } finally {
    input.destroy();
    globalThis.setTimeout = oldSet;
    globalThis.clearTimeout = oldClear;
  }
});

test("pointer hold cancels on drag and suppresses the release click after one confirmation", () => {
  const oldSet = globalThis.setTimeout,
    oldClear = globalThis.clearTimeout,
    timers = new Map();
  let next = 0;
  globalThis.setTimeout = (callback) => {
    timers.set(++next, callback);
    return next;
  };
  globalThis.clearTimeout = (id) => timers.delete(id);
  const doc = new EventTarget(),
    root = rootStub(),
    input = new Input({
      root,
      document: doc,
      scope: () => root,
      bindings: new Bindings(storage()),
      settings: () => ({ holdConfirm: true }),
    });
  let clicked = 0;
  const target = {
    tagName: "BUTTON",
    isConnected: true,
    focus() {},
    click() {
      clicked++;
    },
    contains: (node) => node === target,
    closest: (selector) => (selector.startsWith("input") ? null : target),
  };
  const event = {
    button: 0,
    pointerId: 1,
    pointerType: "touch",
    clientX: 10,
    clientY: 10,
    target,
  };
  try {
    input.pointer(event);
    assert.equal(input.device, "touch");
    input.pointermove({ ...event, clientX: 25 });
    assert.equal(timers.size, 0);
    input.pointer(event);
    [...timers.values()][0]();
    assert.equal(clicked, 1);
    input.pointerup(event);
    let prevented = false;
    input.click({
      detail: 1,
      preventDefault() {
        prevented = true;
      },
      stopImmediatePropagation() {},
    });
    assert.equal(prevented, true);
    assert.equal(input.pointerHold, null);
  } finally {
    input.destroy();
    globalThis.setTimeout = oldSet;
    globalThis.clearTimeout = oldClear;
  }
});
test("spatial navigation scores the requested half-plane and nearest row", () => {
  const rect = (left, top) => ({ left, top, width: 20, height: 20 });
  assert.equal(spatialScore(rect(0, 0), rect(30, 0), "right"), 30);
  assert.equal(spatialScore(rect(0, 0), rect(30, 10), "right"), 55);
  assert.equal(spatialScore(rect(0, 0), rect(-30, 0), "right"), Infinity);
  const row = {},
    otherRow = {};
  const node = (x, y, group) => ({
    getBoundingClientRect: () => rect(x, y),
    closest: () => group,
  });
  const a = node(0, 0, row),
    b = node(80, 0, row),
    c = node(20, 20, otherRow);
  assert.equal(chooseSpatial(a, [a, b, c], "right"), b);
  assert.equal(chooseSpatial(a, [a, b, c], "down"), c);
  assert.equal(chooseSpatial(b, [a, b, c], "right"), a);
});
test("gamepad button map, stick deadzone, basic mapping and layouts", () => {
  const pad = {
    mapping: "standard",
    axes: [0, 0],
    buttons: Array.from({ length: 16 }, () => ({ pressed: false })),
  };
  pad.buttons[0].pressed = true;
  pad.buttons[9].pressed = true;
  pad.axes = [0.49, -0.6];
  assert.deepEqual([...padActions(pad)], ["confirm", "pause", "nav.up"]);
  assert.equal(padActions(pad, true).has("back"), true);
  pad.mapping = "";
  assert.equal(padActions(pad).has("pause"), false);
  assert.equal(padLayout("Sony DualSense"), "playstation");
  assert.equal(padLayout("Nintendo Pro Controller"), "nintendo");
  assert.equal(padLayout("Other"), "xbox");
});
test("gamepad has zero polling frames without a connected controller", () => {
  const win = Object.assign(new EventTarget(), {
    navigator: { getGamepads: () => [] },
    requestAnimationFrame: () => {
      throw new Error("Unexpected polling");
    },
    cancelAnimationFrame: () => {},
  });
  const doc = Object.assign(new EventTarget(), { hidden: false });
  const pad = new Gamepad({
    window: win,
    document: doc,
    input: { emit: () => {} },
  });
  assert.equal(pad.frame, 0);
  pad.destroy();
});
test("gamepad emits edges, repeats after delay and stops when hidden or disconnected", () => {
  const frames = new Map();
  let next = 0;
  const physical = {
    index: 0,
    mapping: "standard",
    axes: [0, 0],
    buttons: Array.from({ length: 16 }, () => ({ pressed: false })),
  };
  const win = Object.assign(new EventTarget(), {
    navigator: { getGamepads: () => [physical] },
    requestAnimationFrame: (callback) => {
      frames.set(++next, callback);
      return next;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
  });
  const doc = Object.assign(new EventTarget(), { hidden: false }),
    actions = [];
  let disconnected = 0;
  const gamepad = new Gamepad({
    window: win,
    document: doc,
    input: { emit: (action, detail) => actions.push({ action, ...detail }) },
    onDisconnect: () => disconnected++,
  });
  const step = (time) => {
    const [id, callback] = frames.entries().next().value;
    frames.delete(id);
    callback(time);
  };
  physical.buttons[15].pressed = true;
  step(0);
  step(100);
  step(349);
  assert.equal(actions.length, 1);
  step(350);
  assert.equal(actions.length, 2);
  step(459);
  assert.equal(actions.length, 2);
  step(460);
  assert.equal(actions.length, 3);
  assert.equal(actions[1].repeat, true);
  doc.hidden = true;
  doc.dispatchEvent(new Event("visibilitychange"));
  assert.equal(frames.size, 0);
  doc.hidden = false;
  doc.dispatchEvent(new Event("visibilitychange"));
  assert.equal(frames.size, 1);
  gamepad.disconnect({ gamepad: physical });
  assert.equal(disconnected, 1);
  assert.equal(frames.size, 0);
  gamepad.destroy();
});
test("v1 journey migration keeps score data and is idempotent", () => {
  const value = {
    version: 1,
    current: "fox",
    players: {
      fox: { stops: { one: { best: 87, rounds: 2, all: [70, 87] } } },
    },
  };
  const result = migrateStore(value, "2026-10-12T10:00:00Z");
  assert.equal(result, value);
  assert.equal(result.version, 2);
  assert.equal(result.players.fox.stops.one.best, 87);
  assert.deepEqual(result.players.fox.badges, {});
  const once = JSON.stringify(result);
  migrateStore(result, "2027-01-01T00:00:00Z");
  assert.equal(JSON.stringify(result), once);
});
test("animal save slots isolate scores, avoid names, delete and undo one slot", () => {
  const value = migrateStore({
      players: {
        fox: { stops: { one: { best: 90 } } },
        owl: { stops: { two: { best: 70 } } },
      },
      current: "fox",
    }),
    s = storage();
  const slots = new Slots({
    state: () => ({
      store: value,
      storageKey: "pecan-grove-journey:session-a",
    }),
    storage: s,
  });
  assert.equal(ANIMAL_IDS.length, 8);
  assert.equal(slots.create("typed name"), false);
  assert.equal(slots.create("turtle"), true);
  assert.equal(slots.select("fox"), true);
  slots.remove("fox");
  assert.equal(value.players.fox, undefined);
  assert.equal(value.players.owl.stops.two.best, 70);
  slots.undo();
  assert.equal(value.players.fox.stops.one.best, 90);
  assert.equal(s.values.has("pecan-grove-journey"), false);
  assert.equal(s.values.has("pecan-grove-journey:session-a"), true);
});
test("Continue refuses stale, future or missing step snapshots", () => {
  const now = Date.parse("2026-10-12T10:00:00Z");
  assert.equal(
    resumable(
      {
        v: 1,
        mode: "stop",
        stopId: "one",
        state: { step: 2 },
        ts: "2026-10-11T10:00:00Z",
      },
      now,
    ),
    true,
  );
  for (const ts of ["bad", "2026-10-01T10:00:00Z", "2026-10-13T10:00:00Z"])
    assert.equal(
      resumable({ v: 1, mode: "stop", stopId: "one", state: {}, ts }, now),
      false,
    );
  assert.equal(
    resumable({ stopId: "one", ts: "2026-10-11T10:00:00Z" }, now),
    false,
  );
});

test("empty default player becomes an animal slot and the store stops at eight players", () => {
  const value = migrateStore({
      players: {
        you: {
          stops: {},
          resume: { v: 1, mode: "title", ts: new Date().toISOString() },
        },
      },
      current: "you",
    }),
    slots = new Slots({ state: () => ({ store: value }), storage: storage() });
  for (const id of ANIMAL_IDS) assert.equal(slots.create(id), true);
  assert.equal(value.players.you, undefined);
  assert.equal(Object.keys(value.players).length, 8);
  assert.equal(slots.create("fox"), false);
  const old = migrateStore({
      players: { you: { stops: { one: { best: 40 } } } },
      current: "you",
    }),
    older = new Slots({ state: () => ({ store: old }), storage: storage() });
  for (const id of ANIMAL_IDS.slice(0, 7)) assert.equal(older.create(id), true);
  assert.equal(older.create(ANIMAL_IDS[7]), false);
  assert.equal(old.players.you.stops.one.best, 40);
});
test("settings migration retains every v1 preference and adds independent buses", () => {
  const old = {
    voice: false,
    auto: false,
    vol: 0.4,
    rate: 1.15,
    words: false,
    cap: true,
    capSize: "l",
    circles: false,
    calm: true,
  };
  const value = migrateSettings(old);
  for (const [key, v] of Object.entries(old)) assert.equal(value[key], v);
  assert.equal(value.v, 2);
  assert.equal(value.voiceVolume, 40);
  assert.equal(value.musicOn, false);
  assert.equal(value.master, 90);
  assert.equal(value.sfx, 60);
  assert.deepEqual(migrateSettings(value), value);
});
test("stars match score card thresholds and per-slot journey total", () => {
  assert.deepEqual(
    [0, 39, 40, 69, 70, 89, 90, 100].map(starsFor),
    [0, 0, 1, 1, 2, 2, 3, 3],
  );
  assert.equal(
    slotStars({ stops: { a: { best: 90 }, b: { best: 75 }, c: { best: 40 } } }),
    6,
  );
});
test("badge rules reward completion, process and replay without comparing players", () => {
  const stops = Array.from({ length: 15 }, (_, i) => ({
    id: "s" + (i + 1),
    chap: Math.min(4, Math.floor(i / 4) + 1),
  }));
  const player = {
    stops: Object.fromEntries(
      stops.map((stop) => [stop.id, { best: 90, rounds: 1 }]),
    ),
    badges: {},
  };
  const ids = evaluateBadges(player, stops, {
    stopId: "s2",
    newBest: true,
    quiet: true,
    team: true,
    meta: {
      allListened: true,
      allSources: true,
      clearQuestions: 4,
      allSigns: true,
      extraTaps: 0,
      processBadge: "process-5",
    },
  });
  for (const id of [
    "first-stop",
    "chapter-1",
    "chapter-2",
    "chapter-3",
    "chapter-4",
    "journey-15",
    "three-stars",
    "try-again",
    "quiet-pro",
    "team-player",
    "all-ears",
    "source-checker",
    "good-question",
    "sign-spotter",
    "process-5",
  ])
    assert.equal(ids.includes(id), true, id);
  player.badges["first-stop"] = "2026-10-12";
  assert.equal(evaluateBadges(player, stops).includes("first-stop"), false);
  assert.equal(evaluateBadges({ stops: {}, badges: {} }, stops).length, 0);
});
test("badge unlock persists and notifies only once per slot", () => {
  const player = { stops: {}, badges: {} },
    notices = [];
  let saved = 0;
  const badges = new Badges({
    slots: { current: () => player, save: () => saved++ },
    notify: (id) => notices.push(id),
  });
  assert.equal(badges.unlock("first-stop"), true);
  assert.equal(badges.unlock("first-stop"), false);
  assert.equal(badges.unlock("unknown"), false);
  assert.equal(saved, 1);
  assert.deepEqual(notices, ["first-stop"]);
});
function contextMock() {
  class Param {
    constructor() {
      this.value = 0;
      this.calls = [];
    }
    setTargetAtTime(value) {
      this.value = value;
    }
    setValueAtTime(value) {
      this.value = value;
    }
    cancelScheduledValues() {}
    linearRampToValueAtTime(value, time) {
      this.value = value;
      this.calls.push({ value, time });
    }
  }
  return class Context {
    constructor() {
      this.currentTime = 2;
      this.state = "running";
      this.destination = {};
    }
    createGain() {
      return { gain: new Param(), connect() {} };
    }
    createMediaElementSource() {
      return { connect() {} };
    }
    resume() {
      return Promise.resolve();
    }
  };
}
test("audio context waits for gesture and all mixer buses are independent", () => {
  let settings = {
    master: 90,
    voiceVolume: 80,
    music: 40,
    sfx: 60,
    musicOn: true,
    duck: true,
  };
  const mixer = new AudioMixer({
    settings: () => settings,
    window: { AudioContext: contextMock() },
  });
  assert.equal(mixer.context, null);
  assert.equal(mixer.unlock(), true);
  assert.equal(mixer.buses.master.gain.value, 0.9);
  assert.equal(mixer.buses.voice.gain.value, 0.8);
  assert.equal(mixer.buses.music.gain.value, 0.4);
  assert.equal(mixer.buses.sfx.gain.value, 0.6);
  settings = { ...settings, sfx: 20 };
  mixer.apply();
  assert.equal(mixer.buses.sfx.gain.value, 0.2);
  assert.equal(mixer.buses.voice.gain.value, 0.8);
  mixer.voice(true);
  assert.ok(
    Math.abs(mixer.buses.music.gain.value - 0.4 * Math.pow(10, -12 / 20)) <
      1e-8,
  );
  assert.equal(mixer.buses.music.gain.calls.at(-1).time, 2.15);
  mixer.voice(false);
  assert.equal(mixer.buses.music.gain.calls.at(-1).time, 2.4);
  mixer.mute(true);
  assert.equal(mixer.buses.master.gain.value, 0);
});
test("Calm hard gate follows both device and player preference", () => {
  let calm = false,
    system = false;
  configureMotion(
    () => ({ calm }),
    () => ({
      get matches() {
        return system;
      },
    }),
  );
  assert.equal(motion.allowed(), true);
  assert.equal(motion.duration(320), 320);
  calm = true;
  assert.equal(motion.allowed(), false);
  assert.equal(motion.duration(320), 120);
  assert.equal(motion.duration(80), 80);
  calm = false;
  system = true;
  assert.equal(motion.allowed(), false);
  configureMotion(
    () => ({}),
    () => ({ matches: false }),
  );
});
test("touch zoom is bounded and has a fit state", () => {
  assert.equal(clampZoom(0.1), 1);
  assert.equal(clampZoom(1.8), 1.8);
  assert.equal(clampZoom(8), 2.5);
});
test("engine EN and ES keys, plurals and placeholders have parity", async () => {
  const base = new URL(
      "../../assets/games/community-builders/engine/locales/",
      import.meta.url,
    ),
    en = JSON.parse(await readFile(new URL("en.json", base))),
    es = JSON.parse(await readFile(new URL("es.json", base)));
  assert.deepEqual(Object.keys(en).sort(), Object.keys(es).sort());
  function check(a, b, path) {
    if (typeof a === "string") {
      assert.ok(a.trim() && b.trim(), path);
      const placeholders = (value) =>
        [...value.matchAll(/\{([\w.-]+)\}/g)].map((match) => match[1]).sort();
      assert.deepEqual(placeholders(a), placeholders(b), path);
    } else {
      assert.deepEqual(Object.keys(a), Object.keys(b));
      for (const key of Object.keys(a)) check(a[key], b[key], path + "." + key);
    }
  }
  for (const key of Object.keys(en)) check(en[key], es[key], key);
  const i18n = new I18n("es", es);
  assert.equal(i18n.t("starsCount", { count: 1 }), "1 estrella");
  assert.equal(i18n.t("starsCount", { count: 2 }), "2 estrellas");
  assert.equal(i18n.list(["Ana", "Luis"]), "Ana y Luis");
  assert.equal(
    i18n.relative("2026-10-11T10:00:00Z", Date.parse("2026-10-12T10:00:00Z")),
    "ayer",
  );
  assert.equal(interpolate("Stop {number}", { number: 4 }), "Stop 4");
});
