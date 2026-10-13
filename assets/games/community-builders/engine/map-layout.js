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
export function platePlacement(anchor, size, bounds, obstacles) {
  const gap = 8,
    centerX = (anchor.left + anchor.right) / 2,
    centerY = (anchor.top + anchor.bottom) / 2;
  const candidates = [
    [centerX - size.width / 2, anchor.top - size.height - gap, "above"],
    [centerX - size.width / 2, anchor.bottom + gap, "below"],
    [anchor.left - size.width - gap, centerY - size.height / 2, "left"],
    [anchor.right + gap, centerY - size.height / 2, "right"],
  ].map(([left, top, side]) => ({
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
        !obstacles.some((other) => overlap(box, other)),
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
  const legend = ctx.h("details", { class: "cb-map-legend" }, [
    ctx.h("summary", { text: ctx.W.mapLegend }),
  ]);
  const list = ctx.h("ul");
  ctx.W.chapters.forEach((label, i) =>
    list.append(
      ctx.h("li", { "data-chapter": i + 1 }, [
        ctx.h("span", { "aria-hidden": "true" }),
        ctx.h("span", { text: label }),
      ]),
    ),
  );
  legend.append(list);
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
  let observer,
    stopped = false;
  const controls = [...canvas.querySelectorAll(".cb-stop")],
    svg = canvas.querySelector(".cb-path");
  function layout() {
    if (stopped || !canvas.isConnected) return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
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
  }
  function placeLabels() {
    const bounds = canvas.getBoundingClientRect(),
      active = ctx.document.activeElement;
    const discs = controls.map((b) =>
        b.querySelector(".cb-stop__disc").getBoundingClientRect(),
      ),
      placed = [];
    const order = controls
      .map((button, index) => ({ button, index }))
      .sort(
        (a, b) =>
          Number(b.button === active) - Number(a.button === active) ||
          Number(b.button.dataset.state === "next") -
            Number(a.button.dataset.state === "next"),
      );
    for (const { button, index } of order) {
      const plate = button.querySelector(".cb-stop__plate"),
        shown =
          bounds.width >= 1100 ||
          button === active ||
          button.matches(":hover") ||
          button.dataset.state === "next";
      button.dataset.plateVisible = String(shown);
      button.dataset.plateHidden = "false";
      if (!shown) continue;
      const size = plate.getBoundingClientRect(),
        box = platePlacement(discs[index], size, bounds, [
          ...discs.filter((_, i) => i !== index),
          ...placed,
        ]);
      if (!box) {
        button.dataset.plateHidden = "true";
        continue;
      }
      const origin = button.getBoundingClientRect();
      plate.style.left = box.left - origin.left + "px";
      plate.style.top = box.top - origin.top + "px";
      plate.dataset.placement = box.side;
      placed.push(box);
    }
    const next = controls.find((b) => b.dataset.state === "next"),
      tag = next?.querySelector(".cb-tag");
    if (tag) {
      const index = controls.indexOf(next);
      tag.hidden = false;
      const size = tag.getBoundingClientRect(),
        box = platePlacement(discs[index], size, bounds, [
          ...discs.filter((_, i) => i !== index),
          ...placed,
        ]);
      if (!box) tag.hidden = true;
      else {
        const origin = next.getBoundingClientRect();
        tag.style.left = box.left - origin.left + "px";
        tag.style.top = box.top - origin.top + "px";
      }
    }
  }
  const close = () => {
    if (stopped) return;
    stopped = true;
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
    observer = new ctx.window.ResizeObserver(layout);
    observer.observe(canvas);
  }
  ctx.document.fonts?.ready.then(() => {
    if (!stopped) layout();
  });
  layout();
  return { layout, placeLabels, close };
}
