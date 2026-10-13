/* One retryable stylesheet request when the player chooses Start. */
(function (host) {
  'use strict';
  function create(document, href) {
    var pending = null, loaded = false;
    return {
      get required() { return !!href && !loaded; },
      load: function () {
        if (!href || loaded) return Promise.resolve();
        if (pending) return pending;
        pending = new Promise(function (resolve, reject) {
          var link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href;
          link.addEventListener('load', function () { loaded = true; resolve(); }, { once: true });
          link.addEventListener('error', function () { link.remove(); pending = null; reject(new Error('Game stylesheet unavailable')); }, { once: true });
          document.head.appendChild(link);
        });
        return pending;
      }
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { create: create };
  if (host.document) host.PGStyles = create(host.document, host.PG_STYLE_HREF);
})(typeof window !== 'undefined' ? window : globalThis);
