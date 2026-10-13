import { safeGet, safeSet } from "./dom.js";
export const DEFAULT_BINDINGS = Object.freeze({
  "nav.up": ["ArrowUp", "KeyW"],
  "nav.down": ["ArrowDown", "KeyS"],
  "nav.left": ["ArrowLeft", "KeyA"],
  "nav.right": ["ArrowRight", "KeyD"],
  confirm: ["Enter", "Space"],
  back: ["Backspace"],
  pause: ["Escape", "KeyP"],
  "tab.prev": ["KeyQ", "BracketLeft"],
  "tab.next": ["KeyE", "BracketRight"],
  "voice.toggle": ["KeyM"],
  "voice.replay": ["KeyR"],
  "voice.stop": ["KeyV"],
  "captions.toggle": ["KeyC"],
  "fullscreen.toggle": ["KeyF"],
  help: ["Slash", "F1"],
  "map.zoom": ["KeyZ", "Equal", "Minus"],
});
export function reserved(event) {
  return (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    [
      "Tab",
      "F5",
      "F11",
      "MetaLeft",
      "MetaRight",
      "AltLeft",
      "AltRight",
      "ControlLeft",
      "ControlRight",
      "ShiftLeft",
      "ShiftRight",
      "OSLeft",
      "OSRight",
    ].includes(event.code)
  );
}
export function keyName(code) {
  return (
    {
      Space: "Space",
      ArrowUp: "↑",
      ArrowDown: "↓",
      ArrowLeft: "←",
      ArrowRight: "→",
      BracketLeft: "[",
      BracketRight: "]",
      Slash: "?",
      Equal: "+",
      Minus: "−",
    }[code] || code.replace(/^(Key|Digit|Numpad)/, "")
  );
}
export class Bindings {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.listeners = new Set();
    this.defaults = structuredClone(DEFAULT_BINDINGS);
    this.value = structuredClone(DEFAULT_BINDINGS);
    const saved = safeGet(storage, "pecan-grove-bindings-v1", {});
    for (const action of Object.keys(this.value))
      if (
        Array.isArray(saved[action]) &&
        saved[action].every(
          (code) => typeof code === "string" && !reserved({ code }),
        )
      )
        this.value[action] = saved[action].slice(0, 2);
  }
  action(event) {
    const number = /^(?:Digit|Numpad)([1-9])$/.exec(event.code);
    if (number) return "choice." + number[1];
    if (event.code === "Slash" && event.key !== "?") return null;
    for (const [action, codes] of Object.entries(this.value))
      if (codes.includes(event.code)) return action;
    return null;
  }
  conflict(code, action) {
    return (
      Object.keys(this.value).find(
        (id) => id !== action && this.value[id].includes(code),
      ) || null
    );
  }
  assign(action, event, swap = false) {
    if (!this.value[action] || reserved(event))
      return { ok: false, reason: "reserved" };
    const conflict = this.conflict(event.code, action);
    if (conflict && !swap) return { ok: false, reason: "conflict", conflict };
    const previous = this.value[action][0];
    if (conflict)
      this.value[conflict] = this.value[conflict].map((code) =>
        code === event.code ? previous : code,
      );
    this.value[action] = [
      event.code,
      ...this.value[action].slice(1).filter((code) => code !== event.code),
    ];
    this.save();
    return { ok: true };
  }
  save() {
    const ok = safeSet(this.storage, "pecan-grove-bindings-v1", this.value);
    for (const f of this.listeners) f(this.value);
    return ok;
  }
  reset() {
    this.value = structuredClone(this.defaults);
    this.save();
  }
  onChange(handler) {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }
}
