const test = require("node:test"),
  assert = require("node:assert/strict");
const { fullCore } = require("./modernization-gameplay-fixture.cjs");

async function handoff(language) {
  let clock = 1000,
    capture;
  const r = await fullCore(language, 42, false, null, {
    reduced: true,
    beforeBoot(w) {
      w.Date.now = () => clock;
      Object.defineProperty(w.performance, "now", {
        configurable: true,
        value: () => clock,
      });
      const root = w.document.querySelector("[data-game]"),
        add = root.addEventListener.bind(root);
      root.addEventListener = (type, handler, options) => {
        // Capture the actual production root handoff listener during real boot.
        // JSDOM cannot manufacture isTrusted=true on a dispatched MouseEvent.
        if (type === "click" && options === true && !capture) capture = handler;
        return add(type, handler, options);
      };
    },
  });
  assert.equal(typeof capture, "function");
  r.pointer = (node, x = 400, y = 500, detail = 1) => {
    assert.ok(node, "The actual target control must exist");
    const event = new r.w.MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      detail,
      clientX: x,
      clientY: y,
    });
    let stopped = false;
    // Invoke the captured browser boundary with native trust, then dispatch to
    // the actual authored target only if production capture permits it.
    capture.call(r.root, {
      isTrusted: true,
      detail,
      clientX: x,
      clientY: y,
      preventDefault: () => event.preventDefault(),
      stopPropagation: () => {
        stopped = true;
      },
    });
    if (!stopped) node.dispatchEvent(event);
    return { stopped, prevented: event.defaultPrevented };
  };
  r.advance = (ms) => {
    clock += ms;
  };
  await r.core.startStop("ask-a-good-question");
  r.pointer(r.main().querySelector(".cb-s02-intro .cb-btn--go"), 100, 100);
  assert.ok(r.main().querySelector(".cb-s02-play"));
  return r;
}

for (const language of ["en", "es"]) {
  test(`${language}: distinct first Stop2 tiles and Ask accept trusted pointer input immediately`, async () => {
    const r = await handoff(language);
    try {
      for (const [index, row] of ["start", "topic", "detail"].entries()) {
        const tile = r.main().querySelector(`.cb-s02-tile[data-row="${row}"]`);
        const outcome = r.pointer(tile, 300, 250 + index * 100);
        assert.equal(
          outcome.stopped,
          false,
          "A different position is not a ghost tap",
        );
        assert.equal(
          tile.getAttribute("aria-pressed"),
          "true",
          `${row}: the deliberate initial pointer must be accepted before300ms`,
        );
        assert.equal(r.core.snapshot().state.sel[row], tile.dataset.id);
      }
      const ask = r.main().querySelector(".cb-s02-ask");
      assert.equal(ask.getAttribute("aria-disabled"), "false");
      r.pointer(ask, 500, 800);
      assert.ok(
        r.main().querySelector('[data-s02="answer"]'),
        "Ask is active immediately after valid choices",
      );
      assert.equal(r.core.snapshot().state.answers.length, 1);
      assert.equal(r.errors.length, 0, String(r.errors));
    } finally {
      r.close();
    }
  });

  test(`${language}: the real shared guard blocks same-position ghost clicks, permits keyboard and expires at350ms`, async () => {
    const r = await handoff(language);
    try {
      const tile = r.main().querySelector('.cb-s02-tile[data-row="start"]');
      assert.deepEqual(r.pointer(tile, 100, 100), {
        stopped: true,
        prevented: true,
      });
      assert.equal(r.core.snapshot().state.sel.start, null);
      assert.equal(
        r.pointer(tile, 100, 100, 0).stopped,
        false,
        "A trusted keyboard activation bypasses the pointer guard",
      );
      assert.equal(
        r.core.snapshot().state.sel.start,
        tile.dataset.id,
        "Keyboard/programmatic activation bypasses the pointer handoff",
      );
      r.advance(349);
      assert.equal(r.pointer(tile, 100, 100).stopped, true);
      assert.equal(r.core.snapshot().state.sel.start, tile.dataset.id);
      r.advance(1);
      assert.equal(r.pointer(tile, 100, 100).stopped, false);
      assert.equal(
        r.core.snapshot().state.sel.start,
        null,
        "A later intentional pointer still toggles the choice",
      );
      assert.equal(r.errors.length, 0, String(r.errors));
    } finally {
      r.close();
    }
  });

  test(`${language}: a new question accepts a different pointer target while answer double-tap protection remains`, async () => {
    const r = await handoff(language);
    try {
      for (const row of ["start", "topic"])
        r.main().querySelector(`.cb-s02-tile[data-row="${row}"]`).click();
      const ask = r.main().querySelector(".cb-s02-ask");
      r.pointer(ask, 500, 800);
      assert.equal(r.core.snapshot().state.screenKey, "answer");
      const next = r.main().querySelector(".cb-s02-strip.is-done .cb-btn--go");
      r.pointer(next, 500, 800);
      assert.equal(
        r.core.snapshot().state.wi,
        0,
        "The immediate second pointer cannot skip the answer",
      );
      next.click();
      assert.equal(
        r.core.snapshot().state.wi,
        1,
        "Keyboard can intentionally advance without an artificial wait",
      );
      const tile = r.main().querySelector('.cb-s02-tile[data-row="start"]');
      assert.equal(r.pointer(tile, 300, 250).stopped, false);
      assert.equal(
        tile.getAttribute("aria-pressed"),
        "true",
        "The second question has no blanket pointer blackout",
      );
      assert.equal(r.errors.length, 0, String(r.errors));
    } finally {
      r.close();
    }
  });
}
