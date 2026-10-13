const PATHS = {
  "first-stop": "M8 6h3v6H8Zm5 6h3v6h-3Z",
  "chapter-1": "M4 12q8-10 16 0-8 10-16 0Zm8-3v6",
  "chapter-2": "M5 6h14v10h-7l-5 4v-4H5Z",
  "chapter-3": "m5 15 5-5 4 3 5-8M15 5h4v4",
  "chapter-4": "M6 16Q4 6 18 5q1 13-12 11Zm0 2 9-9",
  "three-stars": "m12 5 2 4 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1Z",
  "try-again": "M6 9a7 7 0 1 1-1 6M5 5v5h5",
  "all-ears": "M7 10a5 5 0 0 1 10 0q0 4-4 5-1 6-5 3m3-8q3-3 3 1l-2 2",
  "source-checker": "M5 5h11v14H5Zm3 5h4m-4 3h4m3 4 5-5m-3 0h3v3",
  "good-question": "M6 7h12M6 12h8M6 17h10",
  "sign-spotter": "M7 6h10v9H7Zm5 9v5m-5-9 3 2 5-4",
  "team-player":
    "M8 8a2 2 0 1 0 0 .1m8-.1a2 2 0 1 0 0 .1M4 18q0-6 4-6t4 6m0 0q0-6 4-6t4 6",
  "quiet-pro": "M5 10h3l4-4v12l-4-4H5Zm11 0 4 4m0-4-4 4",
  "journey-15": "M4 18h16M6 18v-8l6-5 6 5v8m-8 0v-5h4v5",
  "process-5": "M5 5 10 7l4-2 5 2v12l-5-2-4 2-5-2Zm5 2v12m4-14v12",
  "process-6": "M4 19h16M6 10h12M8 10v9m8-9v9M5 8l7-4 7 4",
  "process-7": "M5 6h14v10h-8l-4 4v-4H5Zm4 5 2 2 4-4",
  "process-8": "M6 6h8v8H6l-3 3v-4m8 3h7l3 3v-9h-4",
  "process-9": "M5 19v-7h6v7m2 0v-7h6v7M8 5v4m8-4v4M6 7h4m4 0h4",
  "process-10": "m7 5 5 5-3 3-5-5m5 5 7 7 4-4-7-7m-3 5 4-4",
  "process-11": "M12 5v14M5 19h14M4 9h16M7 9l-3 6h6Zm10 0-3 6h6Z",
  "process-12": "m4 11 4-4 4 2 4-2 4 4-8 8Zm4 3 3 3m3-5 3 3",
  "process-13": "M5 9h4l9-4v14l-9-4H5Zm4 6 2 5m9-11 2-1m-2 7 2 1",
  "process-14": "M5 6h14v13H5Zm4-2v4m6-4v4m-7 6 3 3 5-5",
  "process-15": "M5 18h14M7 18v-7l5-5 5 5v7m-7 0v-5h4v5m-2-7V4",
};
export function badgeIcon(id) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(svg.namespaceURI, "path");
  for (const [key, value] of Object.entries({
    d: PATHS[id] || PATHS["first-stop"],
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.6",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  }))
    path.setAttribute(key, value);
  svg.append(path);
  return svg;
}
export function badgeHint(i18n, id) {
  return i18n.t("badgeHint." + id);
}
