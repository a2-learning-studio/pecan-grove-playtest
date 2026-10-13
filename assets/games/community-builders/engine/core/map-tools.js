export default function createMapTools(ctx) {
  function nextSuggested() {
    var pl = ctx.player();
    for (var i = 0; i < ctx.STOPS.length; i++)
      if (ctx.PLAYABLE[ctx.STOPS[i].id] && !ctx.rec(ctx.STOPS[i].id, pl))
        return ctx.STOPS[i].id;
    return null;
  }
  function pathD(a, b, prev, next) {
    // Catmull-Rom segment a->b as a cubic Bezier, in map pixels
    var X_ = function (p) {
        return p[0] * 13.76;
      },
      Y = function (p) {
        return p[1] * 7.68;
      };
    prev = prev || a;
    next = next || b;
    var c1x = X_(a) + (X_(b) - X_(prev)) / 6,
      c1y = Y(a) + (Y(b) - Y(prev)) / 6,
      c2x = X_(b) - (X_(next) - X_(a)) / 6,
      c2y = Y(b) - (Y(next) - Y(a)) / 6;
    return (
      "M" +
      X_(a) +
      " " +
      Y(a) +
      " C" +
      c1x +
      " " +
      c1y +
      " " +
      c2x +
      " " +
      c2y +
      " " +
      X_(b) +
      " " +
      Y(b)
    );
  }
  function starRow(n) {
    var e = ctx.h("span", { class: "cb-stars", "aria-hidden": "true" });
    ctx.setAuthoredMarkup(
      e,
      [0, 1, 2]
        .map(function (i) {
          return i < n ? ctx.STAR_ON : ctx.STAR_OFF;
        })
        .join(""),
    );
    return e;
  }
  function comingSoon(s, opener) {
    var badge = ctx.h(
      "span",
      { class: "cb-dlg__badge", "aria-hidden": "true" },
      [
        ctx.h("span", { text: String(s.n) }),
        ctx.h("span", { class: "cb-stop__lock" }, [ctx.ico("lock")]),
      ],
    );
    badge.style.setProperty("--cb-chap", ctx.CHAP[s.chap - 1]);
    ctx.dialog(
      ctx.W.stop + " " + s.n + ": " + s.name,
      [ctx.h("p", { class: "cb-dlg__lead", text: ctx.W.soon })],
      opener,
      null,
      { badge: badge, sub: ctx.W.chapters[s.chap - 1] },
    );
  }
  function openLast5(opener) {
    var pl = ctx.player(),
      rows = ctx.STOPS.filter(function (s) {
        return ctx.rec(s.id, pl);
      });
    var body = rows.length
      ? ctx.h("table", { class: "cb-table" }, [
          ctx.h("thead", null, [
            ctx.h("tr", null, [
              ctx.h("th", { text: ctx.W.stop }),
              ctx.h("th", { text: ctx.W.last5 }),
              ctx.h("th", { class: "cb-num", text: ctx.W.best }),
            ]),
          ]),
          ctx.h(
            "tbody",
            null,
            rows.map(function (s) {
              var r = ctx.rec(s.id, pl);
              var tries = r.last5 || [];
              var bars = ctx.h(
                "span",
                {
                  class: "cb-tries",
                  role: "img",
                  "aria-label": tries.join(", "),
                },
                tries.map(function (v) {
                  var b = ctx.h("span", { class: "cb-tries__bar" }, [
                    ctx.h("b", { text: String(v) }),
                  ]);
                  b.style.setProperty(
                    "--h",
                    Math.max(4, Math.round(v * 0.4)) + "px",
                  );
                  return b;
                }),
              );
              bars.style.setProperty("--cb-chap", ctx.CHAP[s.chap - 1]);
              return ctx.h("tr", null, [
                ctx.h("td", { text: s.n + ". " + s.name }),
                ctx.h("td", null, [bars]),
                ctx.h("td", { class: "cb-num", text: String(r.best) }),
              ]);
            }),
          ),
        ])
      : ctx.h("p", { text: ctx.W.open(Object.keys(ctx.PLAYABLE).length) });
    ctx.dialog(ctx.W.last5, [body], opener, null, { wide: true });
  }
  ctx.publish({ nextSuggested, pathD, starRow, comingSoon, openLast5 });
}
