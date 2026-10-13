import { mapOrderControl } from "../map-layout.js";
export default function createLibrary(ctx) {
  function openLibraryMode(opener) {
    ctx.vStop();
    var wrap = ctx.h("div", {
      class: "cb-dlg__body cb-library",
      "data-cb-novoice": "",
    });
    var note = ctx.h("p", { text: ctx.X.libraryNote });
    var status = ctx.h("p", {
      class: "cb-library__status",
      role: "status",
      text: !ctx.vOn ? ctx.X.libraryActive : "",
    });
    var quiet = ctx.btn(
      ctx.X.libraryQuiet,
      "cb-btn--go",
      function () {
        ctx.setVoice(false, true);
        // Library mode chooses the classic, predictable reading-card format.
        var settings =
          ctx.window.PecanGroveEngine && ctx.window.PecanGroveEngine.settings;
        if (settings) settings.update({ findCards: true });
        else {
          ctx.CFG.findCards = true;
          ctx.cfgSave();
        }
        status.textContent = ctx.X.libraryActive;
        d.close();
      },
      "voiceOff",
    );
    quiet.setAttribute("aria-pressed", !ctx.vOn ? "true" : "false");
    var settings = ctx.btn(
      ctx.X.librarySettings,
      "",
      function () {
        d.close();
        ctx.openSettings(opener);
      },
      "sliders",
    );
    var groups = ctx.btn(
      ctx.X.libraryGroups,
      "",
      function () {
        d.close();
        openWho(opener);
      },
      "people",
    );
    [
      note,
      status,
      mapOrderControl(ctx),
      ctx.h("div", { class: "cb-row" }, [quiet, settings]),
      ctx.h("section", { class: "cb-library__groups" }, [
        ctx.h("h3", { text: ctx.X.libraryGroups }),
        ctx.h("p", { text: ctx.X.libraryGroupsNote }),
        groups,
      ]),
    ].forEach(function (e) {
      wrap.appendChild(e);
    });
    var d = ctx.dialog(ctx.W.library, [wrap], opener, null, {
      sub: ctx.X.librarySub,
      closeLabel: ctx.X.keepPlaying,
    });
    return d;
  }
  function openWho(opener) {
    var wrap = ctx.h("div", { class: "cb-dlg__body" });
    var grid = ctx.h("div", { class: "cb-animals" });
    ctx.ANIMALS.forEach(function (a) {
      grid.appendChild(
        ctx.animalBtn(
          a,
          function () {
            ctx.store.current = a.id;
            ctx.save();
            d.close();
            ctx.showMap();
          },
          ctx.store.current === a.id,
        ),
      );
    });
    wrap.appendChild(grid);
    var sb = ctx.btn(
      ctx.W.scoreboard,
      "",
      function () {
        d.close();
        openScoreboard(opener);
      },
      "trophy",
    );
    var tc = ctx.btn(
      ctx.W.team,
      "",
      function () {
        d.close();
        teamStart(opener);
      },
      "people",
    );
    var lv = ctx.btn(
      ctx.W.leave,
      "",
      function () {
        ctx.store.current = "you";
        ctx.save();
        d.close();
        ctx.showMap();
      },
      "back",
    );
    wrap.appendChild(ctx.h("div", { class: "cb-row" }, [sb, tc, lv]));
    var d = ctx.dialog(ctx.W.who, [wrap], opener, null, { wide: true });
  }
  function improvement(pl) {
    var best = null;
    for (var k in pl.stops) {
      var a = pl.stops[k].all || [];
      if (a.length >= 2) {
        var l3 = a.slice(1).slice(-3),
          v =
            l3.reduce(function (t, x) {
              return t + x;
            }, 0) /
              l3.length -
            a[0];
        if (best === null || v > best) best = v;
      }
    }
    return best;
  }
  function openScoreboard(opener) {
    var played = ctx.ANIMALS.filter(function (a) {
      var p = ctx.store.players[a.id];
      return p && Object.keys(p.stops).length;
    });
    var imps = played.map(function (a) {
      return improvement(ctx.store.players[a.id]);
    });
    var top = imps.reduce(function (m, v) {
      return v !== null && v > 0 && (m === null || v > m) ? v : m;
    }, null);
    var rows = played.map(function (a, i) {
      var p = ctx.store.players[a.id],
        stars = 0,
        bestStop = null;
      for (var k in p.stops) {
        stars += ctx.starsFor(p.stops[k].best);
        if (!bestStop || p.stops[k].best > p.stops[bestStop].best) bestStop = k;
      }
      var bs = ctx.STOPS.filter(function (s) {
        return s.id === bestStop;
      })[0];
      return ctx.h("tr", null, [
        ctx.h("td", null, [
          ctx.h("span", { class: "cb-who" }, [
            ctx.animalFace(a),
            ctx.h("span", { text: a.name }),
            top !== null && imps[i] === top
              ? ctx.h("span", { class: "cb-ribbon", text: ctx.W.improved })
              : null,
          ]),
        ]),
        ctx.h("td", { class: "cb-num", text: ctx.journeyOf(p) + " / 1500" }),
        ctx.h("td", { class: "cb-num", text: String(stars) }),
        ctx.h("td", {
          text: bs ? bs.name + " (" + p.stops[bestStop].best + ")" : "",
        }),
      ]);
    });
    var tbl = ctx.h("table", { class: "cb-table" }, [
      ctx.h("thead", null, [
        ctx.h("tr", null, [
          ctx.h("th", { text: "" }),
          ctx.h("th", { class: "cb-num", text: ctx.W.total }),
          ctx.h("th", { class: "cb-num", text: ctx.W.starsWord }),
          ctx.h("th", { text: ctx.W.pbest }),
        ]),
      ]),
      ctx.h("tbody", null, rows),
    ]);
    ctx.dialog(
      ctx.W.scoreboard,
      [
        rows.length ? tbl : null,
        top === null ? ctx.h("p", { text: ctx.W.noImproved }) : null,
        ctx.h("p", { class: "cb-dlg__sub", text: ctx.W.everyone }),
      ],
      opener,
      null,
      { wide: true },
    );
  }
  function teamStart(opener) {
    ctx.team = {
      a: null,
      b: null,
      stop: null,
      phase: "pickA",
      cards: [],
      prev: ctx.store.current || "you",
    };
    var wrap = ctx.h("div", { class: "cb-dlg__body" }),
      d;
    function stepA() {
      ctx.clear(wrap);
      wrap.appendChild(
        ctx.h("p", { class: "cb-dlg__lead", text: ctx.W.team1 }),
      );
      var g = ctx.h("div", { class: "cb-animals" });
      ctx.ANIMALS.forEach(function (a) {
        g.appendChild(
          ctx.animalBtn(a, function () {
            ctx.team.a = a.id;
            stepB();
          }),
        );
      });
      wrap.appendChild(g);
      g.firstChild.focus();
    }
    function stepB() {
      ctx.clear(wrap);
      wrap.appendChild(
        ctx.h("p", { class: "cb-dlg__lead", text: ctx.W.team2 }),
      );
      var g = ctx.h("div", { class: "cb-animals" });
      ctx.ANIMALS.filter(function (a) {
        return a.id !== ctx.team.a;
      }).forEach(function (a) {
        g.appendChild(
          ctx.animalBtn(a, function () {
            ctx.team.b = a.id;
            stepStop();
          }),
        );
      });
      wrap.appendChild(g);
      g.firstChild.focus();
    }
    function stepStop() {
      ctx.clear(wrap);
      wrap.appendChild(
        ctx.h("p", { class: "cb-dlg__lead", text: ctx.W.pickStop }),
      );
      var row = ctx.h("div", { class: "cb-row" });
      ctx.STOPS.filter(function (s) {
        return ctx.PLAYABLE[s.id];
      }).forEach(function (s) {
        row.appendChild(
          ctx.btn(
            ctx.W.stop + " " + s.n + ": " + s.name,
            "cb-btn--primary",
            function () {
              ctx.team.stop = s.id;
              ctx.team.phase = "A";
              ctx.store.current = ctx.team.a;
              ctx.save();
              d.close();
              ctx.startStop(s.id);
            },
            "go",
            true,
          ),
        );
      });
      wrap.appendChild(row);
      row.firstChild.focus();
    }
    d = ctx.dialog(ctx.W.team, [wrap], opener, null, { wide: true });
    stepA();
  }
  ctx.publish({
    openLibraryMode,
    openWho,
    improvement,
    openScoreboard,
    teamStart,
  });
}
