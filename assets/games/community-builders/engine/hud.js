import { h, button, icon } from "./dom.js";
import { slotStars, starsFor } from "./store.js";
export class HUD {
  constructor({ root, core, slots, pause, i18n, focus, onSlots, onBadges }) {
    Object.assign(this, {
      root,
      core,
      slots,
      pause,
      i18n,
      focus,
      onSlots,
      onBadges,
    });
    this.lastAnnounce = -Infinity;
    this.pending = null;
    this.live = h("p", {
      class: "cb-vh",
      "aria-live": "polite",
      "data-cb-novoice": "",
    });
    root.append(this.live);
  }
  announce(text) {
    const delay = Math.max(0, 1500 - (Date.now() - this.lastAnnounce));
    clearTimeout(this.pending);
    if (delay) {
      this.pending = setTimeout(() => this.announce(text), delay);
      return;
    }
    this.lastAnnounce = Date.now();
    this.live.textContent = text;
    this.pending = null;
  }
  earned(score, previousBest = 0) {
    const count = starsFor(score) - starsFor(previousBest);
    if (count > 0) this.announce(this.i18n.t("starsEarned", { count }));
  }
  openMore(opener, tools, best) {
    if (this.dialog?.open) return;
    const d = h("dialog", {
      class: "cb-engine-dialog cb-hud-more-dialog",
      "aria-label": this.i18n.t("more"),
      "data-cb-utility": "",
      "data-cb-novoice": "",
    });
    d.append(h("h2", { text: this.i18n.t("more") }), h("p", { text: best }));
    for (const control of tools.querySelectorAll("button")) {
      if (control.classList.contains("cb-stophud__back")) continue;
      const proxy = button(
        control.getAttribute("aria-label") || control.textContent,
        () => {
          d.close();
          control.click();
        },
      );
      proxy.disabled = control.disabled;
      d.append(proxy);
    }
    d.append(button(this.i18n.t("close"), () => d.close()));
    this.root.append(d);
    d.addEventListener("close", () => {
      this.focus?.pop(d);
      d.remove();
      this.dialog = null;
    });
    d.showModal();
    this.dialog = d;
    this.focus?.push(d, opener);
  }
  render() {
    const state = this.core()?.getState?.() || {},
      player = this.slots.current();
    const stopHud = this.root.querySelector(".cb-stophud"),
      mapHud = this.root.querySelector(".cb-world__hud");
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
      const best = this.i18n.t("bestStars", {
        count: starsFor(record?.best || 0),
      });
      node.append(h("span", { class: "cb-engine-best", text: best }));
      const tools = stopHud.querySelector(".cb-stophud__tools");
      if (tools) {
        node.append(
          button(
            this.i18n.t("more"),
            (event) => this.openMore(event.currentTarget, tools, best),
            { class: "cb-btn cb-hud-more", "aria-haspopup": "dialog" },
          ),
        );
      }
      const steps = [...stopHud.querySelectorAll(".cb-step")];
      const current = steps.findIndex(
        (s) => s.getAttribute("aria-current") === "step",
      );
      const done = steps.filter(
        (s) => s.getAttribute("data-s") === "done",
      ).length;
      if (steps.length)
        node.append(
          h("progress", {
            max: steps.length,
            value: current >= 0 ? current + 1 : done,
            "aria-label": this.i18n.t("stopProgress"),
          }),
        );
    } else {
      const slotButton = button(this.i18n.t("slots"), () =>
        this.onSlots(document.activeElement),
      );
      const api = this.core()?.getAPI?.();
      const animal = api?.ANIMALS?.find(
        (item) => item.id === this.slots.store().current,
      );
      if (animal) slotButton.prepend(api.animalFace(animal));
      node.append(
        button(
          this.i18n.t("badges") + " " + Object.keys(player.badges).length,
          () => this.onBadges(document.activeElement),
        ),
        slotButton,
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
        bar = h("progress", { "aria-label": this.i18n.t("stopProgress") });
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
      text.textContent = this.i18n.t("roundPoints", { points });
    }
  }
  destroy() {
    clearTimeout(this.pending);
    this.dialog?.close();
    this.live.remove();
  }
}
