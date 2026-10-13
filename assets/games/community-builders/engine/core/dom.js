export default function createDom(ctx) {
  function h(tag, attrs, kids) {
    var e = ctx.document.createElement(tag);
    if (attrs)
      for (var k in attrs) {
        if (k === "text") e.textContent = attrs[k];
        else if (k === "html") ctx.setAuthoredMarkup(e, attrs[k]);
        else if (k.slice(0, 2) === "on")
          e.addEventListener(k.slice(2), attrs[k]);
        else if (
          attrs[k] !== null &&
          attrs[k] !== undefined &&
          attrs[k] !== false
        )
          e.setAttribute(
            k,
            tag === "script" && k === "src"
              ? ctx.trustedScriptURL(ctx.window, attrs[k])
              : attrs[k] === true
                ? ""
                : attrs[k],
          );
      }
    (kids || []).forEach(function (c) {
      if (c)
        e.appendChild(
          typeof c === "string" ? ctx.document.createTextNode(c) : c,
        );
    });
    return e;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(ctx.rng() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }
  function pick(a) {
    return a[Math.floor(ctx.rng() * a.length)];
  }
  function starsFor(s) {
    return s >= 90 ? 3 : s >= 70 ? 2 : s >= 40 ? 1 : 0;
  }
  function img(name, alt, cls, eager) {
    var image = h("img", {
      src: ctx.resolveAsset(ctx.BASE + "img/" + name + ".webp"),
      alt: alt || "",
      class: cls || null,
      loading: eager ? "eager" : "lazy",
      decoding: "async",
      fetchpriority: eager ? "high" : "auto",
    });
    var picture = null;
    if (/^town-map(?:@2x)?$/.test(name)) {
      var widths = [640, 960, 1376, 2048, 2752];
      function sources(format) {
        return widths.map(function (width) {
          return ctx.resolveAsset(ctx.BASE + "img/town-map-" + width + "." + format) + " " + width + "w";
        }).join(", ");
      }
      image.style.setProperty("background-image", 'url("' + ctx.resolveAsset(ctx.BASE + "img/town-map-placeholder.webp") + '")');
      image.style.setProperty("background-size", "cover");
      image.src = ctx.resolveAsset(ctx.BASE + "img/town-map-960.webp");
      image.setAttribute("srcset", sources("webp"));
      image.setAttribute(
        "sizes",
        "(max-width: 940px) calc(100vw - 24px), 900px",
      );
      picture = h("picture", { class: "cb-responsive-art" }, [
        h("source", { type: "image/avif", srcset: sources("avif"), sizes: image.getAttribute("sizes") }), image,
      ]);
      picture.artImage = image;
    }
    function loaded() {
      var ready = image.decode ? image.decode() : null;
      if (ready && ready.then)
        ready.then(
          function () {
            image.classList.add("is-loaded");
          },
          function () {
            image.classList.add("is-loaded");
          },
        );
      else image.classList.add("is-loaded");
    }
    image.addEventListener("load", loaded);
    if (image.complete) loaded();
    return picture || image;
  }
  function story(markup, cls) {
    var s = ctx.document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 64 64");
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    s.setAttribute("class", "cb-story" + (cls ? " " + cls : ""));
    ctx.setAuthoredMarkup(s, markup);
    return s;
  }
  function mono(name, cls) {
    return h(
      "span",
      { class: "cb-mono" + (cls ? " " + cls : ""), "aria-hidden": "true" },
      [h("span", { text: (name || "?").trim().charAt(0).toUpperCase() })],
    );
  }
  function ico(name, cls) {
    var s = ctx.document.createElementNS(ctx.SVGNS, "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    s.setAttribute("class", "cb-ico" + (cls ? " " + cls : ""));
    ctx.setAuthoredMarkup(s, ctx.IC[name]);
    return s;
  }
  function crop(rect, cls, kids) {
    var w = Math.max(0.2, Math.min(1, rect[2] - rect[0])),
      k = 1 / w;
    var ox = w >= 1 ? 0.5 : rect[0] / (1 - w),
      oy = w >= 1 ? 0.5 : Math.max(0, Math.min(1, rect[1] / (1 - w)));
    var im = img(
      (ctx.window.devicePixelRatio || 1) * k <= 1.5
        ? "town-map"
        : "town-map@2x",
      "",
      "cb-art__map cb-art__map--crop",
      true,
    );
    var picture = im, image = im.artImage || im;
    var size = "(max-width: 940px) " + Math.round(k * 100) + "vw, " + Math.round(900 * k) + "px";
    image.setAttribute("sizes", size);
    if (picture.artImage) picture.firstElementChild.setAttribute("sizes", size);
    var pos = (ox * 100).toFixed(2) + "% " + (oy * 100).toFixed(2) + "%";
    image.style.setProperty("object-position", pos);
    image.style.setProperty("transform-origin", pos);
    image.style.setProperty("transform", "scale(" + k.toFixed(3) + ")");
    var container = h(
      "div",
      { class: "cb-art" + (cls ? " " + cls : "") },
      [picture].concat(kids || []),
    );
    // Width descriptors already account for devicePixelRatio. Measure the crop itself,
    // rather than downloading a desktop-sized map for a small neighbor portrait.
    var measure = function () {
      if (container.isConnected === false) return;
      var measured = container.getBoundingClientRect().width;
      if (measured > 0) {
        var fitted = Math.ceil(measured * k) + "px";
        image.setAttribute("sizes", fitted);
        if (picture.artImage) picture.firstElementChild.setAttribute("sizes", fitted);
      }
    };
    if (ctx.window.requestAnimationFrame) ctx.window.requestAnimationFrame(measure);
    else ctx.window.setTimeout(measure, 0);
    return container;
  }
  ctx.publish({ h, shuffle, pick, starsFor, img, story, mono, ico, crop });
}
