import { h } from "./dom.js";
export class Tooltips {
  constructor(root, { delay = 400 } = {}) {
    this.root = root;
    this.delay = delay;
    this.uid = 0;
    this.over = event => this.schedule(event.target);
    this.out = event => { if (!this.control?.contains(event.relatedTarget)) this.hide(); };
    this.key = event => { if (event.key === "Escape") this.hide(); };
    this.touch = () => this.hide();
    root.addEventListener("pointerover", this.over);
    root.addEventListener("focusin", this.over);
    root.addEventListener("pointerout", this.out);
    root.addEventListener("focusout", this.out);
    root.addEventListener("keydown", this.key);
    root.addEventListener("pointerdown", this.touch);
  }
  schedule(target) {
    const control = target?.closest?.("button[aria-label], button[title]");
    if (!control || !this.root.contains(control) || control === this.control) return;
    this.hide();
    const label = control.getAttribute("aria-label") || control.getAttribute("title");
    if (!label) return;
    control.setAttribute("title", label);
    this.control = control;
    this.timer = setTimeout(() => {
      if (!control.isConnected) return this.hide();
      const tip = h("span", { id: "cb-tooltip-" + ++this.uid, role: "tooltip", class: "cb-tooltip", text: label, "data-cb-novoice": "" });
      this.description = control.getAttribute("aria-describedby");
      control.setAttribute("aria-describedby", [this.description, tip.id].filter(Boolean).join(" "));
      this.root.append(tip);
      const rect = control.getBoundingClientRect(), stage = this.root.getBoundingClientRect();
      tip.style.left = Math.max(8, Math.min(rect.left - stage.left, stage.width - tip.offsetWidth - 8)) + "px";
      tip.style.top = Math.max(8, rect.bottom - stage.top + 6) + "px";
      this.tip = tip;
    }, this.delay);
  }
  hide() {
    clearTimeout(this.timer);
    if (this.tip && this.control) {
      if (this.description) this.control.setAttribute("aria-describedby", this.description);
      else this.control.removeAttribute("aria-describedby");
    }
    this.tip?.remove();
    this.tip = this.control = null;
    this.description = null;
  }
  destroy() {
    this.hide();
    for (const [type, callback] of [["pointerover", this.over], ["focusin", this.over], ["pointerout", this.out], ["focusout", this.out], ["keydown", this.key], ["pointerdown", this.touch]]) this.root.removeEventListener(type, callback);
  }
}
