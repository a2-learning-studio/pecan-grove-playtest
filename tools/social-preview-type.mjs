import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const overlay = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="627" viewBox="0 0 1200 627" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#163A30"/>
      <stop offset="54%" stop-color="#163A30"/>
      <stop offset="72%" stop-color="#163A30" stop-opacity="0.42"/>
      <stop offset="88%" stop-color="#163A30" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="627" fill="url(#scrim)"/>
  <rect x="64" y="72" width="72" height="8" rx="4" fill="#C46A45"/>
  <text x="64" y="128" fill="#F3D2C3" font-family="Inter" font-size="18" font-weight="700" letter-spacing="2.4">BILINGUAL CIVIC GAME</text>
  <text x="64" y="204" fill="#F7F4EE" font-family="Inter" font-size="56" font-weight="700">Community Builders</text>
  <text x="64" y="270" fill="#F7F4EE" font-family="Inter" font-size="56" font-weight="700">of Pecan Grove</text>
  <text x="64" y="328" fill="#F7F4EE" font-family="Inter" font-size="26" font-weight="500">For kids 8 to 14, with a grown-up</text>
  <text x="64" y="366" fill="#D7E6DC" font-family="Inter" font-size="22" font-weight="600">English and Español</text>
</svg>`;
const file = path.join(root, 'assets/img/social-preview-type.png');
await sharp(Buffer.from(overlay)).png().toFile(file);
console.log('Wrote social type overlay. Run npm run images to rebuild social-preview.jpg.');
