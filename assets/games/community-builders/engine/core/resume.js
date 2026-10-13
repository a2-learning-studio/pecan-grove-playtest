export default function createResume(ctx) {
  function snapshot() {
    var focused = ctx.document.activeElement;
    return {
      v: 1,
      mode: ctx.mode,
      stopId: ctx.feedbackStop || null,
      slot: ctx.store.current || "you",
      session: ctx.feedbackSession,
      ts: Date.now(),
      rng: ctx.rngState >>> 0,
      roundSeed: ctx.roundSeed >>> 0,
      screenKey: ctx.mode,
      roundRecord: ctx.roundRecord,
      resultInfo: ctx.lastResultInfo,
      voice: ctx.voiceSnapshot(),
      focusId:
        focused && focused.getAttribute
          ? focused.getAttribute("data-cb-id")
          : null,
      state:
        ctx.activeController && ctx.activeController.snapshot
          ? ctx.activeController.snapshot()
          : { adapter: "actions-v1", actions: ctx.actionHistory.slice() },
    };
  }
  function replayActions(actions) {
    actions = Array.isArray(actions) ? actions.slice(0, 1000) : [];
    return new Promise(function (resolve, reject) {
      var index = 0,
        waitingSince = Date.now();
      function next() {
        if (index >= actions.length) {
          ctx.actionHistory = actions.slice();
          resolve();
          return;
        }
        if (actions[index].type === "dialog-close") {
          var dialog = ctx.root.querySelector("dialog[open]");
          if (dialog) dialog.close();
          index++;
          waitingSince = Date.now();
          ctx.setTimeout(next, 0);
          return;
        }
        var action = actions[index],
          scope = action.dialog
            ? ctx.root.querySelector("dialog[open]")
            : ctx.main;
        var target =
          scope && action.key
            ? scope.querySelector(
                '[data-cb-id="' +
                  String(action.key).replace(/[^A-Za-z0-9_-]/g, "") +
                  '"]',
              )
            : null;
        if (!target && scope)
          target = [].slice
            .call(scope.querySelectorAll("button, input, select, textarea"))
            .filter(function (node) {
              return (
                node.tagName === action.tag &&
                String(node.className || "") === action.className
              );
            })[action.index];
        if (!target || target.disabled) {
          if (Date.now() - waitingSince < 2000) {
            ctx.setTimeout(next, 16);
            return;
          }
          reject(new Error("resume_target_missing"));
          return;
        }
        ctx.replayClock += 1000;
        if (action.type === "click") target.click();
        else {
          if (action.value !== undefined) target.value = action.value;
          target.checked = action.checked;
          target.dispatchEvent(new ctx.Event(action.type, { bubbles: true }));
        }
        index++;
        waitingSince = Date.now();
        ctx.setTimeout(next, 0);
      }
      next();
    });
  }
  function resume(record) {
    if (!record || record.v !== 1 || record.session !== ctx.feedbackSession)
      return Promise.resolve(false);
    if (record.slot && ctx.store.players[record.slot])
      ctx.store.current = record.slot;
    if (record.mode === "title") {
      ctx.showTitle();
      return Promise.resolve(true);
    }
    if (record.mode !== "stop" || !ctx.stopById(record.stopId)) {
      ctx.showMap();
      return Promise.resolve(true);
    }
    ctx.restoring = true;
    ctx.replayingActions = !!(
      record.state && record.state.adapter === "actions-v1"
    );
    [].slice
      .call(
        ctx.root.querySelectorAll("dialog.cb-dlg[open]:not([data-cb-utility])"),
      )
      .forEach(function (dialog) {
        if (dialog.dispose) dialog.dispose();
        else dialog.close();
      });
    ctx.restoringRecord = record.roundRecord || null;
    ctx.restoringResultInfo = record.resultInfo || null;
    ctx.replayClock = Date.now();
    ctx.rngState = Number(record.roundSeed) >>> 0;
    return Promise.resolve(ctx.startStop(record.stopId))
      .then(function (loaded) {
        if (loaded === false) return false;
        var restored =
          record.state && record.state.adapter === "actions-v1"
            ? replayActions(record.state.actions)
            : ctx.activeController &&
                ctx.activeController.restore &&
                record.state
              ? ctx.activeController.restore(record.state)
              : null;
        return Promise.resolve(restored).then(function () {
          ctx.rngState = Number(record.rng) >>> 0;
          ctx.pendingVoice = record.voice || null;
          ctx.vScan(
            [ctx.main].concat(
              [].slice.call(ctx.root.querySelectorAll("dialog[open]")),
            ),
          );
          if (record.focusId) {
            var target = ctx.main.querySelector(
              '[data-cb-id="' +
                String(record.focusId).replace(/[^A-Za-z0-9_-]/g, "") +
                '"]',
            );
            if (target) target.focus({ preventScroll: true });
          }
          return true;
        });
      })
      .finally(function () {
        ctx.restoring = false;
        ctx.replayingActions = false;
        ctx.progressEvent();
      });
  }
  function changeLanguage(language, url) {
    if ((language !== "en" && language !== "es") || language === ctx.L)
      return Promise.resolve(false);
    var record = snapshot(),
      previous = ctx.L;
    ctx.document.dispatchEvent(new ctx.window.CustomEvent("pt:feedback-flush"));
    ctx.vStop();
    [].slice
      .call(ctx.root.querySelectorAll("dialog[open]"))
      .forEach(function (dialog) {
        dialog.close();
      });
    ctx.L = language;
    ctx.W = ctx.CORE_WORDS[ctx.L];
    ctx.X = ctx.CORE_EXTRA[ctx.L];
    ctx.API.L = ctx.L;
    ctx.API.W = ctx.W;
    ctx.API.X = ctx.X;
    ctx.STOPS.forEach(function (stop) {
      stop.name = stop.names[ctx.L];
    });
    ctx.document.documentElement.lang = ctx.L;
    ctx.foot.textContent = ctx.W.footer;
    ctx.vIdx = (ctx.window.CB_VOICE && ctx.window.CB_VOICE[ctx.L]) || null;
    ctx.vKeys = null;
    ctx.vHeard = {};
    ctx.vLoading = false;
    var file = language === "es" ? "espanol.html" : "index.html";
    var next = url;
    try {
      next = new ctx.URL(file, ctx.location.href);
      next.search = ctx.location.search;
      next.hash = ctx.location.hash;
    } catch (e) {
      next = url;
    }
    if (
      next &&
      next.origin === ctx.location.origin &&
      ctx.window.history &&
      ctx.window.history.replaceState
    )
      ctx.window.history.replaceState(null, "", next.href);
    ctx.root.setAttribute(
      "data-language-url",
      language === "es" ? "index.html" : "espanol.html",
    );
    ctx.emit("pg:language-change", {
      language: ctx.L,
      previousLanguage: previous,
    });
    return resume(record).then(function (done) {
      ctx.vLoad();
      ctx.vScan([ctx.main]);
      return done;
    });
  }
  function pausePlay() {
    if (ctx.gamePaused) return;
    ctx.gamePaused = true;
    ctx.pausedVoice = ctx.vAudio;
    if (ctx.pausedVoice) ctx.pausedVoice.pause();
    if (ctx.vRaf) ctx.cancelAnimationFrame(ctx.vRaf);
    ctx.vRaf = 0;
    if (ctx.activeLifecycle) ctx.activeLifecycle.pause();
    if (ctx.activeController && ctx.activeController.onPause)
      ctx.activeController.onPause();
    ctx.emit("cb:pause", { paused: true });
  }
  function resumePlay() {
    if (!ctx.gamePaused) return;
    ctx.gamePaused = false;
    if (
      ctx.pausedVoice &&
      ctx.pausedVoice === ctx.vAudio &&
      ctx.vOn &&
      !ctx.vSuspended &&
      ctx.vEl &&
      ctx.vEl.isConnected
    ) {
      var p = ctx.pausedVoice.play();
      if (p && p.catch) p.catch(function () {});
      if (ctx.vLastItem) ctx.vFollow(ctx.pausedVoice, ctx.vLastItem, ctx.vEl);
    }
    ctx.pausedVoice = null;
    if (ctx.activeLifecycle) ctx.activeLifecycle.resume();
    if (ctx.activeController && ctx.activeController.onResume)
      ctx.activeController.onResume();
    if (ctx.pendingVoice) ctx.vScan([ctx.main]);
    ctx.emit("cb:pause", { paused: false });
  }
  ctx.publish({
    snapshot,
    replayActions,
    resume,
    changeLanguage,
    pausePlay,
    resumePlay,
  });
}
