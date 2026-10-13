/* P0-06: embedded pages must open the first-party game in their own tab. */
(function () {
  'use strict';
  var embedded = false;
  try { embedded = window.top !== window.self; } catch (_) { embedded = true; }
  if (!embedded) return;
  var es = document.documentElement.lang === 'es';
  var main = document.createElement('main'); main.className = 'pt-note';
  var heading = document.createElement('h1'); heading.textContent = es ? 'Abre el juego en su propia pestaña' : 'Open the game in its own tab';
  var link = document.createElement('a'); link.className = 'pt-btn'; link.href = window.location.href;
  link.target = '_blank'; link.rel = 'noopener'; link.textContent = es ? 'Abrir Pecan Grove' : 'Open Pecan Grove';
  main.appendChild(heading); main.appendChild(link); document.body.replaceChildren(main);
})();
