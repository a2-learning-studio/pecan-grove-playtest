export default function createVoiceCues(ctx) {
  var CUES = {
    "s01-past": [["tap today", "toca hoy", ".cb-s01-view[data-view=today]", 1]],
    "s02-coach-": [
      ["one tile in each row", "una ficha en cada fila", ".cb-s02-row", 3],
      ["tap ask it", "toca pregúntalo", { en: "Ask it", es: "Pregúntalo" }, 1],
    ],
    "s03-p1": [["tap each neighbor", "toca a cada vecino", ".cb-nbr", 6]],
    "s03-p2": [["tap one neighbor", "toca a un vecino", ".cb-note", 2]],
    "s03-p3": [["tap the neighbor", "toca al vecino", ".cb-face-btn", 6]],
    "s04-how": [
      [
        "peek at the source",
        "mira la fuente",
        { en: "Peek at the source", es: "Mira la fuente" },
        1,
      ],
      ["the box", "la caja", ".cb-basket", 3],
    ],
    "s05-q1": [["tap a place", "toca un lugar", ".cb-s05-place", 6]],
    "s05-q2": [["tap a neighbor", "toca a un vecino", ".cb-face-btn", 6]],
    "s06-who": [["tap the desk", "toca el escritorio", ".cb-s06-desk", 7]],
    "s07-build": [
      ["one tile in each row", "una ficha en cada fila", ".cb-s07-tile", 3],
    ],
    "s07-who": [["tap who", "toca para", ".cb-s07-helper", 6]],
    "s08-c1": [["tap each neighbor", "toca a cada vecino", ".cb-s08-nb", 2]],
    "s08-c2": [["try it", "pruébalo", { en: "Try it", es: "Pruébalo" }, 3]],
    "s09-instr": [["empty chair", "silla vacía", ".cb-s09-chair", 5]],
    "s10-c1": [["tap a problem", "toca un problema", ".cb-s10-prob", 6]],
    "s10-c2": [["tap a fix", "toca una solución", ".cb-s10-fix__main", 6]],
    "s11-p1": [["tap each signpost", "toca cada letrero", ".cb-s11-sign", 4]],
    "s11-q1": [
      ["tap a neighbor", "toca a un vecino", ".cb-s11-nb, .cb-face-btn", 6],
    ],
    "s11-q2": [
      ["tap a neighbor", "toca a un vecino", ".cb-s11-nb, .cb-face-btn", 6],
    ],
    "s11-p3": [["tap a change", "toca un cambio", ".cb-s11-chg", 4]],
    "s12-s1": [["pick 4 promises", "elige 4 promesas", ".cb-s12-card", 8]],
    "s12-s3": [["tap each fuzzy part", "toca cada parte", ".cb-s12-fuzzy", 6]],
    "s13-tap": [["tap a card", "toca una tarjeta", ".cb-s13-card", 6]],
    "s14-s1": [
      ["its clue", "su pista", ".cb-s14-clue", 6],
      ["no clue found", "no encontré pista", ".cb-s14-none", 1],
    ],
    "s14-s2": [["a kind follow-up", "un seguimiento", ".cb-s14-fu", 6]],
    "s15-plan": [["tap a place", "toca un lugar", ".cb-s15-place", 5]],
    "s15-theo2": [["one yearly check-in", "una revisión", ".cb-s15-check", 3]],
    "s15-lucia3": [
      ["invite one person", "invita a una persona", ".cb-s15-person", 6],
    ],
  };
  var vInkLayer = null,
    vInkTimers = [];
  function vCues(f, c) {
    // the clock time of each cue in this clip
    var id = f.replace(/^..\//, "").replace(/\.mp3$/, ""),
      list = CUES[id] || (/^s02-coach-/.test(id) ? CUES["s02-coach-"] : null);
    if (!list || !c) return [];
    var S = c.s.split(" ").map(ctx.vTok),
      out = [];
    list.forEach(function (q) {
      var P = q[ctx.L === "es" ? 1 : 0].split(" ").map(ctx.vTok);
      for (var i = c.h || 0; i + P.length <= S.length; i++) {
        var ok = true;
        for (var j = 0; j < P.length; j++)
          if (S[i + j].indexOf(P[j]) !== 0) {
            ok = false;
            break;
          }
        if (ok) {
          out.push({ at: c.t[i], what: q[2], max: q[3], done: false });
          break;
        }
      }
    });
    return out;
  }
  function vTargets(what, max) {
    var all =
      typeof what === "string"
        ? [].slice.call(ctx.root.querySelectorAll(what))
        : [].slice
            .call(ctx.root.querySelectorAll("button, [role=tab]"))
            .filter(function (b) {
              return ctx.vNorm(b.textContent).indexOf(what[ctx.L]) >= 0;
            });
    return all
      .filter(function (e) {
        var r = e.getBoundingClientRect();
        return r.width > 4 && r.height > 4 && !e.closest("[hidden], .cb-vh");
      })
      .slice(0, max || 1);
  }
  function vInkClear() {
    vInkTimers.forEach(ctx.clearTimeout);
    vInkTimers = [];
    if (vInkLayer) ctx.clear(vInkLayer);
  }
  function vCircle(el, k) {
    // one marker loop around el, a little wobbly, overlapping where it closes
    if (!vInkLayer || !vInkLayer.isConnected) {
      vInkLayer = ctx.h("div", { class: "cb-ink", "aria-hidden": "true" });
      ctx.root.appendChild(vInkLayer);
    }
    var R = ctx.root.getBoundingClientRect(),
      r = el.getBoundingClientRect(),
      pad = Math.max(8, Math.min(16, r.height * 0.18));
    var w = r.width + pad * 2,
      hh = r.height + pad * 2,
      x = r.left - R.left + ctx.root.scrollLeft - pad,
      y = r.top - R.top + ctx.root.scrollTop - pad;
    var svg = ctx.document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + w.toFixed(1) + " " + hh.toFixed(1));
    svg.setAttribute("class", "cb-ink__loop");
    svg.style.setProperty("left", x.toFixed(1) + "px");
    svg.style.setProperty("top", y.toFixed(1) + "px");
    svg.style.setProperty("width", w.toFixed(1) + "px");
    svg.style.setProperty("height", hh.toFixed(1) + "px");
    var cx = w / 2,
      cy = hh / 2,
      rx = w / 2 - 3,
      ry = hh / 2 - 3,
      a0 = -2.2 + k * 0.7,
      d = "";
    for (var i = 0; i <= 56; i++) {
      var u = i / 56,
        a = a0 + u * Math.PI * 2 * 1.1,
        wob = 1 + 0.03 * Math.sin(3 * a + k) + 0.02 * Math.sin(5 * a + 2 * k),
        grow = 1 - 0.07 * u;
      d +=
        (i ? " L" : "M") +
        (cx + Math.cos(a) * rx * wob * (1.02 - 0.04 * u)).toFixed(1) +
        " " +
        (cy + Math.sin(a) * ry * wob * grow).toFixed(1);
    }
    var path = ctx.document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path.setAttribute("d", d);
    svg.appendChild(path);
    vInkLayer.appendChild(svg);
    var len = path.getTotalLength();
    path.style.setProperty("--len", len.toFixed(0));
    vInkTimers.push(
      ctx.setTimeout(function () {
        svg.classList.add("is-out");
      }, 3000),
    );
    vInkTimers.push(
      ctx.setTimeout(function () {
        svg.remove();
      }, 3500),
    );
  }
  function vCue(q) {
    vTargets(q.what, q.max).forEach(function (el, k) {
      vCircle(el, k);
    });
  }
  ctx.publish({ vCues, vTargets, vInkClear, vCircle, vCue });
  ctx.bind({
    CUES: [() => CUES, (value) => (CUES = value)],
    vInkLayer: [() => vInkLayer, (value) => (vInkLayer = value)],
    vInkTimers: [() => vInkTimers, (value) => (vInkTimers = value)],
  });
}
