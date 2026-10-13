import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareManifest, linkManifest } from '../delivery-manifest.mjs';

test('Published manifests resolve icons, app launch and scope under the GitHub project path', () => {
  for (const lang of ['en', 'es']) {
    const start = lang === 'en' ? './' : './espanol.html';
    const result = prepareManifest({ start_url: start, scope: './', icons: [{ src: 'assets/icons/icon-192.png', sizes: '192x192' }] }, { 'assets/icons/icon-192.png': 'assets/icons/icon-192.abc123.png' }, lang);
    const html = linkManifest('<link rel="manifest" href="./assets/manifest.en-vite.webmanifest">', result.name);
    const page = new URL('https://a2-learning-studio.github.io/pecan-grove-playtest/');
    const href = html.match(/href="([^"]+)"/)[1];
    const manifestURL = new URL(href, page);
    const manifest = JSON.parse(result.text);
    assert.equal(new URL(manifest.scope, manifestURL).href, page.href);
    assert.equal(new URL(manifest.start_url, manifestURL).href, new URL(start, page).href);
    assert.equal(new URL(manifest.icons[0].src, manifestURL).href, page.href + 'assets/icons/icon-192.abc123.png');
    assert.match(result.name, new RegExp(`^manifest\\.${lang}\\.[a-f0-9]{12}\\.webmanifest$`));
  }
});

test('Manifest content changes invalidate its filename and missing page links fail the build', () => {
  const source = { icons: [{ src: 'icon.png' }] };
  assert.notEqual(prepareManifest(source, {}, 'en').name, prepareManifest(source, { 'icon.png': 'icon.changed.png' }, 'en').name);
  assert.throws(() => linkManifest('<html></html>', 'manifest.en.webmanifest'));
});
