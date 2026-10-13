/* JSON is the authored source of game copy; this compatibility bundle contains no evaluated code. */
const fs = require('node:fs');
const path = require('node:path');
const directory = path.join(__dirname, '../assets/games/community-builders/locales');
const catalogs = {};
for (const lang of ['en', 'es']) {
  catalogs[lang] = {};
  for (const file of fs.readdirSync(path.join(directory, lang)).filter(file => file.endsWith('.json')).sort()) {
    catalogs[lang][file.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(directory, lang, file), 'utf8'));
  }
}
const runtime = `(function (root) {
  "use strict";
  root.CB_LOCALES = __CATALOGS__;
  var registered = { en: {}, es: {} }, resolved = { en: {}, es: {} }, pending = {};
  function load(namespace) {
    if (!/^(?:core|stop-(?:0[1-9]|1[0-5]))$/.test(namespace)) return Promise.reject(new Error('Unknown game copy namespace'));
    if (root.CB_LOCALES.en[namespace] && root.CB_LOCALES.es[namespace]) return Promise.resolve();
    if (pending[namespace]) return pending[namespace];
    pending[namespace] = Promise.all(['en','es'].map(function (language) {
      var name = 'assets/games/community-builders/locales/' + language + '/' + namespace + '.json';
      return root.fetch((root.PG_ASSET_MAP || {})[name] || name).then(function (response) {
        if (!response.ok) throw new Error('Game copy unavailable');
        return response.json();
      });
    })).then(function (values) {
      if (values.some(function (value) { return !value || typeof value !== 'object' || Array.isArray(value); })) throw new Error('Invalid game copy');
      root.CB_LOCALES.en[namespace] = values[0]; root.CB_LOCALES.es[namespace] = values[1];
    }).catch(function (error) { delete pending[namespace]; throw error; });
    return pending[namespace];
  }
  function at(object, key) { return String(key).split('.').reduce(function (value, piece) { return value && value[piece]; }, object); }
  function interpolate(value, params) { return String(value).replace(/\\{([\\w.-]+)\\}/g, function (_, key) { return params && params[key] !== undefined ? params[key] : '{' + key + '}'; }); }
  function read(namespace, lang, formatters) {
    lang = lang === 'es' ? 'es' : 'en';
    var handlers = registered[lang][namespace] || (registered[lang][namespace] = {});
    Object.assign(handlers, formatters && formatters[lang] || {});
    function materialize(value, key) {
      if (value && value.$parts) return handlers[key] || function () { return value.$parts.join(''); };
      if (Array.isArray(value)) return value.map(function (item, index) { return materialize(item, key + '.' + index); });
      if (value && typeof value === 'object') { var result = {}; Object.keys(value).forEach(function (name) { result[name] = materialize(value[name], key ? key + '.' + name : name); }); return result; }
      return value;
    }
    var data = materialize(root.CB_LOCALES[lang][namespace] || {}, '');
    resolved[lang][namespace] = data; return data;
  }
  root.CBLocale = {
    load: load,
    read: read,
    pair: function (namespace, key) {
      var en = at(root.CB_LOCALES.en[namespace], key), es = at(root.CB_LOCALES.es[namespace], key);
      if (typeof en !== 'string' || typeof es !== 'string') throw new Error('Missing bilingual game copy: ' + namespace + '.' + key);
      return [en, es];
    },
    part: function (namespace, lang, key, index) { var value = at(root.CB_LOCALES[lang][namespace], key); return value && value.$parts[index] || ''; },
    t: function (namespace, lang, key, params) {
      var value = at(resolved[lang][namespace] || read(namespace, lang), key), raw = at(root.CB_LOCALES[lang][namespace], key);
      if (typeof value === 'function') return value.apply(null, (raw.$args || []).map(function (name) { return params && params[name]; }));
      if (value && typeof value === 'object' && !Array.isArray(value)) { var plural = new Intl.PluralRules(lang).select(Number(params && params.count) || 0); value = value[plural] || value.other; }
      return interpolate(value === undefined ? key : value, params);
    },
    list: function (items, lang) { return new Intl.ListFormat(lang, { style: 'long', type: 'conjunction' }).format(items); }
  };
})(typeof window === 'object' ? window : globalThis);
`;
fs.writeFileSync(path.join(directory, 'catalog.js'), runtime.replace('__CATALOGS__', JSON.stringify(catalogs)));
console.log('Generated game locale catalog from ' + Object.keys(catalogs.en).length + ' bilingual JSON namespaces.');
