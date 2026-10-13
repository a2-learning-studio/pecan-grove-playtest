/* Finish a scene after its DOM and map geometry have committed in one paint. */
export function createSceneLayout(ctx) {
  let request = null,
    target = null,
    previousFocus = null,
    needsFrame = false,
    whole = false;
  const requestFrame = ctx.window.requestAnimationFrame
      ? (run) => ctx.window.requestAnimationFrame(run)
      : (run) => ctx.setTimeout(run, 16),
    cancelFrame = ctx.window.cancelAnimationFrame
      ? (id) => ctx.window.cancelAnimationFrame(id)
      : (id) => ctx.clearTimeout(id);
  function mark(state) {
    ctx.root.dataset.sceneLayout = state;
  }
  function reset() {
    if (request !== null) cancelFrame(request);
    request = null;
    target = previousFocus = null;
    needsFrame = whole = false;
    mark("ready");
  }
  function frameNow() {
    const stage = ctx.root.closest("[data-playtest-stage]"),
      scrollport = stage?.querySelector(":scope > .pt-stage-content"),
      fullscreen = ctx.fsEl();
    // Expanded play owns a child scrollport; the outer stage never scrolls.
    if (
      scrollport?.contains(ctx.root) &&
      (stage.classList.contains("is-expanded") || fullscreen === stage)
    ) {
      if (scrollport.scrollTop > 4)
        scrollport.scrollTo({
          top: 0,
          behavior: ctx.motionAllowed() ? "smooth" : "auto",
        });
      return;
    }
    if (fullscreen === ctx.fsTarget()) {
      const host = ctx.fsTarget();
      if (host.scrollTop > 4)
        host.scrollTo({
          top: 0,
          behavior: ctx.motionAllowed() ? "smooth" : "auto",
        });
      return;
    }
    const rect = ctx.root.getBoundingClientRect();
    if (
      rect.top < -4 ||
      (whole && rect.bottom > ctx.window.innerHeight + 4 && rect.top > 4)
    )
      ctx.root.scrollIntoView({
        block: "start",
        behavior: ctx.motionAllowed() ? "smooth" : "auto",
      });
  }
  function finish() {
    request = null;
    try {
      if (ctx.acted && ctx.root.isConnected) {
        if (needsFrame) frameNow();
        const active = ctx.document.activeElement;
        if (
          target?.isConnected &&
          !ctx.root.querySelector("dialog[open]") &&
          (!active ||
            (active === previousFocus && ctx.root.contains(active)) ||
            active === ctx.document.body ||
            !active.isConnected)
        )
          target.focus({ preventScroll: true });
      }
    } finally {
      target = previousFocus = null;
      needsFrame = whole = false;
      mark("ready");
    }
  }
  function schedule() {
    if (request !== null) return;
    mark("pending");
    // The first frame includes map layout. Let the browser commit those writes
    // before focus and framing read geometry, instead of forcing layout in click.
    request = requestFrame(() => {
      request = requestFrame(finish);
    });
  }
  return {
    reset,
    focus(node) {
      if (!ctx.acted) return;
      target = node;
      previousFocus = ctx.document.activeElement;
      schedule();
    },
    frame(all, defer = true) {
      if (!ctx.acted) return;
      if (!defer) {
        whole = !!all;
        frameNow();
        whole = false;
        return;
      }
      needsFrame = true;
      whole ||= !!all;
      schedule();
    },
  };
}
