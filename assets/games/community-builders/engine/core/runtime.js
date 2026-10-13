import { transitionScene } from "../transitions.js";
export default function createRuntime(ctx) {
  function startStop(id) {
    var fromMap = ctx.mode === "map" && !ctx.restoring;
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
      return fromMap
        ? transitionScene(
            ctx,
            function () {
              runModule(id);
            },
            "stop",
          )
        : (runModule(id), Promise.resolve());
    }
    if (!ctx.stopById(id)) return Promise.resolve(false);
    ctx.mode = "stop";
    ctx.inStop = true;
    var loading = ctx.loadingTask(function () {
      startStop(id);
    });
    return Promise.resolve(ctx.manifestReady)
      .then(function () {
        loading.set("manifest", 1);
        var descriptor = ctx.moduleManifest[id];
        if (!descriptor) throw new Error("stop_unavailable");
        var bank = ctx.window.CBLocale.load
          ? ctx.window.CBLocale.load(
              "stop-" + String(descriptor.n).padStart(2, "0"),
            )
          : Promise.resolve();
        return bank.then(function () {
          return ctx.loadStop(descriptor, function (value) {
            loading.set("module", value);
          });
        });
      })
      .then(
        function () {
          var render = function () {
            if (ctx.feedbackStop === id && ctx.mode === "stop") runModule(id);
          };
          return (
            fromMap
              ? transitionScene(ctx, render, "stop")
              : (render(), Promise.resolve())
          )
            .then(function () {
              return Promise.all([
                loading.art(ctx.main),
                Promise.resolve(ctx.vOn ? ctx.vLoad(true) : true).then(
                  function (ready) {
                    if (ready === false) throw new Error("voice_unavailable");
                    loading.set("voice", 1);
                  },
                ),
              ]);
            })
            .then(function () {
              loading.finish();
              return true;
            });
        },
        function () {
          loading.finish();
          if (ctx.feedbackStop === id)
            ctx.screen([
              ctx.h("div", { class: "cb-board" }, [
                ctx.h("p", {
                  role: "status",
                  text: ctx.window.CBLocale.t("core", ctx.L, "bank.b0042"),
                }),
                ctx.btn(
                  ctx.window.CBLocale.t("core", ctx.L, "bank.b0043"),
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
      )
      .catch(function () {
        loading.fail();
        return false;
      });
  }
  var REG = {};
  function createLifecycle(definitionOnly) {
    var lifecycle = ctx.ownedLifecycle({
      root: ctx.root,
      document: ctx.document,
      window: ctx.window,
      definitionOnly: definitionOnly,
      isRestoring: function () {
        return ctx.restoring;
      },
      isReplaying: function () {
        return !!ctx.replayingActions;
      },
      replayClock: function () {
        return ctx.replayClock;
      },
    });
    if (ctx.gamePaused) lifecycle.pause();
    return lifecycle;
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
