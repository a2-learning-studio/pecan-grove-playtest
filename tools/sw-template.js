/* First-party offline files only. Feedback is never cached or queued here. */
const CACHE = 'pecan-grove-__BUILD__';
const PRECACHE = __PRECACHE__;
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE))));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith('pecan-grove-') && key !== CACHE && !key.startsWith('pecan-grove-voice-')) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.includes('/macros/')) return;
  if (!url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (request.mode === 'navigate') {
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 3000);
      try { const response = await fetch(request, { signal: controller.signal }); if (response.ok) await cache.put(request, response.clone()); return response; }
      catch (_) { return await cache.match(request, { ignoreSearch: true }) || await cache.match(url.pathname.endsWith('espanol.html') ? 'espanol.html' : 'index.html') || Response.error(); }
      finally { clearTimeout(timer); }
    }
    if (url.pathname.endsWith('.mp3')) {
      const voice = await caches.open('pecan-grove-voice-' + (url.pathname.includes('/es/') ? 'es' : 'en'));
      const old = await voice.match(request, { ignoreSearch: true }); if (old) return old;
      const response = await fetch(request); if (response.ok) await voice.put(request, response.clone()); return response;
    }
    const cached = await cache.match(request, { ignoreSearch: true });
    const fresh = async () => { const response = await fetch(request); if (response.ok) await cache.put(request, response.clone()); return response; };
    if (/\/voice\/index\.[a-z0-9]+\.js$/.test(url.pathname)) { if (cached) { event.waitUntil(fresh().catch(() => {})); return cached; } return fresh(); }
    return cached || fresh();
  })());
});
