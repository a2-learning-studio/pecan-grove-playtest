import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import createLoadingView from "../../assets/games/community-builders/engine/core/loading-view.js";
import createLoading from "../../assets/games/community-builders/engine/core/loading.js";
import {
  setAuthoredMarkup,
  clear,
} from "../../assets/games/community-builders/engine/authored-markup.js";

function fixture() {
  const dom = new JSDOM("<main></main>", { runScripts: "outside-only" });
  const w = dom.window,
    root = w.document.querySelector("main"),
    timers = new Map(),
    spoken = [];
  w.eval(
    fs.readFileSync(
      new URL(
        "../../assets/games/community-builders/locales/catalog.js",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  let now = 0,
    serial = 0;
  const ctx = {
    window: w,
    document: w.document,
    root,
    L: "en",
    vOn: true,
    clear,
    setAuthoredMarkup,
    CREST:
      '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#163A30"/></svg>',
    h(tag, attrs = {}) {
      const node = w.document.createElement(tag);
      for (const [key, value] of Object.entries(attrs))
        key === "text"
          ? (node.textContent = value)
          : node.setAttribute(key, value);
      return node;
    },
    btn(text, cls, run) {
      const node = w.document.createElement("button");
      node.textContent = text;
      node.className = cls;
      node.addEventListener("click", run);
      return node;
    },
    say: (text) => spoken.push(text),
    publish: (values) => Object.assign(ctx, values),
    setTimeout(run, delay) {
      const id = ++serial;
      timers.set(id, { run, at: now + delay });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
  };
  createLoadingView(ctx);
  const advance = (ms) => {
    now += ms;
    for (const [id, item] of [...timers])
      if (item.at <= now) {
        timers.delete(id);
        item.run();
      }
  };
  return { ctx, root, spoken, advance, close: () => w.close() };
}

function manifestFixture() {
  let respond,
    failed = 0,
    maps = 0;
  const stops = [
    { id: "first", n: 1 },
    { id: "second", n: 2 },
  ];
  const ctx = {
    STOPS: stops,
    PLAYABLE: { legacy: 1 },
    BASE: "/game/",
    vOn: false,
    main: {},
    mode: "title",
    window: {
      fetch: () =>
        new Promise((resolve) => {
          respond = resolve;
        }),
    },
    resolveAsset: (value) => value,
    stopById: (id) => stops.find((stop) => stop.id === id),
    showTitle() {},
    showMap() {
      maps++;
    },
    loadingTask: () => ({
      set() {},
      art: () => Promise.resolve(),
      finish() {},
      fail() {
        failed++;
      },
    }),
    publish: (values) => Object.assign(ctx, values),
    bind: (descriptors) => {
      for (const [key, [get, set]] of Object.entries(descriptors))
        Object.defineProperty(ctx, key, { get, set });
    },
  };
  createLoading(ctx);
  const items = stops.map((stop) => ({
    ...stop,
    file: "0" + stop.n + "-" + stop.id + ".js",
    css: "0" + stop.n + "-" + stop.id + ".css",
    steps: [null, null],
  }));
  return {
    ctx,
    items,
    respond: (items) => respond({ ok: true, json: async () => items }),
    failures: () => failed,
    maps: () => maps,
  };
}

test("playable stops and authored step counts come only from the validated fetched manifest", async () => {
  const r = manifestFixture();
  assert.deepEqual(r.ctx.PLAYABLE, {});
  assert.deepEqual(r.ctx.moduleManifest, {});
  r.ctx.mode = "map";
  r.respond(r.items);
  await r.ctx.manifestReady;
  assert.deepEqual(r.ctx.PLAYABLE, { first: 1, second: 1 });
  assert.deepEqual(r.ctx.moduleManifest.second.steps, [null, null]);
  assert.notEqual(r.ctx.moduleManifest.second.steps, r.items[1].steps);
  assert.equal(
    r.maps(),
    1,
    "a map opened while the manifest loaded refreshes its available stops",
  );
  assert.equal(r.failures(), 0);
});

test("a manifest with an empty step list fails atomically without advertising partly validated stops", async () => {
  const r = manifestFixture();
  r.items[1].steps = [];
  r.respond(r.items);
  await assert.rejects(r.ctx.manifestReady, /manifest_invalid/);
  await Promise.resolve();
  assert.deepEqual(r.ctx.PLAYABLE, {});
  assert.deepEqual(r.ctx.moduleManifest, {});
  assert.equal(r.failures(), 1);
});

test("fast resource loads never flash an overlay; delayed loads expose real weighted quarter progress", () => {
  const r = fixture();
  try {
    const fast = r.ctx.loadingTask(() => {});
    fast.set("module", 1);
    fast.finish();
    r.advance(400);
    assert.equal(r.root.querySelector("progress"), null);
    const load = r.ctx.loadingTask(() => {});
    r.advance(299);
    assert.equal(r.root.querySelector("progress"), null);
    r.advance(1);
    const bar = r.root.querySelector("progress");
    assert.equal(bar.value, 0);
    assert.equal(bar.getAttribute("aria-label"), "Game loading");
    load.set("module", 0.5);
    assert.equal(bar.value, 20);
    load.set("manifest", 1);
    assert.equal(bar.value, 25);
    load.set("art", 1);
    assert.equal(bar.value, 60);
    load.set("voice", 1);
    assert.equal(bar.value, 80);
    load.set("module", 1);
    assert.equal(bar.value, 100);
    assert.deepEqual(r.spoken, [
      "Game loading: 25%",
      "Game loading: 50%",
      "Game loading: 75%",
      "Game loading: 100%",
    ]);
    const before = r.root.querySelector("p").textContent;
    r.advance(4000);
    assert.notEqual(r.root.querySelector("p").textContent, before);
    load.finish();
    assert.equal(r.root.querySelector("progress"), null);
    assert.equal(r.root.hasAttribute("aria-busy"), false);
  } finally {
    r.close();
  }
});

test("art contributes its weight only after decode; retry is explicit and replaces the failed task", async () => {
  const r = fixture();
  try {
    let decoded,
      attempts = 0;
    const image = r.ctx.h("img");
    image.decode = () => new Promise((resolve) => (decoded = resolve));
    r.root.append(image);
    const load = r.ctx.loadingTask(() => attempts++);
    r.advance(300);
    const ready = load.art(r.root);
    assert.equal(r.root.querySelector("progress").value, 0);
    decoded();
    await ready;
    assert.equal(r.root.querySelector("progress").value, 35);
    load.fail();
    assert.match(r.root.textContent, /Something didn't load/);
    assert.equal(attempts, 0);
    r.root.querySelector("button").click();
    assert.equal(attempts, 1);
    assert.equal(r.root.querySelector("progress"), null);
    const old = r.ctx.loadingTask(() => {});
    r.advance(300);
    const next = r.ctx.loadingTask(() => {});
    assert.equal(r.root.querySelector("progress"), null);
    old.set("voice", 1);
    r.advance(300);
    assert.equal(r.root.querySelectorAll("progress").length, 1);
    next.finish();
  } finally {
    r.close();
  }
});

test("rerendered art waits for its replacement and ignores a detached image's aborted decode", async () => {
  const r = fixture();
  try {
    let abortOld, decodeReplacement;
    const old = r.ctx.h("img");
    old.decode = () =>
      new Promise((resolve, reject) => {
        abortOld = reject;
      });
    r.root.append(old);
    const load = r.ctx.loadingTask(() => {});
    r.advance(300);
    const ready = load.art(r.root);
    const replacement = r.ctx.h("img");
    replacement.decode = () =>
      new Promise((resolve) => {
        decodeReplacement = resolve;
      });
    old.replaceWith(replacement);
    abortOld(new Error("Image decode aborted"));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(typeof decodeReplacement, "function");
    assert.equal(r.root.querySelector("progress").value, 0);
    decodeReplacement();
    await ready;
    assert.equal(r.root.querySelector("progress").value, 35);
    load.finish();
  } finally {
    r.close();
  }
});

test("an already loaded image remains usable when decode rejects, but real art failures reject", async () => {
  const r = fixture();
  try {
    const image = r.ctx.h("img");
    image.decode = () => Promise.reject(new Error("Image decode interrupted"));
    Object.defineProperty(image, "complete", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(image, "naturalWidth", {
      configurable: true,
      value: 400,
    });
    r.root.append(image);
    const load = r.ctx.loadingTask(() => {});
    await load.art(r.root);
    Object.defineProperty(image, "naturalWidth", {
      configurable: true,
      value: 0,
    });
    await assert.rejects(load.art(r.root), /interrupted/);
    load.finish();
  } finally {
    r.close();
  }
});
