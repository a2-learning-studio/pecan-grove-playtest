import { h, button, icon } from "./dom.js";
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
    d.append(item("resume", () => this.close(), { "data-cb-nav-entry": "" }));
    if (inStop)
      d.append(
        item("restart", () =>
          this.confirm("restartQuestion", () => {
            this.close();
            this.core()?.startStop?.(state.stopId);
          }),
        ),
      );
    d.append(
      item("settings", () => this.settings.open(document.activeElement)),
    );
    if (inStop)
      d.append(
        item("map", () =>
          this.confirm("mapQuestion", () => {
            this.close();
            this.core()?.showMap?.();
          }),
        ),
      );
    d.append(
      item("badges", () => this.onBadges(document.activeElement)),
      item("slots", () => this.onSlots(document.activeElement)),
      item("quit", () => {
        this.close();
        this.onQuit();
      }),
    );
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
    this.focus.pop(d);
    d.remove();
    if (!this.settings.dialog?.open) this.core()?.resumePlay?.();
    this.fx?.pause(false);
    this.audio?.mute(document.hidden);
  }
  confirm(key, run) {
    const d = h(
      "dialog",
      { class: "cb-engine-dialog", "aria-label": this.i18n.t("pause") },
      [
        h("p", { text: this.i18n.t(key) }),
        button(this.i18n.t("yes"), () => {
          d.close();
          run();
        }),
        button(this.i18n.t("cancel"), () => d.close()),
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
