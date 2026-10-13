import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createSlotTransition } from "../../assets/games/community-builders/engine/slot-transition.js";
import { Focus } from "../../assets/games/community-builders/engine/focus.js";

function fixture() {
  const dom = new JSDOM(
      '<main><div class="cb-main"><button>New game</button></div></main>',
    ),
    w = dom.window,
    root = w.document.querySelector("main"),
    main = root.firstElementChild,
    tasks = new Map(),
    errors = [],
    calls = [];
  let serial = 0,
    current = "fox";
  w.requestAnimationFrame = (run) => {
    const id = ++serial;
    tasks.set(id, run);
    return id;
  };
  w.cancelAnimationFrame = (id) => tasks.delete(id);
  const transition = createSlotTransition({
    root,
    valid: (selection) => selection.id === current,
    onError: (error) => errors.push(error.message),
  });
  const dialog = () => {
    const d = w.document.createElement("dialog");
    d.open = true;
    d.close = () => {
      calls.push("close");
      d.open = false;
      d.dispatchEvent(new w.Event("close"));
    };
    root.append(d);
    return d;
  };
  return {
    w,
    root,
    main,
    tasks,
    transition,
    errors,
    calls,
    dialog,
    select: () => {
      calls.push("select");
      return { id: current, record: { v: 1, state: { step: 2 } } };
    },
    change: (id) => (current = id),
    paint() {
      const items = [...tasks.values()];
      tasks.clear();
      items.forEach((run) => run());
    },
    close() {
      transition.destroy();
      w.close();
    },
  };
}

test("slot navigation commits close before two paint frames, then keeps busy through async resume", async () => {
  const r = fixture();
  try {
    let finish;
    const d = r.dialog();
    assert.equal(
      r.transition.begin(d, r.select, (selection) => {
        r.calls.push(selection.record.state.step);
        return new Promise((resolve) => (finish = resolve));
      }),
      true,
    );
    assert.deepEqual(r.calls, ["select", "close"]);
    assert.equal(d.dataset.slotNavigation, "true");
    assert.equal(r.root.dataset.slotTransition, "pending");
    assert.equal(r.main.getAttribute("aria-busy"), "true");
    r.paint();
    assert.deepEqual(r.calls, ["select", "close"]);
    r.paint();
    assert.deepEqual(r.calls, ["select", "close", 2]);
    assert.equal(
      r.root.dataset.slotTransition,
      "pending",
      "asynchronous stop loading remains measured",
    );
    finish();
    await Promise.resolve();
    assert.equal(r.root.dataset.slotTransition, undefined);
    assert.equal(r.main.hasAttribute("aria-busy"), false);
  } finally {
    r.close();
  }
});

test("duplicate activation selects once, while a new dialog supersedes a pending selection", async () => {
  const r = fixture();
  try {
    const first = r.dialog(),
      resume = (selection) => r.calls.push(selection.id);
    r.transition.begin(first, r.select, resume);
    assert.equal(r.transition.begin(first, r.select, resume), false);
    r.change("owl");
    r.transition.begin(r.dialog(), r.select, resume);
    r.paint();
    r.paint();
    await Promise.resolve();
    assert.deepEqual(r.calls, ["select", "close", "select", "close", "owl"]);
  } finally {
    r.close();
  }
});

test("native close must actually fire before the two-frame teardown interval can begin", async () => {
  const r = fixture();
  try {
    const d = r.dialog();
    d.close = () => {
      d.open = false;
      r.calls.push("native close requested");
    };
    r.transition.begin(d, r.select, () => r.calls.push("render"));
    r.paint();
    r.paint();
    assert.deepEqual(r.calls, ["select", "native close requested"]);
    assert.equal(r.root.dataset.slotTransition, "pending");
    d.dispatchEvent(new r.w.Event("close"));
    r.paint();
    assert.equal(r.calls.includes("render"), false);
    r.paint();
    await Promise.resolve();
    assert.equal(r.calls.at(-1), "render");
    assert.equal(
      r.transition.begin(d, r.select, () => r.calls.push("again")),
      false,
      "An old closed button cannot select again after the transition completes",
    );
  } finally {
    r.close();
  }
});

test("a missing native close event fails within its bound and releases busy state", () => {
  const r = fixture();
  try {
    let timeout, delay;
    r.w.setTimeout = (run, ms) => {
      timeout = run;
      delay = ms;
      return 1;
    };
    r.w.clearTimeout = () => {};
    const d = r.dialog();
    d.close = () => {
      d.open = false;
    };
    r.transition.begin(d, r.select, () => r.calls.push("render"));
    assert.equal(delay, 5000);
    timeout();
    assert.deepEqual(r.errors, ["The player dialog did not close"]);
    assert.equal(r.root.dataset.slotTransition, undefined);
    assert.equal(r.main.hasAttribute("aria-busy"), false);
    assert.equal(r.tasks.size, 0);
  } finally {
    r.close();
  }
});

test("a resumed scene can focus and enable its controls before readiness clears", async () => {
  const r = fixture();
  try {
    r.transition.begin(r.dialog(), r.select, () => {
      const heading = r.w.document.createElement("h2"),
        control = r.w.document.createElement("button");
      heading.tabIndex = -1;
      control.textContent = "Continue playing";
      r.main.replaceChildren(heading, control);
      heading.focus();
      r.w.document.dispatchEvent(new r.w.CustomEvent("cb:screen"));
      assert.equal(r.w.document.activeElement, heading);
      assert.equal(control.disabled, false);
      assert.equal(r.root.dataset.slotTransition, "pending");
    });
    r.paint();
    r.paint();
    await Promise.resolve();
    assert.equal(
      r.main.querySelector("button").textContent,
      "Continue playing",
    );
    assert.equal(r.root.dataset.slotTransition, undefined);
  } finally {
    r.close();
  }
});

for (const reason of [
  "cancel",
  "screen",
  "language",
  "pause",
  "changed-slot",
  "quit",
  "removed",
])
  test(`slot navigation cannot render after ${reason}`, () => {
    const r = fixture();
    try {
      r.transition.begin(r.dialog(), r.select, () => r.calls.push("render"));
      r.paint();
      if (reason === "cancel") r.transition.cancel();
      if (reason === "screen")
        r.w.document.dispatchEvent(new r.w.CustomEvent("cb:screen"));
      if (reason === "language")
        r.w.document.dispatchEvent(new r.w.CustomEvent("pg:language-change"));
      if (reason === "pause")
        r.w.document.dispatchEvent(
          new r.w.CustomEvent("cb:pause", { detail: { paused: true } }),
        );
      if (reason === "changed-slot") r.change("owl");
      if (reason === "quit")
        r.root.setAttribute("data-playtest-paused", "true");
      if (reason === "removed") r.root.remove();
      r.paint();
      assert.deepEqual(r.calls, ["select", "close"]);
      assert.equal(r.root.dataset.slotTransition, undefined);
      assert.equal(r.main.hasAttribute("aria-busy"), false);
      assert.equal(r.tasks.size, 0);
    } finally {
      r.close();
    }
  });

for (const phase of ["select", "resume", "async-resume"])
  test(`slot ${phase} failure cleans up readiness and permits another attempt`, async () => {
    const r = fixture();
    try {
      const fail = () => {
        throw Error("Could not open");
      };
      r.transition.begin(
        r.dialog(),
        phase === "select" ? fail : r.select,
        phase === "async-resume"
          ? () => Promise.reject(Error("Could not open"))
          : fail,
      );
      r.paint();
      r.paint();
      await Promise.resolve();
      await Promise.resolve();
      assert.deepEqual(r.errors, ["Could not open"]);
      assert.equal(r.root.dataset.slotTransition, undefined);
      assert.equal(r.main.hasAttribute("aria-busy"), false);
      assert.equal(r.tasks.size, 0);
      r.transition.begin(r.dialog(), r.select, () => r.calls.push("retry"));
      r.paint();
      r.paint();
      await Promise.resolve();
      assert.equal(r.calls.at(-1), "retry");
    } finally {
      r.close();
    }
  });

test("modal cancellation still restores the opener; committed navigation only removes its focus scope", () => {
  const r = fixture();
  try {
    const focus = new Focus(r.root, r.w.document),
      opener = r.main.querySelector("button"),
      d = r.dialog(),
      control = r.w.document.createElement("button");
    d.append(control);
    control.focus();
    focus.stack.push({ element: d, opener });
    focus.pop(d, false);
    assert.equal(r.w.document.activeElement, control);
    assert.equal(focus.stack.length, 0);
    opener.scrollIntoView = () => {};
    focus.stack.push({ element: d, opener });
    focus.pop(d);
    assert.equal(r.w.document.activeElement, opener);
    assert.equal(focus.stack.length, 0);
  } finally {
    r.close();
  }
});
