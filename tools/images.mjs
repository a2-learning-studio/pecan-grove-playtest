import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imageDir = path.join(root, 'assets/games/community-builders/img');
const source = path.join(imageDir, 'town-map@2x.webp');
for (const width of [640, 960, 1376, 2048, 2752]) {
  const input = sharp(source).resize({ width, withoutEnlargement: true });
  await input.clone().webp({ quality: 76, effort: 5 }).toFile(path.join(imageDir, `town-map-${width}.webp`));
  await input.clone().avif({ quality: 48, effort: 4 }).toFile(path.join(imageDir, `town-map-${width}.avif`));
}
await sharp(source).resize(24, 14).blur(1).webp({ quality: 35 }).toFile(path.join(imageDir, 'town-map-placeholder.webp'));
const icons = path.join(root, 'assets/icons'); await fs.mkdir(icons, { recursive: true });
const mark = path.join(root, 'assets/img/mark.svg');
for (const size of [192, 512, 180]) {
  await sharp(mark).resize(size, size, { fit: 'contain', background: '#163a30' }).png().toFile(path.join(icons, size === 180 ? 'apple-touch.png' : `icon-${size}.png`));
}
await sharp(mark).resize(320, 320, { fit: 'contain', background: '#163a30' }).extend({ top: 96, bottom: 96, left: 96, right: 96, background: '#163a30' }).png().toFile(path.join(icons, 'maskable-512.png'));
console.log('Responsive map art, placeholder and install icons generated.');
