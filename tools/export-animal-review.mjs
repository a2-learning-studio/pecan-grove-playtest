import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import createData from "../assets/games/community-builders/data/catalog.js";

const data = {},
  context = {
    L: "en",
    publish() {},
    bind(values) {
      for (const [key, [get]] of Object.entries(values)) data[key] = get();
    },
  };
createData(context);
const folder = new URL("../docs/engine-art-review/", import.meta.url);
const icons = new URL(
  "../assets/games/community-builders/engine/icons/",
  import.meta.url,
);
await mkdir(folder, { recursive: true });
await mkdir(icons, { recursive: true });
const cards = [];
const panels = [];
for (const [index, animal] of data.ANIMALS.entries()) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-labelledby="title"><title id="title">${animal.name}</title>${data.ICON[animal.id]}</svg>`;
  await writeFile(new URL(animal.id + ".svg", icons), svg + "\n");
  cards.push(
    `<article><div class="portrait" style="--ring:${animal.ring}">${svg}</div><h2>${animal.name}</h2><p>${animal.id === "otter" ? "Rounded ears, whiskers and tapered tail" : { fox: "Pointed ears and pale cheek mask", owl: "Ear tufts, facial discs and rounded wings", turtle: "Domed shell, flippers and low silhouette", rabbit: "Long upright ears and soft muzzle", deer: "Branching antlers and broad ears", heron: "Long beak, folded neck and wading legs", bee: "Paired wings, antennae and striped body" }[animal.id]}</p></article>`,
  );
  const x = 40 + (index % 4) * 240,
    y = 100 + Math.floor(index / 4) * 260;
  panels.push(
    `<g transform="translate(${x} ${y})"><rect width="200" height="220" rx="24" fill="#ffffff"/><circle cx="100" cy="88" r="65" fill="#F7F4EE"/><circle cx="100" cy="88" r="65" fill="none" stroke="${animal.ring}" stroke-width="3"/><svg x="36" y="24" width="128" height="128" viewBox="0 0 64 64">${data.ICON[animal.id]}</svg><text x="100" y="185" fill="#263D39" font-family="Arial,sans-serif" font-size="20" text-anchor="middle">${animal.name}</text></g>`,
  );
}
const poster = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="650" viewBox="0 0 1000 650"><rect width="1000" height="650" fill="#EEF2EF"/><text x="40" y="55" fill="#263D39" font-family="Arial,sans-serif" font-size="28">Pecan Grove · modern animal characters</text>${panels.join("")}</svg>`;
await writeFile(new URL("animals-modern.svg", folder), poster + "\n");
await writeFile(
  new URL("animals-modern.png", folder),
  await sharp(Buffer.from(poster)).png().toBuffer(),
);
await writeFile(
  new URL("animals-modern.html", folder),
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Modern animal characters · Pecan Grove</title><link rel="stylesheet" href="animals-modern.css"><main><h1>Modern animal characters</h1><p>One contemporary vector family for player portraits and saved games. Labels stay visible; colour is a secondary cue. Artwork uses the live game catalog.</p><div class="grid">${cards.join("")}</div><p>Five-person recognition testing and native Spanish label review remain pending.</p></main></html>\n`,
);
await writeFile(
  new URL("animals-modern.css", folder),
  `:root{color-scheme:light;font-family:system-ui,sans-serif;color:#263d39;background:#eef2ef}body{margin:0}main{max-width:1100px;margin:auto;padding:32px}h1{font-size:clamp(1.8rem,4vw,2.5rem)}p{line-height:1.6}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:20px;margin:32px 0}article{padding:24px;border-radius:24px;background:#fff;text-align:center}.portrait{width:128px;height:128px;margin:auto;padding:8px;border:3px solid var(--ring);border-radius:50%;background:#f7f4ee}svg{width:100%;height:100%}h2{font-size:1.2rem}article p{font-size:.9rem}@media(forced-colors:active){article,.portrait{border:2px solid CanvasText}}\n`,
);
