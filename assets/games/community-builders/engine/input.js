import { Bindings } from "./bindings.js";
export const ACTIONS = Object.freeze([
  "nav.up",
  "nav.down",
  "nav.left",
  "nav.right",
  "confirm",
  "back",
  "pause",
  ...Array.from({ length: 9 }, (_, i) => "choice." + (i + 1)),
  "tab.prev",
  "tab.next",
  "voice.toggle",
  "voice.replay",
  "voice.stop",
  "captions.toggle",
  "fullscreen.toggle",
  "help",
  "map.zoom",
]);
export function typingContext(target) {
  return !!target?.closest?.(
    'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [data-pg-native]',
  );
}
export function nativeArrows(target) {
  return (
    !target ||
    target.tagName === "BODY" ||
    !!target.closest?.(
      'input[type="range"], input[type="radio"], [role="slider"], [role="listbox"], [role="tablist"], [role="menu"]',
    ) ||
    !target.closest?.('button, a[href], input, [tabindex="0"], [data-cb-nav]')
  );
}
export function guarded(event, root, scope, paused = false) {
  if (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.isComposing ||
    typingContext(event.target)
  )
    return true;
  if (!scope || !scope.contains(event.target)) return true;
  if (
    paused ||
    (root?.hasAttribute?.("data-playtest-paused") &&
      !scope.matches?.("dialog[open]"))
  )
    return true;
  if (event.key?.startsWith("Arrow") && nativeArrows(event.target)) return true;
  return false;
}
export class Input {
  constructor({
    root,
    document: doc = globalThis.document,
    bindings,
    scope,
    settings = () => ({}),
    paused = () => false,
  } = {}) {
    this.root = root;
    this.doc = doc;
    this.bindings = bindings || new Bindings();
    this.scope = scope || (() => root);
    this.settings = settings;
    this.paused = paused;
    this.device = "mouse";
    this.handlers = new Map();
    this.capture = null;
    this.hold = null;
    this.keydown = this.keydown.bind(this);
    this.pointer = (e) => {
      this.setDevice(e.pointerType === "touch" ? "touch" : "mouse");
      this.beginPointerHold(e);
    };
    doc.addEventListener("keydown", this.keydown, true);
    doc.addEventListener("pointerdown", this.pointer, true);
    this.keyup = (e) => {
      if (this.hold?.code === e.code) {
        clearTimeout(this.hold.timer);
        this.hold = null;
      }
    };
    doc.addEventListener("keyup", this.keyup, true);
    this.pointerup = (e) => {
      if (this.pointerHold?.id === e.pointerId) {
        clearTimeout(this.pointerHold.timer);
        this.pointerHold = null;
        this.suppressPointerClickUntil = Date.now() + 700;
      }
    };
    this.pointercancel = () => {
      if (this.pointerHold) clearTimeout(this.pointerHold.timer);
      this.pointerHold = null;
    };
    this.pointermove = (e) => {
      if (
        this.pointerHold &&
        Math.hypot(
          e.clientX - this.pointerHold.x,
          e.clientY - this.pointerHold.y,
        ) > 8
      )
        this.pointercancel();
    };
    this.click = (e) => {
      if (
        Date.now() < (this.suppressPointerClickUntil || 0) &&
        e.detail !== 0
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.suppressPointerClickUntil = 0;
      }
    };
    this.focusin = (e) => {
      if (this.hold) {
        clearTimeout(this.hold.timer);
        this.hold = null;
      }
      if (this.pointerHold && !this.pointerHold.target.contains(e.target))
        this.pointercancel();
    };
    doc.addEventListener("pointerup", this.pointerup, true);
    doc.addEventListener("pointercancel", this.pointercancel, true);
    doc.addEventListener("pointermove", this.pointermove, true);
    doc.addEventListener("click", this.click, true);
    doc.addEventListener("focusin", this.focusin, true);
    root.dataset.input = this.device;
  }
  beginPointerHold(event) {
    if (
      !this.settings().holdConfirm ||
      event.button !== 0 ||
      guarded(event, this.root, this.scope(), this.paused())
    )
      return;
    const target = event.target.closest?.("button, a[href]");
    if (!target || target.disabled) return;
    this.pointercancel();
    this.pointerHold = {
      id: event.pointerId,
      target,
      x: event.clientX,
      y: event.clientY,
      timer: setTimeout(() => {
        if (target.isConnected && this.scope()?.contains(target)) {
          target.focus({ preventScroll: true });
          target.click();
        }
      }, 600),
    };
  }
  setDevice(device) {
    if (device === this.device) return;
    this.device = device;
    this.root.dataset.input = device;
    this.doc.dispatchEvent(
      new CustomEvent("cb:input-device", { detail: { device } }),
    );
  }
  on(action, handler, { scope } = {}) {
    const list = this.handlers.get(action) || [];
    const item = { handler, scope };
    list.push(item);
    this.handlers.set(action, list);
    return () => {
      this.handlers.set(
        action,
        (this.handlers.get(action) || []).filter((x) => x !== item),
      );
    };
  }
  off(action, handler) {
    this.handlers.set(
      action,
      (this.handlers.get(action) || []).filter(
        (item) => item.handler !== handler,
      ),
    );
  }
  emit(action, { repeat = false, device = this.device, event = null } = {}) {
    const scope = this.scope();
    if (
      !scope ||
      (this.root.hasAttribute("data-playtest-paused") &&
        !scope.matches?.("dialog[open]"))
    )
      return false;
    this.setDevice(device);
    const detail = { action, device, repeat };
    scope.dispatchEvent(
      new CustomEvent("cb:action", { detail, bubbles: true }),
    );
    const target = event?.target || this.doc.activeElement;
    const eligible = (this.handlers.get(action) || [])
      .filter(
        (item) =>
          !item.scope ||
          (item.scope.isConnected !== false &&
            (item.scope === scope ||
              (scope.contains?.(item.scope) && item.scope.contains?.(target)))),
      )
      .sort((a, b) => {
        if (a.scope === b.scope) return 0;
        if (!a.scope) return b.scope ? 1 : 0;
        if (!b.scope) return -1;
        return a.scope.contains?.(b.scope)
          ? 1
          : b.scope.contains?.(a.scope)
            ? -1
            : 0;
      });
    for (const item of eligible)
      if (item.handler(detail, event) !== false) return true;
    return false;
  }
  keydown(event) {
    if (this.capture) {
      this.capture(event);
      return;
    }
    this.setDevice("keyboard");
    if (guarded(event, this.root, this.scope(), this.paused())) return;
    const action = this.bindings.action(event);
    if (!action) return;
    if (action.startsWith("nav.") && this.settings().wasdNav === false) return;
    if (action === "confirm" && this.settings().holdConfirm) {
      event.preventDefault();
      event.stopPropagation();
      if (!this.hold)
        this.hold = {
          code: event.code,
          timer: setTimeout(() => {
            if (this.hold) this.hold.fired = true;
            this.emit(action, { event });
          }, 600),
        };
      return;
    }
    // Enter and Space keep the browser's native button and link activation.
    if (action === "confirm" && ["Enter", "Space"].includes(event.code)) return;
    if (this.emit(action, { repeat: event.repeat, event })) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
  destroy() {
    this.doc.removeEventListener("keydown", this.keydown, true);
    this.doc.removeEventListener("pointerdown", this.pointer, true);
    this.doc.removeEventListener("keyup", this.keyup, true);
    this.doc.removeEventListener("pointerup", this.pointerup, true);
    this.doc.removeEventListener("pointercancel", this.pointercancel, true);
    this.doc.removeEventListener("pointermove", this.pointermove, true);
    this.doc.removeEventListener("click", this.click, true);
    this.doc.removeEventListener("focusin", this.focusin, true);
    if (this.hold) clearTimeout(this.hold.timer);
    this.pointercancel();
  }
}
