export default function createRuntime(ctx) {
  function startStop(id) {
    if (ctx.activeLifecycle) {
      ctx.activeLifecycle.dispose();
      ctx.activeLifecycle = null;
    }
    ctx.actionHistory = [];
    ctx.roundRecord = ctx.restoring
      ? ctx.restoringRecord
      : JSON.parse(JSON.stringify(ctx.rec(id) || null));
    ctx.lastResultInfo = ctx.restoring ? ctx.restoringResultInfo : null;
    ctx.activeController = null;
    ctx.roundSeed = ctx.rngState;
    ctx.feedbackStop = id;
    ctx.feedbackScore = null;
    if (REG[id]) {
      runModule(id);
      return Promise.resolve();
    }
    var descriptor = ctx.moduleManifest[id];
    if (!descriptor) return Promise.resolve(false);
    ctx.mode = "stop";
    ctx.inStop = true;
    ctx.screen([
      ctx.h(
        "div",
        { class: "cb-board cb-loading", role: "status", "aria-live": "polite" },
        [
          ctx.h("h2", {
            text:
              ctx.L === "es"
                ? "Preparando tu parada…"
                : "Getting your stop ready…",
          }),
        ],
      ),
    ]);
    return ctx.loadStop(descriptor).then(
      function () {
        if (ctx.feedbackStop === id && ctx.mode === "stop") runModule(id);
        return true;
      },
      function () {
        if (ctx.feedbackStop === id)
          ctx.screen([
            ctx.h("div", { class: "cb-board" }, [
              ctx.h("p", {
                role: "status",
                text:
                  ctx.L === "es"
                    ? "No se pudo cargar esta parada. Revisa la conexión e inténtalo de nuevo."
                    : "This stop could not load. Check the connection and try again.",
              }),
              ctx.btn(
                ctx.L === "es" ? "Intentar de nuevo" : "Try again",
                "cb-btn--go",
                function () {
                  startStop(id);
                },
              ),
              ctx.btn(ctx.W.back, "", ctx.showMap),
            ]),
          ]);
        return false;
      },
    );
  }
  var REG = {};
  function createLifecycle(definitionOnly) {
    return ctx.ownedLifecycle({
      root: ctx.root,
      document: ctx.document,
      window: ctx.window,
      definitionOnly: definitionOnly,
      isRestoring: function () {
        return ctx.restoring;
      },
      replayClock: function () {
        return ctx.replayClock;
      },
    });
  }
  function stopById(id) {
    return (
      ctx.STOPS.filter(function (s) {
        return s.id === id;
      })[0] || null
    );
  }
  function runModule(id) {
    ctx.feedbackStop = id;
    ctx.feedbackScore = null;
    var def = REG[id],
      stop = stopById(id);
    ctx.inStop = true;
    ctx.mode = "stop";
    ctx.setTitle(stop.name);
    try {
      if (def.factory) {
        ctx.activeLifecycle = createLifecycle(false);
        var fresh = def.factory(ctx.activeLifecycle);
        fresh.run(ctx.API, stop);
        if (!ctx.activeController && fresh.snapshot && fresh.restore)
          ctx.activeController = fresh;
      } else {
        ctx.activeLifecycle = createLifecycle(false);
        def.run(ctx.API, stop);
        if (!ctx.activeController && def.snapshot && def.restore)
          ctx.activeController = def;
      }
    } catch (e) {
      ctx.inStop = false;
      ctx.showMap(ctx.W.moreSoon);
      if (ctx.window.console) console.error("Stop " + id + " failed", e);
    }
  }
  ctx.publish({ startStop, createLifecycle, stopById, runModule });
  ctx.bind({ REG: [() => REG, (value) => (REG = value)] });
}
