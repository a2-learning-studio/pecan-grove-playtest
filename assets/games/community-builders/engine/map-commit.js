// Keep detached map construction separate from its first connected layout.
// The returned promise and pending marker cover every part of the same scene.
export function createMapCommit(ctx) {
  const win = ctx.window,
    request = win.requestAnimationFrame
      ? (run) => win.requestAnimationFrame(run)
      : (run) => win.setTimeout(run, 16),
    stop = win.cancelAnimationFrame
      ? (id) => win.cancelAnimationFrame(id)
      : (id) => win.clearTimeout(id);
  let active = null;
  function clear(token, result, error) {
    if (active !== token) return;
    if (token.frame !== null) stop(token.frame);
    active = null;
    delete ctx.root.dataset.mapCommit;
    if (error) token.reject(error);
    else token.resolve(result);
  }
  function cancel() {
    if (active) clear(active, false);
  }
  const screenChanged = () => {
    if (active && !active.committing) cancel();
  };
  const paused = (event) => {
    if (event.detail?.paused) cancel();
  };
  ctx.document.addEventListener("cb:screen", screenChanged);
  ctx.document.addEventListener("cb:pause", paused);
  ctx.document.addEventListener("pg:language-change", cancel);
  return {
    cancel,
    run(commit) {
      cancel();
      return new Promise((resolve, reject) => {
        const token = {
          slot: ctx.store.current,
          session: ctx.feedbackSession,
          visit: ctx.stopVisit,
          paused: ctx.gamePaused,
          dialogs: new Set(ctx.root.querySelectorAll("dialog[open]")),
          resolve,
          reject,
          frame: null,
          committing: false,
        };
        active = token;
        ctx.root.dataset.mapCommit = "pending";
        token.frame = request(() => {
          token.frame = null;
          if (
            active !== token ||
            !ctx.root.isConnected ||
            ctx.root.hasAttribute("data-playtest-paused") ||
            [...ctx.root.querySelectorAll("dialog[open]")].some(
              (dialog) => !token.dialogs.has(dialog),
            ) ||
            ctx.gamePaused !== token.paused ||
            ctx.mode !== "map" ||
            ctx.store.current !== token.slot ||
            ctx.feedbackSession !== token.session ||
            ctx.stopVisit !== token.visit
          ) {
            clear(token, false);
            return;
          }
          token.committing = true;
          try {
            commit();
            clear(token, true);
          } catch (error) {
            clear(token, false, error);
          }
        });
      });
    },
    destroy() {
      cancel();
      ctx.document.removeEventListener("cb:screen", screenChanged);
      ctx.document.removeEventListener("cb:pause", paused);
      ctx.document.removeEventListener("pg:language-change", cancel);
    },
  };
}
