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
    let centred = null;
    r.ctx.window.HTMLElement.prototype.scrollIntoView = function (options) {
      centred = [this.textContent, options.block];
    };
    load.fail();
    assert.match(r.root.textContent, /Something didn't load/);
    assert.equal(attempts, 0);
    // PG-UX-C13: wherever the map was scrolled, Try again comes into view and
    // takes focus, with the message above it.
    const again = r.root.querySelector(".cb-loading-overlay button");
    assert.equal(r.ctx.document.activeElement, again);
    assert.deepEqual(centred, [again.textContent, "center"]);
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

test("deferred portraits cannot block critical scene art, including portraits added during a render", async () => {
  const r = fixture();
  try {
    let finishDecode,
      deferredDecodes = 0;
    const eager = r.ctx.h("img", { loading: "eager" });
    eager.decode = () => new Promise((resolve) => (finishDecode = resolve));
    const deferred = () => {
      const image = r.ctx.h("img", { loading: "lazy" });
      image.decode = () => {
        deferredDecodes++;
        return Promise.reject(new Error("Deferred request has not started"));
      };
      return image;
    };
    r.root.append(eager, deferred());
    const load = r.ctx.loadingTask(() => {});
    r.advance(300);
    const ready = load.art(r.root);
    r.root.append(deferred());
    assert.equal(r.root.querySelector("progress").value, 0);
    finishDecode();
    await ready;
    assert.equal(deferredDecodes, 0);
    assert.equal(r.root.querySelector("progress").value, 35);
    load.finish();
  } finally {
    r.close();
  }
});

test("pending eager artwork waits for load before decode, and an unchanged broken request still fails", async () => {
  const r = fixture();
  try {
    let width = 0,
      complete = false,
      decodes = 0;
    const image = r.ctx.h("img", { loading: "eager", src: "/map.avif" });
    Object.defineProperties(image, {
      complete: { get: () => complete },
      naturalWidth: { get: () => width },
    });
    image.decode = () => {
      decodes++;
      return complete
        ? Promise.resolve()
        : Promise.reject(new Error("Request has not completed"));
    };
    r.root.append(image);
    const load = r.ctx.loadingTask(() => {});
    r.advance(300);
    const ready = load.art(r.root);
    await Promise.resolve();
    assert.equal(decodes, 0);
    assert.equal(r.root.querySelector("progress").value, 0);
    complete = true;
    width = 960;
    image.dispatchEvent(new r.ctx.window.Event("load"));
    await ready;
    assert.equal(decodes, 1);
    assert.equal(r.root.querySelector("progress").value, 35);
    complete = false;
    width = 0;
    const failed = assert.rejects(load.art(r.root), /Image failed to load/);
    image.dispatchEvent(new r.ctx.window.Event("error"));
    await failed;
    load.fail();
    assert.match(r.root.textContent, /Something didn't load/);
    load.finish();
  } finally {
    r.close();
  }
});

test("a changed responsive source waits for its load and decode before contributing art progress", async () => {
  const r = fixture();
  try {
    const image = r.ctx.h("img");
    let source = "/map-960.avif",
      complete = true,
      width = 960,
      attempts = 0,
      abort,
      finishDecode;
    Object.defineProperties(image, {
      currentSrc: { get: () => source },
      complete: { get: () => complete },
      naturalWidth: { get: () => width },
    });
    image.decode = () => {
      attempts++;
      return new Promise((resolve, reject) => {
        if (attempts === 1) abort = reject;
        else finishDecode = resolve;
      });
    };
    r.root.append(image);
    const load = r.ctx.loadingTask(() => {});
    r.advance(300);
    const ready = load.art(r.root);
    source = "/map-2048.avif";
    complete = false;
    width = 0;
    abort(new Error("The source changed during decoding"));
    await Promise.resolve();
    assert.equal(attempts, 1, "the pending replacement is not decoded early");
    assert.equal(r.root.querySelector("progress").value, 0);
    complete = true;
    width = 2048;
    image.dispatchEvent(new r.ctx.window.Event("load"));
    await Promise.resolve();
    assert.equal(attempts, 2);
    assert.equal(r.root.querySelector("progress").value, 0);
    finishDecode();
    await ready;
    assert.equal(r.root.querySelector("progress").value, 35);
    load.finish();
  } finally {
    r.close();
  }
});

test("an unchanged request that finishes without usable pixels still fails with an explicit Retry", async () => {
  const r = fixture();
  try {
    const image = r.ctx.h("img");
    let complete = false;
    Object.defineProperties(image, {
      currentSrc: { value: "/broken.avif" },
      complete: { get: () => complete },
      naturalWidth: { value: 0 },
    });
    image.decode = () => Promise.reject(new Error("Invalid image data"));
    r.root.append(image);
    const load = r.ctx.loadingTask(() => {});
    const failed = assert.rejects(load.art(r.root), /Image failed to load/);
    complete = true;
    image.dispatchEvent(new r.ctx.window.Event("load"));
    await failed;
    load.fail();
    assert.match(r.root.textContent, /Something didn't load/);
    assert.ok(r.root.querySelector("button"));
    load.finish();
  } finally {
    r.close();
  }
});

for (const changedElement of ["img", "source"])
  test(`${changedElement} sizes changes can recover while currentSrc still reports the old selection`, async () => {
    const r = fixture();
    try {
      const image = r.ctx.h("img"),
        picture = r.ctx.h("picture"),
        source = r.ctx.h("source");
      source.setAttribute("type", "image/avif");
      source.setAttribute("srcset", "/map-960.avif 960w, /map-2048.avif 2048w");
      const changed = changedElement === "img" ? image : source;
      changed.setAttribute("sizes", "900px");
      let width = 960,
        abort,
        attempts = 0;
      Object.defineProperties(image, {
        currentSrc: { value: "/map-960.avif" },
        complete: { get: () => width > 0 },
        naturalWidth: { get: () => width },
      });
      image.decode = () => {
        attempts++;
        return attempts === 1
          ? new Promise((resolve, reject) => (abort = reject))
          : Promise.resolve();
      };
      picture.append(source, image);
      r.root.append(picture);
      const load = r.ctx.loadingTask(() => {});
      r.advance(300);
      const ready = load.art(r.root);
      changed.setAttribute("sizes", "1849px");
      width = 0;
      abort(
        new Error("Responsive selection changed before currentSrc updated"),
      );
      await Promise.resolve();
      assert.equal(image.currentSrc, "/map-960.avif");
      assert.equal(r.root.querySelector("progress").value, 0);
      width = 2048;
      image.dispatchEvent(new r.ctx.window.Event("load"));
      await ready;
      assert.equal(attempts, 2);
      assert.equal(r.root.querySelector("progress").value, 35);
      load.finish();
    } finally {
      r.close();
    }
  });

test("pending critical requests remain bounded and are cancelled when their loading task is replaced", async () => {
  const r = fixture();
  try {
    const image = r.ctx.h("img");
    let source = "/map-960.avif";
    Object.defineProperties(image, {
      currentSrc: { get: () => source },
      complete: { value: false },
      naturalWidth: { value: 0 },
    });
    image.decode = () => {
      source = source === "/map-960.avif" ? "/map-2048.avif" : "/map-960.avif";
      return Promise.reject(new Error("Responsive decode interrupted"));
    };
    r.root.append(image);
    const first = r.ctx.loadingTask(() => {});
    const failed = assert.rejects(first.art(r.root), /Image failed to load/);
    await Promise.resolve();
    r.advance(15000);
    await failed;
    first.finish();
    const previous = r.ctx.loadingTask(() => {});
    const cancelled = previous.art(r.root);
    await Promise.resolve();
    const current = r.ctx.loadingTask(() => {});
    await cancelled;
    image.dispatchEvent(new r.ctx.window.Event("error"));
    r.advance(15000);
    assert.equal(r.root.querySelectorAll("progress").length, 1);
    current.finish();
  } finally {
    r.close();
  }
});
