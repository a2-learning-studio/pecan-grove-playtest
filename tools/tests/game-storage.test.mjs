import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mountedGame, until } from "./modernization-mounted-game-fixture.mjs";
const require = createRequire(import.meta.url);
const { fullCore } = require("./modernization-gameplay-fixture.cjs");

const KEY = "pecan-grove-journey:test_player_session_123456";
const saved = (value) => ({
  key: KEY,
  value: typeof value === "string" ? value : JSON.stringify(value),
});
const warnings = (r) =>
  r.root.querySelectorAll(".cb-engine-save-warning, .cb-storage-warning");
test("blocked site data still starts the game, with one save notice", async () => {
  const r = await mountedGame("en", null, { blockStorage: true });
  try {
    assert.equal(r.root.dataset.engineMounted, "true");
    assert.ok(r.root.querySelector(".cb-engine-title-actions"));
    assert.equal(warnings(r).length, 1);
    assert.match(warnings(r)[0].textContent, /cannot save your progress/);
    assert.equal(r.engine.store.create("fox"), false);
    assert.equal(r.core.getState().store.players.fox.stops !== undefined, true);
    r.core.getAPI().saveRound(r.core.getAPI().STOPS[0].id, 50, {});
    assert.equal(warnings(r).length, 1, "the core and engine keep one notice");
    assert.deepEqual(r.runtimeErrors, []);
  } finally {
    r.close();
  }
});

test("a damaged player or stop record is set aside, kept as a recovery copy, and play starts", async () => {
  const raw = JSON.stringify({
    version: 2,
    current: "fox",
    players: {
      fox: {
        stops: { "notice-the-signs": { best: 80, rounds: 1 }, broken: null },
        badges: {},
      },
      owl: null,
    },
  });
  const r = await mountedGame("en", saved(raw));
  try {
    assert.ok(r.root.querySelector(".cb-engine-title-actions"));
    const store = r.core.getState().store;
    assert.equal(store.players.owl, undefined);
    assert.equal(store.players.fox.stops.broken, undefined);
    assert.equal(store.players.fox.stops["notice-the-signs"].best, 80);
    assert.equal(r.w.localStorage.getItem(KEY + "-recovery"), raw);
    assert.equal(r.core.getState().saveLocked, false);
    assert.deepEqual(r.runtimeErrors, []);
  } finally {
    r.close();
  }
});

test("an unreadable save is copied aside before a fresh save replaces it", async () => {
  const r = await mountedGame("en", saved("{not json"));
  try {
    assert.equal(r.w.localStorage.getItem(KEY + "-recovery"), "{not json");
    assert.equal(JSON.parse(r.w.localStorage.getItem(KEY)).version, 2);
    assert.equal(warnings(r).length, 0);
  } finally {
    r.close();
  }
});

test("a save from a newer game version is never overwritten", async () => {
  const raw = JSON.stringify({ version: 3, profiles: { fox: { done: 15 } } });
  const r = await mountedGame("en", saved(raw));
  try {
    r.engine.store.create("owl");
    r.core.getAPI().saveRound(r.core.getAPI().STOPS[0].id, 50, {});
    assert.equal(r.w.localStorage.getItem(KEY), raw);
    assert.equal(r.core.getState().saveLocked, true);
    assert.equal(warnings(r).length, 1);
  } finally {
    r.close();
  }
});

test("another tab's finished stops, badges and new games survive this tab's next save", async () => {
  const start = {
    version: 2,
    current: "fox",
    players: {
      fox: { stops: {}, badges: {}, created: "2026-10-01T10:00:00.000Z" },
    },
  };
  const a = await fullCore("en", 42, true, saved(start)),
    b = await fullCore("en", 42, true, saved(start));
  try {
    const [one, two] = a.core.getAPI().STOPS;
    a.core.getAPI().saveRound(one.id, 80, {});
    const other = JSON.parse(a.w.localStorage.getItem(KEY));
    other.players.fox.badges["first-stop"] = "2026-10-02T10:00:00.000Z";
    other.players.owl = {
      stops: {},
      badges: {},
      created: "2026-10-02T10:00:00.000Z",
    };
    const event = new b.w.Event("storage");
    Object.assign(event, { key: KEY, newValue: JSON.stringify(other) });
    b.w.dispatchEvent(event);
    b.core.getAPI().saveRound(two.id, 70, {});
    const result = JSON.parse(b.w.localStorage.getItem(KEY));
    assert.equal(result.players.fox.stops[one.id].best, 80);
    assert.equal(result.players.fox.stops[two.id].best, 70);
    assert.ok(result.players.fox.badges["first-stop"]);
    assert.ok(result.players.owl);
    // A game deleted and started again for the same animal is not mixed in.
    other.players.fox = {
      stops: { [one.id]: { best: 10, rounds: 9 } },
      created: "2026-10-03T10:00:00.000Z",
    };
    Object.assign(event, { newValue: JSON.stringify(other) });
    b.w.dispatchEvent(event);
    assert.equal(b.core.getState().store.players.fox.stops[one.id].best, 80);
  } finally {
    a.close();
    b.close();
  }
});

// PG-UX-A03: the Undo for a deleted game no longer sits in the toast corner on a 10 s timer (out of the Tab path, and
// against "This game has no timers"). It replaces the deleted game's card in the open player dialog, takes focus and
// stays until the dialog closes. Each Undo still restores its own game and never replaces a newer one.
test("each Undo restores its own deleted game, refuses to replace a newer one, and goes away", async () => {
  const store = {
    version: 2,
    current: "fox",
    players: {
      fox: { stops: { a: { best: 90, rounds: 1 } }, badges: {} },
      owl: { stops: { b: { best: 70, rounds: 1 } }, badges: {} },
      bee: { stops: {}, badges: {} },
    },
  };
  const r = await mountedGame("en", saved(store));
  const realSet = globalThis.setTimeout,
    timers = [];
  globalThis.setTimeout = (fn, ms, ...args) =>
    ms >= 5000 ? timers.push(ms) : realSet(fn, ms, ...args);
  try {
    const dialog = r.engine.openSlots(null);
    const name = (id) =>
      r.core.getAPI().ANIMALS.find((animal) => animal.id === id).name;
    const card = (id) =>
      [...dialog.querySelectorAll(".cb-engine-slot")].find(
        (node) =>
          node.querySelector(".cb-engine-slot-pick")?.textContent.trim() ===
          name(id),
      );
    const deleteIn = (id) => {
      const remove = card(id).querySelector('[aria-label^="Delete slot"]');
      assert.equal(remove.getAttribute("aria-label"), "Delete slot: " + name(id));
      remove.click();
      [...r.root.querySelectorAll("dialog[open] button")]
        .find((button) => button.textContent.trim() === name("turtle"))
        .click();
    };
    const undo = () => [
      ...dialog.querySelectorAll(".cb-engine-slot > button:not(.cb-engine-slot-pick)"),
    ].filter((button) => /^Undo delete/.test(button.textContent));
    deleteIn("fox");
    assert.equal(r.w.document.activeElement, undo()[0], "Undo takes focus");
    deleteIn("owl");
    assert.deepEqual(
      undo().map((button) => button.textContent),
      ["Undo delete: Fox", "Undo delete: Owl"],
    );
    assert.equal(dialog.open, true, "the player dialog stays open");
    assert.equal(
      r.root.querySelectorAll(".cb-engine-toast-host > button").length,
      0,
      "nothing waits in the toast corner",
    );
    // Fox was being played. Deleting Fox passed play to Owl, then to Bee; Undo makes Fox the player again (last review
    // of the round: play went on in Bee's slot, so Fox's next stars went into Bee's record).
    assert.equal(r.core.getState().store.current, "bee");
    undo()[0].click();
    const players = r.core.getState().store.players;
    assert.equal(players.fox.stops.a.best, 90, "Fox comes back, not Owl");
    assert.equal(r.core.getState().store.current, "fox", "and Fox is the one playing again");
    assert.equal(players.owl, undefined);
    assert.ok(card("fox"), "Fox's card is back in the dialog");
    assert.equal(r.engine.store.create("owl"), true);
    undo()[0].click();
    assert.deepEqual(r.core.getState().store.players.owl.stops, {});
    const playing = r.core.getState().store.current;
    deleteIn("bee");
    assert.equal(undo().length, 1);
    undo()[0].click();
    assert.equal(r.core.getState().store.current, playing, "Undo for a game not being played leaves the player as it was");
    deleteIn("bee");
    assert.deepEqual(timers, [], "no Undo goes away on a timer");
    dialog.close();
    assert.equal(r.root.querySelectorAll("dialog[open]").length, 0);
    assert.equal(undo()[0]?.isConnected ?? false, false, "Undo goes with the dialog");
  } finally {
    globalThis.setTimeout = realSet;
    r.close();
  }
});

test("Load game explains when there are no saved games", async () => {
  const r = await mountedGame("es");
  try {
    r.engine.openSlots(null);
    const dialog = r.root.querySelector("dialog[open]");
    assert.match(dialog.textContent, /Todavía no hay partidas guardadas/);
    assert.equal(dialog.querySelectorAll(".cb-engine-slot").length, 0);
  } finally {
    r.close();
  }
});

test("Continue says every stop is done instead of naming Stop 15 again", async () => {
  const r0 = await fullCore();
  const stops = Object.fromEntries(
    r0.core.getAPI().STOPS.map((stop) => [stop.id, { best: 90, rounds: 1 }]),
  );
  r0.close();
  const r = await mountedGame(
    "en",
    saved({
      version: 2,
      current: "fox",
      players: { fox: { stops, badges: {} } },
    }),
  );
  try {
    await until(
      () => r.root.querySelector(".cb-continue small"),
      "The title shows Continue",
    );
    assert.equal(
      r.root.querySelector(".cb-continue small").textContent,
      "Fox · All 15 stops done · 45 stars",
    );
  } finally {
    r.close();
  }
});

const { progressFile, readProgressFile, mergeProgress, PROGRESS_MAX_BYTES } =
  await import("../../assets/games/community-builders/engine/progress-file.js");
const { StepLog, STEP_LIMIT, STEP_PLAYERS, stepKey } =
  await import("../../assets/games/community-builders/engine/interaction-log.js");
const STOPS = [
  { id: "notice-the-signs", n: 1 },
  { id: "ask-a-good-question", n: 2 },
];
function memory() {
  const values = new Map();
  return {
    values,
    get length() {
      return values.size;
    },
    key: (i) => [...values.keys()][i] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test("a progress file keeps scores, badges and steps, with no names, and opens elsewhere", () => {
  const store = {
    version: 2,
    current: "fox",
    players: {
      you: { stops: {}, badges: {} },
      fox: {
        stops: {
          "notice-the-signs": {
            best: 90,
            first: 60,
            rounds: 2,
            last5: [60, 90],
            all: [60, 90],
            lastRound: "b-3",
            allSigns: true,
            lastOrder: [3, 1, 2],
          },
          "retired-stop": { best: 50, rounds: 1 },
        },
        badges: { "first-stop": "2026-10-20T10:00:00.000Z", invented: "x" },
        created: "2026-10-01T10:00:00.000Z",
        updated: "2026-10-20T10:00:00.000Z",
        resume: { v: 1, mode: "stop", stopId: "notice-the-signs", state: {} },
      },
    },
  };
  const steps = [
    { at: "2026-10-20T10:00:00Z", event: "screen", stop: 1, phase: "playing" },
    { at: "2026-10-20T10:01:00Z", event: "screen", phase: "My name is Ana" },
    { at: "bad", event: "screen" },
  ];
  const file = progressFile(store, {
    stops: STOPS,
    steps,
    now: new Date("2026-10-27T12:00:00Z"),
  });
  assert.equal(file.format, "pecan-grove-progress");
  assert.equal(file.version, 1);
  assert.deepEqual(Object.keys(file.players), ["fox"]);
  const fox = file.players.fox;
  assert.equal(fox.stars, 3);
  assert.equal(fox.stops["notice-the-signs"].stop, 1);
  assert.equal(fox.stops["retired-stop"], undefined);
  assert.equal(fox.resume, undefined);
  assert.deepEqual(Object.keys(fox.badges), ["first-stop"]);
  assert.deepEqual(file.steps, [
    { at: "2026-10-20T10:00:00Z", event: "screen", stop: 1, phase: "playing" },
    { at: "2026-10-20T10:01:00Z", event: "screen" },
  ]);
  assert.doesNotMatch(JSON.stringify(file), /Ana|"name"/);

  const read = readProgressFile(JSON.stringify(file), { stops: STOPS });
  assert.equal(read.error, undefined);
  const elsewhere = {
    version: 2,
    current: "you",
    players: { you: { stops: {}, badges: {} } },
  };
  assert.deepEqual(mergeProgress(elsewhere, read), { opened: 1, skipped: 0 });
  assert.equal(elsewhere.current, "fox");
  assert.equal(elsewhere.players.you, undefined, "the empty default gives way");
  assert.deepEqual(elsewhere.players.fox.stops["notice-the-signs"], {
    best: 90,
    first: 60,
    rounds: 2,
    last5: [60, 90],
    all: [60, 90],
    lastRound: "b-3",
    allSigns: true,
  });
  assert.equal(
    fox.stops["notice-the-signs"].lastOrder,
    undefined,
    "a stop keeps only the extras it reads back",
  );
});

test("opening a progress file is checked first and only ever adds progress", () => {
  const good = (players) =>
    JSON.stringify({ format: "pecan-grove-progress", version: 1, players });
  const record = { best: 70, rounds: 1, first: 70, last5: [70], all: [70] };
  for (const text of [
    "not json",
    JSON.stringify({ format: "other", version: 1, players: {} }),
    good({ dragon: { stops: {} } }),
    good({
      fox: { stops: { "notice-the-signs": { best: "lots", rounds: 1 } } },
    }),
    good({ fox: { stops: { "notice-the-signs": { best: 70, rounds: 0 } } } }),
    good({ fox: { stops: [] } }),
    " ".repeat(PROGRESS_MAX_BYTES + 1),
  ])
    assert.equal(
      readProgressFile(text, { stops: STOPS }).error,
      "invalid",
      text.slice(0, 40),
    );
  assert.equal(
    readProgressFile(
      JSON.stringify({
        format: "pecan-grove-progress",
        version: 2,
        players: {},
      }),
      { stops: STOPS },
    ).error,
    "newer",
  );
  const sneaky = readProgressFile(
    JSON.stringify({
      format: "pecan-grove-progress",
      version: 1,
      players: {
        fox: {
          stops: {
            "notice-the-signs": {
              best: 70,
              rounds: 1,
              note: { a: { b: { c: { d: 1 } } } },
            },
            "future-stop": { best: 1, rounds: 1 },
          },
        },
      },
    }).replace('"note"', '"__proto__":{"polluted":true},"note"'),
    { stops: STOPS },
  );
  assert.equal({}.polluted, undefined);
  assert.deepEqual(Object.keys(sneaky.players.fox.stops), ["notice-the-signs"]);
  assert.equal(sneaky.players.fox.stops["notice-the-signs"].note, undefined);
  assert.equal(
    Object.getPrototypeOf(sneaky.players.fox.stops["notice-the-signs"]),
    Object.prototype,
  );

  const store = {
    version: 2,
    current: "fox",
    players: {
      fox: {
        stops: { "notice-the-signs": { ...record, best: 95, rounds: 4 } },
        badges: { "first-stop": "2026-10-01T10:00:00.000Z" },
      },
    },
  };
  const read = readProgressFile(
    good({
      fox: {
        stops: { "notice-the-signs": record, "ask-a-good-question": record },
        badges: { "three-stars": "2026-10-02T10:00:00.000Z" },
      },
      owl: { stops: {} },
      bee: { stops: {} },
    }),
    { stops: STOPS },
  );
  for (const id of ["turtle", "rabbit", "deer", "heron", "otter", "bee"])
    store.players[id] = { stops: {}, badges: {} };
  store.players.you = { stops: { "notice-the-signs": record }, badges: {} };
  assert.deepEqual(mergeProgress(store, read), { opened: 2, skipped: 1 });
  assert.equal(store.players.fox.stops["notice-the-signs"].best, 95);
  assert.equal(store.players.fox.stops["ask-a-good-question"].best, 70);
  assert.deepEqual(Object.keys(store.players.fox.badges).sort(), [
    "first-stop",
    "three-stars",
  ]);
  assert.equal(store.players.owl, undefined, "a ninth game does not fit");
  assert.equal(Object.keys(store.players).length, 8);
});

// The reviewer's hostile file: wrong-typed extras made Stop 2 and Stop 4 fail every time they started.
const HOSTILE_STOPS = [
  { id: "notice-the-signs", n: 1 },
  { id: "ask-a-good-question", n: 2 },
  { id: "listen-to-every-neighbor", n: 3 },
  { id: "fact-or-rumor", n: 4 },
  { id: "weigh-the-tradeoffs", n: 11 },
];
const hostileFile = (stops) =>
  JSON.stringify({
    format: "pecan-grove-progress",
    version: 1,
    savedAt: "2026-10-27T10:00:00.000Z",
    language: "en",
    current: "fox",
    players: {
      fox: {
        created: "2026-10-01T00:00:00Z",
        updated: "2026-10-01T00:00:00Z",
        badges: {},
        stops: {
          [stops[1].id]: { best: 50, rounds: 1, lastOrder: 5, lastRound: 7 },
          [stops[3].id]: { best: 50, rounds: 1, lastClaims: "boom", allSources: "yes", processBadge: "<b>x</b>" },
        },
      },
    },
  });
test("a hostile progress file only adds clean data: unknown and wrong-typed extras are dropped", () => {
  const read = readProgressFile(hostileFile(HOSTILE_STOPS), { stops: HOSTILE_STOPS });
  assert.equal(read.error, undefined);
  const clean = { best: 50, first: 50, rounds: 1, last5: [], all: [] };
  assert.deepEqual(read.players.fox.stops["ask-a-good-question"], clean);
  assert.deepEqual(read.players.fox.stops["fact-or-rumor"], clean);
  const good = readProgressFile(
    JSON.stringify({
      format: "pecan-grove-progress",
      version: 1,
      players: {
        fox: {
          stops: {
            "notice-the-signs": { best: 60, rounds: 2, lastRound: "a,b", allSigns: true, extraTaps: 0, processBadge: "process-1", lastClaims: [1, 2] },
            "fact-or-rumor": { best: 70, rounds: 1, lastClaims: [3, 1], allSources: true, processBadge: null },
            "weigh-the-tradeoffs": { best: 40, rounds: 1, lastRound: { a: { g: [0, 1], h: [2, 3] } }, lastOrder: ["a", "b"], lastClaims: [1] },
          },
        },
      },
    }),
    { stops: HOSTILE_STOPS },
  );
  const stops = good.players.fox.stops;
  assert.deepEqual(stops["notice-the-signs"], { best: 60, first: 60, rounds: 2, last5: [], all: [], lastRound: "a,b", allSigns: true, extraTaps: 0, processBadge: "process-1" }, "a stop keeps its own extras, never another stop's");
  assert.deepEqual(stops["fact-or-rumor"].lastClaims, [3, 1]);
  assert.equal(stops["fact-or-rumor"].processBadge, null);
  assert.deepEqual(stops["weigh-the-tradeoffs"].lastRound, { a: { g: [0, 1], h: [2, 3] } });
  assert.equal(stops["weigh-the-tradeoffs"].lastClaims, undefined);
  // Opened on a device, the new game holds only the clean records.
  const store = { version: 2, current: "you", players: { you: { stops: {}, badges: {} } } };
  mergeProgress(store, read);
  assert.deepEqual(store.players.fox.stops["fact-or-rumor"], clean);
});
test("a hostile progress file cannot make a stop fail in the mounted game", async () => {
  const r = await mountedGame("en");
  try {
    r.core.showTitle();
    const stops = r.core.getAPI().STOPS;
    r.root.querySelector(".cb-hero .cb-btn--onstage").click();
    const box = r.root.querySelector("dialog[open] .cb-progress-file"), status = box.querySelector("[role=status]");
    const picker = box.querySelector("input[type=file]"), text = hostileFile(stops);
    Object.defineProperty(picker, "files", { configurable: true, value: [{ size: text.length, text: async () => text }] });
    picker.dispatchEvent(new r.w.Event("change"));
    await until(() => status.textContent !== "", "The result is announced");
    assert.match(status.textContent, /Progress file opened/);
    r.root.querySelector("dialog[open]").close();
    for (const n of [2, 4]) {
      r.errors.length = 0;
      r.core.startStop(stops[n - 1].id);
      // A stop that fails to draw its round goes back to the map a moment after it starts.
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const state = r.core.getState();
      assert.deepEqual([state.mode, state.inStop], ["stop", true], `Stop ${n} must not fail`);
      assert.deepEqual(r.errors.map(String), []);
      r.core.showMap();
    }
  } finally {
    r.close();
  }
});
test("opening a progress file reports the real outcome when nothing is added or nothing can be saved", async () => {
  for (const blockStorage of [false, true]) {
    const r = await mountedGame("en", null, { blockStorage });
    try {
      r.core.showTitle();
      r.root.querySelector(".cb-hero .cb-btn--onstage").click();
      const box = r.root.querySelector("dialog[open] .cb-progress-file"), status = box.querySelector("[role=status]");
      const picker = box.querySelector("input[type=file]");
      const choose = async (text) => {
        status.textContent = "";
        Object.defineProperty(picker, "files", { configurable: true, value: [{ size: text.length, text: async () => text }] });
        picker.dispatchEvent(new r.w.Event("change"));
        await until(() => status.textContent !== "", "The result is announced");
      };
      await choose(JSON.stringify({ format: "pecan-grove-progress", version: 1, players: {} }));
      assert.match(status.textContent, /No games from this progress file were added, so nothing changed/);
      const stopId = r.core.getAPI().STOPS[0].id;
      await choose(JSON.stringify({ format: "pecan-grove-progress", version: 1, current: "otter", players: { otter: { stops: { [stopId]: { best: 80, rounds: 1 } } } } }));
      if (blockStorage) assert.match(status.textContent, /opened for now, but this browser cannot save it/);
      else assert.match(status.textContent, /Its games are on this device now/);
      assert.equal(r.core.getState().store.current, "otter", "the games are open in this tab either way");
    } finally {
      r.close();
    }
  }
});
test("the step log keeps fixed game values only, skips repeats and stays small", () => {
  const storage = memory(),
    state = () => ({ storageKey: KEY });
  const log = new StepLog({ state, storage, target: null });
  assert.equal(stepKey(KEY), "pecan-grove-steps:test_player_session_123456");
  assert.equal(
    log.record("screen", { stop: 2, phase: "playing", slot: "fox" }),
    true,
  );
  assert.equal(
    log.record("screen", { stop: 2, phase: "playing", slot: "fox" }),
    false,
  );
  log.record("screen", { stop: 2, phase: "result", score: 87.4, slot: "fox" });
  log.record("language", { language: "es", text: "free words" });
  assert.equal(log.record("typed", { text: "My name is Ana" }), false);
  const entries = log.entries();
  for (const entry of entries)
    assert.match(entry.at, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
  assert.deepEqual(
    entries.map(({ at: _at, ...rest }) => rest),
    [
      { event: "screen", stop: 2, phase: "playing", slot: "fox" },
      { event: "screen", stop: 2, phase: "result", slot: "fox" },
      { event: "language", language: "es" },
    ],
  );
  for (let n = 0; n < STEP_LIMIT + 20; n++)
    log.record(n % 2 ? "pause" : "resume", { stop: 1 });
  assert.equal(log.entries().length, STEP_LIMIT);
  assert.ok(storage.values.get(stepKey(KEY)).length < 40000);
});

test("a shared computer keeps the step logs of this player and the most recent others only", () => {
  const storage = memory();
  const at = (n) => `2026-10-${String(n).padStart(2, "0")}T10:00:00Z`;
  const session = (n) => `player_session_${String(n).padStart(16, "0")}`;
  for (let n = 1; n <= 12; n++)
    storage.setItem(`pecan-grove-steps:${session(n)}`, JSON.stringify([{ at: at(n), event: "screen", stop: 1 }]));
  storage.setItem("pecan-grove-settings", "{}");
  storage.setItem(`pecan-grove-journey:${session(1)}`, "{}");
  const mine = `pecan-grove-journey:${session(2)}`;
  const log = new StepLog({ state: () => ({ storageKey: mine }), storage, target: null });
  assert.equal(STEP_PLAYERS, 8);
  assert.equal(log.prune(), 4);
  const kept = [...storage.values.keys()].filter((key) => key.startsWith("pecan-grove-steps"));
  assert.equal(kept.length, 8);
  assert.ok(kept.includes(stepKey(mine)), "this player's log stays even though it is old");
  for (let n = 6; n <= 12; n++) assert.ok(kept.includes(`pecan-grove-steps:${session(n)}`), `recent player ${n} stays`);
  for (const key of ["pecan-grove-settings", `pecan-grove-journey:${session(1)}`]) assert.ok(storage.values.has(key), key);
  assert.equal(log.prune(), 0, "pruning again removes nothing");
});
test("For grown-ups saves and opens a progress file in the mounted game", async () => {
  const r = await mountedGame("en");
  const realCreate = URL.createObjectURL,
    realRevoke = URL.revokeObjectURL;
  let blob = null;
  URL.createObjectURL = (value) => {
    blob = value;
    return "blob:progress";
  };
  URL.revokeObjectURL = () => {};
  try {
    r.core.showTitle();
    r.root.querySelector(".cb-hero .cb-btn--onstage").click();
    const box = () => r.root.querySelector("dialog[open] .cb-progress-file");
    assert.ok(box(), "For grown-ups shows the progress file controls");
    assert.match(box().textContent, /never sends it anywhere/);
    const [save, open] = box().querySelectorAll("button");
    assert.equal(save.textContent, "Save progress file");
    assert.equal(open.textContent, "Open progress file");
    save.click();
    const saved = JSON.parse(await blob.text());
    assert.equal(saved.format, "pecan-grove-progress");
    assert.ok(saved.steps.some((step) => step.event === "screen"));
    const status = box().querySelector("[role=status]");
    assert.match(status.textContent, /Progress file saved/);

    const picker = box().querySelector("input[type=file]");
    const choose = async (text) => {
      status.textContent = "";
      Object.defineProperty(picker, "files", {
        configurable: true,
        value: [{ size: text.length, text: async () => text }],
      });
      picker.dispatchEvent(new r.w.Event("change"));
      await until(() => status.textContent !== "", "The result is announced");
    };
    await choose("{}");
    assert.match(status.textContent, /not a Pecan Grove progress file/);
    const stopId = r.core.getAPI().STOPS[0].id;
    await choose(
      JSON.stringify({
        format: "pecan-grove-progress",
        version: 1,
        current: "otter",
        players: { otter: { stops: { [stopId]: { best: 80, rounds: 1 } } } },
      }),
    );
    assert.match(status.textContent, /Progress file opened/);
    assert.equal(r.core.getState().store.current, "otter");
    assert.equal(r.storedPlayer().stops[stopId].best, 80);
    r.root.querySelector("dialog[open]").close();
    await until(
      () =>
        /Otter/.test(
          r.root.querySelector(".cb-continue small")?.textContent || "",
        ),
      "Continue names the opened game",
    );
  } finally {
    URL.createObjectURL = realCreate;
    URL.revokeObjectURL = realRevoke;
    r.close();
  }
});

test("Settings shows the voice and captions the game buttons last saved", async () => {
  const r = await mountedGame("en");
  try {
    r.core.performAction("voice");
    r.core.performAction("captions");
    const dialog = r.engine.settings.open(null);
    const box = (key) =>
      [...dialog.querySelectorAll("label")]
        .find((label) => label.textContent === r.engine.i18n.t(key))
        ?.closest(".cb-engine-setting")
        ?.querySelector("input");
    assert.equal(r.engine.settings.get().voice, false);
    assert.equal(r.engine.settings.get().cap, true);
    r.engine.settings.choose?.("audio", true);
    assert.equal(box("voice")?.checked, false);
  } finally {
    r.close();
  }
});
