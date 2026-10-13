export default function createScorecard(ctx) {
  function stopHud(stop, steps, cur, cap) {
    ctx.feedbackStop = stop.id;
    var a =
      ctx.store.current && ctx.store.current !== "you"
        ? ctx.animalOf(ctx.store.current)
        : null;
    var title = ctx.h("div", { class: "cb-stophud__title" }, [
      ctx.h("span", {
        class: "cb-stophud__badge",
        "aria-hidden": "true",
        text: String(stop.n),
      }),
      ctx.h("div", null, [
        ctx.h("h2", { class: "cb-stophud__h", text: stop.name }),
        ctx.h("p", {
          text:
            ctx.W.stop +
            " " +
            stop.n +
            " · " +
            ctx.W.chapters[stop.chap - 1] +
            (a ? " · " + ctx.W.playing(a.name) : ""),
        }),
      ]),
    ]);
    var stepper = null;
    if (steps) {
      var labelled = !!steps[0];
      stepper = ctx.h("div", { class: "cb-stophud__steps" }, [
        ctx.h(
          "ol",
          { class: "cb-steps" + (labelled ? "" : " cb-steps--dots") },
          steps.map(function (lbl, i) {
            var s = i < cur ? "done" : i === cur ? "now" : "todo";
            return ctx.h(
              "li",
              {
                class: "cb-step",
                "data-s": s,
                "aria-current": s === "now" ? "step" : null,
              },
              [
                ctx.h(
                  "span",
                  { class: "cb-step__dot", "aria-hidden": "true" },
                  [s === "done" ? ctx.ico("check") : String(i + 1)],
                ),
                ctx.h("span", {
                  class: labelled ? "cb-step__lbl" : "cb-vh",
                  text: lbl || String(i + 1),
                }),
              ],
            );
          }),
        ),
        cap
          ? ctx.h("p", {
              class: labelled ? "cb-vh" : "cb-steps__cap",
              text: cap,
            })
          : null,
      ]);
    }
    var hud = ctx.h("div", { class: "cb-stophud" }, [
      ctx.h("div", { class: "cb-stophud__tools" }, [
        (function () {
          var b = ctx.btn(
            ctx.W.townmap,
            "cb-btn--onstage cb-stophud__back",
            function () {
              ctx.showMap();
            },
            "back",
          );
          b.setAttribute("aria-label", ctx.W.townmap);
          return b;
        })(),
        ctx.languageBtn(),
        ctx.setBtn(true),
        ctx.voiceBtn(true),
        ctx.fsBtn(true),
      ]),
      title,
      stepper,
    ]);
    hud.style.setProperty("--cb-chap", ctx.CHAP[stop.chap - 1]);
    return hud;
  }
  function scoreCard(stop, score, info, tip, can, real, extra) {
    ctx.feedbackStop = stop.id;
    ctx.feedbackScore = score;
    var st = ctx.starsFor(score),
      hid = "cb-sc-h" + ++ctx.uid;
    var stars = ctx.h(
      "div",
      { class: "cb-medal__stars", "aria-hidden": "true" },
      [40, 70, 90].map(function (at) {
        var s = ctx.h("span", {
          class:
            "cb-medal__star" + (ctx.REDUCED && score >= at ? " is-on" : ""),
          "data-at": String(at),
        });
        ctx.setAuthoredMarkup(s, ctx.STAR_OFF + ctx.STAR_ON);
        return s;
      }),
    );
    var medal = ctx.h("div", { class: "cb-medal", "aria-hidden": "true" }, [
      stars,
      ctx.h("div", { class: "cb-medal__disc", hidden: !ctx.CFG.numericScore }, [
        ctx.h("span", { class: "cb-medal__k", text: ctx.W.score }),
        ctx.h("b", {
          class: "cb-count",
          "data-to": String(score),
          text: ctx.REDUCED ? String(score) : "0",
        }),
        ctx.h("span", { class: "cb-medal__of", text: "/ 100" }),
      ]),
      info.newBest
        ? ctx.h("p", {
            class: "cb-medal__ribbon" + (ctx.REDUCED ? " is-on" : ""),
            text: ctx.W.newBest,
          })
        : null,
    ]);
    medal.style.setProperty("--cb-chap", ctx.CHAP[stop.chap - 1]);
    medal
      .querySelector(".cb-medal__disc")
      .style.setProperty("--p", ctx.REDUCED ? score : 0); // CSSOM, not a style attribute (CSP)
    return ctx.h("section", { class: "cb-card", "aria-labelledby": hid }, [
      ctx.h("h3", { class: "cb-vh", id: hid, text: stop.name }),
      ctx.h("p", {
        class: "cb-vh cb-card__score",
        text:
          (ctx.CFG.numericScore ? ctx.W.score + " " + score + " / 100. " : "") +
          (st ? ctx.W.stars(st) : ctx.W.goodStart),
      }),
      ctx.h("p", { class: "cb-card__can" }, [
        ctx.h("span", { class: "cb-feedback-badge", "aria-hidden": "true" }, [
          ctx.ico("check"),
        ]),
        ctx.h("span", { text: can }),
      ]),
      medal,
      ctx.h("div", { class: "cb-card__body" }, [
        ctx.h("p", { class: "cb-card__meta" }, [
          ctx.h("span", {
            class: "cb-card__stars",
            text: st ? ctx.W.stars(st) : ctx.W.goodStart,
          }),
          ctx.h(
            "span",
            { class: "cb-card__best", hidden: !ctx.CFG.numericScore },
            [
              ctx.W.yourBest + " ",
              ctx.h("b", { text: String(info.best) }),
              " / 100",
            ],
          ),
          info.newBest
            ? ctx.h("span", { class: "cb-card__new", text: ctx.W.newBest })
            : null,
        ]),
        info.first
          ? ctx.h("p", {
              class: "cb-card__first",
              text: score === 100 ? ctx.W.perfect : ctx.W.first,
            })
          : null,
        ctx.h("div", { class: "cb-tipcard" }, [
          ctx.ico("bulb"),
          ctx.h("p", { class: "cb-card__tip", text: tip }),
        ]),
        ctx.h("div", { class: "cb-tipcard cb-tipcard--real cb-card__real" }, [
          ctx.ico("home"),
          ctx.h("div", null, [
            ctx.h("strong", { text: ctx.W.tryReal }),
            ctx.h("p", { text: real }),
          ]),
        ]),
        extra || null,
      ]),
    ]);
  }
  function playCard(card) {
    var num = card.querySelector(".cb-count");
    if (!num) return;
    var to = +num.getAttribute("data-to"),
      stars = [].slice.call(card.querySelectorAll(".cb-medal__star")),
      rib = card.querySelector(".cb-medal__ribbon");
    var disc = card.querySelector(".cb-medal__disc");
    function paint(v) {
      num.textContent = String(v);
      if (disc) disc.style.setProperty("--p", v);
      stars.forEach(function (s) {
        if (v >= +s.getAttribute("data-at") && !s.classList.contains("is-on")) {
          s.classList.add("is-on");
          var fx =
            ctx.window.PecanGroveEngine && ctx.window.PecanGroveEngine.fx;
          if (fx && ctx.motionAllowed()) {
            fx.stamp(s);
            var rect = s.getBoundingClientRect();
            fx.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, {
              kind: "sparkle",
            });
          }
        }
      });
    }
    function end() {
      paint(to);
      if (rib) rib.classList.add("is-on");
      var tip = card.querySelector(".cb-tipcard"),
        fx = ctx.window.PecanGroveEngine && ctx.window.PecanGroveEngine.fx;
      if (fx && tip)
        fx.animate(
          tip,
          [
            { opacity: 0, transform: "translateY(8px)" },
            { opacity: 1, transform: "none" },
          ],
          200,
        );
    }
    if (!ctx.motionAllowed() || !ctx.window.requestAnimationFrame) return end();
    var clock = ctx.activeLifecycle || ctx.window;
    var dur = Math.min(1600, 500 + to * 11),
      t0 = null,
      fin = false;
    function step(t) {
      if (fin || !card.isConnected) return;
      if (!ctx.motionAllowed()) {
        fin = true;
        end();
        return;
      }
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      paint(Math.round(to * (1 - Math.pow(2, -10 * p))));
      if (p < 1) clock.requestAnimationFrame(step);
      else {
        fin = true;
        end();
      }
    }
    clock.requestAnimationFrame(step);
    clock.setTimeout(function () {
      if (!fin) {
        fin = true;
        end();
      }
    }, dur + 400);
  }
  function cardButtons(stopId, again, extraBtn) {
    if (ctx.team && ctx.team.phase === "A") {
      return ctx.h("div", { class: "cb-row cb-card__btns" }, [
        ctx.btn(
          ctx.W.pass,
          "cb-btn--go cb-btn--big",
          function () {
            ctx.team.phase = "B";
            ctx.store.current = ctx.team.b;
            ctx.save();
            ctx.startStop(stopId);
          },
          "people",
        ),
      ]);
    }
    var idx = ctx.STOPS.findIndex(function (s) {
        return s.id === stopId;
      }),
      nxt = null;
    for (var i = idx + 1; i < ctx.STOPS.length; i++)
      if (ctx.PLAYABLE[ctx.STOPS[i].id]) {
        nxt = ctx.STOPS[i].id;
        break;
      }
    return ctx.h("div", { class: "cb-row cb-card__btns" }, [
      ctx.btn(ctx.W.again, "cb-btn--go cb-btn--big", again, "replay"),
      ctx.btn(
        ctx.W.nextStop,
        "cb-btn--big",
        function () {
          if (nxt) ctx.startStop(nxt);
          else ctx.showMap(ctx.W.moreSoon);
        },
        "go",
        true,
      ),
      ctx.btn(
        ctx.W.back,
        "cb-btn--quiet",
        function () {
          ctx.showMap();
        },
        "back",
      ),
      extraBtn || null,
    ]);
  }
  function stepsFor(id) {
    return ctx.REG[id]
      ? ctx.REG[id].steps
      : id === "listen-to-every-neighbor"
        ? ctx.X.parts3
        : [null, null, null, null, null];
  }
  function finishRound(stopId, cardEl, buttons) {
    var stop = ctx.STOPS.filter(function (s) {
        return s.id === stopId;
      })[0],
      steps = stepsFor(stopId);
    ctx.mode = "stop";
    if (ctx.team && ctx.team.phase === "B") {
      ctx.team.cards.push(cardEl);
      ctx.team.phase = "done";
      var a = ctx.animalOf(ctx.team.a),
        b = ctx.animalOf(ctx.team.b),
        c0 = ctx.team.cards[0],
        c1 = ctx.team.cards[1];
      c0.insertBefore(
        ctx.h("p", { class: "cb-card__team" }, [
          ctx.animalFace(a),
          ctx.W.teamLabel(1) + ": " + a.name,
        ]),
        c0.firstChild,
      );
      c1.insertBefore(
        ctx.h("p", { class: "cb-card__team" }, [
          ctx.animalFace(b),
          ctx.W.teamLabel(2) + ": " + b.name,
        ]),
        c1.firstChild,
      );
      var swap = ctx.btn(
        ctx.W.again,
        "cb-btn--go cb-btn--big",
        function () {
          var t = ctx.team;
          ctx.team = {
            a: t.b,
            b: t.a,
            stop: t.stop,
            phase: "A",
            cards: [],
            prev: t.prev,
          };
          ctx.store.current = ctx.team.a;
          ctx.save();
          ctx.startStop(t.stop);
        },
        "replay",
      );
      ctx.screen([
        stopHud(stop, steps, steps.length),
        ctx.h("div", { class: "cb-board" }, [
          ctx.h("h3", { class: "cb-board__h", text: ctx.W.team }),
          ctx.h("div", { class: "cb-cards2" }, [c0, c1]),
          ctx.h("p", { class: "cb-msg", text: ctx.W.bothTeams }),
          ctx.h("div", { class: "cb-row cb-card__btns" }, [
            swap,
            ctx.btn(
              ctx.W.back,
              "cb-btn--quiet",
              function () {
                ctx.showMap();
              },
              "back",
            ),
          ]),
        ]),
      ]);
      playCard(c0);
      playCard(c1);
      ctx.say(ctx.W.bothTeams);
      return;
    }
    if (ctx.team && ctx.team.phase === "A")
      ctx.team.cards.push(cardEl.cloneNode(true));
    ctx.screen([
      stopHud(stop, steps, steps.length),
      ctx.h("div", { class: "cb-board cb-board--result" }, [cardEl, buttons]),
    ]);
    ctx.frame();
    playCard(cardEl);
  }
  ctx.publish({
    stopHud,
    scoreCard,
    playCard,
    cardButtons,
    stepsFor,
    finishRound,
  });
}
