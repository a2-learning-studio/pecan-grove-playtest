/* A renderer remains synchronous inside the swap, so newly shown controls work at once. */
export function zoomMapDisc(ctx) {
  if (!ctx.motionAllowed() || ctx.restoring) return null;
  const disc = [...ctx.root.querySelectorAll(".cb-stop[data-stop-id]")]
    .find((node) => node.dataset.stopId === ctx.feedbackStop)
    ?.querySelector(".cb-stop__disc");
  if (!disc?.animate) return null;
  const rect = disc.getBoundingClientRect(),
    stage = ctx.root.getBoundingClientRect();
  const token = ctx.document.createElement("span");
  token.className = "cb-map-zoom-token";
  token.setAttribute("aria-hidden", "true");
  token.style.left = rect.left - stage.left + ctx.root.scrollLeft + "px";
  token.style.top = rect.top - stage.top + ctx.root.scrollTop + "px";
  token.style.width = rect.width + "px";
  token.style.height = rect.height + "px";
  const copy = disc.cloneNode(true);
  copy.style.width = copy.style.height = "100%";
  const color = ctx.window?.getComputedStyle(disc).backgroundColor;
  if (color) copy.style.backgroundColor = color;
  token.append(copy);
  ctx.root.append(token);
  const animation = token.animate(
    [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(1.15)" },
    ],
    { duration: 320, easing: "cubic-bezier(0.16,1,0.3,1)" },
  );
  const remove = () => token.remove();
  animation.finished?.then(remove, remove);
  return { animation, remove };
}
export function transitionScene(ctx, render, kind = "step") {
  const disc = kind === "stop" ? zoomMapDisc(ctx) : null;
  const renderNow = () => {
    render();
    if (disc) {
      ctx.activeLifecycle?.animation?.(disc.animation);
      ctx.activeLifecycle?.cleanup(disc.remove);
    }
  };
  if (!ctx.motionAllowed() || !ctx.document.startViewTransition) {
    renderNow();
    return Promise.resolve();
  }
  ctx.root.dataset.transition = kind;
  let rendered = false;
  const swap = () => {
    if (!rendered) {
      rendered = true;
      renderNow();
    }
  };
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
  // Calm/reduced motion permits an instant swap. Keep the whole text layer
  // opaque rather than freezing a partially faded scene on a slow renderer.
  if (!node?.animate || ctx.restoring || !ctx.motionAllowed()) return;
  const frames = [
    {
      opacity: 0,
      transform: kind === "stop" ? "scale(.985)" : "translateX(16px)",
    },
    { opacity: 1, transform: "none" },
  ];
  const animation = node.animate(frames, {
    duration: kind === "stop" ? 320 : 200,
    easing: "cubic-bezier(0.16,1,0.3,1)",
  });
  if (ctx.activeLifecycle?.animation) ctx.activeLifecycle.animation(animation);
  else ctx.activeLifecycle?.cleanup(() => animation.cancel());
}
