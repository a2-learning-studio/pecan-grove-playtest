/* One live feedback form, shared by the dock, modal and floating window. */
(function (host) {
  'use strict';
  function mount(document, window) {
    var stage = document.getElementById('pt-stage');
    if (!stage) return null;
    var el = function (id) { return document.getElementById('pt-' + id); };
    var intro = el('intro'), game = document.getElementById('community-builders');
    var startVersion = 0, artWarmed = false, nativeWanted = false, nativeRequest = null;
    function warmArt() {
      if (artWarmed || !window.PG_ASSET_MAP) return;
      artWarmed = true;
      var idle = window.requestIdleCallback || function (fn) { return window.setTimeout(fn, 0); };
      idle.call(window, function () {
        if (!stage.classList.contains('is-playing')) { artWarmed = false; return; }
        var width = (window.devicePixelRatio || 1) * Math.min(window.innerWidth || 900, 1376) > 1500 ? 2048 : 1376;
        var name = 'assets/games/community-builders/img/town-map-' + width + '.avif';
        var href = window.PG_ASSET_MAP[name];
        if (!href) return;
        var link = document.createElement('link');
        // This is optional future art; prefetch lets the browser defer unused candidates.
        link.rel = 'prefetch'; link.as = 'image'; link.type = 'image/avif'; link.href = href; link.setAttribute('fetchpriority', 'low');
        document.head.appendChild(link);
      }, { timeout: 3000 });
    }
    function readyToPlay(finish, fullscreen) {
      var version = ++startVersion;
      var needsStyles = window.PGStyles && window.PGStyles.required;
      if (!needsStyles && !fullscreen) { game.hidden = false; finish(); warmArt(); return; }
      var words = window.PGShellLocale && window.PGShellLocale[document.documentElement.lang === 'es' ? 'es' : 'en'];
      var status = el('play-status');
      // A mounted title must not become visible while native fullscreen is still entering.
      game.hidden = true;
      if (words) status.textContent = words.shell_loading_styles; game.setAttribute('inert', ''); game.setAttribute('aria-busy', 'true'); el('start').disabled = true;
      var fullscreenSafe = fullscreen && typeof fullscreen.catch === 'function' ? fullscreen.catch(function () { return null; }) : fullscreen;
      return Promise.all([needsStyles ? window.PGStyles.load() : null, fullscreenSafe]).then(function () {
        if (version !== startVersion) return;
        el('start').disabled = false; game.hidden = false; game.removeAttribute('inert'); game.removeAttribute('aria-busy');
        finish(); warmArt();
      }).catch(function () {
        if (version !== startVersion) return;
        el('start').disabled = false; game.hidden = false; game.removeAttribute('inert'); game.removeAttribute('aria-busy');
        stage.classList.remove('is-playing', 'is-expanded'); document.body.classList.remove('pt-playing'); coverPage(false); intro.hidden = false;
        var error = el('style-error');
        if (!error) { error = document.createElement('p'); error.id = 'pt-style-error'; error.setAttribute('role', 'alert'); intro.appendChild(error); }
        error.textContent = window.PGShellLocale[document.documentElement.lang === 'es' ? 'es' : 'en'].shell_styles_error;
        el('start').focus(); cancelNativeFS();
      });
    }
    var currentLanguage = document.documentElement.lang === 'es' ? 'es' : 'en';
    var catalogs;
    function loadCatalogs() {
      if (window.PGShellLocale) return Promise.resolve([window.PGShellLocale.en, window.PGShellLocale.es]);
      if (!catalogs) catalogs = Promise.all(['en', 'es'].map(function (language) {
        var name = 'assets/playtest/locales/' + language + '.json';
        return window.fetch((window.PG_ASSET_MAP || {})[name] || name).then(function (response) {
          if (!response.ok) throw new Error('Language file unavailable');
          return response.json();
        });
      }));
      return catalogs;
    }
    document.addEventListener('pg:language-change', function (event) {
      var language = event.detail && event.detail.language;
      if ((language !== 'en' && language !== 'es') || language === currentLanguage) return;
      var previous = currentLanguage; currentLanguage = language;
      loadCatalogs().then(function (all) {
        var oldWords = all[previous === 'es' ? 1 : 0], words = all[language === 'es' ? 1 : 0], translations = new Map();
        Object.keys(oldWords).forEach(function (key) {
          if (Array.isArray(oldWords[key])) oldWords[key].forEach(function (value, i) { translations.set(value, words[key][i]); });
          else if (typeof oldWords[key] === 'string') translations.set(oldWords[key], words[key]);
        });
        var excluded = '#community-builders, #pt-feedback, .cb-engine-dialog, #pg-update-notice';
        var walker = document.createTreeWalker(document.body, 4), node;
        while ((node = walker.nextNode())) {
          if (node.parentElement && !node.parentElement.closest(excluded)) {
            var trimmed = node.textContent.trim(), translated = translations.get(trimmed);
            if (translated) node.textContent = node.textContent.replace(trimmed, translated);
          }
        }
        document.querySelectorAll('[aria-label], [title], [data-expand-label], [data-collapse-label], [data-float-label], [data-popup-label]').forEach(function (element) {
          if (element.closest(excluded)) return;
          ['aria-label', 'title', 'data-expand-label', 'data-collapse-label', 'data-float-label', 'data-popup-label'].forEach(function (attribute) {
            var translated = translations.get(element.getAttribute(attribute));
            if (translated) element.setAttribute(attribute, translated);
          });
        });
        var flavor = document.documentElement.dataset && document.documentElement.dataset.flavor;
        document.title = flavor && flavor !== 'playtest' && words.title_local ? words.title_local : words.title;
        var badge = document.querySelector('.pt-tag');
        if (badge && typeof words.version_badge === 'string') {
          var dated = (badge.textContent || '').match(/\d{4}-\d{2}-\d{2}/);
          badge.textContent = words.version_badge.replace('{date}', dated ? dated[0] : '');
        }
        var languageLink = document.querySelector('.pt-lang');
        if (languageLink) { languageLink.href = words.other; languageLink.hreflang = words.other_lang; languageLink.lang = words.other_lang; }
        es = language === 'es';
      }).catch(function () { catalogs = null; });
    });
    var languageLink = document.querySelector && document.querySelector('.pt-lang');
    if (languageLink) languageLink.addEventListener('click', function (event) {
      var value = window.CommunityBuilders;
      if (value && value.setLanguage) { event.preventDefault(); value.setLanguage(document.documentElement.lang === 'es' ? 'en' : 'es'); }
    });
    var header = document.querySelector && document.querySelector('.pt-bar'), skip = document.querySelector && document.querySelector('.pt-skip');
    // The play view covers the page header: keep it out of the Tab order and skip straight to the game.
    function coverPage(covered) {
      if (header) { if (covered) header.setAttribute('inert', ''); else header.removeAttribute('inert'); }
      if (skip) skip.setAttribute('href', covered ? '#community-builders' : '#pt-h');
    }
    // This listener also exists in family mode; declarations below are hoisted.
    function releaseLateFullscreen() { if (fs() === stage && !stage.classList.contains('is-playing')) exitNativeFS(); }
    document.addEventListener('fullscreenchange', releaseLateFullscreen);
    document.addEventListener('webkitfullscreenchange', releaseLateFullscreen);
    var panel = el('feedback'), home = el('feedback-home'), slot = el('feedback-window');
    if (!panel) {
      var familyStart = function (options) {
        intro.hidden = true; stage.classList.add('is-playing', 'is-expanded'); document.body.classList.add('pt-playing'); coverPage(true);
        var fullscreen = !options || options.requestFullscreen !== false ? requestFS() : null;
        return readyToPlay(function () {
          var familyCore = window.CommunityBuilders || {};
          if (familyCore.enterPlay) familyCore.enterPlay({ quiet: !!el('quiet').checked });
          if (familyCore.suspendVoice) familyCore.suspendVoice(false);
          game.focus({ preventScroll: true }); stage.scrollTop = 0;
        }, fullscreen);
      };
      var familyExit = function () {
        startVersion += 1;
        var familyCore = window.CommunityBuilders || {};
        if (familyCore.suspendVoice) familyCore.suspendVoice(true);
        game.setAttribute('data-playtest-paused', 'true');
        cancelNativeFS();
        game.hidden = false; game.removeAttribute('inert'); game.removeAttribute('aria-busy'); el('start').disabled = false;
        stage.classList.remove('is-playing', 'is-expanded'); document.body.classList.remove('pt-playing'); coverPage(false); intro.hidden = false; el('h').focus();
      };
      el('start').addEventListener('click', familyStart); el('exit').addEventListener('click', familyExit);
      el('library-tab').addEventListener('click', function () { if (window.CommunityBuilders.openLibraryMode) window.CommunityBuilders.openLibraryMode(el('library-tab')); });
      el('grownups-tab').addEventListener('click', function () { if (window.CommunityBuilders.openGrownups) window.CommunityBuilders.openGrownups(el('grownups-tab')); });
      return { start: familyStart, exit: familyExit };
    }
    var review = el('review-dialog'), tab = el('review-tab'), float = el('review-float');
    var move = el('review-move'), collapse = el('review-collapse'), tools = el('review-tools');
    // This handle owns its arrow keys; shared game navigation must leave them alone.
    if (move) move.setAttribute('data-pg-native', '');
    var dockHeader = el('feedback-dock-header'), dockCollapse = el('feedback-dock-collapse'), dockFloat = el('feedback-dock-float');
    var playing = false, reviewActive = false, opener = tab;
    function narrow() { return window.matchMedia ? window.matchMedia('(max-width: 760px)').matches : window.innerWidth <= 760; }
    var dockCollapsed = narrow();
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
    function exitNativeFS() {
      var exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (fs() !== stage || !exit) return;
      try { var result = exit.call(document); return result && result.catch ? result.catch(function () {}) : result; }
      catch (_) { /* The expanded view remains usable if the native transition is unavailable. */ }
    }
    function cancelNativeFS() { nativeWanted = false; return exitNativeFS(); }
    function requestFS() {
      nativeWanted = true;
      if (nativeRequest) return nativeRequest;
      var request = stage.requestFullscreen || stage.webkitRequestFullscreen;
      if (request && document.fullscreenEnabled !== false) {
        try {
          var result = request.call(stage);
          if (result && result.then) {
            var pending = new Promise(function (resolve) {
              // A browser transition must not leave the expanded game hidden forever.
              var timeout = window.setTimeout(function () { nativeWanted = false; exitNativeFS(); resolve(); }, 3000);
              Promise.resolve(result).catch(function () {}).then(function () {
                window.clearTimeout(timeout);
                if (!nativeWanted || !stage.classList.contains('is-playing')) exitNativeFS();
                resolve();
              });
            });
            nativeRequest = pending;
            pending.then(function () { if (nativeRequest === pending) nativeRequest = null; });
            return pending;
          }
        } catch (_) { /* Expanded browser view remains available. */ }
      }
      return null;
    }
    function start(options) {
      playing = true; intro.hidden = true;
      stage.classList.add('is-playing', 'is-expanded');
      document.body.classList.add('pt-playing'); coverPage(true);
      // Request fullscreen within the original user gesture, before async work.
      var fullscreen = !options || options.requestFullscreen !== false ? requestFS() : null;
      return readyToPlay(function () {
        if (core().enterPlay) core().enterPlay({ quiet: !!el('quiet').checked });
        suspend(false);
        var words = window.PGShellLocale && window.PGShellLocale[es ? 'es' : 'en'];
        el('play-status').textContent = words ? words.shell_play_open : '';
        game.setAttribute('tabindex', '-1'); focus(game);
        stage.scrollTop = 0;
      }, fullscreen);
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
      floating = !!floating && !narrow();
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
      startVersion += 1;
      closeReview(); playing = false;
      game.setAttribute('data-playtest-paused', 'true'); suspend(true);
      cancelNativeFS();
      game.hidden = false; game.removeAttribute('inert'); game.removeAttribute('aria-busy'); el('start').disabled = false;
      stage.classList.remove('is-playing', 'is-expanded'); document.body.classList.remove('pt-playing'); coverPage(false);
      intro.hidden = false; focus(el('h'));
    }
    el('start').addEventListener('click', start);
    el('exit').addEventListener('click', exit);
    tab.addEventListener('click', function () { opener = tab; openReview(false); });
    if (dockCollapse) dockCollapse.addEventListener('click', function () {
      if (narrow() && dockCollapsed) { opener = dockCollapse; openReview(false); return; }
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
    try {
      var resumeFlag = new window.URL(window.location.href).searchParams.get('resume');
      var record = resumeFlag && JSON.parse(window.sessionStorage.getItem('pecan-grove-resume') || 'null');
      if (record && record.v === 1 && Date.now() - record.ts >= 0 && Date.now() - record.ts < 600000) {
        window.sessionStorage.removeItem('pecan-grove-resume');
        var started = start({ requestFullscreen: false });
        if (started && started.then) started.then(function () { if (core().resume && playing) core().resume(record); });
        else if (core().resume) core().resume(record);
      }
    } catch (_) { /* An invalid or expired handoff leaves the normal introduction available. */ }
    return { start: start, exit: exit, openReview: openReview, closeReview: closeReview };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { mount: mount };
  if (host.document) mount(host.document, host);
})(typeof window !== 'undefined' ? window : globalThis);
