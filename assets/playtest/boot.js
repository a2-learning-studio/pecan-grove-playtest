/* One ordered boot path for both the source preview and the production build. */
import './frame-guard.js';
import './locales/catalog.js';
import './styles.js';

async function boot() {
  if (!document.getElementById('community-builders')) return;
  const gameLocales = import('../games/community-builders/locales/catalog.js');
  if (document.documentElement.dataset.flavor !== 'family') {
    await import('./feedback.js');
  }
  await gameLocales;
  await window.CBLocale.load('core');
  await import('../games/community-builders/cb.js');
  await import('./shell.js');
  await import('../games/community-builders/engine/main.js');
  await import('./pwa.js');
}

try { await boot(); }
catch (_) {
  const words = window.PGShellLocale[document.documentElement.lang === 'es' ? 'es' : 'en'];
  const message = document.createElement('p'); message.setAttribute('role', 'alert');
  message.textContent = words.boot_error;
  const reload = document.createElement('button'); reload.type = 'button'; reload.className = 'pt-btn';
  reload.textContent = words.reload; reload.addEventListener('click', () => location.reload());
  document.getElementById('pt-start')?.setAttribute('disabled', '');
  document.getElementById('pt-feedback-new-player-top')?.setAttribute('disabled', '');
  (document.querySelector('.pt-intro__copy') || document.body).append(message, reload);
}
