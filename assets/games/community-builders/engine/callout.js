// Findings remain nonmodal unless the player chooses classic cards.
export function prefersFindCards(ctx) {
  return (
    !!ctx.CFG.findCards ||
    !!ctx.window.matchMedia?.("(forced-colors: active)").matches
  );
}

export function showCallout(ctx, anchor, content, options = {}) {
  ctx.root.querySelector(".cb-callout")?.dismiss?.();
  const panel = ctx.h(
    "section",
    {
      class: "cb-callout",
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true",
      "aria-label": options.title || "",
    },
    [
      ctx.h("h3", { text: options.title || "" }),
      ...(Array.isArray(content) ? content : [content]),
    ],
  );
  let closed = false,
    tick = 0,
    dismissAt = null,
    voiceReady = !ctx.vOn,
    offBack = () => {};
  const clock = ctx.activeLifecycle || ctx.window;
  const now = () => clock.Date?.now() ?? ctx.performance.now();
  function close() {
    if (closed) return;
    closed = true;
    clock.clearTimeout(tick);
    ctx.document.removeEventListener("pointerdown", outside, true);
    ctx.document.removeEventListener("keydown", escape, true);
    ctx.window.removeEventListener("resize", place);
    ctx.document.removeEventListener("scroll", place, true);
    offBack();
    if (ctx.vEl && panel.contains(ctx.vEl)) ctx.vStop();
    panel.remove();
    options.onClose?.();
  }
  function dismiss() {
    close();
    if (anchor.isConnected) anchor.focus({ preventScroll: true });
  }
  function outside(event) {
    if (!panel.contains(event.target) && !anchor.contains(event.target))
      close();
  }
  function escape(event) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    dismiss();
  }
  panel.appendChild(
    ctx.btn(
      options.closeLabel || ctx.W.close,
      "cb-btn--quiet",
      dismiss,
      "close",
    ),
  );
  panel.lastElementChild.setAttribute("data-cb-novoice", "");
  ctx.root.appendChild(panel);
  panel.dismiss = close;
  // Prefer beside the chosen item, then either edge. Avoid every remaining item.
  function place() {
    if (closed || !anchor.isConnected) {
      close();
      return;
    }
    const gap = 12,
      viewport = ctx.window.visualViewport;
    const vw = viewport?.width || ctx.window.innerWidth,
      vh = viewport?.height || ctx.window.innerHeight;
    const left = viewport?.offsetLeft || 0,
      top = viewport?.offsetTop || 0;
    panel.style.maxWidth = Math.max(1, vw - gap * 2) + "px";
    panel.style.width = Math.min(350, Math.max(1, vw - gap * 2)) + "px";
    panel.style.maxHeight = Math.max(80, vh - gap * 2) + "px";
    const a = anchor.getBoundingClientRect(),
      p = panel.getBoundingClientRect();
    const clamp = (v, low, high) =>
      Math.max(low, Math.min(v, Math.max(low, high)));
    const candidates = [
      [a.left, a.bottom + gap],
      [a.left, a.top - p.height - gap],
      [a.right + gap, a.top],
      [a.left - p.width - gap, a.top],
      [left + gap, top + gap],
      [left + vw - p.width - gap, top + vh - p.height - gap],
    ].map(([x, y]) => ({
      left: clamp(x, left + gap, left + vw - p.width - gap),
      top: clamp(y, top + gap, top + vh - p.height - gap),
      width: p.width,
      height: p.height,
    }));
    const obstacles = [
      ...ctx.main.querySelectorAll(".cb-s01-spot:not(.is-found):not(.is-not)"),
    ]
      .filter((node) => node !== anchor)
      .map((node) => node.getBoundingClientRect());
    const area = (a, b) =>
      Math.max(
        0,
        Math.min(a.left + a.width, b.right) - Math.max(a.left, b.left),
      ) *
      Math.max(
        0,
        Math.min(a.top + a.height, b.bottom) - Math.max(a.top, b.top),
      );
    const score = (box) =>
      obstacles.reduce((sum, other) => sum + area(box, other), 0);
    const chosen = candidates.reduce((best, next) =>
      score(next) < score(best) ? next : best,
    );
    // When a dense small scene has no free rectangle, place the callout beside
    // the board in the normal flow instead of obscuring an unfound target.
    const inline = score(chosen) > 0;
    panel.classList.toggle("is-flow", inline);
    if (inline) ctx.main.appendChild(panel);
    else {
      if (panel.parentNode !== ctx.root) ctx.root.appendChild(panel);
      panel.style.left = chosen.left + "px";
      panel.style.top = chosen.top + "px";
    }
  }
  function pulse() {
    if (closed || !panel.isConnected) return;
    const speaking = !!ctx.vAudio && !!ctx.vEl && panel.contains(ctx.vEl);
    if (!voiceReady || speaking || ctx.gamePaused) dismissAt = null;
    else if (dismissAt === null) dismissAt = now() + 6000;
    else if (now() >= dismissAt) {
      close();
      return;
    }
    tick = clock.setTimeout(pulse, 100);
  }
  ctx.document.addEventListener("pointerdown", outside, true);
  ctx.document.addEventListener("keydown", escape, true);
  ctx.window.addEventListener("resize", place);
  ctx.document.addEventListener("scroll", place, true);
  const input = ctx.window.PecanGroveEngine?.input;
  if (input)
    offBack = input.on(
      "back",
      () => {
        dismiss();
        return true;
      },
      { scope: ctx.main },
    );
  ctx.activeLifecycle?.cleanup(close);
  place();
  anchor.focus({ preventScroll: true });
  if (ctx.vOn)
    Promise.resolve(ctx.vLoad()).then(
      () => {
        if (!closed) {
          ctx.vScan([panel]);
          voiceReady = true;
        }
      },
      () => {
        voiceReady = true;
      },
    );
  pulse();
  return panel;
}
