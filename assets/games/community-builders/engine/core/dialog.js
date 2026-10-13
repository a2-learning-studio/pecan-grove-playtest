import { mapOrderControl } from "../map-layout.js";
export default function createDialog(ctx) {
  function dialog(title, body, opener, onClose, opt) {
    opt = opt || {};
    var id = "cb-dlg-h" + ++ctx.uid;
    var d = ctx.h("dialog", {
      class: "cb-dlg" + (opt.wide ? " cb-dlg--wide" : ""),
      "aria-labelledby": id,
    });
    if (opt.utility) d.setAttribute("data-cb-utility", "true");
    var hd = ctx.h("h2", { id: id, tabindex: "-1", text: title });
    d.appendChild(
      ctx.h(
        "button",
        {
          type: "button",
          class: "cb-dlg__x",
          "aria-label": ctx.W.close,
          onclick: function () {
            d.close();
          },
        },
        [ctx.ico("close")],
      ),
    );
    d.appendChild(
      ctx.h("div", { class: "cb-dlg__head" }, [
        opt.face ? ctx.img(opt.face, "", "cb-dlg__face", true) : null,
        opt.badge || null,
        ctx.h("div", null, [
          hd,
          opt.sub ? ctx.h("p", { class: "cb-dlg__sub", text: opt.sub }) : null,
        ]),
      ]),
    );
    body.forEach(function (b) {
      if (b) d.appendChild(b);
    });
    d.appendChild(ctx.h("p", { class: "cb-live", "aria-live": "polite" }));
    d.appendChild(
      ctx.h("div", { class: "cb-dlg__foot" }, [
        ctx.btn(opt.closeLabel || ctx.W.close, "cb-btn--primary", function () {
          d.close();
        }),
      ]),
    );
    var cleaned = false,
      nativeClose = d.close.bind(d);
    function cleanup(silent) {
      // synchronous and idempotent: never wait for the async close event
      if (cleaned) return;
      cleaned = true;
      if (
        !silent && !opt.utility &&
        ctx.inStop &&
        !ctx.restoring &&
        ctx.actionHistory.length < 1000
      )
        ctx.actionHistory.push({ type: "dialog-close" });
      if (d.open) nativeClose();
      d.remove();
      ctx.guard();
      if (!silent && onClose) onClose();
      if (!silent && opener && opener.isConnected && opener.focus) opener.focus();
    }
    d.close = function () { cleanup(false); };
    d.dispose = function () { cleanup(true); };
    d.addEventListener("cancel", function (e) {
      e.preventDefault();
      cleanup(false);
    }); // Esc
    d.addEventListener("close", function () { cleanup(false); }); // backup
    ctx.root.appendChild(d);
    if (d.showModal) d.showModal();
    else d.setAttribute("open", "");
    if (d.animate && !ctx.restoring) {
      var fullMotion = ctx.motionAllowed(),
        animation = d.animate(fullMotion
          ? [{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }]
          : [{ opacity: 0 }, { opacity: 1 }],
          { duration: fullMotion ? 160 : 120, easing: "cubic-bezier(0.16,1,0.3,1)" });
      if (ctx.activeLifecycle && ctx.activeLifecycle.animation) ctx.activeLifecycle.animation(animation);
    }
    hd.focus();
    return d;
  }
  function openGrownups(opener) {
    ctx.vStop();
    var wrap = ctx.h("div", { class: "cb-dlg__body", "data-cb-novoice": "" }),
      changed = { on: false, opener: opener };
    grownBody(wrap, changed);
    dialog(ctx.W.grownups, [wrap], opener, function () {
      if (changed.on && ctx.mode === "map") {
        // scores were erased or restored: redraw the town, keep focus on For grown-ups
        ctx.showMap();
        var g = ctx.main.querySelector(".cb-dock__grownups");
        if (g) {
          ctx.acted = true;
          g.focus();
        }
      }
    });
  }
  function grownBody(wrap, changed) {
    ctx.clear(wrap);
    wrap.appendChild(ctx.h("p", { text: ctx.W.grownText }));
    wrap.appendChild(mapOrderControl(ctx));
    var offline = ctx.window.PecanGroveOffline;
    if (offline && offline.availableInstall)
      wrap.appendChild(
        ctx.btn(ctx.W.installGame, "", function () {
          offline.install();
        }),
      );
    var consentApi = ctx.window.PecanGroveFeedback;
    if (consentApi && consentApi.getConsent && consentApi.setConsent) {
      var consent = consentApi.getConsent();
      var scoreInput = ctx.h("input", {
        type: "checkbox",
        "data-pg-consent": "scores",
      });
      var autoInput = ctx.h("input", {
        type: "checkbox",
        "data-pg-consent": "autoScores",
      });
      scoreInput.checked = !!consent.scores;
      autoInput.checked = !!consent.autoScores;
      autoInput.disabled = !consent.scores;
      scoreInput.addEventListener("change", function () {
        consentApi.setConsent({
          scores: scoreInput.checked,
          autoScores: scoreInput.checked && autoInput.checked,
        });
        autoInput.disabled = !scoreInput.checked;
        if (!scoreInput.checked) autoInput.checked = false;
      });
      autoInput.addEventListener("change", function () {
        consentApi.setConsent({
          scores: scoreInput.checked,
          autoScores: autoInput.checked,
        });
      });
      wrap.appendChild(
        ctx.h("fieldset", { class: "cb-consent" }, [
          ctx.h("legend", {
            text: ctx.W.consentHeading,
          }),
          ctx.h("label", null, [scoreInput, ctx.W.consentScores]),
          ctx.h("p", {
            text: ctx.W.consentDetails,
          }),
          ctx.h("label", null, [autoInput, ctx.W.consentAutoScores]),
        ]),
      );
    }
    var lib = ctx.btn(
      ctx.W.library,
      "",
      function () {
        var d = wrap.closest("dialog");
        if (d) d.close();
        ctx.openLibraryMode(
          changed.opener && changed.opener.isConnected ? changed.opener : null,
        );
      },
      "people",
    );
    var c = ctx.btn(ctx.W.clear, "", function () {
      clearFlow(wrap, changed);
    });
    wrap.appendChild(ctx.h("div", { class: "cb-row" }, [lib, c]));
    return c;
  }
  function clearFlow(wrap, changed) {
    ctx.clear(wrap);
    wrap.appendChild(ctx.h("p", { text: ctx.W.tapTurtle }));
    var grid = ctx.h("div", { class: "cb-animals" });
    ctx.shuffle(ctx.ANIMALS).forEach(function (a) {
      grid.appendChild(
        animalBtn(a, function () {
          if (a.id === "turtle") confirmClear(wrap, changed);
        }),
      );
    });
    wrap.appendChild(grid);
    grid.firstChild.focus();
  }
  function confirmClear(wrap, changed) {
    ctx.clear(wrap);
    wrap.appendChild(ctx.h("p", { text: ctx.W.sure }));
    var yes = ctx.btn(ctx.W.yesErase, "cb-btn--go", function () {
      var backup = JSON.stringify(ctx.store);
      ctx.store = {
        version: 1,
        players: { you: { stops: {} } },
        current: "you",
      };
      ctx.save();
      changed.on = true;
      ctx.clear(wrap);
      var note = ctx.h("p", { tabindex: "-1", text: ctx.W.erased });
      var undo = ctx.btn(
        ctx.W.undo,
        "",
        function () {
          ctx.store = JSON.parse(backup);
          ctx.save();
          changed.on = true;
          grownBody(wrap, changed).focus();
          ctx.say(ctx.X.restored);
        },
        "replay",
      );
      wrap.appendChild(note);
      wrap.appendChild(undo);
      ctx.say(ctx.W.erased);
      undo.focus();
      ctx.setTimeout(function () {
        if (undo.isConnected) {
          var had = ctx.document.activeElement === undo;
          undo.remove();
          if (had) note.focus();
        }
      }, 10000);
    });
    var no = ctx.btn(ctx.W.noKeep, "", function () {
      grownBody(wrap, changed).focus();
    });
    wrap.appendChild(ctx.h("div", { class: "cb-row" }, [yes, no]));
    no.focus();
  }
  function animalBtn(a, fn, pressed) {
    var b = ctx.h(
      "button",
      {
        type: "button",
        class: "cb-animal",
        "aria-pressed": pressed ? "true" : null,
        onclick: fn,
      },
      [ctx.animalFace(a), ctx.h("span", { text: a.name })],
    );
    b.style.setProperty("--ring", a.ring);
    return b;
  }
  ctx.publish({
    dialog,
    openGrownups,
    grownBody,
    clearFlow,
    confirmClear,
    animalBtn,
  });
}
