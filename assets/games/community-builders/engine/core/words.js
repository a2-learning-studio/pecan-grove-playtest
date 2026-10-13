export default function createWords(ctx) {
  var wordCallbacks = {
    en: {
      "W.open": function (n) {
        return (
          ctx.window.CBLocale.part("core", "en", "W.open", 0) +
          n +
          ctx.window.CBLocale.part("core", "en", "W.open", 1)
        );
      },
      "W.playing": function (a) {
        return ctx.window.CBLocale.part("core", "en", "W.playing", 0) + a;
      },
      "W.teamLabel": function (n) {
        return ctx.window.CBLocale.part("core", "en", "W.teamLabel", 0) + n;
      },
      "W.stars": function (n) {
        return n + ctx.window.CBLocale.part("core", "en", "W.stars", 0);
      },
      "W.stopStars": function (n, name, s) {
        return (
          ctx.window.CBLocale.part("core", "en", "W.stopStars", 0) +
          n +
          ctx.window.CBLocale.part("core", "en", "W.stopStars", 1) +
          name +
          ctx.window.CBLocale.part("core", "en", "W.stopStars", 2) +
          s +
          ctx.window.CBLocale.part("core", "en", "W.stopStars", 3)
        );
      },
      "W.stopSoon": function (n, name) {
        return (
          ctx.window.CBLocale.part("core", "en", "W.stopSoon", 0) +
          n +
          ctx.window.CBLocale.part("core", "en", "W.stopSoon", 1) +
          name +
          ctx.window.CBLocale.part("core", "en", "W.stopSoon", 2)
        );
      },
      "W.stopOpen": function (n, name) {
        return (
          ctx.window.CBLocale.part("core", "en", "W.stopOpen", 0) +
          n +
          ctx.window.CBLocale.part("core", "en", "W.stopOpen", 1) +
          name +
          ctx.window.CBLocale.part("core", "en", "W.stopOpen", 2)
        );
      },
      "W.part": function (n) {
        return (
          ctx.window.CBLocale.part("core", "en", "W.part", 0) +
          n +
          ctx.window.CBLocale.part("core", "en", "W.part", 1)
        );
      },
    },
    es: {
      "W.open": function (n) {
        return (
          ctx.window.CBLocale.part("core", "es", "W.open", 0) +
          n +
          ctx.window.CBLocale.part("core", "es", "W.open", 1)
        );
      },
      "W.playing": function (a) {
        return ctx.window.CBLocale.part("core", "es", "W.playing", 0) + a;
      },
      "W.teamLabel": function (n) {
        return ctx.window.CBLocale.part("core", "es", "W.teamLabel", 0) + n;
      },
      "W.stars": function (n) {
        return n + ctx.window.CBLocale.part("core", "es", "W.stars", 0);
      },
      "W.stopStars": function (n, name, s) {
        return (
          ctx.window.CBLocale.part("core", "es", "W.stopStars", 0) +
          n +
          ctx.window.CBLocale.part("core", "es", "W.stopStars", 1) +
          name +
          ctx.window.CBLocale.part("core", "es", "W.stopStars", 2) +
          s +
          ctx.window.CBLocale.part("core", "es", "W.stopStars", 3)
        );
      },
      "W.stopSoon": function (n, name) {
        return (
          ctx.window.CBLocale.part("core", "es", "W.stopSoon", 0) +
          n +
          ctx.window.CBLocale.part("core", "es", "W.stopSoon", 1) +
          name +
          ctx.window.CBLocale.part("core", "es", "W.stopSoon", 2)
        );
      },
      "W.stopOpen": function (n, name) {
        return (
          ctx.window.CBLocale.part("core", "es", "W.stopOpen", 0) +
          n +
          ctx.window.CBLocale.part("core", "es", "W.stopOpen", 1) +
          name +
          ctx.window.CBLocale.part("core", "es", "W.stopOpen", 2)
        );
      },
      "W.part": function (n) {
        return (
          ctx.window.CBLocale.part("core", "es", "W.part", 0) +
          n +
          ctx.window.CBLocale.part("core", "es", "W.part", 1)
        );
      },
    },
  };
  var CORE_WORDS = {
    en: ctx.window.CBLocale.read("core", "en", wordCallbacks).W,
    es: ctx.window.CBLocale.read("core", "es", wordCallbacks).W,
  };
  var W = CORE_WORDS[ctx.L];
  var extraCallbacks = {
    en: {
      "X.of": function (a, b) {
        return a + ctx.window.CBLocale.part("core", "en", "X.of", 0) + b;
      },
    },
    es: {
      "X.of": function (a, b) {
        return a + ctx.window.CBLocale.part("core", "es", "X.of", 0) + b;
      },
    },
  };
  var CORE_EXTRA = {
    en: ctx.window.CBLocale.read("core", "en", extraCallbacks).X,
    es: ctx.window.CBLocale.read("core", "es", extraCallbacks).X,
  };
  var X = CORE_EXTRA[ctx.L];
  ctx.bind({
    W: [() => W, (value) => (W = value)],
    CORE_WORDS: [() => CORE_WORDS, (value) => (CORE_WORDS = value)],
    X: [() => X, (value) => (X = value)],
    CORE_EXTRA: [() => CORE_EXTRA, (value) => (CORE_EXTRA = value)],
  });
}
