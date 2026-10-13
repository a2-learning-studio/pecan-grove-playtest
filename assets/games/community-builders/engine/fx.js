import { motion } from "./motion.js";
export class FX {
  constructor(root, win = globalThis.window) {
    this.root = root;
    this.win = win;
    this.pool = [];
    this.canvas = null;
    this.context = null;
    this.frame = 0;
    this.paused = false;
    this.last = 0;
    this.animations = new Set();
    this.render = this.render.bind(this);
  }
  burst(x, y, { kind = "sparkle" } = {}) {
    if (!motion.allowed() || this.paused) return;
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvas.className = "cb-fx";
      this.canvas.setAttribute("aria-hidden", "true");
      this.root.append(this.canvas);
      this.context = this.canvas.getContext("2d");
      if (!this.context) {
        this.canvas.remove();
        this.canvas = null;
        return;
      }
    }
    const rect = this.root.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    const style = this.win.getComputedStyle(this.root);
    const color = style
      .getPropertyValue(
        kind === "leaves"
          ? "--pg-chapter-3"
          : kind === "pecans"
            ? "--pg-pecan"
            : "--pg-gold",
      )
      .trim();
    const count = Math.max(0, 24 - this.pool.length);
    for (let i = 0; i < count; i++) {
      const angle = (i / 24) * Math.PI * 2;
      this.pool.push({
        x: x - rect.left,
        y: y - rect.top,
        vx: Math.cos(angle) * (1 + (i % 4)),
        vy: Math.sin(angle) * 3 - 2,
        life: 0,
        color,
      });
    }
    this.start();
  }
  start() {
    if (!this.frame && !this.paused && this.pool.length) {
      this.last = 0;
      this.frame = this.win.requestAnimationFrame(this.render);
    }
  }
  render(time) {
    this.frame = 0;
    if (!motion.allowed()) {
      this.clear();
      return;
    }
    if (this.paused) return;
    const dt = this.last ? Math.min(32, time - this.last) : 16;
    this.last = time;
    const ctx = this.context;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.pool = this.pool.filter((p) => p.life < 900);
    for (const p of this.pool) {
      p.life += dt;
      p.x += (p.vx * dt) / 16;
      p.y += (p.vy * dt) / 16;
      p.vy += 0.06;
      ctx.globalAlpha = Math.max(0, 1 - p.life / 900);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
    }
    if (this.pool.length)
      this.frame = this.win.requestAnimationFrame(this.render);
    else this.clear();
  }
  animate(node, frames, ms) {
    if (!node || !motion.allowed()) return;
    const animation = node.animate?.(frames, {
      duration: ms,
      easing: "cubic-bezier(0.16,1,0.3,1)",
    });
    if (animation) {
      this.animations.add(animation);
      const remove = () => this.animations.delete(animation);
      animation.addEventListener?.("finish", remove, { once: true });
      animation.addEventListener?.("cancel", remove, { once: true });
      if (this.paused) animation.pause();
    }
  }
  stamp(node) {
    this.animate(
      node,
      [
        { transform: "scale(.96)" },
        { transform: "scale(1.04)" },
        { transform: "scale(1)" },
      ],
      320,
    );
  }
  pulse(node) {
    this.animate(
      node,
      [
        { filter: "brightness(1)" },
        { filter: "brightness(1.08)" },
        { filter: "brightness(1)" },
      ],
      320,
    );
  }
  nudge(node) {
    this.animate(
      node,
      [
        { transform: "translateX(0)" },
        { transform: "translateX(4px)" },
        { transform: "translateX(-4px)" },
        { transform: "translateX(0)" },
      ],
      320,
    );
  }
  pause(value) {
    this.paused = value;
    for (const animation of this.animations) value ? animation.pause() : animation.play();
    if (value) {
      if (this.frame) this.win.cancelAnimationFrame(this.frame);
      this.frame = 0;
    } else this.start();
  }
  clear() {
    for (const animation of this.animations) animation.cancel();
    this.animations.clear();
    if (this.frame) this.win.cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.pool = [];
    this.canvas?.remove();
    this.canvas = null;
    this.context = null;
  }
}
