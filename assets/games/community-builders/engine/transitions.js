/* A renderer remains synchronous inside the swap, so newly shown controls work at once. */
export function transitionScene(ctx, render, kind = "step") {
  if (!ctx.motionAllowed() || !ctx.document.startViewTransition) {
    render();
    return Promise.resolve();
  }
  ctx.root.dataset.transition = kind;
  let rendered = false;
  const swap = () => { if (!rendered) { rendered = true; render(); } };
  try {
    const transition = ctx.document.startViewTransition(swap);
    // updateCallbackDone resolves when controls exist, not when the animation finishes.
    return Promise.resolve(transition.updateCallbackDone).catch(() => swap());
  } catch {
    swap();
    return Promise.resolve();
  }
}
export function animateScene(ctx, node, kind = "step") {
  if (!node?.animate || ctx.restoring) return;
  const allowed = ctx.motionAllowed();
  const frames = allowed
    ? [{ opacity: 0, transform: kind === "stop" ? "scale(.985)" : "translateX(16px)" }, { opacity: 1, transform: "none" }]
    : [{ opacity: 0 }, { opacity: 1 }];
  const animation = node.animate(frames, { duration: allowed ? (kind === "stop" ? 320 : 200) : 120, easing: "cubic-bezier(0.16,1,0.3,1)" });
  if (ctx.activeLifecycle?.animation) ctx.activeLifecycle.animation(animation);
  else ctx.activeLifecycle?.cleanup(() => animation.cancel());
}
