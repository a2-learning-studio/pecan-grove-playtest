import { h, button, icon } from "./dom.js";
import { slotStars, starsFor } from "./store.js";
export class HUD {
  constructor({ root, core, slots, pause, i18n, onSlots, onBadges }) {
    Object.assign(this, { root, core, slots, pause, i18n, onSlots, onBadges });
    this.lastAnnounce = 0;
    this.pending = null;
  }
  render() {
    const state = this.core()?.getState?.() || {},
      player = this.slots.current();
    const stopHud = this.root.querySelector(".cb-stophud");
    const mapHud = this.root.querySelector(".cb-world__hud");
    const host = stopHud || mapHud;
    if (!host) return;
    let node = host.querySelector(".cb-engine-hud");
    if (!node) {
      node = h("div", { class: "cb-engine-hud", "data-cb-novoice": "" });
      host.append(node);
    }
    node.replaceChildren();
    node.append(this.pause.control());
    const summary = h("span", { class: "cb-engine-stars" });
    summary.append(
      icon("star"),
      document.createTextNode(slotStars(player) + " / 45"),
    );
    node.append(summary);
    if (stopHud) {
      const record = player.stops[state.stopId];
      const best = h("span", {
        class: "cb-engine-best",
        text:
          (this.i18n.language === "es" ? "Mejor: " : "Best: ") +
          starsFor(record?.best || 0) +
          " / 3",
      });
      node.append(best);
      const steps = [...stopHud.querySelectorAll(".cb-step")],
        current = steps.findIndex(
          (s) => s.getAttribute("aria-current") === "step",
        );
      if (steps.length) {
        const progress = h("progress", {
          max: steps.length,
          value: Math.max(0, current + 1),
          "aria-label":
            this.i18n.language === "es"
              ? "Progreso de la parada"
              : "Stop progress",
        });
        node.append(progress);
      }
    } else {
      node.append(
        button(
          this.i18n.t("badges") + " " + Object.keys(player.badges).length,
          () => this.onBadges(document.activeElement),
        ),
        button(this.i18n.t("slots"), () =>
          this.onSlots(document.activeElement),
        ),
      );
    }
    const offline = h("span", {
      class: "cb-engine-offline",
      text: this.i18n.t("offline"),
    });
    offline.hidden = navigator.onLine !== false;
    node.append(offline);
    this.node = node;
  }
  set({ progress, points } = {}) {
    if (!this.node) return;
    if (progress) {
      let bar = this.node.querySelector("progress");
      if (!bar) {
        bar = h("progress", {
          "aria-label":
            this.i18n.language === "es"
              ? "Progreso de la parada"
              : "Stop progress",
        });
        this.node.append(bar);
      }
      bar.max = progress[1];
      bar.value = progress[0];
    }
    if (points != null) {
      let text = this.node.querySelector(".cb-engine-points");
      if (!text) {
        text = h("span", { class: "cb-engine-points" });
        this.node.append(text);
      }
      text.textContent =
        (this.i18n.language === "es"
          ? "Puntos de la ronda: "
          : "Points this round: ") + points;
    }
  }
}
