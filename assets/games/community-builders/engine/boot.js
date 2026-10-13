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
import { clear, setAuthoredMarkup } from "./authored-markup.js";
import { createLifecycle as ownedLifecycle } from "./lifecycle.js";
import { trustedScriptURL } from "./assets.js";
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
  ctx.location =
    typeof window.location === "function" &&
    !["Audio", "MutationObserver", "Event", "URL", "URLSearchParams"].includes(
      "location",
    )
      ? window.location.bind(window)
      : window.location;
  ctx.localStorage =
    typeof window.localStorage === "function" &&
    !["Audio", "MutationObserver", "Event", "URL", "URLSearchParams"].includes(
      "localStorage",
    )
      ? window.localStorage.bind(window)
      : window.localStorage;
  ctx.sessionStorage =
    typeof window.sessionStorage === "function" &&
    !["Audio", "MutationObserver", "Event", "URL", "URLSearchParams"].includes(
      "sessionStorage",
    )
      ? window.sessionStorage.bind(window)
      : window.sessionStorage;
  ctx.MutationObserver =
    typeof window.MutationObserver === "function" &&
    !["Audio", "MutationObserver", "Event", "URL", "URLSearchParams"].includes(
      "MutationObserver",
    )
      ? window.MutationObserver.bind(window)
      : window.MutationObserver;
  ctx.requestAnimationFrame =
    typeof window.requestAnimationFrame === "function" &&
    !["Audio", "MutationObserver", "Event", "URL", "URLSearchParams"].includes(
      "requestAnimationFrame",
    )
      ? window.requestAnimationFrame.bind(window)
      : window.requestAnimationFrame;
  ctx.cancelAnimationFrame =
    typeof window.cancelAnimationFrame === "function" &&
    !["Audio", "MutationObserver", "Event", "URL", "URLSearchParams"].includes(
      "cancelAnimationFrame",
    )
      ? window.cancelAnimationFrame.bind(window)
      : window.cancelAnimationFrame;
  ctx.Audio =
    typeof window.Audio === "function" &&
    !["Audio", "MutationObserver", "Event", "URL", "URLSearchParams"].includes(
      "Audio",
    )
      ? window.Audio.bind(window)
      : window.Audio;
  ctx.getComputedStyle =
    typeof window.getComputedStyle === "function" &&
    !["Audio", "MutationObserver", "Event", "URL", "URLSearchParams"].includes(
      "getComputedStyle",
    )
      ? window.getComputedStyle.bind(window)
      : window.getComputedStyle;
  ctx.NodeFilter =
    typeof window.NodeFilter === "function" &&
    !["Audio", "MutationObserver", "Event", "URL", "URLSearchParams"].includes(
      "NodeFilter",
    )
      ? window.NodeFilter.bind(window)
      : window.NodeFilter;
  ctx.performance =
    typeof window.performance === "function" &&
    !["Audio", "MutationObserver", "Event", "URL", "URLSearchParams"].includes(
      "performance",
    )
      ? window.performance.bind(window)
      : window.performance;
  ctx.URLSearchParams =
    typeof window.URLSearchParams === "function" &&
    !["Audio", "MutationObserver", "Event", "URL", "URLSearchParams"].includes(
      "URLSearchParams",
    )
      ? window.URLSearchParams.bind(window)
      : window.URLSearchParams;
  ctx.URL =
    typeof window.URL === "function" &&
    !["Audio", "MutationObserver", "Event", "URL", "URLSearchParams"].includes(
      "URL",
    )
      ? window.URL.bind(window)
      : window.URL;
  ctx.Event =
    typeof window.Event === "function" &&
    !["Audio", "MutationObserver", "Event", "URL", "URLSearchParams"].includes(
      "Event",
    )
      ? window.Event.bind(window)
      : window.Event;
  ctx.setTimeout =
    typeof window.setTimeout === "function" &&
    !["Audio", "MutationObserver", "Event", "URL", "URLSearchParams"].includes(
      "setTimeout",
    )
      ? window.setTimeout.bind(window)
      : window.setTimeout;
  ctx.clearTimeout =
    typeof window.clearTimeout === "function" &&
    !["Audio", "MutationObserver", "Event", "URL", "URLSearchParams"].includes(
      "clearTimeout",
    )
      ? window.clearTimeout.bind(window)
      : window.clearTimeout;
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
  createLoading(ctx);
  return window.CommunityBuilders;
}
