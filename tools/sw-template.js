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
  // An image candidate can be replaced while resizing. Its offline transfer belongs
  // to the worker, so cancellation of the old display request cannot abort it.
  const resource = () => fetch(request, request.destination === 'image'
    ? { signal: new AbortController().signal } : undefined);
  const remember = (cache, response) => {
    // Cache storage is optional. A full disk or aborted clone must not reject a
    // valid network response; partial audio is not a complete offline recording.
    if (response.ok && response.status !== 206) {
      try { event.waitUntil(Promise.resolve(cache.put(request, response.clone())).catch(() => {})); }
      catch (_) { /* The valid network response is still usable without storage. */ }
    }
    return response;
  };
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (request.mode === 'navigate') {
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 3000);
      try { return remember(cache, await fetch(request, { signal: controller.signal })); }
      catch (_) { return await cache.match(request, { ignoreSearch: true }) || await cache.match(url.pathname.endsWith('espanol.html') ? 'espanol.html' : 'index.html') || Response.error(); }
      finally { clearTimeout(timer); }
    }
    if (url.pathname.endsWith('.mp3')) {
      const voice = await caches.open('pecan-grove-voice-' + (url.pathname.includes('/es/') ? 'es' : 'en'));
      const old = await voice.match(request, { ignoreSearch: true }); if (old) return old;
      try { return remember(voice, await resource()); } catch (_) { return Response.error(); }
    }
    const cached = await cache.match(request, { ignoreSearch: true });
    const fresh = async () => { try { return remember(cache, await resource()); } catch (_) { return cached || Response.error(); } };
    if (/\/voice\/index\.[a-z0-9]+\.js$/.test(url.pathname)) { if (cached) { event.waitUntil(fresh().catch(() => {})); return cached; } return fresh(); }
    return cached || fresh();
  })());
});
