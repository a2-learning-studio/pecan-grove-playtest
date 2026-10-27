/* Offline features never send or retry playtest feedback. */
import { trustedWorkerURL } from '../games/community-builders/engine/assets.js';
const es = () => document.documentElement.lang === 'es';
const translated = new Map(), languageRegions = new Set();
const text = (key, values = {}) => {
  const copy = window.PGShellLocale[es() ? 'es' : 'en'][key];
  const value = copy.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
  translated.set(value, {key, values});
  return value;
};
function refreshLanguage() {
  for (const region of languageRegions) {
    if (!region.isConnected) { languageRegions.delete(region); continue; }
    const walker = document.createTreeWalker(region, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const saved = translated.get(walker.currentNode.data);
      if (saved) walker.currentNode.data = text(saved.key, saved.values);
    }
    for (const element of [region, ...region.querySelectorAll('[aria-label]')]) {
      const saved = translated.get(element.getAttribute('aria-label'));
      if (saved) element.setAttribute('aria-label', text(saved.key, saved.values));
    }
  }
}
document.addEventListener('pg:language-change', refreshLanguage);
const asset = name => new URL(window.PG_ASSET_MAP?.[name] || name, document.baseURI).href;
const make = (tag, label, attrs = {}) => {
  const element = document.createElement(tag); if (label) element.textContent = label;
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
  return element;
};
let installEvent = null, registration = null, reloading = false, requestedUpdate = false, updateDeferred = false, stopUnavailable = false, lastCheck = 0;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); installEvent = event;
  document.dispatchEvent(new CustomEvent('cb:install-available'));
});
window.addEventListener('appinstalled', () => { installEvent = null; });
const safeScreen = () => {
  const state = window.CommunityBuilders?.snapshot?.();
  // A stop that could not load has no play to lose: the restart may show there.
  return stopUnavailable || !state || state.mode !== 'stop';
};
function pageBuild() {
  return document.querySelector('meta[name="content-build-id"]')?.content || '';
}
function workerBuild(worker) {
  return new Promise(resolve => {
    let settled = false, timer;
    const finish = value => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      navigator.serviceWorker.removeEventListener('message', onMessage);
      resolve(value);
    };
    const onMessage = event => { if (event.data?.type === 'VERSION') finish(event.data.build || ''); };
    timer = setTimeout(() => finish(''), 800);
    navigator.serviceWorker.addEventListener('message', onMessage);
    try { worker.postMessage({ type: 'GET_VERSION' }); }
    catch (_) { finish(''); }
  });
}
let noticeCheck = 0;
async function considerUpdate() {
  const waiting = registration?.waiting;
  if (!waiting) return;
  const token = ++noticeCheck, build = await workerBuild(waiting);
  if (token !== noticeCheck || registration?.waiting !== waiting) return;
  const current = pageBuild();
  if (build && current && build === current) {
    document.getElementById('pg-update-notice')?.remove();
    waiting.postMessage({ type: 'SKIP_WAITING' });
    return;
  }
  updateNotice();
}
function updateNotice() {
  if (!registration?.waiting || updateDeferred || !safeScreen() || document.getElementById('pg-update-notice')) return;
  const bar = make('aside', '', { id: 'pg-update-notice', class: 'pg-update-notice', 'aria-label': text('pwa_game_update') });
  bar.append(make('p', text('pwa_a_new_version_is_ready')));
  if (stopUnavailable) bar.append(make('p', text('pwa_stop_needs_update')));
  const restart = make('button', text('pwa_restart_now'), { type: 'button', class: 'pt-tool' });
  const later = make('button', text('pwa_later'), { type: 'button', class: 'pt-tool' });
  restart.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('pt:feedback-flush'));
    const snapshot = window.CommunityBuilders?.snapshot?.();
    if (snapshot) { try { sessionStorage.setItem('pecan-grove-resume', JSON.stringify({ ...snapshot, v: 1, ts: Date.now() })); } catch (_) {} }
    requestedUpdate = true;
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
  });
  later.addEventListener('click', () => { updateDeferred = true; bar.remove(); });
  bar.append(restart, later); languageRegions.add(bar); document.getElementById('pt-stage')?.append(bar);
}
const chip = make('span', '', { id: 'pg-offline-chip', role: 'status', 'aria-live': 'polite', class: 'pg-offline-chip' });
function connectivity() {
  chip.hidden = navigator.onLine !== false;
  chip.textContent = text('pwa_offline');
}
(document.querySelector('.pt-toolbar') || document.getElementById('community-builders'))?.append(chip);
window.addEventListener('online', connectivity); window.addEventListener('offline', connectivity); connectivity();
document.addEventListener('pg:language-change', connectivity);
document.addEventListener('cb:screen', () => {
  if (!safeScreen()) document.getElementById('pg-update-notice')?.remove(); else considerUpdate();
});
// A page left open across a release cannot open files that release removed. Look for the new release when a stop
// cannot load, when the page comes back into view, and every hour; considerUpdate then offers Restart now.
async function checkForUpdate(force) {
  if (!registration || navigator.onLine === false || (!force && Date.now() - lastCheck < 600000)) return;
  lastCheck = Date.now();
  try { await registration.update(); } catch (_) { return; }
  const worker = registration.installing;
  if (worker) await new Promise(resolve => {
    const settled = () => { if (worker.state === 'installing') return; worker.removeEventListener('statechange', settled); resolve(); };
    worker.addEventListener('statechange', settled); settled();
  });
  considerUpdate();
}
document.addEventListener('cb:stop-unavailable', () => { stopUnavailable = true; updateDeferred = false; checkForUpdate(true); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkForUpdate(false); });
setInterval(() => checkForUpdate(false), 3600000);
if ('serviceWorker' in navigator && document.querySelector('meta[name="pg-offline"]')?.content === 'enabled') {
  navigator.serviceWorker.register(trustedWorkerURL(window, new URL('sw.js', document.baseURI))).then(value => {
    registration = value; considerUpdate();
    value.addEventListener('updatefound', () => value.installing?.addEventListener('statechange', considerUpdate));
  }).catch(() => {
    chip.hidden = false; chip.textContent = text('pwa_offline_setup_unavailable_play_can_continue');
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!requestedUpdate || reloading) return; reloading = true;
    const url = new URL(location.href); url.searchParams.set('resume', '1'); location.replace(url);
  });
}
async function openVoicePacks(container) {
  if (!container || container.dataset.voicePacks === 'ready') return;
  container.dataset.voicePacks = 'ready'; languageRegions.add(container);
  const heading = make('h3', text('pwa_voice_for_offline_play'));
  container.append(heading, make('p', text('pwa_ask_a_grown_up_before_downloading_voice_packs_use_device_storage')));
  if (!('caches' in window)) { container.append(make('p', text('pwa_offline_storage_is_not_available_in_this_browser'))); return; }
  for (const lang of ['en', 'es']) {
    const section = make('section', '', { class: 'pg-voice-pack' });
    const size = make('p', text('pwa_checking_size'), { role: 'status', 'aria-live': 'polite' });
    const label = lang === 'en' ? 'English' : 'Español';
    const progress = make('progress', '', { max: '1', value: '0', 'aria-label': label });
    const status = make('p', label, { role: 'status', 'aria-live': 'polite' });
    const download = make('button', text('pwa_download', {label: label}), { type: 'button', class: 'pt-tool' });
    const pause = make('button', text('pwa_pause'), { type: 'button', class: 'pt-tool', disabled: '' });
    const cancel = make('button', text('pwa_cancel'), { type: 'button', class: 'pt-tool', disabled: '' });
    const remove = make('button', text('pwa_remove_pack'), { type: 'button', class: 'pt-tool' });
    let running = false, paused = false, cancelled = false, wake = null, controller = null;
    let pack = null;
    async function getPack() {
      if (pack) return pack;
      const response = await fetch(asset(`assets/games/community-builders/voice/${lang}/pack.json`));
      if (!response.ok) throw new Error('pack');
      const value = await response.json();
      if (value.lang !== lang || !Array.isArray(value.files) || value.files.length > 500 ||
          value.files.some(file => !/^[\w.@-]+\.mp3$/.test(file.file) || !Number.isFinite(file.bytes) || file.bytes < 0)) throw new Error('pack');
      pack = { ...value, totalBytes: value.files.reduce((bytes, file) => bytes + file.bytes, 0) };
      size.textContent = text('pwa_pack_size', { label, size: (pack.totalBytes / 1048576).toFixed(1) });
      return pack;
    }
    download.disabled = true;
    getPack().then(() => { download.disabled = false; }).catch(() => {
      size.textContent = text('pwa_size_unavailable'); download.disabled = false;
    });
    pause.addEventListener('click', () => { paused = !paused; pause.textContent = paused ? text('pwa_resume') : text('pwa_pause'); if (!paused) { wake?.(); wake = null; } });
    cancel.addEventListener('click', () => { cancelled = true; controller?.abort(); wake?.(); wake = null; });
    remove.addEventListener('click', async () => { cancelled = true; controller?.abort(); wake?.(); await caches.delete(`pecan-grove-voice-${lang}`); progress.value = 0; status.textContent = text('pwa_voice_pack_removed', {label: label}); });
    download.addEventListener('click', async () => {
      if (running) return;
      if (navigator.onLine === false) { status.textContent = text('pwa_connect_to_download_voice'); return; }
      running = true; paused = false; cancelled = false; download.disabled = true; pause.disabled = false; cancel.disabled = false;
      try {
        await navigator.storage?.persist?.();
        const pack = await getPack(), cache = await caches.open(`pecan-grove-voice-${lang}`);
        progress.max = pack.files.length; progress.value = 0;
        for (const file of pack.files) {
          if (paused && !cancelled) await new Promise(resolve => { wake = resolve; });
          if (cancelled) break;
          const url = asset(`assets/games/community-builders/voice/${lang}/${file.file}`);
          if (!await cache.match(url, { ignoreSearch: true })) {
            controller = new AbortController(); const clip = await fetch(url, { signal: controller.signal });
            if (!clip.ok) throw new Error('clip'); await cache.put(url, clip);
          }
          progress.value += 1;
          status.textContent = `${label}: ${progress.value} / ${pack.files.length} (${(pack.totalBytes / 1048576).toFixed(1)} MB)`;
        }
        if (cancelled) status.textContent = text('pwa_download_cancelled_completed_clips_stay_available');
        else status.textContent = text('pwa_is_ready_offline', {label: label});
        const estimate = await navigator.storage?.estimate?.();
        if (estimate?.quota) status.append(make('span', text('pwa_device_storage_mb_used', {value1: (estimate.usage / 1048576).toFixed(1)})));
      } catch (_) { status.textContent = cancelled ? text('pwa_download_cancelled') : text('pwa_download_paused_by_a_connection_or_storage_problem_try_again_to_k'); }
      finally { running = false; download.disabled = false; pause.disabled = true; cancel.disabled = true; }
    });
    section.append(size, status, progress, download, pause, cancel, remove); container.append(section);
  }
  const install = make('button', text('pwa_install_the_game'), { type: 'button', class: 'pt-tool' });
  install.hidden = !installEvent;
  install.addEventListener('click', () => window.PecanGroveOffline.install());
  document.addEventListener('cb:install-available', () => { install.hidden = false; }); container.append(install);
}
window.PecanGroveOffline = {
  get availableInstall() { return !!installEvent; }, openVoicePacks,
  async install() { if (!installEvent) return false; const event = installEvent; installEvent = null; await event.prompt(); return (await event.userChoice).outcome === 'accepted'; }
};
document.addEventListener('cb:settings-open', event => { const container = event.detail?.container || document.getElementById('pg-offline-voice-controls'); if (container) openVoicePacks(container); });
