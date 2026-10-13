import { h, button } from "./dom.js";
import { starsFor } from "./store.js";
export const clampZoom = (value) => Math.max(1, Math.min(2.5, value));
export class Gestures {
  constructor({ root, i18n, focus, core, settings }) {
    Object.assign(this, { root, i18n, focus, core, settings });
    this.points = new Map();
    this.zoom = 1;
    this.pan = { x: 0, y: 0 };
    this.drag = null;
    this.longTimer = 0;
    this.selected = null;
    this.lastTap = 0;
    this.swipe = null;
    root.addEventListener("pointerdown", (e) => this.down(e));
    root.addEventListener("pointermove", (e) => this.move(e));
    root.addEventListener("pointerup", (e) => this.up(e));
    root.addEventListener("pointercancel", (e) => this.cancel(e));
    root.addEventListener("click", (e) => this.click(e), true);
  }
  refresh() {
    this.map = this.root.querySelector(".cb-world__pan");
    this.canvas = this.map?.querySelector(".cb-world__canvas");
    this.zoom = 1;
    this.pan = { x: 0, y: 0 };
    this.points.clear();
    this.selected = null;
    if (!this.map) return;
    if (!this.map.parentNode.querySelector(".cb-engine-zoom")) {
      const b = button(this.i18n.t("zoom"), () => this.toggle(), {
        class: "cb-btn cb-engine-zoom",
        "aria-pressed": "false",
      });
      this.map.parentNode.append(b);
    }
    this.paint();
  }
  toggle() {
    this.zoom = this.zoom > 1 ? 1 : 1.8;
    this.pan = { x: 0, y: 0 };
    this.paint();
  }
  paint() {
    if (!this.canvas) return;
    const rect = this.map.getBoundingClientRect();
    const maxX = (rect.width * (this.zoom - 1)) / 2,
      maxY = (rect.height * (this.zoom - 1)) / 2;
    this.pan.x = Math.max(-maxX, Math.min(maxX, this.pan.x));
    this.pan.y = Math.max(-maxY, Math.min(maxY, this.pan.y));
    this.canvas.style.setProperty(
      "transform",
      `translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.zoom})`,
    );
    this.canvas.style.setProperty("transform-origin", "center");
    this.map.classList.toggle("is-zoomed", this.zoom > 1);
    this.map.style.setProperty(
      "touch-action",
      this.zoom > 1 ? "none" : "pan-y",
    );
    const b = this.map.parentNode.querySelector(".cb-engine-zoom");
    if (b) {
      b.textContent = this.i18n.t(this.zoom > 1 ? "fit" : "zoom");
      b.setAttribute("aria-pressed", String(this.zoom > 1));
    }
  }
  down(e) {
    if (e.pointerType !== "touch") return;
    this.swipe = {
      x: e.clientX,
      y: e.clientY,
      target: e.target,
      time: Date.now(),
    };
    if (!this.map?.contains(e.target)) return;
    this.points.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.drag = { x: e.clientX, y: e.clientY, pan: { ...this.pan } };
    if (this.points.size === 2) {
      const [a, b] = [...this.points.values()];
      this.pinch = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        zoom: this.zoom,
      };
    }
    const token = e.target.closest(".cb-stop");
    if (token && this.points.size === 1 && !this.settings.get().holdConfirm) {
      this.longTimer = setTimeout(() => {
        this.longTimer = 0;
        this.suppressClick = true;
        this.preview(token);
      }, 500);
    }
  }
  move(e) {
    if (!this.points.has(e.pointerId)) return;
    const old = this.points.get(e.pointerId);
    if (Math.hypot(e.clientX - old.x, e.clientY - old.y) > 8) {
      clearTimeout(this.longTimer);
      this.longTimer = 0;
    }
    this.points.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.points.size === 2 && this.pinch) {
      const [a, b] = [...this.points.values()];
      this.zoom = clampZoom(
        (this.pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y)) /
          Math.max(1, this.pinch.distance),
      );
      this.suppressClick = true;
      this.paint();
    } else if (this.zoom > 1 && this.drag) {
      this.pan = {
        x: this.drag.pan.x + e.clientX - this.drag.x,
        y: this.drag.pan.y + e.clientY - this.drag.y,
      };
      this.suppressClick = true;
      this.paint();
    }
  }
  up(e) {
    clearTimeout(this.longTimer);
    this.longTimer = 0;
    this.points.delete(e.pointerId);
    if (!this.points.size) {
      this.drag = null;
      this.pinch = null;
    }
    if (e.pointerType !== "touch" || !this.swipe) return;
    const dx = e.clientX - this.swipe.x,
      dy = e.clientY - this.swipe.y;
    const target = this.swipe.target;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const settings = target.closest(".cb-engine-settings");
      if (settings) {
        this.settings.next(dx < 0 ? 1 : -1);
        this.suppressClick = true;
      } else {
        const dialog = target.closest("dialog[data-cb-pages]");
        dialog?.dispatchEvent(
          new CustomEvent("cb:page", { detail: { delta: dx < 0 ? 1 : -1 } }),
        );
      }
    }
    if (dy > 90 && dy > Math.abs(dx) * 1.5) {
      const sheet = target.closest("#pt-review-dialog");
      if (sheet && globalThis.innerWidth < 760)
        sheet.dispatchEvent(
          new globalThis.Event("cancel", { cancelable: true }),
        );
    }
    if (
      this.map?.contains(target) &&
      !target.closest("button") &&
      Math.abs(dx) < 10 &&
      Math.abs(dy) < 10
    ) {
      const now = Date.now();
      if (now - this.lastTap < 300) {
        this.toggle();
        this.lastTap = 0;
      } else this.lastTap = now;
    }
    this.swipe = null;
  }
  cancel(e) {
    clearTimeout(this.longTimer);
    this.longTimer = 0;
    this.points.delete(e.pointerId);
    this.drag = null;
    this.pinch = null;
    this.swipe = null;
  }
  click(e) {
    if (this.suppressClick) {
      this.suppressClick = false;
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    const token = e.target.closest?.(".cb-stop");
    if (!token || this.root.dataset.input !== "touch") return;
    if (this.selected !== token) {
      this.selected = token;
      this.focus.focus(token);
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  preview(token) {
    const api = this.core()?.getAPI?.();
    let stop = api?.STOPS?.find((s) => s.id === token.dataset.stopId);
    if (!stop) {
      const index = [...this.map.querySelectorAll(".cb-stop")].indexOf(token);
      stop = api?.STOPS?.[index];
    }
    if (!stop) return;
    const d = h(
      "dialog",
      { class: "cb-engine-dialog", "aria-label": this.i18n.t("preview") },
      [
        h("h2", { text: stop.name }),
        h("p", { text: api.W.chapters[stop.chap - 1] }),
        h("p", {
          text: this.i18n.t("starsCount", {
            count: starsFor(api.rec(stop.id)?.best || 0),
          }),
        }),
        button(this.i18n.t("previewPlay"), () => {
          d.close();
          this.core()?.startStop?.(stop.id);
        }),
        button(this.i18n.t("close"), () => d.close()),
      ],
    );
    this.root.append(d);
    d.addEventListener("close", () => {
      this.focus.pop(d);
      d.remove();
    });
    d.showModal();
    this.focus.push(d, token);
  }
}
