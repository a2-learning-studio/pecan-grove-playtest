import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  createSceneLayout,
  keepScroll,
} from "../../assets/games/community-builders/engine/scene-layout.js";

function fixture(expanded = true) {
  const dom = new JSDOM(
    `<section data-playtest-stage class="${expanded ? "is-expanded" : ""}"><nav>Tools</nav><div class="pt-stage-content"><main><h2 tabindex="-1">Map</h2><button>First stop</button></main></div></section>`,
  );
  const w = dom.window,
    root = w.document.querySelector("main"),
    stage = root.closest("section"),
    scrollport = stage.querySelector(".pt-stage-content"),
    heading = root.querySelector("h2"),
    tasks = new Map(),
    calls = [];
  let serial = 0,
    fullscreen = null;
  w.requestAnimationFrame = (run) => {
    const id = ++serial;
    tasks.set(id, run);
    return id;
  };
  w.cancelAnimationFrame = (id) => tasks.delete(id);
  root.getBoundingClientRect = () => {
    calls.push("measure");
    return { top: -20, bottom: 1000 };
  };
  root.scrollIntoView = (options) => calls.push(["page", options]);
  stage.scrollTo = () => calls.push("outer stage");
  scrollport.scrollTo = (options) => calls.push(["scrollport", options]);
  const focus = heading.focus.bind(heading);
  heading.focus = (options) => {
    calls.push(["focus", options]);
    focus(options);
  };
  const ctx = {
    root,
    window: w,
    document: w.document,
    acted: true,
    motionAllowed: () => false,
    fsEl: () => fullscreen,
    fsTarget: () => stage,
  };
  const layout = createSceneLayout(ctx);
  return {
    ctx,
    root,
    stage,
    scrollport,
    heading,
    calls,
    tasks,
    layout,
    fullscreen: () => (fullscreen = stage),
    paint() {
      const current = [...tasks];
      tasks.clear();
      current.forEach(([, run]) => run());
    },
    close() {
      layout.reset();
      w.close();
    },
  };
}

test("map focus and framing coalesce after its geometry paint, with explicit readiness", () => {
  const r = fixture();
  try {
    r.scrollport.scrollTop = 120;
    r.layout.focus(r.heading);
    r.layout.frame(true);
    r.layout.frame(false);
    assert.equal(r.tasks.size, 1);
    assert.equal(r.root.dataset.sceneLayout, "pending");
    assert.deepEqual(
      r.calls,
      [],
      "No synchronous focus or layout in the click",
    );
    r.paint();
    assert.deepEqual(r.calls, [], "The first frame lets map geometry commit");
    r.paint();
    assert.deepEqual(r.calls, [
      ["scrollport", { top: 0, behavior: "auto" }],
      ["focus", { preventScroll: true }],
    ]);
    assert.equal(r.ctx.document.activeElement, r.heading);
    assert.equal(r.root.dataset.sceneLayout, "ready");
    assert.equal(r.tasks.size, 0);
  } finally {
    r.close();
  }
});

test("replacing a scene cancels its pending focus and scroll work", () => {
  const r = fixture();
  try {
    r.layout.focus(r.heading);
    r.layout.frame(true);
    r.paint();
    r.layout.reset();
    r.heading.remove();
    r.paint();
    assert.deepEqual(r.calls, []);
    assert.equal(r.root.dataset.sceneLayout, "ready");
    assert.equal(r.tasks.size, 0);
  } finally {
    r.close();
  }
});

for (const destination of ["control", "dialog"])
  test(`deferred map focus respects a newly focused ${destination}`, () => {
    const r = fixture();
    try {
      r.layout.focus(r.heading);
      const active = r.root.querySelector("button");
      if (destination === "dialog") {
        const dialog = r.ctx.document.createElement("dialog");
        dialog.setAttribute("open", "");
        r.root.append(dialog);
        dialog.append(active);
      }
      active.focus();
      r.paint();
      r.paint();
      assert.deepEqual(r.calls, []);
      assert.equal(r.ctx.document.activeElement, active);
      assert.equal(r.root.dataset.sceneLayout, "ready");
    } finally {
      r.close();
    }
  });

test("native fullscreen frames the owned child scrollport and honors current motion", () => {
  const r = fixture(false);
  try {
    r.fullscreen();
    r.ctx.motionAllowed = () => true;
    r.scrollport.scrollTop = 80;
    r.layout.frame(true);
    r.paint();
    r.paint();
    assert.deepEqual(r.calls, [["scrollport", { top: 0, behavior: "smooth" }]]);
  } finally {
    r.close();
  }
});

test("native fullscreen also returns a scrolled game root to the new scene's header", () => {
  const r = fixture(false);
  try {
    r.fullscreen();
    r.root.scrollTo = (options) => r.calls.push(["root", options]);
    r.root.scrollTop = 225;
    r.layout.frame(true, false);
    assert.deepEqual(r.calls, [["root", { top: 0, behavior: "auto" }]]);
  } finally {
    r.close();
  }
});

test("a map refresh preserves feedback-field focus that was already outside the game", () => {
  const r = fixture();
  try {
    const feedback = r.ctx.document.createElement("textarea");
    r.ctx.document.body.append(feedback);
    feedback.value = "A note while I play";
    feedback.focus();
    r.layout.focus(r.heading);
    r.paint();
    r.paint();
    assert.equal(r.ctx.document.activeElement, feedback);
    assert.equal(feedback.value, "A note while I play");
    assert.deepEqual(r.calls, []);
    assert.equal(r.root.dataset.sceneLayout, "ready");
  } finally {
    r.close();
  }
});

test("page framing retains the existing immediate stop contract", () => {
  const r = fixture(false);
  try {
    r.layout.frame(true, false);
    assert.deepEqual(r.calls, [
      "measure",
      ["page", { block: "start", behavior: "auto" }],
    ]);
    assert.equal(r.tasks.size, 0);
  } finally {
    r.close();
  }
});

test("unstarted and disconnected scenes never gain delayed focus", () => {
  const r = fixture();
  try {
    r.ctx.acted = false;
    r.layout.focus(r.heading);
    r.layout.frame(true);
    assert.equal(r.tasks.size, 0);
    r.ctx.acted = true;
    r.layout.focus(r.heading);
    r.root.remove();
    r.paint();
    r.paint();
    assert.deepEqual(r.calls, []);
    assert.equal(r.root.dataset.sceneLayout, "ready");
  } finally {
    r.close();
  }
});

test("a screen swap puts the play view back where the player was when laying out the new screen moved it", () => {
  const r = fixture();
  try {
    r.scrollport.style.overflowY = "auto";
    Object.defineProperty(r.scrollport, "clientHeight", { value: 600 });
    r.scrollport.scrollTop = 166;
    let restore = keepScroll(r.root);
    r.scrollport.scrollTop = 167;
    restore();
    assert.deepEqual(r.calls, [], "A pixel of rounding is left alone");
    restore = keepScroll(r.root);
    // WebKit's scroll anchoring at 1366x768: Next claim pressed at 166 showed 827
    r.scrollport.scrollTop = 827;
    restore();
    assert.deepEqual(r.calls, [["scrollport", { top: 167, behavior: "auto" }]]);
  } finally {
    r.close();
  }
});

test("a screen swap leaves the page's own scroll and a removed scrollport alone", () => {
  const r = fixture();
  try {
    const restore = keepScroll(r.root);
    r.scrollport.scrollTop = 300;
    restore();
    assert.deepEqual(
      r.calls,
      [],
      "Without a scrollport the page scrolls itself",
    );
    r.scrollport.style.overflowY = "auto";
    Object.defineProperty(r.scrollport, "clientHeight", { value: 600 });
    const gone = keepScroll(r.root);
    r.scrollport.scrollTop = 0;
    r.stage.remove();
    gone();
    assert.deepEqual(r.calls, []);
  } finally {
    r.close();
  }
});
