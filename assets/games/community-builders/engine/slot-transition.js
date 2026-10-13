/* Commit native modal teardown before rendering the selected player's scene. */
export function createSlotTransition({ root, valid, onError }) {
  const win = root.ownerDocument.defaultView;
  let active = null;
  const request = win.requestAnimationFrame
      ? (run) => win.requestAnimationFrame(run)
      : (run) => win.setTimeout(run, 16),
    stop = win.cancelAnimationFrame
      ? (id) => win.cancelAnimationFrame(id)
      : (id) => win.clearTimeout(id);
  function clear(token) {
    if (active !== token) return;
    if (token.frame !== null) stop(token.frame);
    win.clearTimeout(token.timeout);
    token.dialog.removeEventListener("close", token.closed);
    if (token.main) {
      if (token.busy === null) token.main.removeAttribute("aria-busy");
      else token.main.setAttribute("aria-busy", token.busy);
    }
    delete root.dataset.slotTransition;
    active = null;
  }
  function cancel() {
    if (active) clear(active);
  }
  function failed(token, error) {
    if (active !== token) return;
    clear(token);
    if (token.dialog.open) token.dialog.close();
    onError?.(error, token.dialog);
  }
  const screenChanged = () => {
    if (active && !active.rendering) cancel();
  };
  root.ownerDocument.addEventListener("cb:screen", screenChanged);
  root.ownerDocument.addEventListener("pg:language-change", cancel);
  const paused = (event) => {
    if (event.detail?.paused) cancel();
  };
  root.ownerDocument.addEventListener("cb:pause", paused);
  return {
    cancel,
    begin(dialog, select, resume) {
      // A second activation of the detached old button cannot select twice.
      if (!dialog.open || active?.dialog === dialog) return false;
      cancel();
      const main = root.querySelector(".cb-main"),
        token = {
          dialog,
          main,
          busy: main?.getAttribute("aria-busy") ?? null,
          frame: null,
          rendering: false,
        };
      active = token;
      try {
        token.selection = select();
        dialog.dataset.slotNavigation = "true";
        root.dataset.slotTransition = "pending";
        main?.setAttribute("aria-busy", "true");
        token.closed = () => {
          win.clearTimeout(token.timeout);
          token.frame = request(() => {
            token.frame = request(() => {
              token.frame = null;
              if (
                active !== token ||
                !root.isConnected ||
                root.hasAttribute("data-playtest-paused") ||
                !valid(token.selection)
              ) {
                clear(token);
                return;
              }
              token.rendering = true;
              try {
                Promise.resolve(resume(token.selection)).then(
                  () => clear(token),
                  (error) => failed(token, error),
                );
              } catch (error) {
                failed(token, error);
              }
            });
          });
        };
        dialog.addEventListener("close", token.closed, { once: true });
        token.timeout = win.setTimeout(
          () => failed(token, new Error("The player dialog did not close")),
          5000,
        );
        dialog.close();
      } catch (error) {
        failed(token, error);
      }
      return true;
    },
    destroy() {
      cancel();
      root.ownerDocument.removeEventListener("cb:screen", screenChanged);
      root.ownerDocument.removeEventListener("pg:language-change", cancel);
      root.ownerDocument.removeEventListener("cb:pause", paused);
    },
  };
}
