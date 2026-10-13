export function h(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "text") node.textContent = value;
    else if (key.startsWith("on") && typeof value === "function")
      node.addEventListener(key.slice(2), value);
    else if (key === "className") node.className = value;
    else node.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of [children].flat()) if (child != null) node.append(child);
  return node;
}
export function button(text, run, attrs = {}) {
  return h("button", {
    type: "button",
    class: "cb-btn",
    text,
    onclick: run,
    ...attrs,
  });
}
export function icon(name, document = globalThis.document) {
  const paths = {
    pause: "M8 5v14M16 5v14",
    play: "m8 5 11 7-11 7Z",
    check: "m5 12 4 4L19 6",
    star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z",
    badge: "m12 3 7 4v6l-7 8-7-8V7Z",
    close: "m6 6 12 12M18 6 6 18",
    touch:
      "M9 12V6a2 2 0 0 1 4 0v5m0-2h3a3 3 0 0 1 3 3v4a5 5 0 0 1-5 5h-2l-7-7a2 2 0 0 1 3-3l1 1",
  };
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", paths[name] || paths.check);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.append(path);
  return svg;
}
export function safeSet(storage, key, value, target = globalThis.document) {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    if (target?.dispatchEvent && typeof CustomEvent === "function")
      target.dispatchEvent(
        new CustomEvent("cb:storage-error", { detail: { key } }),
      );
    return false;
  }
}
export function safeGet(storage, key, fallback) {
  try {
    const value = JSON.parse(storage.getItem(key));
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}
