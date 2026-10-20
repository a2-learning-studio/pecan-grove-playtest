import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imageDir = path.join(root, 'assets/games/community-builders/img');
// The editable vector portraits are authoritative; keep each existing story ID.
for (const person of ['ms-lee', 'mr-johnson', 'ana', 'grandma-ruth', 'mr-patel', 'jayden']) {
  await sharp(path.join(imageDir, 'people', `${person}.svg`)).resize(512, 512)
    .webp({ quality: 90, effort: 6 }).toFile(path.join(imageDir, `${person}.webp`));
}
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
await socialPreview();
console.log('Modern human portraits, responsive map art, placeholder, install icons and social preview generated.');

async function framedPortrait(file, size) {
  const pad = 8, inner = size - pad * 2;
  const portrait = await sharp(file).resize(inner, inner).png().toBuffer();
  const ring = Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 3}" fill="#F7F4EE"/><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 3}" fill="none" stroke="#C46A45" stroke-width="3"/></svg>`);
  return sharp(ring).composite([{ input: portrait, top: pad, left: pad }]).png().toBuffer();
}

// 1200×627 JPEG for LinkedIn and other summary_large_image cards. Art is the town map and vector portraits only.
async function socialPreview() {
  const width = 1200, height = 627, portrait = 128, gap = 18;
  const map = await sharp(path.join(imageDir, 'town-map@2x.webp')).resize(width, height, { fit: 'cover', position: 'centre' }).modulate({ saturation: 1.05 }).toBuffer();
  const people = await Promise.all(['ana', 'jayden', 'ms-lee', 'mr-patel'].map(name => framedPortrait(path.join(imageDir, 'people', `${name}.svg`), portrait)));
  // Type and scrim are a committed overlay so the card does not depend on which fonts the build machine has.
  const overlay = await fs.readFile(path.join(root, 'assets/img/social-preview-type.png'));
  const composites = [{ input: overlay, top: 0, left: 0 }, ...people.map((input, index) => ({ input, top: 412, left: 64 + index * (portrait + gap) }))];
  const file = path.join(root, 'assets/img/social-preview.jpg');
  await sharp(map).composite(composites).jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: '4:4:4' }).toFile(file);
  const meta = await sharp(file).metadata();
  const bytes = (await fs.stat(file)).size;
  if (meta.width !== width || meta.height !== height || bytes > 1000000) throw new Error(`Social preview must be ${width}x${height} and under 1MB`);
}
