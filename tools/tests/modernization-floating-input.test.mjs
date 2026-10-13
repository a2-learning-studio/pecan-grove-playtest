import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { JSDOM } from "jsdom";
import { Input } from "../../assets/games/community-builders/engine/input.js";
import { Focus } from "../../assets/games/community-builders/engine/focus.js";

const require = createRequire(import.meta.url);
const { mount } = require("../../assets/playtest/shell.js");

test("the floating feedback handle keeps its native movement keys with shared game input mounted", () => {
  const generated = spawnSync(
    "python",
    ["-B", "-c", "import tools.make_playtest as m; print(m.page('en',''))"],
    { cwd: new URL("../../", import.meta.url), encoding: "utf8" },
  );
  assert.equal(generated.status, 0, generated.stderr);
  const dom = new JSDOM(generated.stdout, {
    url: "https://example.test/game/",
  });
  const w = dom.window,
    doc = w.document,
    root = doc.getElementById("community-builders"),
    dialog = doc.getElementById("pt-review-dialog"),
    handle = doc.getElementById("pt-review-move"),
    collapse = doc.getElementById("pt-review-collapse"),
    draft = doc.getElementById("pt-feedback-fix"),
    form = doc.getElementById("pt-feedback-form"),
    originalCustomEvent = globalThis.CustomEvent;
  let input;
  try {
    globalThis.CustomEvent = w.CustomEvent;
    Object.defineProperties(w, {
      innerWidth: { value: 1280 },
      innerHeight: { value: 900 },
    });
    w.matchMedia = () => ({ matches: false });
    w.CommunityBuilders = { enterPlay() {}, suspendVoice() {} };
    w.HTMLElement.prototype.scrollIntoView = () => {};
    w.HTMLDialogElement.prototype.show = function () {
      this.setAttribute("open", "");
    };
    w.HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
      this.dispatchEvent(new w.Event("close"));
    };
    w.HTMLElement.prototype.getBoundingClientRect = function () {
      const left =
        this === dialog
          ? parseFloat(dialog.style.left) || 644
          : this === handle
            ? 660
            : 672;
      const top =
        this === dialog
          ? parseFloat(dialog.style.top) || 209
          : this === handle
            ? 220
            : 270;
      const width = this === dialog ? 620 : this === handle ? 400 : 100;
      const height = this === dialog ? 675 : 44;
      return {
        left,
        top,
        width,
        height,
        x: left,
        y: top,
        right: left + width,
        bottom: top + height,
      };
    };
    const shell = mount(doc, w),
      focus = new Focus(root, doc);
    input = new Input({ root, document: doc, scope: () => focus.active() });
    let sharedMoves = 0;
    for (const direction of ["left", "right", "up", "down"])
      input.on("nav." + direction, () => {
        sharedMoves++;
        return focus.move(direction);
      });
    shell.start({ requestFullscreen: false });
    draft.value = "Keep the draft while moving and collapsing";
    shell.openReview(true);
    handle.focus();
    const before = dialog.getBoundingClientRect();
    handle.dispatchEvent(
      new w.KeyboardEvent("keydown", {
        key: "ArrowLeft",
        code: "ArrowLeft",
        bubbles: true,
        cancelable: true,
      }),
    );
    assert.equal(dialog.getBoundingClientRect().left, before.left - 10);
    assert.equal(
      sharedMoves,
      0,
      "game navigation must not intercept the handle’s own keys",
    );
    handle.dispatchEvent(
      new w.KeyboardEvent("keydown", {
        key: "ArrowUp",
        code: "ArrowUp",
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    assert.equal(dialog.getBoundingClientRect().top, before.top - 40);
    collapse.click();
    assert.equal(doc.getElementById("pt-feedback-window").hidden, true);
    assert.equal(collapse.getAttribute("aria-expanded"), "false");
    collapse.click();
    assert.equal(doc.getElementById("pt-feedback-window").hidden, false);
    assert.equal(doc.getElementById("pt-feedback-form"), form);
    assert.equal(draft.value, "Keep the draft while moving and collapsing");
  } finally {
    input?.destroy();
    globalThis.CustomEvent = originalCustomEvent;
    w.close();
  }
});
