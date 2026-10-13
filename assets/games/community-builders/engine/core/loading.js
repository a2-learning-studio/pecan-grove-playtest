export default function createLoading(ctx) {
  var booted = false,
    playRequested = false;
  function boot() {
    if (booted) return;
    booted = true;
    var played = Object.keys(ctx.store.players).some(function (k) {
      return Object.keys(ctx.store.players[k].stops || {}).length;
    });
    if (played || playRequested) ctx.showMap();
    else ctx.showTitle();
  }
  var moduleManifest = {},
    moduleLoads = {};
  ctx.STOPS.forEach(function (stop) {
    var stem = (stop.n < 10 ? "0" : "") + stop.n + "-" + stop.id;
    moduleManifest[stop.id] = {
      id: stop.id,
      n: stop.n,
      file: stem + ".js",
      css: stem + ".css",
    };
    ctx.PLAYABLE[stop.id] = 1;
  });
  (ctx.window.CB_STOP_MANIFEST || []).forEach(function (item) {
    if (item && ctx.stopById(item.id)) moduleManifest[item.id] = item;
  });
  function loadStop(descriptor) {
    if (ctx.REG[descriptor.id]) return Promise.resolve();
    if (moduleLoads[descriptor.id]) return moduleLoads[descriptor.id];
    moduleLoads[descriptor.id] = new Promise(function (resolve, reject) {
      var pending = 2,
        failed = false;
      function done() {
        if (!failed && --pending === 0) {
          if (ctx.REG[descriptor.id]) resolve();
          else fail();
        }
      }
      function fail() {
        if (failed) return;
        failed = true;
        delete moduleLoads[descriptor.id];
        reject(new Error("stop_unavailable"));
      }
      var css = ctx.h("link", {
        rel: "stylesheet",
        href: ctx.resolveAsset(ctx.BASE + "stops/" + descriptor.css),
      });
      css.onload = done;
      css.onerror = fail;
      var script = ctx.h("script", {
        src: ctx.resolveAsset(ctx.BASE + "stops/" + descriptor.file),
      });
      script.onload = done;
      script.onerror = fail;
      ctx.document.head.appendChild(css);
      ctx.document.head.appendChild(script);
    });
    return moduleLoads[descriptor.id];
  }
  function loadModules(list) {
    list.forEach(function (m) {
      var number = parseInt(m.slice(0, 2), 10),
        stop = ctx.STOPS[number - 1];
      if (!stop) return;
      moduleManifest[stop.id] = {
        id: stop.id,
        n: number,
        file: m + ".js",
        css: m + ".css",
      };
      ctx.PLAYABLE[stop.id] = 1;
    });
    boot();
  }
  var extra = [];
  try {
    new ctx.URLSearchParams(ctx.location.search)
      .getAll("cbstop")
      .forEach(function (m) {
        if (/^\d\d-[a-z-]+$/.test(m)) extra.push(m);
      });
  } catch (e) {
    /* old browser */
  }
  var man = ctx.h("script", {
    src: ctx.resolveAsset(ctx.BASE + "stops/manifest.js"),
  });
  man.onload = function () {
    var list = (ctx.window.CB_STOP_MODULES || []).filter(function (m) {
      return /^\d\d-[a-z-]+$/.test(m);
    });
    extra.forEach(function (m) {
      if (list.indexOf(m) < 0) list.push(m);
    });
    loadModules(list);
  };
  man.onerror = function () {
    loadModules(extra);
  };
  ctx.document.head.appendChild(man);
  ctx.setTimeout(function () {
    if (!booted) loadModules(extra);
  }, 2500);
  ctx.publish({ boot, loadStop, loadModules });
  ctx.bind({
    booted: [() => booted, (value) => (booted = value)],
    playRequested: [() => playRequested, (value) => (playRequested = value)],
    moduleManifest: [() => moduleManifest, (value) => (moduleManifest = value)],
    moduleLoads: [() => moduleLoads, (value) => (moduleLoads = value)],
    extra: [() => extra, (value) => (extra = value)],
    man: [() => man, (value) => (man = value)],
  });
}
