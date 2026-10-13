export default function createLoading(ctx) {
  var booted = false,
    playRequested = false;
  var moduleManifest = {},
    moduleLoads = {},
    manifestReady;
  ctx.PLAYABLE = {};
  function boot() {
    if (booted) return;
    booted = true;
    ctx.showTitle();
  }
  function loadManifest() {
    return ctx.window
      .fetch(ctx.resolveAsset(ctx.BASE + "stops/manifest.json"), {
        credentials: "same-origin",
      })
      .then(function (response) {
        if (!response.ok) throw new Error("manifest_unavailable");
        return response.json();
      })
      .then(function (items) {
        if (!Array.isArray(items) || items.length !== ctx.STOPS.length)
          throw new Error("manifest_invalid");
        var seen = {},
          nextManifest = {},
          playable = {};
        items.forEach(function (item) {
          var stop = item && ctx.stopById(item.id);
          if (
            !stop ||
            seen[item.id] ||
            Number(item.n) !== stop.n ||
            !/^\d\d-[a-z-]+\.js$/.test(item.file) ||
            item.css !== item.file.replace(/\.js$/, ".css") ||
            !Array.isArray(item.steps) ||
            !item.steps.length
          )
            throw new Error("manifest_invalid");
          seen[item.id] = true;
          nextManifest[item.id] = {
            id: item.id,
            n: stop.n,
            file: item.file,
            css: item.css,
            steps: item.steps.slice(),
          };
          playable[item.id] = 1;
        });
        moduleManifest = nextManifest;
        ctx.PLAYABLE = playable;
        if (ctx.mode === "map") ctx.showMap();
        return moduleManifest;
      });
  }
  function loadStop(descriptor, progress) {
    if (ctx.REG[descriptor.id]) {
      if (progress) progress(1);
      return Promise.resolve();
    }
    if (moduleLoads[descriptor.id]) return moduleLoads[descriptor.id];
    moduleLoads[descriptor.id] = new Promise(function (resolve, reject) {
      var pending = 2,
        failed = false;
      function done() {
        if (failed) return;
        pending--;
        if (progress) progress((2 - pending) / 2);
        if (!pending) {
          if (ctx.REG[descriptor.id]) resolve();
          else fail();
        }
      }
      function fail() {
        if (failed) return;
        failed = true;
        delete moduleLoads[descriptor.id];
        css.remove();
        script.remove();
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
  function startResources() {
    var loading = ctx.loadingTask(startResources);
    loading.set("module", 1);
    manifestReady = loadManifest();
    var voice = ctx.vOn ? ctx.vLoad(true) : Promise.resolve(true);
    Promise.all([
      manifestReady.then(function () {
        loading.set("manifest", 1);
      }),
      loading.art(ctx.main),
      Promise.resolve(voice).then(function (ready) {
        if (ready === false) throw new Error("voice_unavailable");
        loading.set("voice", 1);
      }),
    ]).then(loading.finish, loading.fail);
  }
  ctx.publish({ boot, loadManifest, loadStop, startResources });
  ctx.bind({
    booted: [() => booted, (value) => (booted = value)],
    playRequested: [() => playRequested, (value) => (playRequested = value)],
    moduleManifest: [() => moduleManifest, (value) => (moduleManifest = value)],
    moduleLoads: [() => moduleLoads, (value) => (moduleLoads = value)],
    manifestReady: [() => manifestReady, (value) => (manifestReady = value)],
  });
  boot();
  startResources();
}
