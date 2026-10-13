import { h, button } from "./dom.js";
import { starsFor } from "./store.js";
import { motion } from "./motion.js";
export const clampZoom = (value) => Math.max(1, Math.min(2.5, value));
export function zoomToPair(bounds, current, previous = current) {
  const points = [current, previous].map((rect) => ({
    x: (rect.left + rect.right) / 2,
    y: (rect.top + rect.bottom) / 2,
  }));
  const pad = 36;
  const zoom = clampZoom(
    Math.min(
      1.8,
      (bounds.width - pad * 2) /
        Math.max(pad * 2, Math.abs(points[0].x - points[1].x) + pad),
      (bounds.height - pad * 2) /
        Math.max(pad * 2, Math.abs(points[0].y - points[1].y) + pad),
    ),
  );
  return {
    zoom,
    pan: {
      x:
        (bounds.left + bounds.width / 2 - (points[0].x + points[1].x) / 2) *
        zoom,
      y:
        (bounds.top + bounds.height / 2 - (points[0].y + points[1].y) / 2) *
        zoom,
    },
  };
}
export class Gestures {
  constructor({ root, i18n, focus, core, settings }) {
    Object.assign(this, { root, i18n, focus, core, settings });
    this.win = root.ownerDocument.defaultView;
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
    root.addEventListener("focusin", (e) => this.reveal(e.target));
  }
  refresh() {
    this.stopCoast();
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
      (
        this.map.parentNode.querySelector(".cb-map-controls") ||
        this.map.parentNode
      ).append(b);
    }
    this.paint();
  }
  toggle() {
    this.stopCoast();
    const zooming = this.zoom === 1;
    this.zoom = zooming ? 1.8 : 1;
    this.pan = { x: 0, y: 0 };
    if (zooming && this.map) {
      const tokens = [...this.map.querySelectorAll(".cb-stop")];
      const active = this.root.ownerDocument.activeElement;
      const selected = tokens.includes(active)
        ? active
        : tokens.find((node) =>
            ["started", "next"].includes(node.dataset.state),
          );
      if (selected)
        Object.assign(
          this,
          zoomToPair(
            this.map.getBoundingClientRect(),
            selected.getBoundingClientRect(),
            (
              tokens[tokens.indexOf(selected) - 1] || selected
            ).getBoundingClientRect(),
          ),
        );
    }
    this.paint();
  }
  reveal(node) {
    if (
      this.zoom <= 1 ||
      !this.map?.contains(node) ||
      !node.matches(".cb-stop")
    )
      return;
    const viewport = this.map.getBoundingClientRect(),
      box = node.getBoundingClientRect(),
      pad = 12;
    if (box.left < viewport.left + pad)
      this.pan.x += viewport.left + pad - box.left;
    else if (box.right > viewport.right - pad)
      this.pan.x -= box.right - viewport.right + pad;
    if (box.top < viewport.top + pad)
      this.pan.y += viewport.top + pad - box.top;
    else if (box.bottom > viewport.bottom - pad)
      this.pan.y -= box.bottom - viewport.bottom + pad;
    this.paint();
  }
  stopCoast() {
    if (this.coastFrame) this.win.cancelAnimationFrame(this.coastFrame);
    this.coastFrame = 0;
    this.velocity = null;
  }
  coast() {
    if (!motion.allowed() || !this.velocity || this.zoom <= 1) return;
    let last = this.win.performance.now(),
      elapsed = 0;
    const frame = (now) => {
      this.coastFrame = 0;
      if (!motion.allowed() || !this.canvas?.isConnected || !this.velocity)
        return this.stopCoast();
      const dt = Math.min(32, now - last);
      last = now;
      elapsed += dt;
      const old = { ...this.pan };
      this.pan.x += this.velocity.x * dt;
      this.pan.y += this.velocity.y * dt;
      this.paint();
      const decay = Math.pow(0.9, dt / 16);
      this.velocity.x *= decay;
      this.velocity.y *= decay;
      if (
        elapsed < 500 &&
        Math.hypot(this.velocity.x, this.velocity.y) > 0.02 &&
        (old.x !== this.pan.x || old.y !== this.pan.y)
      )
        this.coastFrame = this.win.requestAnimationFrame(frame);
      else this.stopCoast();
    };
    this.coastFrame = this.win.requestAnimationFrame(frame);
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
    this.canvas.dispatchEvent(new this.win.Event("cb:map-transform"));
  }
  down(e) {
    if (e.pointerType !== "touch") return;
    this.stopCoast();
    this.swipe = {
      x: e.clientX,
      y: e.clientY,
      target: e.target,
      time: Date.now(),
    };
    if (!this.map?.contains(e.target)) return;
    this.points.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.drag = {
      x: e.clientX,
      y: e.clientY,
      pan: { ...this.pan },
      last: {
        x: e.clientX,
        y: e.clientY,
        at: e.timeStamp || this.win.performance.now(),
      },
    };
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
      const now = e.timeStamp || this.win.performance.now(),
        dt = Math.max(1, now - this.drag.last.at);
      this.velocity = {
        x: (e.clientX - this.drag.last.x) / dt,
        y: (e.clientY - this.drag.last.y) / dt,
      };
      this.drag.last = { x: e.clientX, y: e.clientY, at: now };
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
      if (!this.pinch) this.coast();
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
        const dialog = target.closest("[data-cb-pages]");
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
    this.stopCoast();
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
            count: starsFor(api.rec?.(stop.id)?.best || 0),
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
