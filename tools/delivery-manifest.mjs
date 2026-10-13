import crypto from 'node:crypto';

// Keep manifests beside their HTML: scope, start_url and icon URLs are relative to the manifest.
export function prepareManifest(manifest, assetMap, lang) {
  if (!['en', 'es'].includes(lang)) throw new Error('Unsupported manifest language');
  const mapped = { ...manifest, icons: manifest.icons.map(icon => ({ ...icon, src: assetMap[icon.src] || icon.src })) };
  const text = JSON.stringify(mapped);
  const hash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 12);
  return { name: `manifest.${lang}.${hash}.webmanifest`, text };
}

export function linkManifest(html, name) {
  let count = 0;
  const updated = html.replace(/<link\b(?=[^>]*\brel=["']manifest["'])[^>]*>/g, tag => {
    count++;
    return tag.replace(/\bhref=["'][^"']*["']/, `href="./${name}"`);
  });
  if (count !== 1) throw new Error('Each page requires exactly one app manifest');
  return updated;
}
