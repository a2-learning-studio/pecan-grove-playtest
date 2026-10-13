import { padActions } from "./pad-layout.js";
export { PAD_BUTTONS, padLayout, padActions } from "./pad-layout.js";
export class Gamepad {
  constructor({
    input,
    settings = () => ({}),
    window: win = globalThis.window,
    document: doc = globalThis.document,
    onDisconnect = () => {},
    onConnect = () => {},
  }) {
    this.input = input;
    this.settings = settings;
    this.win = win;
    this.doc = doc;
    this.onDisconnect = onDisconnect;
    this.onConnect = onConnect;
    this.connected = new Set();
    this.previous = new Map();
    this.frame = 0;
    this.pad = null;
    this.tick = this.tick.bind(this);
    this.connect = (e) => {
      this.connected.add(e.gamepad.index);
      this.pad = e.gamepad;
      this.onConnect(e.gamepad);
      this.start();
    };
    this.disconnect = (e) => {
      this.connected.delete(e.gamepad.index);
      this.previous.clear();
      if (!this.connected.size) this.stop();
      this.onDisconnect(e.gamepad);
    };
    this.visibility = () => (doc.hidden ? this.stop() : this.start());
    win.addEventListener("gamepadconnected", this.connect);
    win.addEventListener("gamepaddisconnected", this.disconnect);
    doc.addEventListener("visibilitychange", this.visibility);
    for (const pad of win.navigator.getGamepads?.() || [])
      if (pad) this.connected.add(pad.index);
    this.start();
  }
  start() {
    if (!this.frame && this.connected.size && !this.doc.hidden)
      this.frame = this.win.requestAnimationFrame(this.tick);
  }
  stop() {
    if (this.frame) this.win.cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.previous.clear();
  }
  tick(now) {
    this.frame = 0;
    if (this.doc.hidden || !this.connected.size) return;
    const pads = this.win.navigator.getGamepads?.() || [];
    const active = new Set();
    for (const pad of pads)
      if (pad && this.connected.has(pad.index)) {
        this.pad = pad;
        const cfg = this.settings();
        for (const action of padActions(pad, cfg.padSwap)) {
          const id = pad.index + ":" + action;
          active.add(id);
          const old = this.previous.get(id);
          const repeatable =
            action.startsWith("nav.") || action.startsWith("tab.");
          if (!old) {
            this.previous.set(id, { start: now, last: now, confirmed: false });
            if (action !== "confirm" || !cfg.holdConfirm)
              this.input.emit(action, { device: "gamepad" });
          } else if (
            action === "confirm" &&
            cfg.holdConfirm &&
            !old.confirmed &&
            now - old.start >= 600
          ) {
            old.confirmed = true;
            this.input.emit(action, { device: "gamepad" });
          } else if (
            repeatable &&
            now - old.start >= 350 &&
            now - old.last >= (Number(cfg.stickRepeat) || 110)
          ) {
            old.last = now;
            this.input.emit(action, { device: "gamepad", repeat: true });
          }
        }
      }
    for (const id of this.previous.keys())
      if (!active.has(id)) this.previous.delete(id);
    this.start();
  }
  rumble() {
    if (!this.settings().rumble) return;
    const promise = this.pad?.vibrationActuator?.playEffect?.("dual-rumble", {
      duration: 80,
      strongMagnitude: 0.2,
      weakMagnitude: 0,
    });
    promise?.catch?.(() => {});
  }
  destroy() {
    this.stop();
    this.win.removeEventListener("gamepadconnected", this.connect);
    this.win.removeEventListener("gamepaddisconnected", this.disconnect);
    this.doc.removeEventListener("visibilitychange", this.visibility);
  }
}
