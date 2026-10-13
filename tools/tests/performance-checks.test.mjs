import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { stageReady, inspectStep } from "../performance-checks.mjs";

test("performance stage readiness waits for the actual screen and completed deferred styles/resources", () => {
  const dom = new JSDOM(
    '<div id="community-builders" aria-busy="true" inert></div>',
  );
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, "document"),
    oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  let state = { mode: "title", stopId: null };
  try {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: dom.window.document,
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { CommunityBuilders: { getState: () => state } },
    });
    const root = document.getElementById("community-builders");
    assert.equal(stageReady({ mode: "title" }), false);
    root.removeAttribute("aria-busy");
    assert.equal(stageReady({ mode: "title" }), false);
    root.removeAttribute("inert");
    assert.equal(stageReady({ mode: "title" }), true);
    assert.equal(stageReady({ mode: "map" }), false);
    state = { mode: "map", stopId: null };
    const canvas = document.createElement("div");
    canvas.dataset.mapLayout = "pending";
    root.append(canvas);
    assert.equal(
      stageReady({ mode: "map" }),
      false,
      "map geometry remains inside the measured interaction",
    );
    canvas.dataset.mapLayout = "ready";
    assert.equal(stageReady({ mode: "map" }), true);
    root.dataset.sceneLayout = "pending";
    assert.equal(
      stageReady({ mode: "map" }),
      false,
      "final scene focus and framing remain inside the measured interaction",
    );
    root.dataset.sceneLayout = "ready";
    assert.equal(stageReady({ mode: "map" }), true);
    root.dataset.slotTransition = "pending";
    assert.equal(
      stageReady({ mode: "map" }),
      false,
      "native dialog teardown and asynchronous slot resume stay inside the measured interaction",
    );
    delete root.dataset.slotTransition;
    root.dataset.mapCommit = "pending";
    assert.equal(
      stageReady({ mode: "map" }),
      false,
      "detached construction and its connected commit remain in the measured interaction",
    );
    delete root.dataset.mapCommit;
    state = { mode: "stop", stopId: "notice-the-signs" };
    assert.equal(
      stageReady({ mode: "stop", stopId: "ask-a-good-question" }),
      false,
    );
    assert.equal(
      stageReady({ mode: "stop", stopId: "notice-the-signs" }),
      true,
    );
  } finally {
    if (oldDocument) Object.defineProperty(globalThis, "document", oldDocument);
    else delete globalThis.document;
    if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow);
    else delete globalThis.window;
    dom.window.close();
  }
});

test("performance snapshots require their promised accessibility and best-practice scores", () => {
  const meta = { language: "es", run: 2 },
    lhr = {
      gatherMode: "snapshot",
      categories: {
        accessibility: { score: 1 },
        "best-practices": { score: 1 },
      },
      audits: {},
    };
  assert.deepEqual(inspectStep({ name: "Map", lhr }, meta).failures, []);
  delete lhr.categories.accessibility;
  assert.deepEqual(inspectStep({ name: "Map", lhr }, meta).failures, [
    "Missing accessibility score",
  ]);
  lhr.categories.accessibility = { score: 0.99 };
  assert.deepEqual(inspectStep({ name: "Map", lhr }, meta).failures, [
    "accessibility 0.99",
  ]);
});

test("timespan performance never treats absent or failed metrics as a passing interaction", () => {
  const meta = { language: "en", run: 1 },
    lhr = { gatherMode: "timespan", categories: {}, audits: {} };
  assert.deepEqual(inspectStep({ name: "Open stop", lhr }, meta).failures, [
    "Missing timespan TBT",
    "Missing timespan CLS",
  ]);
  lhr.audits = {
    "total-blocking-time": { numericValue: 50 },
    "cumulative-layout-shift": { numericValue: 0 },
  };
  assert.deepEqual(inspectStep({ name: "Open stop", lhr }, meta).failures, []);
  lhr.audits["total-blocking-time"].numericValue = 51;
  lhr.audits["cumulative-layout-shift"].numericValue = 0.001;
  assert.deepEqual(inspectStep({ name: "Open stop", lhr }, meta).failures, [
    "TBT 51ms",
    "CLS 0.001",
  ]);
});
