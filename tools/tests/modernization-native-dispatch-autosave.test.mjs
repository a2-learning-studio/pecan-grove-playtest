import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import createScene from "../../assets/games/community-builders/engine/core/scene.js";
import { createLifecycle } from "../../assets/games/community-builders/engine/lifecycle.js";

function recorder() {
  const dom = new JSDOM('<div id="game"></div>');
  const w = dom.window;
  const root = w.document.querySelector("#game");
  const tasks = new Map();
  let nextTask = 0;
  w.setTimeout = (run, delay) => {
    assert.equal(delay, 0, "Accepted state is observed in the next event task");
    tasks.set(++nextTask, run);
    return nextTask;
  };
  w.clearTimeout = (id) => tasks.delete(id);
  const state = { seenToday: false, found: [] };
  const events = [];
  const ctx = {
    root,
    document: w.document,
    window: w,
    W: { footer: "Game" },
    store: { current: "fox" },
    restoring: false,
    gamePaused: false,
    actionHistory: [],
    activeController: { snapshot: () => state },
    snapshot: () => ({
      stopId: "notice-the-signs",
      state: structuredClone(state),
    }),
    emit: (type, detail) => events.push({ type, detail }),
    setTimeout: w.setTimeout,
    clearTimeout: w.clearTimeout,
    clear: (node) => node.replaceChildren(),
    h(tag, attributes = {}) {
      const node = w.document.createElement(tag);
      for (const [name, value] of Object.entries(attributes || {})) {
        if (name === "text") node.textContent = value;
        else node.setAttribute(name, value);
      }
      return node;
    },
    publish(values) {
      Object.assign(ctx, values);
    },
    bind(fields) {
      for (const [name, [get, set]] of Object.entries(fields))
        Object.defineProperty(ctx, name, { get, set, configurable: true });
    },
  };
  createScene(ctx);
  ctx.mode = "stop";
  ctx.inStop = true;
  ctx.feedbackStop = "notice-the-signs";
  ctx.feedbackScore = null;
  ctx.activeLifecycle = createLifecycle({
    root,
    window: w,
    document: w.document,
  });
  const button = w.document.createElement("button");
  button.textContent = "Today";
  button.onclick = () => {
    state.seenToday = true;
    state.found.push("flags");
    button.setAttribute("aria-pressed", "true");
  };
  ctx.main.append(button);
  const event = { type: "click", target: button, defaultPrevented: false };
  return {
    ctx,
    state,
    button,
    event,
    events,
    tasks,
    flush() {
      const pending = [...tasks.values()];
      tasks.clear();
      pending.forEach((run) => run());
    },
    close() {
      ctx.activeLifecycle.dispose();
      dom.window.close();
    },
  };
}

test("native capture callback may finish a microtask checkpoint before the target handler", async () => {
  const r = recorder();
  try {
    // Browser event dispatch can return to native code after each listener.
    // JSDOM .click() encloses the entire dispatch in one JS stack and masks it.
    // Invoke the actual production capture callback, then that browser boundary.
    r.ctx.recordAction(r.event);
    await Promise.resolve();
    assert.equal(
      r.events.length,
      0,
      "Unchanged pre-target state must not save",
    );
    r.button.onclick(r.event);
    r.flush();
    assert.deepEqual(
      r.events,
      [
        {
          type: "cb:step",
          detail: {
            snapshot: {
              stopId: "notice-the-signs",
              state: { seenToday: true, found: ["flags"] },
            },
          },
        },
      ],
      "The post-dispatch task must observe the accepted target-handler state",
    );
  } finally {
    r.close();
  }
});

test("a prevented target or disposed visit cannot save from its post-dispatch task", async () => {
  for (const outcome of ["prevented", "disposed"]) {
    const r = recorder();
    try {
      r.ctx.recordAction(r.event);
      assert.equal(r.tasks.size, 1, "The active visit owns the deferred task");
      await Promise.resolve();
      r.button.onclick(r.event);
      if (outcome === "prevented") r.event.defaultPrevented = true;
      else {
        r.ctx.activeLifecycle.dispose();
        assert.equal(
          r.tasks.size,
          0,
          "Disposal cancels the owned task before it runs",
        );
      }
      r.flush();
      assert.equal(r.events.length, 0, outcome);
      assert.equal(r.tasks.size, 0, "The visit owns its pending capture task");
    } finally {
      r.close();
    }
  }
});
