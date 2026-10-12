/* One live feedback form, shared by the dock, modal and floating window. */
(function (host) {
  'use strict';
  function mount(document, window) {
    var stage = document.getElementById('pt-stage');
    if (!stage) return null;
    var el = function (id) { return document.getElementById('pt-' + id); };
    var intro = el('intro'), game = document.getElementById('community-builders');
    var panel = el('feedback'), home = el('feedback-home'), slot = el('feedback-window');
    var review = el('review-dialog'), tab = el('review-tab'), float = el('review-float');
    var playing = false, reviewActive = false, opener = tab;
    var es = document.documentElement.lang === 'es';
    function core() { return window.CommunityBuilders || {}; }
    function suspend(value) { if (core().suspendVoice) core().suspendVoice(value); }
    function flush() { document.dispatchEvent(new window.CustomEvent('pt:feedback-flush')); }
    function focus(node) { if (node && node.isConnected !== false) node.focus({ preventScroll: true }); }
    function fs() { return document.fullscreenElement || document.webkitFullscreenElement; }
    function requestFS() {
      var request = stage.requestFullscreen || stage.webkitRequestFullscreen;
      if (request && document.fullscreenEnabled !== false) {
        try { var result = request.call(stage); if (result && result.catch) result.catch(function () {}); } catch (_) { /* Expanded browser view remains available. */ }
      }
    }
    function start() {
      playing = true; intro.hidden = true;
      stage.classList.add('is-playing', 'is-expanded');
      document.body.classList.add('pt-playing');
      // Request fullscreen within the original user gesture, before async work.
      requestFS();
      if (core().enterPlay) core().enterPlay({ quiet: !!el('quiet').checked });
      suspend(false);
      el('play-status').textContent = es ? 'Vista de juego abierta. Los comentarios y el modo sin voz están encima del juego.' : 'Play view is open. Feedback and quiet mode are available above the game.';
      game.setAttribute('tabindex', '-1'); focus(game);
      stage.scrollTop = 0;
    }
    function restore() {
      flush();
      if (panel.parentNode !== home) home.appendChild(panel);
      review.classList.remove('is-floating');
      float.setAttribute('aria-pressed', 'false'); float.textContent = float.getAttribute('data-float-label');
      tab.setAttribute('aria-expanded', 'false');
      suspend(!playing);
    }
    function closeReview() {
      reviewActive = false;
      if (review.open) review.close();
      restore(); focus(opener && opener.isConnected !== false ? opener : tab);
    }
    function openReview(floating) {
      flush();
      if (review.open) review.close();
      slot.appendChild(panel);
      reviewActive = true;
      review.classList.toggle('is-floating', !!floating);
      float.setAttribute('aria-pressed', floating ? 'true' : 'false');
      float.textContent = float.getAttribute(floating ? 'data-popup-label' : 'data-float-label');
      tab.setAttribute('aria-expanded', 'true');
      if (floating) review.show(); else review.showModal();
      suspend(!floating || !playing);
      focus(el('review-close'));
    }
    function exit() {
      closeReview(); playing = false;
      game.setAttribute('data-playtest-paused', 'true'); suspend(true);
      var exitFS = document.exitFullscreen || document.webkitExitFullscreen;
      if (fs() === stage && exitFS) { try { var result = exitFS.call(document); if (result && result.catch) result.catch(function () {}); } catch (_) {} }
      stage.classList.remove('is-playing', 'is-expanded'); document.body.classList.remove('pt-playing');
      intro.hidden = false; focus(el('h'));
    }
    el('start').addEventListener('click', start);
    el('exit').addEventListener('click', exit);
    tab.addEventListener('click', function () { opener = tab; openReview(false); });
    float.addEventListener('click', function () { openReview(!review.classList.contains('is-floating')); });
    el('review-close').addEventListener('click', closeReview);
    el('review-dock').addEventListener('click', function () {
      closeReview(); panel.scrollIntoView({ block: 'start', behavior: 'auto' });
      el('feedback-h').setAttribute('tabindex', '-1'); focus(el('feedback-h'));
    });
    review.addEventListener('close', function () { if (!review.open && reviewActive) { reviewActive = false; restore(); focus(opener); } });
    review.addEventListener('cancel', function (event) { event.preventDefault(); closeReview(); });
    review.addEventListener('keydown', function (event) {
      // Let native modal Tab navigation work, but don't send text shortcuts to the game.
      event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault(); closeReview(); }
    });
    el('library-tab').addEventListener('click', function () { if (core().openLibraryMode) core().openLibraryMode(el('library-tab')); });
    el('grownups-tab').addEventListener('click', function () { if (core().openGrownups) core().openGrownups(el('grownups-tab')); });
    function fullscreenChanged() {
      // Escape from browser fullscreen keeps the current scene playable in expanded view.
      stage.classList.toggle('is-native-fullscreen', fs() === stage);
    }
    document.addEventListener('fullscreenchange', fullscreenChanged);
    document.addEventListener('webkitfullscreenchange', fullscreenChanged);
    suspend(true);
    return { start: start, exit: exit, openReview: openReview, closeReview: closeReview };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { mount: mount };
  if (host.document) mount(host.document, host);
})(typeof window !== 'undefined' ? window : globalThis);
