import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  convexHull,
  fitStopPoints,
  platePlacement,
  chapterShapes,
  mapOrderControl,
  installMapPresentation,
} from "../../assets/games/community-builders/engine/map-layout.js";
const points = [
  [9, 39],
  [15, 52],
  [18, 77],
  [31, 58],
  [31, 24],
  [43, 44],
  [46, 72],
  [57, 52],
  [68, 30],
  [65, 73],
  [78, 53],
  [88, 74],
  [91, 50],
  [75, 18],
  [91, 20],
];
for (const width of [360, 414, 600, 768, 1100, 1920])
  test(`geographic fit keeps fifteen usable discs inside ${width}px`, () => {
    const height = (width * 768) / 1376,
      diameter = Math.min(68, Math.max(44, width * 0.052)),
      fit = fitStopPoints(points, width, height, diameter);
    assert.equal(fit.length, 15);
    assert.ok(diameter >= 44);
    for (const [x, y] of fit) {
      assert.ok(x - diameter / 2 >= 0 && x + diameter / 2 <= width);
      assert.ok(y - diameter / 2 >= 0 && y + diameter / 2 <= height);
    }
    for (let i = 0; i < 15; i++)
      for (let j = i + 1; j < 15; j++)
        assert.ok(
          Math.hypot(fit[i][0] - fit[j][0], fit[i][1] - fit[j][1]) >=
            diameter + 7.8,
          `Discs ${i + 1}/${j + 1} remain separate`,
        );
    assert.deepEqual(
      fitStopPoints(points, width, height, diameter),
      fit,
      "Layout is deterministic",
    );
  });
test("plate placement tries four directions, never covers another disc, and hides if none fits", () => {
  const a = { left: 100, top: 100, right: 144, bottom: 144 },
    size = { width: 70, height: 30 },
    bounds = { left: 0, top: 0, right: 300, bottom: 300 };
  assert.equal(platePlacement(a, size, bounds, []).side, "above");
  const top = { left: 70, top: 50, right: 170, bottom: 99 },
    bottom = { left: 70, top: 145, right: 170, bottom: 200 },
    left = { left: 0, top: 80, right: 99, bottom: 170 },
    right = { left: 145, top: 80, right: 260, bottom: 170 };
  assert.equal(platePlacement(a, size, bounds, [top]).side, "below");
  assert.equal(platePlacement(a, size, bounds, [top, bottom]).side, "left");
  assert.equal(
    platePlacement(a, size, bounds, [top, bottom, left]).side,
    "right",
  );
  assert.equal(
    platePlacement(a, size, bounds, [top, bottom, left, right]),
    null,
  );
});
test("chapter hulls use the real stop chapter membership and namespace-safe SVG nodes", () => {
  const d = new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  try {
    const svg = d.window.document.querySelector("svg"),
      ctx = {
        document: d.window.document,
        SVGNS: svg.namespaceURI,
        STOPS: points.map((_, i) => ({
          chap: i < 6 ? 1 : i < 9 ? 2 : i < 13 ? 3 : 4,
        })),
      };
    chapterShapes(ctx, svg, points);
    assert.equal(svg.querySelectorAll("polygon").length, 4);
    for (const p of svg.querySelectorAll("polygon"))
      assert.equal(p.namespaceURI, svg.namespaceURI);
    chapterShapes(ctx, svg, points);
    assert.equal(svg.querySelectorAll(".cb-map-chapters").length, 1);
    assert.deepEqual(
      convexHull([
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0.5, 0.5],
      ]),
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
    );
  } finally {
    d.window.close();
  }
});
test("adult play-order switch persists a choice and redraws the map without score mutation", () => {
  const d = new JSDOM("<main></main>");
  try {
    let saved = 0,
      maps = 0;
    const ctx = {
      uid: 0,
      mode: "map",
      window: d.window,
      CFG: {},
      W: {
        mapPlayInOrder: "Play stops in order",
        mapOrderHelp: "Finish the first stop.",
      },
      cfgSave() {
        saved++;
      },
      showMap() {
        maps++;
      },
      h(tag, attrs = {}, kids = []) {
        const n = d.window.document.createElement(tag);
        for (const [k, v] of Object.entries(attrs))
          k === "text" ? (n.textContent = v) : n.setAttribute(k, v);
        for (const kid of kids) if (kid) n.append(kid);
        return n;
      },
    };
    const wrap = mapOrderControl(ctx),
      input = wrap.querySelector("input");
    assert.equal(input.checked, false);
    input.checked = true;
    input.dispatchEvent(new d.window.Event("change"));
    assert.equal(ctx.CFG.playInOrder, true);
    assert.equal(saved, 1);
    assert.equal(maps, 1);
  } finally {
    d.window.close();
  }
});
test("zoomed map labels use unscaled offsets and cannot escape the visible viewport", () => {
  const d = new JSDOM(
    '<main><div class="cb-world"><div class="cb-world__pan"><div class="cb-world__canvas"><button class="cb-stop" data-state="next"><span class="cb-stop__disc"></span><span class="cb-stop__plate">A stop</span></button></div></div></div><details class="cb-journey"></details></main>',
  );
  try {
    const document = d.window.document,
      main = document.querySelector("main"),
      world = main.querySelector(".cb-world"),
      pan = main.querySelector(".cb-world__pan"),
      canvas = main.querySelector(".cb-world__canvas"),
      control = canvas.querySelector("button"),
      plate = canvas.querySelector(".cb-stop__plate");
    Object.defineProperties(canvas, {
      clientWidth: { value: 600 },
      clientHeight: { value: 350 },
    });
    canvas.getBoundingClientRect = () => ({
      left: -300,
      top: -175,
      right: 900,
      bottom: 525,
      width: 1200,
      height: 700,
    });
    pan.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 600,
      bottom: 350,
      width: 600,
      height: 350,
    });
    let disc = {
      left: 100,
      top: 100,
      right: 188,
      bottom: 188,
      width: 88,
      height: 88,
    };
    control.getBoundingClientRect = () => disc;
    canvas.querySelector(".cb-stop__disc").getBoundingClientRect = () => disc;
    plate.getBoundingClientRect = () => ({ width: 120, height: 40 });
    const h = (tag, attrs = {}, kids = []) => {
      const node = document.createElement(tag);
      for (const [key, value] of Object.entries(attrs))
        key === "text"
          ? (node.textContent = value)
          : node.setAttribute(key, value);
      for (const child of kids) if (child) node.append(child);
      return node;
    };
    const view = installMapPresentation(
      {
        document,
        window: d.window,
        main,
        h,
        btn: (label, cls, click) => {
          const node = h("button", { class: cls, text: label });
          node.addEventListener("click", click);
          return node;
        },
        W: {
          chapters: ["Chapter"],
          mapLegend: "Legend",
          mapList: "List",
          mapMap: "Map",
        },
        POS: [[50, 50]],
      },
      world,
      canvas,
      pan,
    );
    view.layout();
    assert.equal(
      control.style.getPropertyValue("--d"),
      "44px",
      "Zoom does not enlarge the underlying hit-target layout twice",
    );
    assert.equal(plate.style.left, "-8px");
    assert.equal(
      plate.style.top,
      "-24px",
      "Viewport coordinates are divided by the canvas scale",
    );
    disc = {
      left: -220,
      top: 100,
      right: -132,
      bottom: 188,
      width: 88,
      height: 88,
    };
    view.placeLabels();
    assert.equal(
      control.dataset.plateHidden,
      "true",
      "No placement is exposed outside the pan viewport",
    );
    view.close();
  } finally {
    d.window.close();
  }
});

test("initial, font and observer map layouts coalesce, unchanged geometry is reused, and disposal cancels pending work", async () => {
  const d = new JSDOM(
    '<main><div class="cb-world"><div class="cb-world__pan"><div class="cb-world__canvas"><svg class="cb-path"></svg><button class="cb-stop" data-state="next"><span class="cb-stop__disc"></span><span class="cb-stop__plate">A stop</span></button></div></div></div><details class="cb-journey"></details></main>',
  );
  try {
    const document = d.window.document,
      main = document.querySelector("main"),
      world = main.querySelector(".cb-world"),
      pan = main.querySelector(".cb-world__pan"),
      canvas = main.querySelector(".cb-world__canvas");
    const frames = new Map();
    let serial = 0,
      resize,
      width = 600;
    d.window.requestAnimationFrame = (fn) => {
      frames.set(++serial, fn);
      return serial;
    };
    d.window.cancelAnimationFrame = (id) => frames.delete(id);
    d.window.ResizeObserver = class {
      constructor(fn) {
        resize = fn;
      }
      observe() {
        resize();
      }
      disconnect() {}
    };
    Object.defineProperty(document, "fonts", {
      value: { ready: Promise.resolve() },
    });
    Object.defineProperties(canvas, {
      clientWidth: { get: () => width },
      clientHeight: { get: () => (width * 768) / 1376 },
    });
    canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: width,
      bottom: 350,
      width,
      height: 350,
    });
    pan.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: width,
      bottom: 350,
      width,
      height: 350,
    });
    for (const node of canvas.querySelectorAll("button,.cb-stop__disc"))
      node.getBoundingClientRect = () => ({
        left: 100,
        top: 100,
        right: 144,
        bottom: 144,
        width: 44,
        height: 44,
      });
    canvas.querySelector(".cb-stop__plate").getBoundingClientRect = () => ({
      width: 120,
      height: 40,
    });
    const h = (tag, attrs = {}, kids = []) => {
      const node = document.createElement(tag);
      for (const [key, value] of Object.entries(attrs))
        key === "text"
          ? (node.textContent = value)
          : node.setAttribute(key, value);
      for (const child of kids) if (child) node.append(child);
      return node;
    };
    const view = installMapPresentation(
      {
        document,
        window: d.window,
        main,
        h,
        btn: (label, cls, click) => {
          const node = h("button", { class: cls, text: label });
          node.addEventListener("click", click);
          return node;
        },
        W: {
          chapters: ["Chapter"],
          mapLegend: "Legend",
          mapList: "List",
          mapMap: "Map",
        },
        POS: [[50, 50]],
        STOPS: [{ chap: 1 }],
        SVGNS: "http://www.w3.org/2000/svg",
      },
      world,
      canvas,
      pan,
    );
    await Promise.resolve();
    assert.equal(
      frames.size,
      1,
      "Three startup signals share one animation frame",
    );
    assert.equal(canvas.dataset.mapLayout, "pending");
    const flush = () => {
      for (const [id, fn] of [...frames]) {
        frames.delete(id);
        fn();
      }
    };
    flush();
    assert.equal(canvas.dataset.mapLayout, "ready");
    assert.equal(canvas.querySelectorAll(".cb-map-chapter").length, 4);
    const first = canvas.querySelector(".cb-map-chapters");
    resize();
    resize();
    assert.equal(frames.size, 1);
    flush();
    assert.equal(
      canvas.querySelector(".cb-map-chapters"),
      first,
      "Same-sized notifications do not rebuild paths or chapter hulls",
    );
    width = 300;
    resize();
    flush();
    assert.notEqual(
      canvas.querySelector(".cb-map-chapters"),
      first,
      "A real resize rebuilds the fitted geometry",
    );
    resize();
    assert.equal(frames.size, 1);
    view.close();
    assert.equal(
      frames.size,
      0,
      "Leaving the map cancels the scheduled layout",
    );
  } finally {
    d.window.close();
  }
});

test("label geometry is measured before any attribute or position writes", () => {
  const d = new JSDOM(
    '<main><div class="cb-world"><div class="cb-world__pan"><div class="cb-world__canvas"><button class="cb-stop" data-state="next"><span class="cb-stop__disc"></span><span class="cb-stop__plate">First</span><span class="cb-tag">Next</span></button><button class="cb-stop"><span class="cb-stop__disc"></span><span class="cb-stop__plate">Second</span></button></div></div></div><details class="cb-journey"></details></main>',
  );
  try {
    const document = d.window.document,
      main = document.querySelector("main"),
      world = main.querySelector(".cb-world"),
      pan = main.querySelector(".cb-world__pan"),
      canvas = main.querySelector(".cb-world__canvas");
    Object.defineProperties(canvas, {
      clientWidth: { value: 1200 },
      clientHeight: { value: 670 },
    });
    const bounds = {
      left: 0,
      top: 0,
      right: 1200,
      bottom: 670,
      width: 1200,
      height: 670,
    };
    canvas.getBoundingClientRect = pan.getBoundingClientRect = () => bounds;
    const controls = [...canvas.querySelectorAll("button")];
    controls.forEach((node, i) => {
      const rect = {
        left: 200 + i * 300,
        top: 200,
        right: 244 + i * 300,
        bottom: 244,
        width: 44,
        height: 44,
      };
      node.getBoundingClientRect = node.querySelector(
        ".cb-stop__disc",
      ).getBoundingClientRect = () => rect;
      node.querySelector(".cb-stop__plate").getBoundingClientRect = () => ({
        width: 120,
        height: 40,
      });
    });
    canvas.querySelector(".cb-tag").getBoundingClientRect = () => ({
      width: 55,
      height: 25,
    });
    const h = (tag, attrs = {}, kids = []) => {
      const node = document.createElement(tag);
      for (const [key, value] of Object.entries(attrs))
        key === "text"
          ? (node.textContent = value)
          : node.setAttribute(key, value);
      for (const child of kids) if (child) node.append(child);
      return node;
    };
    const view = installMapPresentation(
      {
        document,
        window: d.window,
        main,
        h,
        btn: (label, cls, click) => {
          const node = h("button", { class: cls, text: label });
          node.addEventListener("click", click);
          return node;
        },
        W: {
          chapters: ["Chapter"],
          mapLegend: "Legend",
          mapList: "List",
          mapMap: "Map",
        },
        POS: [
          [20, 30],
          [50, 30],
        ],
      },
      world,
      canvas,
      pan,
    );
    view.layout();
    controls[1].dataset.plateVisible = "false";
    const mutations = new d.window.MutationObserver(() => {});
    mutations.observe(canvas, { attributes: true, subtree: true });
    for (const node of [
      canvas,
      pan,
      ...canvas.querySelectorAll(
        "button,.cb-stop__disc,.cb-stop__plate,.cb-tag",
      ),
    ]) {
      const measure = node.getBoundingClientRect;
      node.getBoundingClientRect = () => {
        assert.equal(
          mutations.takeRecords().length,
          0,
          "No layout read follows a style/attribute write",
        );
        return measure();
      };
    }
    view.placeLabels();
    assert.ok(
      mutations.takeRecords().length > 0,
      "The placement still commits its actual positions",
    );
    mutations.disconnect();
    view.close();
  } finally {
    d.window.close();
  }
});
