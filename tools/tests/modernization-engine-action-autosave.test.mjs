import test from "node:test";
import assert from "node:assert/strict";
import {
  captureActionSave,
  saveAcceptedAction,
  createProgressAutosave,
} from "../../assets/games/community-builders/engine/action-autosave.js";
import fixture from "./modernization-gameplay-fixture.cjs";

function context() {
  const model = { selected: [] },
    events = [];
  const ctx = {
    mode: "stop",
    inStop: true,
    feedbackScore: null,
    feedbackStop: "one",
    restoring: false,
    gamePaused: false,
    store: { current: "fox" },
    activeLifecycle: {},
    activeController: { snapshot: () => model },
    snapshot: () => ({
      stopId: ctx.feedbackStop,
      state: structuredClone(model),
    }),
    emit: (type, detail) => events.push({ type, detail }),
  };
  return { ctx, model, events };
}

test("accepted native changes save the final model even when DOM is unchanged", () => {
  const { ctx, model, events } = context();
  const visit = captureActionSave(ctx);
  model.selected.push("choice-a");
  assert.equal(saveAcceptedAction(ctx, visit, {}, false), true);
  assert.deepEqual(events, [
    {
      type: "cb:step",
      detail: {
        snapshot: { stopId: "one", state: { selected: ["choice-a"] } },
      },
    },
  ]);
});

test("presentation-only changes and prevented or unchanged actions do not save", () => {
  const { ctx, model, events } = context();
  const visit = captureActionSave(ctx);
  assert.equal(saveAcceptedAction(ctx, visit, {}, true), false);
  model.selected.push("blocked");
  assert.equal(
    saveAcceptedAction(ctx, visit, { defaultPrevented: true }, true),
    false,
  );
  assert.equal(events.length, 0);
});

for (const kind of [
  "controller",
  "lifecycle",
  "stop",
  "slot",
  "map",
  "pause",
  "restoring",
  "result",
  "ended",
])
  test(`a pending action cannot save after ${kind} changes its visit`, () => {
    const { ctx, model, events } = context();
    const visit = captureActionSave(ctx);
    model.selected.push("stale");
    if (kind === "controller") ctx.activeController = { snapshot: () => model };
    if (kind === "lifecycle") ctx.activeLifecycle = {};
    if (kind === "stop") ctx.feedbackStop = "two";
    if (kind === "slot") ctx.store.current = "owl";
    if (kind === "map") ctx.mode = "map";
    if (kind === "pause") ctx.gamePaused = true;
    if (kind === "restoring") ctx.restoring = true;
    if (kind === "result") ctx.feedbackScore = 80;
    if (kind === "ended") ctx.inStop = false;
    assert.equal(saveAcceptedAction(ctx, visit, {}, true), false);
    assert.equal(events.length, 0);
  });

test("action replay fallback requires an actual DOM change", () => {
  const { ctx, events } = context();
  ctx.activeController = null;
  const visit = captureActionSave(ctx);
  assert.equal(saveAcceptedAction(ctx, visit, {}, false), false);
  assert.equal(saveAcceptedAction(ctx, visit, {}, true), true);
  assert.equal(events.length, 1);
});

function debounce() {
  let next = 0;
  const timers = new Map(),
    writes = [];
  const root = { dataset: { feedbackPhase: "playing" } };
  const state = {
    mode: "stop",
    inStop: true,
    paused: false,
    stopId: "one",
    session: "session",
    store: { current: "fox" },
  };
  const record = {
    v: 1,
    slot: "fox",
    session: "session",
    stopId: "one",
    state: { selected: ["a"] },
  };
  const autosave = createProgressAutosave({
    root,
    core: () => ({ getState: () => state, snapshot: () => record }),
    slots: { resume: (value) => writes.push(value) },
    setTimer: (run, delay) => {
      assert.equal(delay, 50);
      timers.set(++next, run);
      return next;
    },
    clearTimer: (id) => timers.delete(id),
  });
  return {
    autosave,
    root,
    state,
    record,
    timers,
    writes,
    run() {
      const runs = [...timers.values()];
      timers.clear();
      runs.forEach((run) => run());
    },
  };
}

test("the debounce saves one final accepted record and supports cancellation", () => {
  const h = debounce();
  h.autosave.schedule();
  h.autosave.schedule({ ...h.record, state: { selected: ["a", "b"] } });
  assert.equal(h.timers.size, 1);
  h.run();
  assert.deepEqual(h.writes[0].state.selected, ["a", "b"]);
  h.autosave.schedule();
  h.autosave.cancel();
  h.run();
  assert.equal(h.writes.length, 1);
});

for (const kind of [
  "map",
  "ended",
  "pause",
  "result",
  "stop",
  "slot",
  "session",
  "restoring",
  "visit",
])
  test(`the debounce rejects stale storage after ${kind}`, () => {
    const h = debounce();
    h.autosave.schedule();
    if (kind === "map") h.state.mode = "map";
    if (kind === "ended") h.state.inStop = false;
    if (kind === "pause") h.state.paused = true;
    if (kind === "result") h.root.dataset.feedbackPhase = "result";
    if (kind === "stop") h.state.stopId = "two";
    if (kind === "slot") h.state.store.current = "owl";
    if (kind === "session") h.state.session = "other";
    if (kind === "restoring") h.state.restoring = true;
    if (kind === "visit") h.state.visit = 2;
    h.run();
    assert.equal(h.writes.length, 0);
  });

test("same-stop native restore invalidates an old debounce during and after restoring", async () => {
  const r = await fixture.fullCore("en", 42);
  try {
    await r.core.startStop("notice-the-signs");
    r.main().querySelector(".cb-s01-intro .cb-btn--go").click();
    await Promise.resolve();
    let pending;
    const writes = [];
    const autosave = createProgressAutosave({
      root: r.root,
      core: () => r.core,
      slots: { resume: (record) => writes.push(record) },
      setTimer: (run) => {
        pending = run;
        return 1;
      },
      clearTimer: () => {
        pending = null;
      },
    });
    const record = r.core.snapshot(),
      visit = r.core.getState().visit;
    autosave.schedule(record);
    const during = pending;
    const resumed = r.core.resume(record);
    assert.equal(r.core.getState().restoring, true);
    assert.notEqual(r.core.getState().visit, visit);
    during();
    assert.equal(
      writes.length,
      0,
      "the old record cannot write during restore",
    );
    await resumed;
    assert.equal(r.core.getState().restoring, false);
    during();
    assert.equal(
      writes.length,
      0,
      "the replaced visit remains invalid after restore finishes",
    );
    assert.equal(r.errors.length, 0);
  } finally {
    r.close();
  }
});

test("the actual recorder waits for the Stop2 handler and ignores its blocked pointer edge", async () => {
  const r = await fixture.fullCore("en", 42);
  try {
    r.w.Date.now = () => 1000;
    await r.core.startStop("ask-a-good-question");
    r.main().querySelector(".cb-btn--go").click();
    await Promise.resolve();
    const events = [];
    r.w.document.addEventListener("cb:step", (event) =>
      events.push(event.detail.snapshot),
    );
    const tile = r.main().querySelector('.cb-s02-tile[data-row="start"]');
    tile.dispatchEvent(
      new r.w.MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        detail: 1,
      }),
    );
    await Promise.resolve();
    assert.equal(events.length, 0, "a blocked pointer edge must not save");
    tile.click();
    assert.equal(
      events.length,
      0,
      "capture must not save before the target handler",
    );
    await Promise.resolve();
    assert.equal(events.length, 1);
    assert.equal(events[0].state.sel.start, tile.dataset.id);
    assert.equal(r.errors.length, 0);
  } finally {
    r.close();
  }
});

test("the actual recorder ignores utility dialogs and repeated Stop1 findings", async () => {
  const r = await fixture.fullCore("en", 42);
  try {
    await r.core.startStop("notice-the-signs");
    r.main().querySelector(".cb-s01-intro .cb-btn--go").click();
    r.main().querySelector('[data-view="today"]').click();
    const spot = r.main().querySelector('[data-spot="0"]');
    spot.click();
    await Promise.resolve();
    const events = [];
    r.w.document.addEventListener("cb:step", (event) =>
      events.push(event.detail.snapshot),
    );
    spot.click();
    const d = r.w.document.createElement("dialog");
    d.className = "cb-engine-dialog";
    const b = r.w.document.createElement("button");
    b.onclick = () => {
      b.textContent = "Utility changed";
    };
    d.append(b);
    r.root.append(d);
    b.click();
    await Promise.resolve();
    assert.equal(events.length, 0);
    assert.equal(r.errors.length, 0);
  } finally {
    r.close();
  }
});
