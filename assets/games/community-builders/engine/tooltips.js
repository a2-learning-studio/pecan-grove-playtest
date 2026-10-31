import { h } from "./dom.js";
// A tooltip names a control that shows no words of its own (an icon button,
// a stop disc whose plate is hidden). It never repeats what is already on
// screen, never appears for touch, can be dismissed with Escape (main.js
// back()) and stays while the pointer moves onto it (WCAG 1.4.13).
const words = (text) =>
  String(text || "")
    .toLocaleLowerCase()
    .match(/\p{L}{3,}/gu) || [];
export function saysItAlready(control, label) {
  const shown = words(control.innerText ?? control.textContent);
  if (!shown.length) return false;
  const named = new Set(words(label));
  return shown.every((word) => named.has(word));
}
export class Tooltips {
  constructor(root, { delay = 400 } = {}) {
    this.root = root;
    this.delay = delay;
    this.uid = 0;
    this.over = (event) => {
      // Hover tooltips belong to a mouse. Touch has no hover to end them.
      if (
        event.pointerType === "touch" ||
        root.ownerDocument.defaultView?.matchMedia?.("(hover: none)").matches
      )
        return;
      this.schedule(event.target);
    };
    this.focus = (event) => {
      if (root.dataset.input === "touch") return;
      this.schedule(event.target);
    };
    this.out = (event) => {
      if (
        !this.control?.contains(event.relatedTarget) &&
        !this.tip?.contains(event.relatedTarget)
      )
        this.hide();
    };
    this.key = (event) => {
      if (event.key === "Escape") this.hide();
    };
    this.touch = (event) => {
      if (!this.tip?.contains(event.target)) this.hide();
    };
    root.addEventListener("pointerover", this.over);
    root.addEventListener("focusin", this.focus);
    root.addEventListener("pointerout", this.out);
    root.addEventListener("focusout", this.out);
    root.addEventListener("keydown", this.key);
    root.addEventListener("pointerdown", this.touch);
  }
  schedule(target) {
    if (this.tip?.contains(target)) return;
    const control = target?.closest?.("button[aria-label], button[title]");
    if (!control || !this.root.contains(control) || control === this.control)
      return;
    this.hide();
    const label =
      control.getAttribute("aria-label") || control.getAttribute("title");
    if (!label || saysItAlready(control, label)) return;
    this.control = control;
    this.timer = setTimeout(() => {
      if (!control.isConnected) return this.hide();
      // The tip only shows the control's own name, which screen readers
      // already say: linked as a description it was read twice ("Settings,
      // button, Settings"), so it is drawn for the eyes only.
      const tip = h("span", {
        id: "cb-tooltip-" + ++this.uid,
        role: "tooltip",
        class: "cb-tooltip",
        text: label,
        "aria-hidden": "true",
        "data-cb-novoice": "",
      });
      // Inside a dialog the tip joins the dialog, which is drawn above the game.
      (control.closest("dialog") || this.root).append(tip);
      this.place(control, tip);
      this.tip = tip;
    }, this.delay);
  }
  // Below the control, or above it when below would leave the screen or cover
  // the main action.
  place(control, tip) {
    const view = this.root.ownerDocument.defaultView,
      host = tip.parentElement || this.root,
      rect = control.getBoundingClientRect(),
      box = host.getBoundingClientRect(),
      // The tip is placed from its host's padding box, which scrolls with the
      // host's content (the game root in full screen, a dialog).
      ox = box.left + (host.clientLeft || 0) - (host.scrollLeft || 0),
      oy = box.top + (host.clientTop || 0) - (host.scrollTop || 0),
      width = tip.offsetWidth || 0,
      height = tip.offsetHeight || 0,
      x = Math.max(
        box.left + 8,
        Math.min(rect.left, box.left + box.width - width - 8),
      );
    tip.style.left = x - ox + "px";
    const below = rect.bottom + 6,
      covers = [...this.root.querySelectorAll(".cb-btn--go")].some((go) => {
        const r = go.getBoundingClientRect();
        return (
          go !== control &&
          r.width > 0 &&
          r.left < x + width &&
          r.right > x &&
          r.top < below + height &&
          r.bottom > below
        );
      }),
      flip =
        rect.top - 6 - height >= 0 &&
        (covers || below + height > (view?.innerHeight || Infinity));
    // The side tells the CSS where to bridge the gap to the control, so the
    // pointer can move onto the tip without it closing (WCAG 1.4.13).
    tip.dataset.side = flip ? "above" : "below";
    tip.style.top =
      Math.max(box.top + 8, flip ? rect.top - 6 - height : below) - oy + "px";
  }
  // A tip counts as open only where it can be seen: in the game with no
  // dialog over it, or in the dialog on top.
  shown() {
    if (!this.tip?.isConnected) return false;
    const top = [
      ...this.root.ownerDocument.querySelectorAll("dialog[open]"),
    ].at(-1);
    return !top || top.contains(this.tip);
  }
  hide() {
    clearTimeout(this.timer);
    this.tip?.remove();
    this.tip = this.control = null;
  }
  destroy() {
    this.hide();
    for (const [type, callback] of [
      ["pointerover", this.over],
      ["focusin", this.focus],
      ["pointerout", this.out],
      ["focusout", this.out],
      ["keydown", this.key],
      ["pointerdown", this.touch],
    ])
      this.root.removeEventListener(type, callback);
  }
}
