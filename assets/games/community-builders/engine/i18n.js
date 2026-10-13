export function interpolate(text, params = {}) {
  return String(text).replace(/\{([\w.-]+)\}/g, (_, key) =>
    String(params[key] ?? "{" + key + "}"),
  );
}
const LOCALE_URLS = {
  en: new URL("./locales/en.json", import.meta.url),
  es: new URL("./locales/es.json", import.meta.url),
};
export class I18n {
  constructor(language = "en", messages = {}) {
    this.language = language === "es" ? "es" : "en";
    this.messages = messages;
  }
  async load(language = this.language) {
    const lang = language === "es" ? "es" : "en";
    const path =
      "assets/games/community-builders/engine/locales/" + lang + ".json";
    const mapped = globalThis.PG_ASSET_MAP?.[path];
    const response = await fetch(
      mapped ? new URL(mapped, document.baseURI) : LOCALE_URLS[lang],
    );
    if (!response.ok) throw new Error("Locale unavailable");
    this.messages = await response.json();
    this.language = lang;
    return this;
  }
  t(key, params = {}) {
    let value = this.messages[key];
    if (value && typeof value === "object") {
      const category = new Intl.PluralRules(this.language).select(
        Number(params.count) || 0,
      );
      value = value[category] ?? value.other;
    }
    return interpolate(value ?? key, params);
  }
  list(items) {
    return new Intl.ListFormat(this.language, {
      style: "long",
      type: "conjunction",
    }).format(items);
  }
  relative(iso, now = Date.now()) {
    const days = Math.round((Date.parse(iso) - now) / 86400000);
    return new Intl.RelativeTimeFormat(this.language, {
      numeric: "auto",
    }).format(days, "day");
  }
}
