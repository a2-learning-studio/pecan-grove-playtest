const overlap = (a, b, gap = 4) =>
  a.left < b.right + gap &&
  a.right > b.left - gap &&
  a.top < b.bottom + gap &&
  a.bottom > b.top - gap;
export function convexHull(points) {
  const sorted = points
    .map((p) => [...p])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.length < 3) return sorted;
  const cross = (o, a, b) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (items) => {
    const out = [];
    for (const p of items) {
      while (out.length > 1 && cross(out.at(-2), out.at(-1), p) <= 0) out.pop();
      out.push(p);
    }
    return out;
  };
  return [...half(sorted).slice(0, -1), ...half(sorted.reverse()).slice(0, -1)];
}
export function fitStopPoints(positions, width, height, diameter = 44) {
  const pad = diameter / 2 + 4,
    min = diameter + 8;
  const clamp = (value, max) => Math.max(pad, Math.min(max - pad, value));
  const pts = positions.map(([x, y]) => [
    clamp((x * width) / 100, width),
    clamp((y * height) / 100, height),
  ]);
  // Preserve the authored geography, separating close tokens only at small sizes.
  for (let pass = 0; pass < 100; pass++) {
    let moved = false;
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[j][0] - pts[i][0],
          dy = pts[j][1] - pts[i][1],
          distance = Math.hypot(dx, dy);
        if (distance >= min - 0.1) continue;
        const amount = (min - distance) / 2,
          ux = distance ? dx / distance : 1,
          uy = distance ? dy / distance : 0;
        pts[i][0] = clamp(pts[i][0] - ux * amount, width);
        pts[i][1] = clamp(pts[i][1] - uy * amount, height);
        pts[j][0] = clamp(pts[j][0] + ux * amount, width);
        pts[j][1] = clamp(pts[j][1] + uy * amount, height);
        moved = true;
      }
    if (!moved) break;
  }
  return pts;
}
export function platePlacement(
  anchor,
  size,
  bounds,
  obstacles,
  extras = false,
  plateGap = 36,
) {
  const gap = 8,
    centerX = (anchor.left + anchor.right) / 2,
    centerY = (anchor.top + anchor.bottom) / 2;
  const spots = [
    [centerX - size.width / 2, anchor.top - size.height - gap, "above"],
    [centerX - size.width / 2, anchor.bottom + gap, "below"],
    [anchor.left - size.width - gap, centerY - size.height / 2, "left"],
    [anchor.right + gap, centerY - size.height / 2, "right"],
  ];
  if (extras)
    spots.push(
      [anchor.right + gap, anchor.top - size.height - gap, "above"],
      [anchor.left - size.width - gap, anchor.top - size.height - gap, "above"],
      [anchor.right + gap, anchor.bottom + gap, "below"],
      [anchor.left - size.width - gap, anchor.bottom + gap, "below"],
    );
  const candidates = spots.map(([left, top, side]) => ({
    left,
    top,
    right: left + size.width,
    bottom: top + size.height,
    side,
  }));
  return (
    candidates.find(
      (box) =>
        box.left >= bounds.left &&
        box.right <= bounds.right &&
        box.top >= bounds.top &&
        box.bottom <= bounds.bottom &&
        !obstacles.some((other) =>
          overlap(box, other, other.plate ? plateGap : 4),
        ),
    ) || null
  );
}
export function chapterShapes(ctx, svg, positions) {
  svg.querySelector(".cb-map-chapters")?.remove();
  const group = ctx.document.createElementNS(ctx.SVGNS, "g");
  group.setAttribute("class", "cb-map-chapters");
  for (let chapter = 1; chapter <= 4; chapter++) {
    const centers = positions.filter((_, i) => ctx.STOPS[i].chap === chapter);
    const points = centers.flatMap(([x, y]) => [
      [x - 42, y - 42],
      [x + 42, y - 42],
      [x + 42, y + 42],
      [x - 42, y + 42],
    ]);
    const hull = convexHull(points),
      polygon = ctx.document.createElementNS(ctx.SVGNS, "polygon");
    polygon.setAttribute("points", hull.map((p) => p.join(",")).join(" "));
    polygon.setAttribute("class", "cb-map-chapter cb-map-chapter--" + chapter);
    group.append(polygon);
  }
  svg.prepend(group);
}
export function mapOrderControl(ctx) {
  const wrap = ctx.h("div", { class: "cb-map-order" }),
    id = "cb-map-order-" + ++ctx.uid;
  const toggle = ctx.h("input", { type: "checkbox", id });
  toggle.checked = !!ctx.CFG.playInOrder;
  toggle.addEventListener("change", () => {
    const settings = ctx.window.PecanGroveEngine?.settings;
    if (settings) settings.update({ playInOrder: toggle.checked });
    else {
      ctx.CFG.playInOrder = toggle.checked;
      ctx.cfgSave();
    }
    if (ctx.mode === "map") ctx.showMap();
  });
  wrap.append(
    ctx.h("label", { for: id }, [
      toggle,
      ctx.h("span", { text: ctx.W.mapPlayInOrder }),
    ]),
    ctx.h("p", { text: ctx.W.mapOrderHelp }),
  );
  return wrap;
}
export function installMapPresentation(ctx, world, canvas, pan) {
  ctx.mapCleanup?.();
  world.classList.add("cb-map-ready");
  const toolbar = ctx.h("div", {
    class: "cb-map-controls",
    "data-cb-novoice": "",
  });
  const panelId = "cb-map-legend-" + ++ctx.uid;
  const list = ctx.h("ul");
  ctx.W.chapters.forEach((label, i) =>
    list.append(
      ctx.h("li", { "data-chapter": i + 1 }, [
        ctx.h("span", { "aria-hidden": "true" }),
        ctx.h("span", { text: label }),
      ]),
    ),
  );
  const panel = ctx.h("div", {
    class: "cb-map-legend__panel",
    id: panelId,
    hidden: true,
  });
  panel.append(list);
  const toggle = ctx.h("button", {
    type: "button",
    class: "cb-map-legend__btn",
    "aria-expanded": "false",
    "aria-controls": panelId,
    text: ctx.W.mapLegend,
  });
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    panel.hidden = !open;
  });
  const legend = ctx.h("div", { class: "cb-map-legend" }, [toggle, panel]);
  const listButton = ctx.btn(ctx.W.mapList, "cb-btn--onstage", () => {
    const journey = ctx.main.querySelector(".cb-journey"),
      show = pan.hidden;
    pan.hidden = !show;
    journey.open = !show;
    listButton.textContent = show ? ctx.W.mapList : ctx.W.mapMap;
    listButton.setAttribute("aria-pressed", String(!show));
  });
  listButton.classList.add("cb-map-list");
  listButton.setAttribute("aria-pressed", "false");
  const hud = world.querySelector(".cb-world__hud");
  if (hud) toolbar.append(hud);
  toolbar.append(listButton, legend);
  world.insertBefore(toolbar, pan);
  // Reserve this readout before attachment: a crowded map must still name the
  // focused stop without covering another disc or shifting the map on focus.
  const caption = ctx.h("div", {
    class: "cb-map-caption",
    "aria-hidden": "true",
    "data-plate-visible": "true",
    "data-plate-hidden": "false",
    "data-cb-novoice": "",
  });
  world.insertBefore(caption, pan);
  let observer,
    stopped = false,
    frame = null,
    geometry = "",
    captionControl = null;
  canvas.dataset.mapLayout = "pending";
  const requestFrame = ctx.window.requestAnimationFrame
    ? (callback) => ctx.window.requestAnimationFrame(callback)
    : (callback) => ctx.window.setTimeout(callback, 0);
  const cancelFrame = ctx.window.cancelAnimationFrame
    ? (id) => ctx.window.cancelAnimationFrame(id)
    : (id) => ctx.window.clearTimeout(id);
  const controls = [...canvas.querySelectorAll(".cb-stop")],
    svg = canvas.querySelector(".cb-path");
  // Keep the Next badge in ordinary caption flow. WebKit native buttons can
  // paint absolute child badges at a different origin from the measured box.
  controls.forEach((button) => {
    const tag = button.querySelector(".cb-tag");
    if (tag) tag.hidden = true;
  });
  function showCaption(button) {
    if (captionControl === button) return;
    captionControl = button;
    const plate = button?.querySelector(".cb-stop__plate"),
      tag =
        button?.dataset.state === "next"
          ? button.querySelector(".cb-tag")
          : null,
      children = plate ? [plate.cloneNode(true)] : [];
    if (tag) {
      const badge = tag.cloneNode(true);
      badge.hidden = false;
      children.push(badge);
    }
    caption.replaceChildren(...children);
    caption.dataset.stopId = button?.dataset.stopId || "";
    caption.dataset.stopN = button?.dataset.stopN || "";
  }
  showCaption(
    controls.find((button) => button.dataset.state === "next") || controls[0],
  );
  function layout() {
    if (stopped || !canvas.isConnected) return;
    const rect = canvas.getBoundingClientRect(),
      bounds = {
        width: canvas.clientWidth || rect.width,
        height: canvas.clientHeight || rect.height,
      };
    if (!bounds.width || !bounds.height) return;
    const signature = bounds.width + ":" + bounds.height;
    if (geometry === signature) {
      placeLabels();
      return;
    }
    geometry = signature;
    const diameter = Math.min(68, Math.max(44, bounds.width * 0.052)),
      pts = fitStopPoints(ctx.POS, bounds.width, bounds.height, diameter);
    controls.forEach((button, i) => {
      button.style.setProperty("--d", diameter + "px");
      button.parentNode.style.left = (pts[i][0] / bounds.width) * 100 + "%";
      button.parentNode.style.top = (pts[i][1] / bounds.height) * 100 + "%";
    });
    const units = pts.map(([x, y]) => [
        (x / bounds.width) * 1376,
        (y / bounds.height) * 768,
      ]),
      percent = pts.map(([x, y]) => [
        (x / bounds.width) * 100,
        (y / bounds.height) * 100,
      ]);
    if (svg) {
      chapterShapes(ctx, svg, units);
      let index = 0;
      for (const path of svg.querySelectorAll(".cb-stones")) {
        path.setAttribute(
          "d",
          ctx.pathD(
            percent[index],
            percent[index + 1],
            percent[index - 1],
            percent[index + 2],
          ),
        );
        index++;
      }
      for (const path of svg.querySelectorAll(".cb-trail")) {
        const n = Number(path.dataset.from || 0);
        if (n < units.length - 1)
          path.setAttribute(
            "d",
            ctx.pathD(
              percent[n],
              percent[n + 1],
              percent[n - 1],
              percent[n + 2],
            ),
          );
      }
    }
    placeLabels();
    canvas.dataset.mapLayout = "ready";
  }
  function scheduleLayout() {
    if (stopped || frame !== null) return;
    // Drop the previous placement before the next paint. A resize moves the
    // discs immediately, and the old pixel offsets can cover a neighbor until
    // the coalesced frame measures them again.
    for (const button of controls) {
      const plate = button.querySelector(".cb-stop__plate");
      if (plate && plate.dataset.placement) delete plate.dataset.placement;
    }
    frame = requestFrame(() => {
      frame = null;
      layout();
    });
  }
  function placeLabels() {
    if (stopped || !canvas.isConnected || !geometry) return;
    const rect = canvas.getBoundingClientRect(),
      viewport = pan.getBoundingClientRect(),
      bounds = {
        left: Math.max(rect.left, viewport.left),
        right: Math.min(rect.right, viewport.right),
        top: Math.max(rect.top, viewport.top),
        bottom: Math.min(rect.bottom, viewport.bottom),
      },
      width = canvas.clientWidth || rect.width,
      scale = rect.width / (width || 1),
      active = ctx.document.activeElement;
    const next = controls.find((b) => b.dataset.state === "next"),
      priority = controls.includes(active) ? active : next || controls[0];
    const discs = controls.map((b) =>
        b.querySelector(".cb-stop__disc").getBoundingClientRect(),
      ),
      placed = [];
    const order = controls
      .map((button, index) => {
        const shown =
          width >= 1100 ||
          button === active ||
          button.matches(":hover") ||
          button.dataset.state === "next";
        const plate = button.querySelector(".cb-stop__plate");
        return {
          button,
          index,
          plate,
          shown,
          size: shown ? plate.getBoundingClientRect() : null,
          origin: shown ? button.getBoundingClientRect() : null,
        };
      })
      .sort(
        (a, b) =>
          Number(b.button === active) - Number(a.button === active) ||
          Number(b.button.dataset.state === "next") -
            Number(a.button.dataset.state === "next"),
      );
    for (const item of order) {
      if (!item.shown) continue;
      const obstacles = [
        ...discs.filter((_, i) => i !== item.index),
        ...placed,
      ];
      item.box =
        platePlacement(
          discs[item.index],
          item.size,
          bounds,
          obstacles,
          true,
          36,
        ) ||
        platePlacement(
          discs[item.index],
          item.size,
          bounds,
          obstacles,
          true,
          14,
        );
      item.docked =
        !item.box &&
        item.button === priority &&
        (item.button === active || overlap(discs[item.index], bounds, 0));
      if (item.box) placed.push(Object.assign(item.box, { plate: true }));
    }
    // No geometry reads after this point: all attributes/positions commit together.
    showCaption(priority);
    for (const { button, plate, shown, box, docked, origin } of order) {
      const visibility = String(shown),
        hidden = String(shown && !box && !docked);
      if (button.dataset.plateVisible !== visibility)
        button.dataset.plateVisible = visibility;
      if (button.dataset.plateHidden !== hidden)
        button.dataset.plateHidden = hidden;
      if (button.dataset.plateDocked !== String(!!docked))
        button.dataset.plateDocked = String(!!docked);
      if (!box) {
        if (plate && plate.dataset.placement) delete plate.dataset.placement;
        continue;
      }
      const left = (box.left - origin.left) / scale + "px",
        top = (box.top - origin.top) / scale + "px";
      if (plate.style.left !== left) plate.style.left = left;
      if (plate.style.top !== top) plate.style.top = top;
      if (plate.dataset.placement !== box.side)
        plate.dataset.placement = box.side;
    }
  }
  const close = () => {
    if (stopped) return;
    stopped = true;
    if (frame !== null) cancelFrame(frame);
    observer?.disconnect();
    canvas.removeEventListener("focusin", placeLabels);
    canvas.removeEventListener("focusout", placeLabels);
    canvas.removeEventListener("pointerover", placeLabels);
    canvas.removeEventListener("pointerout", placeLabels);
    canvas.removeEventListener("cb:map-transform", placeLabels);
    ctx.document.removeEventListener("cb:screen", screen);
  };
  const screen = () => {
    if (!canvas.isConnected) close();
  };
  ctx.mapCleanup = close;
  canvas.addEventListener("focusin", placeLabels);
  canvas.addEventListener("focusout", placeLabels);
  canvas.addEventListener("pointerover", placeLabels);
  canvas.addEventListener("pointerout", placeLabels);
  canvas.addEventListener("cb:map-transform", placeLabels);
  ctx.document.addEventListener("cb:screen", screen);
  if (ctx.window.ResizeObserver) {
    observer = new ctx.window.ResizeObserver(scheduleLayout);
    observer.observe(canvas);
  }
  ctx.document.fonts?.ready.then(() => {
    if (!stopped) scheduleLayout();
  });
  scheduleLayout();
  return { layout, placeLabels, close };
}
