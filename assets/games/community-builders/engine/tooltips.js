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
      const tip = h("span", {
        id: "cb-tooltip-" + ++this.uid,
        role: "tooltip",
        class: "cb-tooltip",
        text: label,
        "data-cb-novoice": "",
      });
      this.description = control.getAttribute("aria-describedby");
      control.setAttribute(
        "aria-describedby",
        [this.description, tip.id].filter(Boolean).join(" "),
      );
      this.root.append(tip);
      this.place(control, tip);
      this.tip = tip;
    }, this.delay);
  }
  // Below the control, or above it when below would leave the screen or cover
  // the main action.
  place(control, tip) {
    const view = this.root.ownerDocument.defaultView,
      rect = control.getBoundingClientRect(),
      stage = this.root.getBoundingClientRect(),
      width = tip.offsetWidth || 0,
      height = tip.offsetHeight || 0,
      x = Math.max(
        8,
        Math.min(rect.left - stage.left, stage.width - width - 8),
      );
    tip.style.left = x + "px";
    const below = rect.bottom + 6,
      covers = [...this.root.querySelectorAll(".cb-btn--go")].some((go) => {
        const r = go.getBoundingClientRect();
        return (
          go !== control &&
          r.width > 0 &&
          r.left < stage.left + x + width &&
          r.right > stage.left + x &&
          r.top < below + height &&
          r.bottom > below
        );
      }),
      flip =
        rect.top - 6 - height >= 0 &&
        (covers || below + height > (view?.innerHeight || Infinity));
    tip.style.top =
      Math.max(8, (flip ? rect.top - 6 - height : below) - stage.top) + "px";
  }
  hide() {
    clearTimeout(this.timer);
    if (this.tip && this.control) {
      if (this.description)
        this.control.setAttribute("aria-describedby", this.description);
      else this.control.removeAttribute("aria-describedby");
    }
    this.tip?.remove();
    this.tip = this.control = null;
    this.description = null;
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
