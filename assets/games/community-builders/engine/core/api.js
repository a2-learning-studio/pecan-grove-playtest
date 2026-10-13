import { showCallout, prefersFindCards } from "../callout.js";
import { annotateChoices } from "../choice-hints.js";
export default function createApi(ctx) {
  var API = {
    L: ctx.L,
    W: ctx.W,
    X: ctx.X,
    BASE: ctx.BASE,
    get REDUCED() {
      return !ctx.motionAllowed();
    },
    STOPS: ctx.STOPS,
    NB: ctx.NB,
    CHAP: ctx.CHAP,
    ANIMALS: ctx.ANIMALS,
    STAR_ON: ctx.STAR_ON,
    STAR_OFF: ctx.STAR_OFF,
    BASKET_ICON: ctx.BASKET_ICON,
    h: ctx.h,
    ico: ctx.ico,
    IC: ctx.IC,
    img: ctx.img,
    story: ctx.story,
    mono: ctx.mono,
    btn: ctx.btn,
    shuffle: ctx.shuffle,
    pick: ctx.pick,
    starsFor: ctx.starsFor,
    t2: ctx.t2,
    nm: ctx.nm,
    nmCap: ctx.nmCap,
    nbById: ctx.nbById,
    stopById: ctx.stopById,
    clear: ctx.clear,
    setAuthoredMarkup: ctx.setAuthoredMarkup,
    say: ctx.say,
    setTitle: ctx.setTitle,
    screen: ctx.screen,
    stopHud: ctx.stopHud,
    coach: ctx.coach,
    fb: ctx.fb,
    frame: ctx.frame,
    dialog: ctx.dialog,
    crop: ctx.crop,
    animalFace: ctx.animalFace,
    rec: function (id) {
      return ctx.restoring && id === ctx.feedbackStop
        ? ctx.restoringRecord
        : ctx.rec(id);
    },
    saveRound: ctx.saveRound,
    scoreCard: ctx.scoreCard,
    cardButtons: ctx.cardButtons,
    finishRound: ctx.finishRound,
    restart: function (id) {
      return function () {
        ctx.startStop(id);
      };
    },
    showMap: function (msg) {
      ctx.showMap(msg);
    },
    endPlay: function () {
      ctx.inStop = false;
    },
    team: function () {
      return ctx.team;
    },
    rng: ctx.rng,
    motionAllowed: ctx.motionAllowed,
    resolveAsset: ctx.resolveAsset,
    setController: function (controller) {
      ctx.activeController = controller || null;
    },
    isRestoring: function () {
      return ctx.restoring;
    },
  };
  function engineDelegate(area, method, args) {
    var engine = ctx.window.PecanGroveEngine,
      target = engine && engine[area];
    if (target && typeof target[method] === "function")
      return target[method].apply(target, args);
  }
  API.t = function (key, params, namespace) {
    return ctx.window.CBLocale.t(namespace || "core", ctx.L, key, params);
  };
  API.hints = function (items) {
    var engine = ctx.window.PecanGroveEngine;
    if (engine && engine.hints) engine.hints(items);
  };
  API.hud = {
    set: function (value) {
      engineDelegate("hud", "set", [value]);
    },
  };
  API.badge = {
    unlock: function (id) {
      return engineDelegate("badge", "unlock", [id]) || false;
    },
  };
  API.fx = {};
  ["burst", "stamp", "pulse", "nudge"].forEach(function (name) {
    API.fx[name] = function () {
      return engineDelegate("fx", name, arguments);
    };
  });
  API.motion = {
    allowed: ctx.motionAllowed,
    duration: function (ms) {
      return ctx.motionAllowed() ? Number(ms) || 0 : 0;
    },
  };
  API.input = {
    on: function (action, handler, options) {
      var off =
        engineDelegate("input", "on", [action, handler, options]) ||
        function () {};
      if (ctx.activeLifecycle && ctx.activeLifecycle.cleanup)
        ctx.activeLifecycle.cleanup(off);
      return off;
    },
    off: function (action, handler) {
      return engineDelegate("input", "off", [action, handler]);
    },
  };
  API.choices = function (element) {
    if (!element?.setAttribute) return element;
    element.setAttribute("data-cb-choices", "");
    annotateChoices(element);
    return element;
  };
  API.nav = {
    group: function (element, options) {
      if (!element?.setAttribute) return element;
      options = options || {};
      element.setAttribute("data-cb-nav-group", options.axis || "row");
      element.setAttribute("data-cb-nav-wrap", String(options.wrap !== false));
      var entry =
        typeof options.entry === "string"
          ? element.querySelector(options.entry)
          : options.entry;
      if (!entry)
        entry = element.querySelector(
          "button:not(:disabled), a[href], [tabindex='0']",
        );
      if (entry && element.contains(entry))
        entry.setAttribute("data-cb-nav-entry", "");
      return element;
    },
    push: function (scope, opener) {
      return engineDelegate("focus", "push", [scope, opener]);
    },
    pop: function (scope) {
      return engineDelegate("focus", "pop", [scope]);
    },
  };
  API.art = function (name, options) {
    options = options || {};
    return options.crop
      ? ctx.crop(options.crop, options.className)
      : ctx.img(
          name,
          options.alt || "",
          options.className,
          options.priority === "high",
        );
  };
  API.save = function () {
    ctx.emit("cb:step", { snapshot: ctx.snapshot() });
  };
  API.prefersFindCards = function () {
    return prefersFindCards(ctx);
  };
  API.callout = function (anchor, content, options) {
    return showCallout(ctx, anchor, content, options);
  };
  ctx.window.CommunityBuilders = {
    clear: ctx.clear,
    setAuthoredMarkup: ctx.setAuthoredMarkup,
    getAPI: function () {
      return API;
    },
    defineStop: function (factory) {
      var lifecycle = ctx.createLifecycle(true),
        definition = factory(lifecycle);
      lifecycle.dispose();
      if (definition) {
        ctx.window.CommunityBuilders.register(definition);
        ctx.REG[definition.id].factory = factory;
      }
    },
    getState: function () {
      return {
        mode: ctx.mode,
        stopId: ctx.feedbackStop || null,
        inStop: ctx.inStop,
        quiet: !ctx.vOn,
        settings: ctx.CFG,
        store: ctx.store,
        session: ctx.feedbackSession,
        storageKey: ctx.KEY,
        resumePending: !!ctx.resumeRecord,
        paused: ctx.gamePaused,
      };
    },
    snapshot: ctx.snapshot,
    resume: ctx.resume,
    pause: ctx.pausePlay,
    resumePlay: ctx.resumePlay,
    startStop: ctx.startStop,
    showMap: ctx.showMap,
    showTitle: ctx.showTitle,
    openSettings: ctx.openSettings,
    motionAllowed: ctx.motionAllowed,
    updateSettings: function (patch) {
      Object.keys(patch || {}).forEach(function (key) {
        if (key !== "__proto__" && key !== "constructor")
          ctx.CFG[key] = patch[key];
      });
      ctx.cfgSave();
      ctx.applyCalm();
      ctx.setVoice(ctx.CFG.voice, false);
      ctx.setCap(ctx.CFG.cap, false);
      if (ctx.vAudio) {
        ctx.vAudio.playbackRate = ctx.CFG.rate;
        ctx.vAudio.volume = ctx.CFG.vol;
      }
      if (ctx.window.PecanGroveEngine && ctx.window.PecanGroveEngine.audio)
        ctx.window.PecanGroveEngine.audio.apply();
    },
    performAction: function (action) {
      action =
        {
          "voice.toggle": "voice",
          "voice.replay": "replay",
          "voice.stop": "stopVoice",
          "captions.toggle": "captions",
          "fullscreen.toggle": "fullscreen",
          help: "settings",
        }[action] || action;
      if (action === "voice") ctx.setVoice(!ctx.vOn, true);
      else if (action === "replay") ctx.replayNow();
      else if (action === "stopVoice") ctx.vStop();
      else if (action === "captions") ctx.setCap(!ctx.CFG.cap, true);
      else if (action === "fullscreen") ctx.toggleFS();
      else if (action === "settings") ctx.openSettings(null);
      else if (action === "voice.sample" && ctx.vOn && !ctx.vSuspended) {
        ctx.vLoad();
        ctx.vPlay(
          { f: ctx.L + "/g-intro.mp3", k: "sample" },
          ctx.root.querySelector("dialog[open] p") ||
            ctx.main.querySelector("p"),
        );
      }
    },
    setLanguage: function (lang) {
      if ((lang !== "en" && lang !== "es") || lang === ctx.L)
        return Promise.resolve(false);
      var alternate = ctx.document.querySelector('a[hreflang="' + lang + '"]');
      var path = alternate && alternate.getAttribute("href");
      return ctx.changeLanguage(
        lang,
        path ? new ctx.URL(path, ctx.location.href) : null,
      );
    },
    enterPlay: function (options) {
      ctx.playRequested = true;
      ctx.acted = true;
      ctx.root.removeAttribute("data-playtest-paused");
      ctx.suspendVoice(false);
      if (options && options.quiet) ctx.setVoice(false, false);
      if (!ctx.booted) ctx.boot();
      else ctx.showTitle();
      ctx.vLoad();
      ctx.vScan([ctx.main]);
      var heading = ctx.main.querySelector("h2");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      }
    },
    pauseVoice: function () {
      ctx.vStop();
      ctx.vInkClear();
    },
    suspendVoice: ctx.suspendVoice,
    openLibraryMode: ctx.openLibraryMode,
    openGrownups: ctx.openGrownups,
    register: function (def) {
      if (
        !def ||
        !def.id ||
        !ctx.stopById(def.id) ||
        typeof def.run !== "function"
      )
        return;
      ctx.REG[def.id] = {
        steps: def.steps || [null, null, null],
        run: def.run,
        css: def.css,
        snapshot: def.snapshot,
        restore: def.restore,
        onPause: def.onPause,
        onResume: def.onResume,
      };
      ctx.PLAYABLE[def.id] = 1;
      if (ctx.booted && ctx.mode === "map" && !ctx.inStop) ctx.showMap();
    },
  };
  ctx.publish({ engineDelegate });
  ctx.bind({ API: [() => API, (value) => (API = value)] });
}
