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
    var move = el('review-move'), collapse = el('review-collapse'), tools = el('review-tools');
    var dockHeader = el('feedback-dock-header'), dockCollapse = el('feedback-dock-collapse'), dockFloat = el('feedback-dock-float');
    var playing = false, reviewActive = false, opener = tab;
    var dockCollapsed = false;
    var floatingPosition = null, floatingSize = null, drag = null;
    var es = document.documentElement.lang === 'es';
    function core() { return window.CommunityBuilders || {}; }
    function suspend(value) { if (core().suspendVoice) core().suspendVoice(value); }
    function flush() { document.dispatchEvent(new window.CustomEvent('pt:feedback-flush')); }
    function focus(node) { if (node && node.isConnected !== false) node.focus({ preventScroll: true }); }
    function fs() { return document.fullscreenElement || document.webkitFullscreenElement; }
    function renderDock() {
      var docked = panel.parentNode === home;
      if (dockHeader) dockHeader.hidden = !docked;
      panel.hidden = docked && dockCollapsed;
      if (dockCollapse) {
        dockCollapse.setAttribute('aria-expanded', dockCollapsed ? 'false' : 'true');
        dockCollapse.textContent = dockCollapse.getAttribute(dockCollapsed ? 'data-expand-label' : 'data-collapse-label');
      }
    }
    function isFloating() { return review.open && review.classList.contains('is-floating'); }
    function viewport() {
      var v = window.visualViewport;
      return { x: v ? v.offsetLeft || 0 : 0, y: v ? v.offsetTop || 0 : 0,
        width: v && v.width || window.innerWidth || stage.clientWidth,
        height: v && v.height || window.innerHeight || stage.clientHeight };
    }
    function positionFloat(x, y) {
      if (!isFloating()) return;
      var v = viewport(), gap = 8;
      review.style.setProperty('--pt-review-available-width', Math.max(1, v.width - gap * 2) + 'px');
      review.style.setProperty('--pt-review-available-height', Math.max(1, v.height - gap * 2) + 'px');
      var r = review.getBoundingClientRect();
      // Keep the title bar reachable after dragging, resizing, zoom or rotation.
      x = Math.max(v.x + gap, Math.min(x, v.x + Math.max(gap, v.width - r.width - gap)));
      y = Math.max(v.y + gap, Math.min(y, v.y + Math.max(gap, v.height - r.height - gap)));
      floatingPosition = { x: x, y: y };
      review.style.left = x + 'px'; review.style.top = y + 'px';
      review.style.right = 'auto'; review.style.bottom = 'auto';
    }
    function clampFloat() {
      if (!isFloating()) return;
      var r = review.getBoundingClientRect(); positionFloat(r.left, r.top);
    }
    function rememberFloat() {
      if (!isFloating()) return;
      var r = review.getBoundingClientRect(); floatingPosition = { x: r.left, y: r.top };
      if (!review.classList.contains('is-collapsed') && r.width > 0 && r.height > 0) floatingSize = { width: r.width, height: r.height };
    }
    function endDrag() {
      if (!drag) return;
      var id = drag.id; drag = null; review.classList.remove('is-dragging');
      if (move && move.releasePointerCapture) { try { move.releasePointerCapture(id); } catch (_) {} }
    }
    function resetFloatControls() {
      endDrag(); review.classList.remove('is-collapsed');
      ['left', 'top', 'right', 'bottom', 'width', 'height'].forEach(function (key) { review.style[key] = ''; });
      review.style.removeProperty('--pt-review-available-width'); review.style.removeProperty('--pt-review-available-height');
      if (move) move.disabled = true;
      if (collapse) { collapse.hidden = true; collapse.setAttribute('aria-expanded', 'true'); collapse.textContent = collapse.getAttribute('data-collapse-label'); }
      if (tools) tools.hidden = false;
      slot.hidden = false;
    }
    function restoreFloatingSize() {
      if (!floatingSize) return;
      review.style.width = floatingSize.width + 'px'; review.style.height = floatingSize.height + 'px';
    }
    if (move) {
      move.addEventListener('pointerdown', function (event) {
        if (!isFloating() || event.button !== 0 || event.isPrimary === false || (event.target !== move && !move.contains(event.target))) return;
        var r = review.getBoundingClientRect();
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: r.left, top: r.top };
        event.preventDefault(); focus(move); review.classList.add('is-dragging');
        if (move.setPointerCapture) { try { move.setPointerCapture(event.pointerId); } catch (_) { endDrag(); } }
      });
      move.addEventListener('pointermove', function (event) {
        if (!drag || event.pointerId !== drag.id) return;
        event.preventDefault(); positionFloat(drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y);
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (type) { move.addEventListener(type, function (event) { if (drag && event.pointerId === drag.id) endDrag(); }); });
      move.addEventListener('keydown', function (event) {
        if (!isFloating() || event.ctrlKey || event.metaKey || event.altKey) return;
        var directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        if (event.key !== 'Home' && !directions[event.key]) return;
        event.preventDefault(); event.stopPropagation();
        var r = review.getBoundingClientRect(), v = viewport(), step = event.shiftKey ? 40 : 10;
        if (event.key === 'Home') positionFloat(v.x + v.width - r.width - 8, v.y + 8);
        else positionFloat(r.left + directions[event.key][0] * step, r.top + directions[event.key][1] * step);
      });
    }
    if (collapse) collapse.addEventListener('click', function () {
      if (!isFloating()) return;
      flush(); endDrag();
      var collapsed = !review.classList.contains('is-collapsed');
      rememberFloat();
      review.classList.toggle('is-collapsed', collapsed);
      if (tools) tools.hidden = collapsed;
      slot.hidden = collapsed;
      collapse.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      collapse.textContent = collapse.getAttribute(collapsed ? 'data-expand-label' : 'data-collapse-label');
      if (!collapsed) restoreFloatingSize();
      clampFloat(); focus(collapse);
    });
    window.addEventListener('resize', clampFloat);
    window.addEventListener('blur', endDrag);
    if (window.visualViewport) { window.visualViewport.addEventListener('resize', clampFloat); window.visualViewport.addEventListener('scroll', clampFloat); }
    if (typeof window.ResizeObserver === 'function') new window.ResizeObserver(clampFloat).observe(review);
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
      renderDock();
      review.classList.remove('is-floating');
      resetFloatControls();
      float.setAttribute('aria-pressed', 'false'); float.textContent = float.getAttribute('data-float-label');
      tab.setAttribute('aria-expanded', 'false');
      suspend(!playing);
    }
    function closeReview() {
      rememberFloat();
      reviewActive = false;
      if (review.open) review.close();
      restore(); focus(opener && opener.isConnected !== false ? opener : tab);
    }
    function openReview(floating) {
      flush();
      rememberFloat(); endDrag();
      if (review.open) review.close();
      slot.appendChild(panel);
      renderDock();
      reviewActive = true;
      review.classList.toggle('is-floating', !!floating);
      resetFloatControls();
      if (floating) {
        if (move) move.disabled = false;
        if (collapse) collapse.hidden = false;
        restoreFloatingSize();
      }
      float.setAttribute('aria-pressed', floating ? 'true' : 'false');
      float.textContent = float.getAttribute(floating ? 'data-popup-label' : 'data-float-label');
      tab.setAttribute('aria-expanded', 'true');
      if (floating) review.show(); else review.showModal();
      if (floating) {
        if (floatingPosition) positionFloat(floatingPosition.x, floatingPosition.y);
        else clampFloat();
      }
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
    if (dockCollapse) dockCollapse.addEventListener('click', function () {
      flush(); dockCollapsed = !dockCollapsed; renderDock(); focus(dockCollapse);
    });
    if (dockFloat) dockFloat.addEventListener('click', function () { opener = dockFloat; openReview(true); });
    float.addEventListener('click', function () { openReview(!review.classList.contains('is-floating')); });
    el('review-close').addEventListener('click', closeReview);
    el('review-dock').addEventListener('click', function () {
      dockCollapsed = false;
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
      clampFloat();
    }
    document.addEventListener('fullscreenchange', fullscreenChanged);
    document.addEventListener('webkitfullscreenchange', fullscreenChanged);
    renderDock(); suspend(true);
    return { start: start, exit: exit, openReview: openReview, closeReview: closeReview };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { mount: mount };
  if (host.document) mount(host.document, host);
})(typeof window !== 'undefined' ? window : globalThis);
