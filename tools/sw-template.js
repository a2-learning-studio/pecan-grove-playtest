/* First-party offline files only. Feedback is never cached or queued here. */
const BUILD = '__BUILD__';
const CACHE = 'pecan-grove-' + BUILD;
const PRECACHE = __PRECACHE__;
// This build's content-addressed voice clips. A re-recorded line has a new name, so an older copy is never served.
const VOICE = new Set(__VOICE__);
// Android Chrome's media player sends Range and rejects a 200 body for that
// request. A cached whole clip has to be sliced into a real 206 response.
function rangeHeader(request) {
  const headers = request.headers;
  if (!headers) return '';
  if (typeof headers.get === 'function') return headers.get('range') || '';
  return headers.range || headers.Range || '';
}
function voiceSlice(response, range) {
  return response.clone().arrayBuffer().then(bytes => {
    const total = bytes.byteLength;
    const spec = /bytes=(\d*)-(\d*)/i.exec(String(range).split(',')[0].trim());
    const unsatisfiable = () => new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + total } });
    if (!spec || !total) return unsatisfiable();
    let start, end;
    if (spec[1] === '') {
      const suffix = Number(spec[2]);
      if (!Number.isFinite(suffix) || suffix <= 0) return unsatisfiable();
      start = Math.max(0, total - suffix);
      end = total - 1;
    } else {
      start = Number(spec[1]);
      end = spec[2] === '' ? total - 1 : Number(spec[2]);
    }
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start >= total || end < start) return unsatisfiable();
    end = Math.min(end, total - 1);
    const slice = bytes.slice(start, end + 1);
    return new Response(slice, { status: 206, headers: {
      'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Content-Length': String(slice.byteLength),
      'Accept-Ranges': 'bytes'
    } });
  });
}
function bufferedMedia(response) {
  return response.arrayBuffer().then(bytes => {
    const headers = new Headers(response.headers);
    headers.delete('Content-Encoding');
    headers.set('Content-Length', String(bytes.byteLength));
    if (!headers.get('Content-Type')) headers.set('Content-Type', 'audio/mpeg');
    if (!headers.get('Accept-Ranges')) headers.set('Accept-Ranges', 'bytes');
    return new Response(bytes, { status: response.status, statusText: response.statusText, headers });
  });
}
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE))));
// Downloaded voice packs survive updates (a grown-up chose them), minus clips this build no longer uses.
// Builds before content-addressed clips cached them as name.mp3. Such a clip moves to this build's
// name.<hash>.mp3 when its bytes hash to that name, so a pack downloaded earlier still plays offline;
// a re-recorded line no longer matches and is dropped. Nothing is downloaded here.
async function contentName(path, response) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer()));
  return path.replace(/\.mp3$/, '.' + Array.from(digest.slice(0, 6), byte => byte.toString(16).padStart(2, '0')).join('') + '.mp3');
}
async function pruneVoice(key) {
  const cache = await caches.open(key), scope = new URL(self.registration.scope).pathname;
  for (const request of await cache.keys()) {
    const path = new URL(request.url).pathname;
    if (path.startsWith(scope) && VOICE.has(path.slice(scope.length))) continue;
    if (path.startsWith(scope) && /\/voice\/(?:en|es)\/[^/]+\.mp3$/.test(path) && !/\.[0-9a-f]{12}\.mp3$/.test(path)) {
      try {
        const old = await cache.match(request), renamed = old && old.status === 200 ? await contentName(path.slice(scope.length), old) : '';
        if (VOICE.has(renamed)) await cache.put(new URL(renamed, self.registration.scope).href, old);
      } catch (_) { /* That clip downloads again when it next plays online. */ }
    }
    await cache.delete(request);
  }
}
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) {
    if (key.startsWith('pecan-grove-voice-')) await pruneVoice(key);
    else if (key.startsWith('pecan-grove-') && key !== CACHE) await caches.delete(key);
  }
  await self.clients.claim();
})()));
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'GET_VERSION' && event.source) event.source.postMessage({ type: 'VERSION', build: BUILD });
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.includes('/macros/')) return;
  if (!url.href.startsWith(self.registration.scope)) return;
  // An image candidate can be replaced while resizing. Its offline transfer belongs
  // to the worker, so cancellation of the old display request cannot abort it.
  const resource = () => fetch(request, request.destination === 'image'
    ? { signal: new AbortController().signal } : undefined);
  const completeImage = async response => {
    if (request.destination !== 'image' || !response.ok || response.status === 206 || response.type === 'opaque' || response.type === 'opaqueredirect') return response;
    // A cached response still has a storage-backed stream. Finish reading that
    // stream in the worker before a replaced image candidate can cancel delivery.
    const bytes = await response.arrayBuffer(), headers = new Headers(response.headers);
    headers.delete('Content-Encoding'); headers.delete('Content-Length');
    return new Response(bytes, { status: response.status, statusText: response.statusText, headers });
  };
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
      const range = rangeHeader(request);
      const old = await voice.match(request, { ignoreSearch: true });
      if (range) {
        // A whole recording can satisfy the range offline. A partial response
        // must not be stored where the next visit expects the complete clip.
        if (old && old.status === 200) {
          try { return await voiceSlice(old, range); } catch (_) { /* Read the network copy below. */ }
        }
        try {
          const network = await fetch(request);
          if (network.status === 206) return await bufferedMedia(network);
          if (network.ok && network.status === 200) {
            const bytes = await network.arrayBuffer();
            const headers = new Headers(network.headers);
            headers.delete('Content-Encoding');
            headers.set('Accept-Ranges', 'bytes');
            headers.set('Content-Length', String(bytes.byteLength));
            if (!headers.get('Content-Type')) headers.set('Content-Type', 'audio/mpeg');
            const full = new Response(bytes, { status: 200, statusText: network.statusText, headers });
            event.waitUntil(Promise.resolve(voice.put(request.url, full.clone())).catch(() => {}));
            return await voiceSlice(full, range);
          }
          return network;
        } catch (_) { return Response.error(); }
      }
      if (old && old.status === 200) return old;
      try { return remember(voice, await resource()); } catch (_) { return Response.error(); }
    }
    let cached = await cache.match(request, { ignoreSearch: true });
    if (cached && request.destination === 'image') {
      try { return await completeImage(cached); }
      catch (_) { cached = undefined; /* Recover an unreadable image body once from the network. */ }
    }
    const fresh = async () => { try { return remember(cache, await completeImage(await resource())); } catch (_) { return cached || Response.error(); } };
    if (/\/voice\/index\.[a-z0-9]+\.js$/.test(url.pathname)) { if (cached) { event.waitUntil(fresh().catch(() => {})); return cached; } return fresh(); }
    return cached || fresh();
  })());
});
