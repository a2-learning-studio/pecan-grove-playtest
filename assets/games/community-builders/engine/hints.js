import { h, icon } from "./dom.js";
import { padLayout } from "./pad-layout.js";
export function screenHints(root, i18n) {
  if (!["map", "stop"].includes(root.dataset.screen)) return [];
  if (root.dataset.screen === "map")
    return [
      { action: "nav.right", label: i18n.t("hintMove") },
      { action: "confirm", label: i18n.t("hintChoose") },
      { action: "map.zoom", label: i18n.t("zoom") },
      { action: "pause", label: i18n.t("hintPause") },
    ];
  const groups = [...root.querySelectorAll(".cb-main [data-cb-choices]")];
  const active =
    root.ownerDocument.activeElement?.closest?.("[data-cb-choices]");
  const group = groups.includes(active)
    ? active
    : groups.find((node) => !node.closest("[hidden], [inert]"));
  const count = Math.min(
    9,
    group?.querySelectorAll("[data-cb-choice]:not(:disabled)").length || 0,
  );
  const items = [{ action: "nav.right", label: i18n.t("hintMove") }];
  if (count)
    items.push({
      action: "choice",
      label: i18n.t("hintPickCount", { count }),
      keys: "1–" + count,
    });
  items.push(
    { action: "confirm", label: i18n.t("hintChoose") },
    { action: "pause", label: i18n.t("hintPause") },
  );
  return items;
}
export function controllerGlyph(
  action,
  layout = "xbox",
  document = globalThis.document,
) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const circle = document.createElementNS(svg.namespaceURI, "circle");
  circle.setAttribute("cx", "12");
  circle.setAttribute("cy", "12");
  circle.setAttribute("r", "10");
  circle.setAttribute("fill", "none");
  circle.setAttribute("stroke", "currentColor");
  circle.setAttribute("stroke-width", "1.5");
  svg.append(circle);
  if (
    layout === "playstation" &&
    ["confirm", "back", "voice.replay", "help"].includes(action)
  ) {
    const path = document.createElementNS(svg.namespaceURI, "path");
    path.setAttribute(
      "d",
      {
        confirm: "m8 8 8 8M16 8l-8 8",
        back: "M17 12a5 5 0 1 1-10 0 5 5 0 1 1 10 0",
        "voice.replay": "M7 7h10v10H7Z",
        help: "m12 6 6 11H6Z",
      }[action],
    );
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.5");
    svg.append(path);
  } else {
    const text = document.createElementNS(svg.namespaceURI, "text");
    text.setAttribute("x", "12");
    text.setAttribute("y", "16");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "10");
    text.setAttribute("fill", "currentColor");
    text.textContent =
      {
        confirm: layout === "nintendo" ? "B" : "A",
        back: layout === "nintendo" ? "A" : "B",
        "voice.replay": "X",
        help: "Y",
        pause: "≡",
        "tab.prev": "LB",
        "tab.next": "RB",
        "nav.up": "↑",
        "nav.down": "↓",
        "nav.left": "←",
        "nav.right": "→",
      }[action] || "A";
    svg.append(text);
  }
  return svg;
}
export class Hints {
  constructor({ root, input, i18n, settings, pad = () => null }) {
    Object.assign(this, { root, input, i18n, settings, pad });
    this.items = [];
    this.taps = 0;
    this.node = h("div", {
      class: "cb-hints",
      "aria-hidden": "true",
      "data-cb-novoice": "",
    });
    root.append(this.node);
    document.addEventListener("cb:input-device", () => this.render());
    root.addEventListener("focusin", () => {
      if (!this.declared()) this.refresh();
    });
    root.addEventListener("click", (event) => {
      const target = event.target.closest?.("button, a[href]");
      if (
        input.device === "touch" &&
        !event.defaultPrevented &&
        target &&
        !target.disabled &&
        target.getAttribute("aria-disabled") !== "true" &&
        target.closest(".cb-main") &&
        !target.closest("dialog")
      ) {
        this.taps++;
        this.render();
      }
    });
    input.bindings.onChange(() => this.render());
  }
  set(items) {
    this.items = items || [];
    this.declaredScope = this.root.querySelector(".cb-main")?.firstElementChild;
    this.render();
  }
  declared() {
    return (
      this.declaredScope &&
      this.declaredScope ===
        this.root.querySelector(".cb-main")?.firstElementChild
    );
  }
  refresh() {
    if (!this.declared()) this.items = screenHints(this.root, this.i18n);
    this.render();
  }
  render() {
    const cfg = this.settings();
    const active = ["map", "stop"].includes(this.root.dataset.screen);
    const hidden =
      !active ||
      cfg.hints === "off" ||
      (cfg.hints !== "on" && this.input.device === "touch" && this.taps >= 3);
    this.node.classList.toggle("is-hidden", hidden);
    this.node.replaceChildren();
    if (hidden) return;
    for (const hint of this.items.slice(0, 4)) {
      const item = h("span", { class: "cb-hint" });
      if (this.input.device === "gamepad")
        item.append(
          controllerGlyph(
            hint.action,
            padLayout(this.pad()?.id, cfg.padLayout),
          ),
        );
      else if (this.input.device === "touch") item.append(icon("touch"));
      else
        item.append(
          h("kbd", {
            text:
              hint.action === "choice"
                ? hint.keys || "1–9"
                : this.input.bindings.label(
                    this.input.bindings.value[hint.action]?.[0] || "Enter",
                  ),
          }),
        );
      item.append(h("span", { text: hint.label }));
      this.node.append(item);
    }
  }
}
