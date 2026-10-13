export default function createLegacyInput(ctx) {
  var keysLive = false;
  ctx.document.addEventListener(
    "pointerdown",
    function (e) {
      keysLive = ctx.root.contains(e.target);
    },
    true,
  );
  ctx.document.addEventListener(
    "focusin",
    function (e) {
      keysLive = ctx.root.contains(e.target);
    },
    true,
  );
  ctx.document.addEventListener("keydown", function (e) {
    if (ctx.root.getAttribute("data-engine-input") === "true") return;
    if (
      e.defaultPrevented ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      e.isComposing
    )
      return;
    if (ctx.vSuspended || ctx.root.hasAttribute("data-playtest-paused")) return;
    if (!(
      keysLive ||
      ctx.root.contains(ctx.document.activeElement) ||
      ctx.fsEl() === ctx.root
    ))
      return;
    var t = e.target,
      k = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key,
      act = null;
    if (
      t &&
      t.closest &&
      t.closest(
        "input, textarea, select, [contenteditable=''], [contenteditable='true']",
      )
    )
      return;
    if (ctx.root.querySelector("dialog[open]")) return; // a window is open: Esc closes it, nothing else
    if (k === "Escape") {
      if (t && t.classList && t.classList.contains("cb-stop")) return;
      act = function () {
        ctx.openSettings(ctx.root.contains(t) ? t : null);
      };
    } else if (k === "?")
      act = function () {
        ctx.openSettings(ctx.root.contains(t) ? t : null, true);
      };
    else if (e.repeat) return;
    else if (k === "m")
      act = function () {
        ctx.setVoice(!ctx.vOn, true);
      };
    else if (k === "r") act = ctx.replayNow;
    else if (k === "s")
      act = function () {
        if (ctx.vAudio) {
          ctx.vStop();
          ctx.vInkClear();
        }
      };
    else if (k === "c")
      act = function () {
        ctx.setCap(!ctx.CFG.cap, true);
      };
    else if (k === "f" && ctx.canFS) act = ctx.toggleFS;
    if (!act) return;
    e.preventDefault();
    ctx.acted = true;
    act();
  });

  ctx.bind({ keysLive: [() => keysLive, (value) => (keysLive = value)] });
}
