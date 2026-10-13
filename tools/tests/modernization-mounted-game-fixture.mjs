import { readFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { createRequire } from "node:module";
// Import before installing a document: this fixture calls the real mount once.
import { mount } from "../../assets/games/community-builders/engine/main.js";
const require = createRequire(import.meta.url);
const { fullCore } = require("./modernization-gameplay-fixture.cjs");
const { expose } = require("./modernization-gameplay-flow.cjs");

export async function mountedGame(language = "en", saved = null) {
  const r = await fullCore(language, 42, true, saved, {
    reduced: true,
    transformStopSource(source, filename) {
      const n = Number(filename.slice(0, 2));
      return n === 1 || n === 2 ? expose(n, source) : source;
    },
  });
  const w = r.w;
  w.navigator.getGamepads = () => [];
  const globals = new Map();
  const timers = new Set();
  const originalSet = globalThis.setTimeout;
  const originalClear = globalThis.clearTimeout;
  const values = {
    window: w,
    document: w.document,
    navigator: w.navigator,
    localStorage: w.localStorage,
    CustomEvent: w.CustomEvent,
    Event: w.Event,
    Element: w.Element,
    HTMLElement: w.HTMLElement,
    MutationObserver: w.MutationObserver,
    getComputedStyle: w.getComputedStyle.bind(w),
    innerWidth: w.innerWidth,
    innerHeight: w.innerHeight,
    matchMedia: w.matchMedia,
    requestAnimationFrame: w.requestAnimationFrame.bind(w),
    cancelAnimationFrame: w.cancelAnimationFrame.bind(w),
    CommunityBuilders: r.core,
    PecanGroveEngine: undefined,
    setTimeout(callback, delay, ...args) {
      let id;
      id = originalSet(() => {
        timers.delete(id);
        callback(...args);
      }, delay);
      timers.add(id);
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
      originalClear(id);
    },
    async fetch(url) {
      const path = new URL(String(url), w.location.href).pathname;
      const locale = path.match(/\/engine\/locales\/(en|es)\.json$/);
      if (!locale) throw new Error("Unexpected mounted-engine request " + url);
      const file = new URL(
        "../../assets/games/community-builders/engine/locales/" +
          locale[1] +
          ".json",
        import.meta.url,
      );
      return { ok: true, json: async () => JSON.parse(await readFile(file)) };
    },
  };
  for (const [key, value] of Object.entries(values)) {
    globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  }
  function close() {
    w.PecanGroveEngine?.slotTransition.destroy();
    w.PecanGroveEngine?.tooltips.destroy();
    for (const timer of timers) originalClear(timer);
    timers.clear();
    r.close();
    for (const [key, descriptor] of globals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
  try {
    const engine = await mount(r.root);
    w.PecanGroveEngine = engine;
    const runtimeErrors = [];
    w.addEventListener("error", (event) => {
      runtimeErrors.push(event.error || event.message);
      event.preventDefault();
    });
    return {
      ...r,
      engine,
      runtimeErrors,
      close,
      persisted() {
        const key = r.core.getState().storageKey;
        return { key, value: w.localStorage.getItem(key) };
      },
      storedPlayer() {
        const { value } = this.persisted();
        const store = JSON.parse(value);
        return store.players[store.current];
      },
    };
  } catch (error) {
    close();
    throw error;
  }
}

export async function until(predicate, message, timeout = 2500) {
  const deadline = Date.now() + timeout;
  do {
    if (predicate()) return;
    await sleep(10);
  } while (Date.now() < deadline);
  throw new Error(message);
}
