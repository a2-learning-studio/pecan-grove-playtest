// Findings remain nonmodal unless the player chooses classic cards.
export function prefersFindCards(ctx) {
  return (
    !!ctx.CFG.findCards ||
    !!ctx.window.matchMedia?.("(forced-colors: active)").matches
  );
}

export function showCallout(ctx, anchor, content, options = {}) {
  ctx.root.querySelector(".cb-callout")?.dismiss?.();
  const body = (Array.isArray(content) ? content : [content]).filter(Boolean);
  // A plain labelled section. A live region inserted already filled is often
  // not read, so the words go through the game's one persistent live region.
  const panel = ctx.h(
    "section",
    { class: "cb-callout", "aria-label": options.title || "" },
    [ctx.h("h3", { text: options.title || "" }), ...body],
  );
  // A finding stays until the player moves on: Close, Escape, a tap elsewhere,
  // the next finding or a new scene. "This game has no timers" (WCAG 2.2.1).
  let closed = false,
    positionFrame = null,
    slot = null,
    revealed = null,
    offBack = () => {};
  function close() {
    if (closed) return;
    closed = true;
    if (positionFrame !== null) ctx.window.cancelAnimationFrame(positionFrame);
    positionFrame = null;
    ctx.document.removeEventListener("click", outside, true);
    ctx.document.removeEventListener("keydown", escape, true);
    ctx.window.removeEventListener("resize", schedulePlace);
    ctx.document.removeEventListener("scroll", schedulePlace, true);
    ctx.window.visualViewport?.removeEventListener("resize", schedulePlace);
    ctx.window.visualViewport?.removeEventListener("scroll", schedulePlace);
    offBack();
    if (ctx.vEl && panel.contains(ctx.vEl)) ctx.vStop();
    slot?.remove();
    panel.remove();
    options.onClose?.();
  }
  // Keep looking, Escape or Back: return to the scene where the player was
  // searching, with the chosen thing in view (a tap elsewhere just closes).
  function dismiss() {
    const wasOpen = !closed;
    close();
    if (!anchor.isConnected) return;
    if (wasOpen) {
      for (const [box, top] of revealed || [])
        if (box.isConnected !== false) box.scrollTop = top;
      if (!inView(anchor.getBoundingClientRect()))
        anchor.scrollIntoView?.({ block: "nearest", behavior: "auto" });
    }
    anchor.focus({ preventScroll: true });
  }
  function inView(r) {
    const viewport = ctx.window.visualViewport,
      top = viewport?.offsetTop || 0,
      bottom = top + (viewport?.height || ctx.window.innerHeight);
    return r.height > 0 && r.top >= top && r.bottom <= bottom;
  }
  function outside(event) {
    if (!panel.contains(event.target) && !anchor.contains(event.target))
      close();
  }
  function escape(event) {
    // The engine's input handles Escape first when it runs (main.js back()).
    if (event.key !== "Escape" || event.defaultPrevented) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    dismiss();
  }
  // The next step, not a cancel: a plain pill, like the classic card's button.
  panel.appendChild(
    ctx.btn(options.closeLabel || ctx.W.close, "cb-btn--primary", dismiss),
  );
  panel.lastElementChild.setAttribute("data-cb-novoice", "");
  ctx.root.appendChild(panel);
  panel.dismiss = close;
  panel.back = dismiss;
  // Prefer beside the chosen item, then either edge. Keep all actions reachable.
  function schedulePlace() {
    // Scroll handlers only schedule work. Geometry and position writes happen
    // once per frame, outside native asynchronous scrolling dispatch.
    if (closed || positionFrame !== null) return;
    positionFrame = ctx.window.requestAnimationFrame(() => {
      positionFrame = null;
      place();
    });
  }
  // An in-flow finding below the fold is brought into view at once, down to
  // "Keep looking" (no smooth scroll: it would float the finding mid-way).
  // Dismissing it scrolls back to where the player was looking.
  function reveal() {
    if (closed || !panel.classList.contains("is-flow")) return;
    if (inView(panel.getBoundingClientRect())) return;
    const boxes = [];
    for (let box = panel.parentElement; box; box = box.parentElement)
      if (box.scrollHeight > box.clientHeight) boxes.push([box, box.scrollTop]);
    const page = ctx.document.scrollingElement;
    if (page && !boxes.some(([box]) => box === page))
      boxes.push([page, page.scrollTop]);
    revealed = boxes;
    panel.scrollIntoView?.({ block: "nearest", behavior: "auto" });
  }
  // Moving the finding between the board and the game root must not drop
  // keyboard focus from "Keep looking" to the page.
  function move(parent, before = null) {
    const active = ctx.document.activeElement,
      held = panel.contains(active) ? active : null;
    parent.insertBefore(panel, before);
    if (held && ctx.document.activeElement !== held)
      held.focus({ preventScroll: true });
  }
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
    // A floating finding stays inside the game where the game is in view, so
    // on a wide screen it never lands in the window corner beside the stage.
    const game = ctx.root.getBoundingClientRect(),
      span = (low, high, from, to, size) =>
        Math.min(to, high) - Math.max(from, low) >= size + gap * 2
          ? [Math.max(from, low), Math.min(to, high)]
          : [low, high];
    const [x0, x1] = span(left, left + vw, game.left, game.right, p.width),
      [y0, y1] = span(top, top + vh, game.top, game.bottom, p.height);
    const candidates = [
      [a.left, a.bottom + gap],
      [a.left, a.top - p.height - gap],
      [a.right + gap, a.top],
      [a.left - p.width - gap, a.top],
      [x0 + gap, y0 + gap],
      [x1 - p.width - gap, y1 - p.height - gap],
    ].map(([x, y]) => ({
      left: clamp(x, x0 + gap, x1 - p.width - gap),
      top: clamp(y, y0 + gap, y1 - p.height - gap),
      width: p.width,
      height: p.height,
    }));
    // Every control on the play stage is an obstacle: the game, its toolbar and
    // the feedback form below the game stay reachable. So is the instruction
    // the player is following.
    const controls =
        'button, a[href], input:not([type="hidden"]), select, textarea, summary, [role="button"], .cb-coach',
      stage = ctx.root.closest("[data-playtest-stage]"),
      toolbar = stage?.querySelector(".pt-toolbar"),
      obstacles = [...(stage || ctx.root).querySelectorAll(controls)]
        .filter(
          (node) =>
            node !== anchor &&
            !panel.contains(node) &&
            !node.closest("[hidden], [inert]"),
        )
        .map((node) => node.getBoundingClientRect())
        .filter((rect) => rect.width > 0 && rect.height > 0);
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
    // the board in normal flow instead of obscuring an action or navigation.
    let inline = score(chosen) > 0;
    // Once a finding has been in flow, its place below the board is kept: by
    // the finding, or by a slot of the same size while it floats. Moving
    // between that place and a free corner then never changes the height or
    // scroll position of the stage, which this choice is made from. Without
    // the slot, floating at the bottom of a phone stage made the scroller
    // clamp, a control moved under the corner, the finding went back into
    // flow, scroll anchoring restored the offset, and it jumped every frame.
    if (slot && !slot.isConnected) slot = null;
    const home = panel.classList.contains("is-flow") ? panel : slot;
    if (home && !inline) {
      // Where the player can already read the whole finding, down to "Keep
      // looking", is where it stays. Its padding and border may be cut off.
      const h = home.getBoundingClientRect(),
        box = ctx.window.getComputedStyle(panel),
        inset = (side) =>
          (parseFloat(box["padding" + side]) || 0) +
          (parseFloat(box["border" + side + "Width"]) || 0),
        upper = Math.max(top, toolbar?.getBoundingClientRect().bottom ?? top);
      inline =
        h.top + inset("Top") >= upper - 1 &&
        h.bottom - inset("Bottom") <= top + vh + 1 &&
        h.left >= left - 1 &&
        h.right <= left + vw + 1;
    }
    panel.classList.toggle("is-flow", inline);
    if (inline) {
      if (slot) {
        move(slot.parentNode, slot);
        slot.remove();
        slot = null;
      } else if (panel.parentNode !== ctx.main) move(ctx.main);
    } else {
      if (home === panel) {
        slot = ctx.h("div", {
          class: "cb-callout-slot",
          "aria-hidden": "true",
        });
        panel.before(slot);
      }
      if (slot) {
        slot.style.width = p.width + "px";
        slot.style.height = p.height + "px";
      }
      if (panel.parentNode !== ctx.root) move(ctx.root);
      panel.style.left = chosen.left + "px";
      panel.style.top = chosen.top + "px";
    }
  }
  // Removing an in-flow finding on pointerdown can clamp its scroller and move
  // the intended button before pointerup. Capture click keeps the native target
  // fixed while still dismissing before that target's own action handler.
  ctx.document.addEventListener("click", outside, true);
  ctx.document.addEventListener("keydown", escape, true);
  ctx.window.addEventListener("resize", schedulePlace);
  ctx.document.addEventListener("scroll", schedulePlace, {
    capture: true,
    passive: true,
  });
  ctx.window.visualViewport?.addEventListener("resize", schedulePlace);
  ctx.window.visualViewport?.addEventListener("scroll", schedulePlace, {
    passive: true,
  });
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
  reveal();
  anchor.focus({ preventScroll: true });
  const words = [options.title, ...body.map((node) => node.textContent)]
    .map((text) => String(text || "").trim())
    .filter(Boolean);
  if (options.announce) words.push(options.announce);
  ctx.say?.(words.join(" "));
  if (ctx.vOn)
    Promise.resolve(ctx.vLoad()).then(
      () => {
        if (!closed) ctx.vScan([panel]);
      },
      () => {},
    );
  return panel;
}
