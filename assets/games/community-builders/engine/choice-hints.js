import { icon } from "./dom.js";
import { controllerGlyph } from "./hints.js";
import { padLayout } from "./gamepad.js";

export function annotateChoices(root, { settings, pad } = {}) {
  const span = (className, text) => {
    const node = root.ownerDocument.createElement("span");
    node.className = className;
    node.setAttribute("aria-hidden", "true");
    if (text) node.textContent = text;
    return node;
  };
  const groups = [
    ...(root.matches?.("[data-cb-choices]") ? [root] : []),
    ...root.querySelectorAll("[data-cb-choices]"),
  ];
  for (const group of groups) {
    const choices = [
      ...group.querySelectorAll("button:not(:disabled), [data-cb-choice]"),
    ].filter((node) => node.closest("[data-cb-choices]") === group);
    choices.slice(0, 9).forEach((node, i) => {
      const n = node.dataset.cbChoice || String(i + 1);
      node.dataset.cbChoice = n;
      node.classList.add("cb-choice");
      node.setAttribute("aria-keyshortcuts", n);
      if (!node.querySelector(".cb-keycap")) node.append(span("cb-keycap", n));
      if (!node.querySelector(".cb-choice-badge")) {
        const badge = span("cb-choice-badge");
        badge.append(icon("check", root.ownerDocument));
        node.append(badge);
      }
    });
  }
  for (const glyph of root.querySelectorAll(".cb-choice-glyph")) glyph.remove();
  const focused = root.ownerDocument.activeElement;
  if (
    root.dataset.input === "gamepad" &&
    root.contains(focused) &&
    focused.matches(".cb-choice")
  ) {
    const glyph = controllerGlyph(
      "confirm",
      padLayout(pad?.()?.id, settings?.()?.padLayout),
      root.ownerDocument,
    );
    glyph.classList.add("cb-choice-glyph");
    focused.append(glyph);
  }
}

export function syncShortcutLabels(root, bindings) {
  const entries = [
    [".cb-voice", "voice.toggle"],
    [".cb-vbtn", "voice.replay"],
    [".cb-setbtn", "pause"],
    [".cb-fs", "fullscreen.toggle"],
    [".cb-engine-zoom", "map.zoom"],
    ["[data-cb-shortcut]", null],
  ];
  for (const [selector, fallback] of entries)
    for (const node of root.querySelectorAll(selector)) {
      const action = node.dataset.cbShortcut || fallback,
        code = bindings.value[action]?.[0];
      if (!code) continue;
      const current =
        node.getAttribute("title") ||
        node.getAttribute("aria-label") ||
        node.textContent;
      const base = current.replace(/\s+\([^()]*\)$/, "");
      node.title = base + " (" + bindings.label(code) + ")";
      node.setAttribute("aria-keyshortcuts", bindings.label(code));
    }
}
