import { installMapPresentation } from "../map-layout.js";
export default function createMap(ctx) {
  function showMap(msg) {
    if (typeof ctx.activeLifecycle !== "undefined" && ctx.activeLifecycle) {
      ctx.activeLifecycle.dispose();
      ctx.activeLifecycle = null;
    }
    ctx.inStop = false;
    ctx.mode = "map";
    ctx.setTitle(null);
    if (ctx.team) {
      ctx.store.current = ctx.team.prev || "you";
      ctx.save();
      ctx.team = null;
    }
    var pl = ctx.player(),
      sug = ctx.nextSuggested(),
      openN = Object.keys(ctx.PLAYABLE).length,
      stampId = ctx.justDone;
    ctx.justDone = null;
    var canvas = ctx.h("div", { class: "cb-world__canvas" }, [
      ctx.img("town-map", "", "cb-world__art", true),
    ]);
    var pan = ctx.h(
      "div",
      { class: "cb-world__pan", role: "region", "aria-label": ctx.W.mapHelp },
      [canvas],
    );
    var world = ctx.h("div", { class: "cb-world" }, [pan]);
    var svg = ctx.document.createElementNS(ctx.SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 1376 768");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", "cb-path");
    for (var i = 0; i < ctx.POS.length - 1; i++) {
      var d = ctx.pathD(
        ctx.POS[i],
        ctx.POS[i + 1],
        ctx.POS[i - 1],
        ctx.POS[i + 2],
      );
      var stones = ctx.document.createElementNS(ctx.SVGNS, "path");
      stones.setAttribute("d", d);
      stones.setAttribute("class", "cb-stones");
      stones.setAttribute("data-upcoming", String(!ctx.rec(ctx.STOPS[i].id, pl)));
      svg.appendChild(stones);
      if (ctx.rec(ctx.STOPS[i].id, pl)) {
        var trail = ctx.document.createElementNS(ctx.SVGNS, "path");
        trail.setAttribute("d", d);
        trail.setAttribute("class", "cb-trail");
        trail.setAttribute("data-from", String(i));
        svg.appendChild(trail);
        if (stampId === ctx.STOPS[i].id && !ctx.REDUCED)
          (function (tr) {
            // the signature: the path draws itself to the next stop
            ctx.requestAnimationFrame(function () {
              var len = tr.getTotalLength();
              tr.style.strokeDasharray = len;
              tr.style.strokeDashoffset = len;
              tr.getBoundingClientRect();
              tr.style.transition =
                "stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.25s";
              tr.style.strokeDashoffset = "0";
            });
          })(trail);
      }
    }
    canvas.appendChild(svg);
    function token(s, onMap) {
      var r = ctx.rec(s.id, pl),
        firstUnfinished = ctx.STOPS.find(function (candidate) {
          return !ctx.rec(candidate.id, pl);
        }),
        orderLocked =
          ctx.CFG.playInOrder &&
          firstUnfinished &&
          s.n > firstUnfinished.n &&
          !r,
        playable = ctx.PLAYABLE[s.id] && !orderLocked,
        saved = pl.resume && pl.resume.stopId === s.id ? pl.resume : null,
        st = r ? ctx.starsFor(r.best) : 0;
      var state = !playable
        ? "locked"
        : r
          ? "done"
          : saved
            ? "started"
            : sug === s.id
              ? "next"
              : "open";
      var label = playable
        ? r
          ? ctx.W.stopStars(s.n, s.name, st)
          : ctx.W.stopOpen(s.n, s.name) +
            (state === "next"
              ? ", " + ctx.W.next
              : state === "started"
                ? ", " + ctx.W.mapKeepGoing
                : "")
        : ctx.W.stopSoon(s.n, s.name);
      var disc = ctx.h(
        "span",
        { class: "cb-stop__disc", "aria-hidden": "true" },
        [
          state === "done"
            ? ctx.ico("check")
            : ctx.h("span", { text: String(s.n) }),
          state === "locked"
            ? ctx.h("span", { class: "cb-stop__lock" }, [ctx.ico("lock")])
            : null,
        ],
      );
      var plate = ctx.h(
        "span",
        { class: "cb-stop__plate", "aria-hidden": "true" },
        [
          ctx.h("span", { class: "cb-stop__n", text: ctx.W.stop + " " + s.n }),
          ctx.h("b", { text: s.name }),
          state === "started"
            ? ctx.h("span", { class: "cb-state", text: ctx.W.mapKeepGoing })
            : null,
          playable
            ? r
              ? ctx.starRow(st)
              : null
            : ctx.h("span", { class: "cb-state", text: ctx.W.soon }),
        ],
      );
      var mini =
        state === "done"
          ? ctx.h("span", { class: "cb-stop__mini", "aria-hidden": "true" }, [
              ctx.starRow(st),
            ])
          : null;
      var b = ctx.h(
        "button",
        {
          type: "button",
          class: "cb-stop" + (onMap && stampId === s.id ? " is-stamping" : ""),
          "data-state": state,
          "data-stop-id": s.id,
          "data-stop-n": String(s.n),
          "aria-label": label,
          "aria-disabled": orderLocked ? "true" : null,
          onclick: function () {
            if (orderLocked) {
              ctx.say(ctx.W.mapOrderHelp);
              return;
            }
            if (saved && playable) ctx.resume(saved);
            else if (playable) ctx.startStop(s.id);
            else ctx.comingSoon(s, b);
          },
        },
        [
          state === "next"
            ? ctx.h("span", {
                class: "cb-tag",
                "aria-hidden": "true",
                text: ctx.W.next,
              })
            : null,
          disc,
          mini,
          plate,
        ],
      );
      b.style.setProperty("--cb-chap", ctx.CHAP[s.chap - 1]);
      var li = ctx.h("li", null, [b]);
      if (onMap) {
        var x = ctx.POS[s.n - 1][0];
        li.style.left = x + "%";
        li.style.top = ctx.POS[s.n - 1][1] + "%";
        if (x > 85) li.setAttribute("data-edge", "r");
        else if (x < 8) li.setAttribute("data-edge", "l");
      }
      return li;
    }
    canvas.appendChild(
      ctx.h(
        "ul",
        { class: "cb-stops cb-stops--onmap" },
        ctx.STOPS.map(function (s) {
          return token(s, true);
        }),
      ),
    );
    var J = ctx.journeyOf(pl);
    var scoreBtn = ctx.h(
      "button",
      {
        type: "button",
        class: "cb-jscore",
        onclick: function () {
          ctx.openLast5(scoreBtn);
        },
      },
      [
        ctx.ico("star", "cb-ico--fill cb-jscore__ico"),
        ctx.h("span", { class: "cb-jscore__txt" }, [
          ctx.h("span", { class: "cb-jscore__label", text: ctx.W.journey }),
          ctx.h("strong", null, [
            ctx.h("span", { class: "cb-jscore__num", text: String(J) }),
            ctx.h("small", { text: "/ 1500" }),
          ]),
        ]),
        ctx.h("span", { class: "cb-jscore__more" }, [
          ctx.h("span", { text: ctx.W.last5 }),
          ctx.ico("go"),
        ]),
      ],
    );
    world.appendChild(ctx.h("div", { class: "cb-world__hud" }, [scoreBtn]));
    canvas.addEventListener("focusout", function (e) {
      if (e.target.classList) e.target.classList.remove("is-quiet");
    });
    if (msg) {
      var toast = ctx.h("p", { class: "cb-toast", text: msg });
      world.appendChild(toast);
      ctx.setTimeout(function () {
        if (toast.isConnected) toast.remove();
      }, 5000);
    }
    var journey = ctx.h(
      "details",
      { class: "cb-journey" },
      [
        ctx.h("summary", null, [
          ctx.h("span", { text: ctx.W.allStops }),
          ctx.ico("go"),
        ]),
        ctx.h("p", { class: "cb-journey__help", text: ctx.W.journeyHelp }),
      ].concat(
        ctx.W.chapters.map(function (c, ci) {
          var ss = ctx.STOPS.filter(function (s) {
              return s.chap === ci + 1;
            }),
            done = ss.filter(function (s) {
              return ctx.rec(s.id, pl);
            }).length;
          var sec = ctx.h("section", { class: "cb-chap" }, [
            ctx.h("h3", { class: "cb-chap__h" }, [
              ctx.h("i", { "aria-hidden": "true" }),
              ctx.h("span", { text: ci + 1 + ". " + c }),
              ctx.h("small", { text: ctx.X.of(done, ss.length) }),
            ]),
            ctx.h(
              "ul",
              { class: "cb-stops cb-stops--list" },
              ss.map(function (s) {
                return token(s, false);
              }),
            ),
          ]);
          sec.style.setProperty("--cb-chap", ctx.CHAP[ci]);
          return sec;
        }),
      ),
    );
    var lib = ctx.btn(
      ctx.W.library,
      "cb-btn--onstage",
      function () {
        ctx.openLibraryMode(lib);
      },
      "people",
    );
    var gu = ctx.btn(
      ctx.W.grownups,
      "cb-btn--onstage cb-dock__grownups",
      function () {
        ctx.openGrownups(gu);
      },
      "family",
    );
    ctx.screen([
      ctx.h("h2", { class: "cb-vh", text: ctx.W.series }),
      world,
      journey,
      ctx.h("div", { class: "cb-dock" }, [
        ctx.h("p", { class: "cb-dock__open", text: ctx.W.open(openN) }),
        ctx.h("div", { class: "cb-row" }, [lib, gu]),
      ]),
    ]);
    ctx.frame(true);
    installMapPresentation(ctx, world, canvas, pan);
    if (ctx.window.requestIdleCallback && sug && ctx.moduleManifest[sug])
      ctx.window.requestIdleCallback(
        function () {
          if (!canvas.isConnected || ctx.mode !== "map") return;
          var descriptor = ctx.moduleManifest[sug];
          [descriptor.file, descriptor.css].forEach(function (file) {
            ctx.document.head.appendChild(
              ctx.h("link", {
                rel: "prefetch",
                href: ctx.resolveAsset(ctx.BASE + "stops/" + file),
              }),
            );
          });
        },
        { timeout: 2000 },
      );
    if (msg) ctx.say(msg);
  }

  ctx.publish({ showMap });
}
