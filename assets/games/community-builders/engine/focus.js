const SELECTOR =
  'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"], [data-cb-nav]';
export function visible(node) {
  const r = node.getBoundingClientRect();
  return (
    r.width > 0 &&
    r.height > 0 &&
    !node.closest("[hidden], [inert]") &&
    !node.disabled
  );
}
export function focusables(scope) {
  return [...scope.querySelectorAll(SELECTOR)].filter(visible);
}
export function spatialScore(from, to, direction) {
  const a = { x: from.left + from.width / 2, y: from.top + from.height / 2 },
    b = { x: to.left + to.width / 2, y: to.top + to.height / 2 };
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const horizontal = direction === "left" || direction === "right";
  const primary = horizontal
    ? direction === "left"
      ? -dx
      : dx
    : direction === "up"
      ? -dy
      : dy;
  return primary > 0
    ? primary + 2.5 * Math.abs(horizontal ? dy : dx)
    : Infinity;
}
export function chooseSpatial(current, candidates, direction) {
  const row = current.closest?.('[data-cb-nav-group="row"]');
  const sameRow = (direction === "left" || direction === "right") && row;
  const pool = sameRow
    ? candidates.filter(
        (node) => node.closest?.('[data-cb-nav-group="row"]') === row,
      )
    : candidates;
  let chosen = null,
    best = Infinity;
  for (const node of pool)
    if (node !== current) {
      const score = spatialScore(
        current.getBoundingClientRect(),
        node.getBoundingClientRect(),
        direction,
      );
      if (score < best) {
        best = score;
        chosen = node;
      }
    }
  if (!chosen && row && sameRow)
    chosen = direction === "left" ? pool.at(-1) : pool[0];
  return chosen;
}
export class Focus {
  constructor(root, doc = globalThis.document) {
    this.root = root;
    this.doc = doc;
    this.stack = [];
  }
  active() {
    const dialogs = [...this.doc.querySelectorAll("dialog[open]")].filter(
      visible,
    );
    if (dialogs.length) return dialogs.at(-1);
    return this.stack.at(-1)?.element || this.root;
  }
  push(element, opener = this.doc.activeElement) {
    this.stack.push({ element, opener });
    this.focus(
      element.querySelector("[data-cb-nav-entry]") || focusables(element)[0],
    );
  }
  pop(element) {
    const i = this.stack.findIndex((item) => item.element === element);
    if (i < 0) return;
    const item = this.stack.splice(i, 1)[0];
    if (item.opener?.isConnected) this.focus(item.opener);
  }
  focus(node) {
    if (!node) return false;
    try {
      node.focus({ preventScroll: true, focusVisible: true });
    } catch {
      node.focus();
    }
    node.classList.add("is-kbd-focus");
    node.addEventListener("blur", () => node.classList.remove("is-kbd-focus"), {
      once: true,
    });
    node.scrollIntoView?.({
      block: "nearest",
      inline: "nearest",
      behavior: "auto",
    });
    return true;
  }
  move(direction) {
    const active = this.active();
    const current = this.doc.activeElement;
    if (
      this.root.dataset.input === "gamepad" &&
      active.contains(current) &&
      (direction === "left" || direction === "right")
    ) {
      const delta = direction === "right" ? 1 : -1;
      if (current.matches('input[type="range"]')) {
        const step = Number(current.step) || 1;
        current.value = String(
          Math.max(
            Number(current.min) || 0,
            Math.min(
              Number(current.max) || 100,
              Number(current.value) + delta * step,
            ),
          ),
        );
        current.dispatchEvent(new globalThis.Event("input", { bubbles: true }));
        return true;
      }
      if (current.matches("select")) {
        const options = [...current.options].filter(
          (option) => !option.disabled,
        );
        const index = options.indexOf(current.selectedOptions[0]);
        const next = options[(index + delta + options.length) % options.length];
        if (next) {
          current.value = next.value;
          current.dispatchEvent(
            new globalThis.Event("change", { bubbles: true }),
          );
        }
        return true;
      }
    }
    const items = focusables(active);
    if (!items.length) return false;
    const next = items.includes(current)
      ? chooseSpatial(current, items, direction)
      : active.querySelector("[data-cb-nav-entry]") || items[0];
    return this.focus(next);
  }
  path(delta) {
    const items = [
      ...this.active().querySelectorAll(".cb-world__canvas .cb-stop"),
    ].filter(visible);
    if (!items.length) return false;
    const i = items.indexOf(this.doc.activeElement);
    return this.focus(items[(i + delta + items.length) % items.length]);
  }
  confirm() {
    const node = this.doc.activeElement;
    if (!node || !this.active().contains(node) || node.disabled) return false;
    if (
      node.matches(
        'button, a[href], input[type="checkbox"], input[type="radio"]',
      )
    ) {
      node.click();
      return true;
    }
    return false;
  }
  choice(n) {
    const scope = this.active();
    const current = this.doc.activeElement;
    const group =
      current?.closest?.("[data-cb-choices]") ||
      [...scope.querySelectorAll("[data-cb-choices]")].find(visible);
    const node = group?.querySelector('[data-cb-choice="' + n + '"]');
    if (!node || !visible(node)) return false;
    this.focus(node);
    node.click();
    return true;
  }
}
