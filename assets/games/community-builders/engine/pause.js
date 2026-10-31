import { h, button, icon } from "./dom.js";
import { scrollport } from "./scene-layout.js";
export class Pause {
  constructor({
    root,
    focus,
    core,
    i18n,
    settings,
    fx,
    audio,
    onBadges = () => {},
    onSlots = () => {},
    onQuit = () => {},
  }) {
    Object.assign(this, {
      root,
      focus,
      core,
      i18n,
      settings,
      fx,
      audio,
      onBadges,
      onSlots,
      onQuit,
    });
    this.dialog = null;
    this.background = [];
  }
  open(opener = document.activeElement) {
    if (this.dialog?.open) {
      this.close();
      return;
    }
    const state = this.core()?.getState?.() || {},
      inStop = state.mode === "stop" && state.inStop !== false;
    const d = h("dialog", {
      class: "cb-engine-dialog cb-pause",
      "aria-labelledby": "cb-engine-pause-title",
      "data-cb-novoice": "",
    });
    d.append(
      h("h2", { id: "cb-engine-pause-title", text: this.i18n.t("pause") }),
    );
    const item = (key, run, attrs = {}) => button(this.i18n.t(key), run, attrs);
    // Back to play first and marked as the main choice, then the safe
    // places, then, below a line, the ways out of this round.
    d.append(
      item("resume", () => this.close(), {
        class: "cb-btn cb-btn--primary",
        "data-cb-nav-entry": "",
      }),
      item("settings", () => this.settings.open(document.activeElement)),
      item("badges", () => this.onBadges(document.activeElement)),
      item("slots", () => this.onSlots(document.activeElement)),
      h("div", { class: "cb-pause__rule", "aria-hidden": "true" }),
    );
    if (inStop)
      d.append(
        item("restart", () =>
          this.confirm("restartQuestion", "restart", () => {
            this.close();
            this.core()?.startStop?.(state.stopId);
          }),
        ),
        item("map", () =>
          this.confirm("mapQuestion", "map", () => {
            this.close();
            this.core()?.showMap?.();
          }),
        ),
      );
    d.append(
      item("quit", () => {
        this.close();
        this.onQuit();
      }),
    );
    // Pausing never moves the scene: the scroll position comes back with play.
    const port = scrollport(this.root);
    this.scroll = port ? [port, port.scrollTop] : null;
    for (const node of this.root.children)
      if (node !== d && node.tagName !== "DIALOG") {
        this.background.push([node, node.inert]);
        node.inert = true;
      }
    this.root.append(d);
    this.dialog = d;
    this.root.classList.add("is-paused");
    this.core()?.pause?.();
    this.fx?.pause(true);
    this.audio?.mute(true);
    d.addEventListener("close", () => this.finish());
    d.addEventListener("cancel", (e) => {
      e.preventDefault();
      this.close();
    });
    d.showModal();
    this.focus.push(d, opener);
  }
  close() {
    if (this.dialog?.open) this.dialog.close();
    else if (this.dialog) this.finish();
  }
  finish() {
    const d = this.dialog;
    if (!d) return;
    this.dialog = null;
    for (const [node, inert] of this.background) node.inert = inert;
    this.background = [];
    this.root.classList.remove("is-paused");
    const [port, top] = this.scroll || [];
    if (port?.isConnected && Math.abs(port.scrollTop - top) > 1)
      port.scrollTop = top;
    this.scroll = null;
    this.focus.pop(d);
    d.remove();
    if (!this.settings.dialog?.open) this.core()?.resumePlay?.();
    this.fx?.pause(false);
    this.audio?.mute(document.hidden);
  }
  // The question names the dialog; the safe choice comes first and has focus,
  // and the other button says what it does ("Town map", "Restart stop").
  confirm(key, action, run) {
    const id = "cb-engine-confirm-" + key;
    const d = h(
      "dialog",
      { class: "cb-engine-dialog cb-pause-confirm", "aria-labelledby": id },
      [
        h("h2", { id, text: this.i18n.t(key) }),
        h("div", { class: "cb-pause-confirm__actions" }, [
          button(this.i18n.t("cancel"), () => d.close(), {
            class: "cb-btn cb-btn--go",
            "data-cb-nav-entry": "",
          }),
          button(this.i18n.t(action), () => {
            d.close();
            run();
          }),
        ]),
      ],
    );
    this.root.append(d);
    d.addEventListener("close", () => {
      this.focus.pop(d);
      d.remove();
    });
    d.showModal();
    this.focus.push(d);
  }
  control() {
    const b = button(this.i18n.t("pause"), () => this.open(b), {
      class: "cb-btn cb-engine-pause-button",
      "aria-label": this.i18n.t("pause"),
    });
    b.prepend(icon("pause"));
    return b;
  }
}
