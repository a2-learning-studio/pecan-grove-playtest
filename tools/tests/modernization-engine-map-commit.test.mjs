import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createMapCommit } from "../../assets/games/community-builders/engine/map-commit.js";
import fixture from "./modernization-gameplay-fixture.cjs";

function harness() {
  const dom = new JSDOM("<main><p>Previous scene</p></main>");
  const window = dom.window,
    document = window.document,
    root = document.querySelector("main");
  const frames = new Map();
  let id = 0;
  window.requestAnimationFrame = (run) => {
    frames.set(++id, run);
    return id;
  };
  window.cancelAnimationFrame = (frame) => frames.delete(frame);
  const ctx = {
    window,
    document,
    root,
    mode: "map",
    store: { current: "fox" },
    feedbackSession: "session",
    stopVisit: 1,
    gamePaused: false,
  };
  const commit = createMapCommit(ctx);
  return {
    ctx,
    root,
    document,
    window,
    frames,
    commit,
    paint() {
      const runs = [...frames.values()];
      frames.clear();
      runs.forEach((run) => run());
    },
    close() {
      commit.destroy();
      window.close();
    },
  };
}

test("map construction can finish detached before its owned connected commit", async () => {
  const h = harness();
  try {
    const map = h.document.createElement("section");
    map.textContent = "Ready map";
    const ready = h.commit.run(() => {
      h.root.replaceChildren(map);
      h.root.dataset.sceneLayout = "pending";
    });
    assert.equal(map.isConnected, false);
    assert.equal(h.root.textContent, "Previous scene");
    assert.equal(h.root.dataset.mapCommit, "pending");
    assert.equal(h.frames.size, 1);
    h.paint();
    assert.equal(await ready, true);
    assert.equal(map.isConnected, true);
    assert.equal(h.root.dataset.mapCommit, undefined);
    assert.equal(
      h.root.dataset.sceneLayout,
      "pending",
      "final scene layout retains its independent readiness",
    );
  } finally {
    h.close();
  }
});

test("new map requests supersede detached work and cancellation removes its owned frame", async () => {
  const h = harness();
  try {
    const calls = [];
    const first = h.commit.run(() => calls.push("old"));
    const second = h.commit.run(() => calls.push("new"));
    assert.equal(await first, false);
    assert.equal(h.frames.size, 1);
    h.paint();
    assert.equal(await second, true);
    assert.deepEqual(calls, ["new"]);
    const cancelled = h.commit.run(() => calls.push("cancelled"));
    h.commit.cancel();
    assert.equal(await cancelled, false);
    h.paint();
    assert.deepEqual(calls, ["new"]);
    assert.equal(h.root.dataset.mapCommit, undefined);
  } finally {
    h.close();
  }
});

for (const kind of [
  "slot",
  "session",
  "visit",
  "screen",
  "removal",
  "quit",
  "pause",
  "new dialog",
])
  test(`a detached map is discarded after ${kind}`, async () => {
    const h = harness();
    try {
      let committed = false;
      const ready = h.commit.run(() => {
        committed = true;
      });
      if (kind === "slot") h.ctx.store.current = "owl";
      if (kind === "session") h.ctx.feedbackSession = "other";
      if (kind === "visit") h.ctx.stopVisit++;
      if (kind === "screen") h.ctx.mode = "stop";
      if (kind === "removal") h.root.remove();
      if (kind === "quit") h.root.setAttribute("data-playtest-paused", "true");
      if (kind === "pause") h.ctx.gamePaused = true;
      if (kind === "new dialog") {
        const d = h.document.createElement("dialog");
        d.open = true;
        h.root.append(d);
      }
      h.paint();
      assert.equal(await ready, false);
      assert.equal(committed, false);
      assert.equal(h.root.dataset.mapCommit, undefined);
    } finally {
      h.close();
    }
  });

for (const type of ["cb:screen", "cb:pause", "pg:language-change"])
  test(`${type} cancels only pending map work`, async () => {
    const h = harness();
    try {
      let committed = false;
      const ready = h.commit.run(() => {
        committed = true;
      });
      h.document.dispatchEvent(
        new h.window.CustomEvent(type, { detail: { paused: true } }),
      );
      assert.equal(await ready, false);
      assert.equal(h.frames.size, 0);
      assert.equal(committed, false);
    } finally {
      h.close();
    }
  });

test("an inherited pause scope is preserved while a selected map is rendered behind it", async () => {
  const h = harness();
  try {
    h.ctx.gamePaused = true;
    const pause = h.document.createElement("dialog");
    pause.open = true;
    h.root.append(pause);
    let committed = false;
    const ready = h.commit.run(() => {
      committed = true;
    });
    h.paint();
    assert.equal(await ready, true);
    assert.equal(committed, true);
    assert.equal(pause.open, true);
  } finally {
    h.close();
  }
});

test("a commit error rejects and removes pending ownership", async () => {
  const h = harness();
  try {
    const ready = h.commit.run(() => {
      throw new Error("map failed");
    });
    h.paint();
    await assert.rejects(ready, /map failed/);
    assert.equal(h.root.dataset.mapCommit, undefined);
    assert.equal(h.frames.size, 0);
  } finally {
    h.close();
  }
});

for (const language of ["en", "es"])
  test(`${language}: actual map commit preserves synchronous callers, final focus and working stop controls`, async () => {
    const r = await fixture.fullCore(language, 42);
    try {
      const frames = new Map();
      let id = 0;
      r.w.requestAnimationFrame = (run) => {
        frames.set(++id, run);
        return id;
      };
      r.w.cancelAnimationFrame = (frame) => frames.delete(frame);
      const paint = () => {
        const runs = [...frames.values()];
        frames.clear();
        runs.forEach((run) => run());
      };
      r.core.enterPlay({ quiet: true });
      r.core.showMap();
      assert.ok(
        r.main().querySelector(".cb-world"),
        "ordinary map callers remain synchronous",
      );
      paint();
      paint();
      r.core.showTitle();
      const oldHeading = r.main().querySelector("h2");
      const ready = r.core.showMap(null, { defer: true });
      assert.ok(
        r.main().querySelector(".cb-hero"),
        "construction does not attach a partial map",
      );
      assert.equal(r.root.dataset.mapCommit, "pending");
      paint();
      assert.equal(await ready, true);
      assert.ok(r.main().querySelector(".cb-world"));
      assert.equal(
        r.main().querySelectorAll(".cb-stop[data-stop-n]").length,
        30,
      );
      assert.equal(
        r.root.querySelector(".cb-world__canvas").dataset.mapLayout,
        "pending",
      );
      assert.equal(r.root.dataset.sceneLayout, "pending");
      assert.equal(oldHeading.isConnected, false);
      // JSDOM has no stylesheet layout. Supply the mounted canvas dimensions;
      // real geometry/collision algorithms are covered by the map layout suite.
      const canvas = r.root.querySelector(".cb-world__canvas"),
        pan = r.root.querySelector(".cb-world__pan"),
        bounds = {
          left: 0,
          top: 0,
          right: 360,
          bottom: 201,
          width: 360,
          height: 201,
        };
      canvas.getBoundingClientRect = pan.getBoundingClientRect = () => bounds;
      Object.defineProperties(canvas, {
        clientWidth: { value: 360 },
        clientHeight: { value: 201 },
      });
      paint();
      paint();
      assert.equal(
        r.root.querySelector(".cb-world__canvas").dataset.mapLayout,
        "ready",
      );
      assert.equal(r.root.dataset.sceneLayout, "ready");
      assert.equal(r.w.document.activeElement, r.main().querySelector("h2"));
      r.main().querySelector('.cb-stop[data-stop-n="2"]').click();
      await r.tick();
      assert.ok(
        r.main().querySelector(".cb-s02-intro"),
        "committed controls open their actual lazy stop",
      );
      assert.equal(r.errors.length, 0, String(r.errors));
    } finally {
      r.close();
    }
  });
