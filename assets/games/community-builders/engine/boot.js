import createMapTools from "./core/map-tools.js";
import createLegacyInput from "./core/legacy-input.js";
import createBase from "./core/base.js";
import createWords from "./core/words.js";
import createData from "../data/catalog.js";
import createDom from "./core/dom.js";
import createStore from "./core/store.js";
import createScene from "./core/scene.js";
import createSettings from "./core/settings.js";
import createVoiceState from "./core/voice-state.js";
import createVoiceCues from "./core/voice-cues.js";
import createVoicePlay from "./core/voice-play.js";
import createVoiceScan from "./core/voice-scan.js";
import createDialog from "./core/dialog.js";
import createTitle from "./core/title.js";
import createMap from "./core/map.js";
import createLibrary from "./core/library.js";
import createScorecard from "./core/scorecard.js";
import createRuntime from "./core/runtime.js";
import createResume from "./core/resume.js";
import createApi from "./core/api.js";
import createLoading from "./core/loading.js";
import createLoadingView from "./core/loading-view.js";
import { clear, setAuthoredMarkup } from "./authored-markup.js";
import { createLifecycle as ownedLifecycle } from "./lifecycle.js";
import { trustedScriptURL } from "./assets.js";
import { storageArea } from "./dom.js";
export function bootGame(window) {
  if (!window.document.querySelector('[data-game="community-builders"]'))
    return null;
  const ctx = {
    window,
    document: window.document,
    clear,
    setAuthoredMarkup,
    ownedLifecycle,
    trustedScriptURL,
  };
  // Blocked site data gets a stand-in store, so play continues in memory (see dom.js).
  ctx.localStorage = storageArea("localStorage", window);
  ctx.sessionStorage = storageArea("sessionStorage", window);
  // Window functions are bound to the window. Constructors and NodeFilter stay
  // as they are: binding would discard static members such as SHOW_TEXT.
  for (const name of [
    "location",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "getComputedStyle",
    "performance",
    "setTimeout",
    "clearTimeout",
  ])
    ctx[name] =
      typeof window[name] === "function"
        ? window[name].bind(window)
        : window[name];
  for (const name of [
    "MutationObserver",
    "Audio",
    "NodeFilter",
    "URLSearchParams",
    "URL",
    "Event",
  ])
    ctx[name] = window[name];
  ctx.publish = (values) => Object.assign(ctx, values);
  ctx.bind = (fields) => {
    for (const [name, [get, set]] of Object.entries(fields))
      Object.defineProperty(ctx, name, { get, set, configurable: true });
  };
  createBase(ctx);
  createWords(ctx);
  createData(ctx);
  createDom(ctx);
  createStore(ctx);
  createScene(ctx);
  createSettings(ctx);
  createVoiceState(ctx);
  createVoiceCues(ctx);
  createVoicePlay(ctx);
  createVoiceScan(ctx);
  createLegacyInput(ctx);
  createDialog(ctx);
  createTitle(ctx);
  createMapTools(ctx);
  createMap(ctx);
  createLibrary(ctx);
  createScorecard(ctx);
  createRuntime(ctx);
  createResume(ctx);
  createApi(ctx);
  createLoadingView(ctx);
  createLoading(ctx);
  return window.CommunityBuilders;
}
