import { animateScene } from "../transitions.js";
import { createSceneLayout } from "../scene-layout.js";
export default function createScene(ctx) {
  var sceneLayout = createSceneLayout(ctx);
  var live = ctx.h("p", { class: "cb-live", "aria-live": "polite" });
  var bar = ctx.h("div", { class: "cb-bar" });
  var main = ctx.h("div", { class: "cb-main" });
  var foot = ctx.h("p", { class: "cb-foot", text: ctx.W.footer });
  ctx.clear(ctx.root);
  [bar, main, foot, live].forEach(function (e) {
    ctx.root.appendChild(e);
  });
  var mode = "title",
    inStop = false,
    justDone = null,
    team = null,
    baseTitle = ctx.document.title,
    uid = 0;
  var feedbackStop = null,
    feedbackScore = null;
  function say(t) {
    var to = ctx.root.querySelector("dialog[open] .cb-live") || live;
    to.textContent = "";
    ctx.setTimeout(function () {
      to.textContent = t;
    }, 30);
  }
  function setTitle(t) {
    ctx.document.title = t ? t + " · " + ctx.W.series : baseTitle;
  }
  function animalOf(id) {
    return (
      ctx.ANIMALS.filter(function (x) {
        return x.id === id;
      })[0] || null
    );
  }
  function nbById(id) {
    return ctx.NB.filter(function (n) {
      return n.id === id;
    })[0];
  }
  function btn(label, cls, fn, icon, iconAfter) {
    var b = ctx.h("button", {
      type: "button",
      class: "cb-btn" + (cls ? " " + cls : ""),
      onclick: fn,
    });
    if (icon && !iconAfter) b.appendChild(ctx.ico(icon));
    b.appendChild(ctx.h("span", { text: label }));
    if (icon && iconAfter) b.appendChild(ctx.ico(icon));
    return b;
  }
  function animalFace(a) {
    var s = ctx.h("span", { class: "cb-face", "aria-hidden": "true" });
    ctx.setAuthoredMarkup(
      s,
      '<svg viewBox="0 0 64 64" focusable="false">' + ctx.ICON[a.id] + "</svg>",
    );
    s.style.setProperty("--ring", a.ring);
    return s;
  }
  function fsTarget() {
    return (
      (ctx.root.closest && ctx.root.closest("[data-playtest-stage]")) ||
      ctx.root
    );
  }
  var canFS =
    !!(fsTarget().requestFullscreen || fsTarget().webkitRequestFullscreen) &&
    ctx.document.fullscreenEnabled !== false;
  function fsEl() {
    return (
      ctx.document.fullscreenElement ||
      ctx.document.webkitFullscreenElement ||
      null
    );
  }
  function isGameFS() {
    return fsEl() === fsTarget();
  }
  function toggleFS() {
    try {
      if (isGameFS())
        (ctx.document.exitFullscreen || ctx.document.webkitExitFullscreen).call(
          ctx.document,
        );
      else {
        var target = fsTarget(),
          p = (target.requestFullscreen || target.webkitRequestFullscreen).call(
            target,
          );
        if (p && p.catch) p.catch(function () {});
      }
    } catch (e) {
      /* the browser said no: the game keeps working in the page */
    }
  }
  function fsBtn(iconOnly) {
    if (!canFS) return null;
    var on = isGameFS();
    return ctx.h(
      "button",
      {
        type: "button",
        class:
          "cb-btn cb-btn--onstage cb-fs" + (iconOnly ? " cb-fs--icon" : ""),
        "aria-label": on ? ctx.X.fsOff : ctx.X.fsOn,
        "data-cb-shortcut": "fullscreen.toggle",
        onclick: toggleFS,
      },
      [
        ctx.ico(on ? "shrink" : "expand"),
        iconOnly
          ? null
          : ctx.h("span", { text: on ? ctx.X.fsOff : ctx.X.fsOn }),
      ],
    );
  }
  function syncFS() {
    var on = isGameFS();
    ctx.root.classList.toggle("is-fs", on);
    [].forEach.call(ctx.root.querySelectorAll(".cb-fs"), function (b) {
      var icon = b.querySelector("svg");
      if (icon) b.replaceChild(ctx.ico(on ? "shrink" : "expand"), icon);
      var t = b.querySelector("span");
      if (t) t.textContent = on ? ctx.X.fsOff : ctx.X.fsOn;
      b.setAttribute("aria-label", on ? ctx.X.fsOff : ctx.X.fsOn);
      b.title = on ? ctx.X.fsOff : ctx.X.fsOn;
    });
    ctx.window?.PecanGroveEngine?.syncControls?.();
  }
  ctx.document.addEventListener("fullscreenchange", syncFS);
  ctx.document.addEventListener("webkitfullscreenchange", syncFS);
  function renderBar() {
    ctx.clear(bar);
    bar.hidden = mode === "stop";
    if (bar.hidden) return;
    var brand = ctx.h("p", { class: "cb-brand" });
    ctx.setAuthoredMarkup(brand, ctx.CREST);
    brand.appendChild(ctx.h("span", { text: ctx.W.town }));
    bar.appendChild(brand);
    var tools = ctx.h("div", { class: "cb-bar__tools" });
    var a =
      ctx.store.current && ctx.store.current !== "you"
        ? animalOf(ctx.store.current)
        : null;
    if (a) {
      var c = ctx.h(
        "button",
        {
          type: "button",
          class: "cb-chip",
          "aria-label": ctx.W.playing(a.name),
          onclick: function () {
            ctx.openWho(c);
          },
        },
        [animalFace(a), ctx.h("span", { text: ctx.W.playing(a.name) })],
      );
      tools.appendChild(c);
    }
    var lang = languageBtn();
    if (lang) tools.appendChild(lang);
    tools.appendChild(ctx.setBtn(false));
    tools.appendChild(ctx.voiceBtn(false));
    var f = fsBtn(false);
    if (f) tools.appendChild(f);
    bar.appendChild(tools);
  }
  function languageBtn() {
    var other = ctx.L === "es" ? "en" : "es",
      alternate = ctx.document.querySelector('a[hreflang="' + other + '"]');
    var path =
      ctx.root.getAttribute("data-language-url") ||
      (alternate && alternate.getAttribute("href"));
    if (!path) return null;
    var url;
    try {
      url = new ctx.URL(path, ctx.location.href);
      if (url.origin !== ctx.location.origin) return null;
    } catch (e) {
      return null;
    }
    var group = ctx.h("div", {
      class: "cb-language-group",
      role: "group",
      "aria-label": "English / Español",
      "data-cb-novoice": "",
    });
    ["en", "es"].forEach(function (language) {
      var active = language === ctx.L;
      var b = btn(
        language.toUpperCase(),
        "cb-btn cb-btn--onstage cb-language",
        function () {
          if (!active) ctx.changeLanguage(language, url);
        },
      );
      b.setAttribute("lang", language);
      b.setAttribute("aria-label", language === "en" ? "English" : "Español");
      b.setAttribute("aria-pressed", String(active));
      group.appendChild(b);
    });
    return group;
  }
  function screen(kids, focusSel) {
    sceneLayout.reset();
    ctx.vMark(ctx.vEl, false);
    ctx.vEl = null; // a new screen: the voice stops unless the same line is shown again
    ctx.vInkClear();
    if (mode !== "stop") ctx.vHeard = {};
    var callout = ctx.root.querySelector(".cb-callout");
    if (callout && callout.dismiss) callout.dismiss();
    ctx.clear(main);
    kids.forEach(function (k) {
      if (k) main.appendChild(k);
    });
    [].forEach.call(
      main.querySelectorAll("button, input, select, textarea, [tabindex]"),
      function (control, index) {
        if (!control.hasAttribute("data-cb-id"))
          control.setAttribute("data-cb-id", "control-" + index);
      },
    );
    ctx.root.setAttribute("data-screen", mode);
    renderBar();
    progressEvent();
    var f = focusSel ? main.querySelector(focusSel) : null;
    if (!f) {
      f = main.querySelector("h2");
      if (f) f.setAttribute("tabindex", "-1");
    }
    if (f && acted) {
      if (mode === "map") sceneLayout.focus(f);
      else f.focus({ preventScroll: true });
    }
    animateScene(
      ctx,
      main,
      mode === "stop" && !ctx.actionHistory.length ? "stop" : "step",
    );
    guard();
  }
  function progressEvent() {
    if (typeof ctx.restoring !== "undefined" && ctx.restoring) return;
    var stop =
      mode === "stop" && feedbackStop
        ? ctx.STOPS.filter(function (s) {
            return s.id === feedbackStop;
          })[0]
        : null;
    var phase = stop ? (feedbackScore === null ? "playing" : "result") : mode;
    var detail = {
      stopId: stop ? stop.id : null,
      stopN: stop ? stop.n : 0,
      phase: phase,
      score: stop ? feedbackScore : null,
      journey: ctx.journeyOf(ctx.player()),
    };
    ctx.root.setAttribute("data-current-stop", String(detail.stopN));
    ctx.root.setAttribute("data-feedback-phase", phase);
    ctx.root.setAttribute(
      "data-feedback-score",
      detail.score === null ? "" : String(detail.score),
    );
    if (
      typeof ctx.window.CustomEvent === "function" &&
      typeof ctx.document.dispatchEvent === "function"
    ) {
      ctx.document.dispatchEvent(
        new ctx.window.CustomEvent("cb:screen", { detail: detail }),
      );
    }
  }
  var acted = false,
    nudged = false;
  var tapX = -99,
    tapY = -99,
    swapAt = -1e9,
    swapX = -99,
    swapY = -99;
  ctx.root.addEventListener(
    "click",
    function (e) {
      acted = true;
      if (!e.isTrusted || e.detail === 0) return; // keyboard and scripted clicks are never blocked
      if (
        ctx.performance.now() - swapAt < 350 &&
        Math.abs(e.clientX - swapX) < 30 &&
        Math.abs(e.clientY - swapY) < 30
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      tapX = e.clientX;
      tapY = e.clientY;
    },
    true,
  );
  function guard() {
    swapAt = ctx.performance.now();
    swapX = tapX;
    swapY = tapY;
  }
  ctx.root.addEventListener(
    "keydown",
    function () {
      acted = true;
    },
    true,
  );
  function recordAction(event) {
    if (
      ctx.restoring ||
      mode !== "stop" ||
      !event.target ||
      ctx.actionHistory.length >= 1000
    )
      return;
    var node =
        event.target.closest &&
        event.target.closest("button, input, select, textarea"),
      scope = node && node.closest("dialog");
    if (
      !node ||
      node.closest(".cb-stophud, .cb-vbtn, .pg-hints, .pg-hud") ||
      (scope && scope.hasAttribute("data-cb-utility")) ||
      (!scope && !main.contains(node))
    )
      return;
    scope = scope || main;
    var controls = [].slice.call(
      scope.querySelectorAll("button, input, select, textarea"),
    );
    var className = String(node.className || ""),
      matching = controls.filter(function (control) {
        return (
          String(control.className || "") === className &&
          control.tagName === node.tagName
        );
      });
    var before = ctx.root.outerHTML,
      action = {
        type: event.type,
        dialog: scope !== main,
        key: node.getAttribute("data-cb-id"),
        className: className,
        tag: node.tagName,
        index: matching.indexOf(node),
        value: node.value,
        checked: !!node.checked,
      };
    ctx.actionHistory.push(action);
    if (event.type === "click")
      Promise.resolve().then(function () {
        if (ctx.root.outerHTML === before) {
          var index = ctx.actionHistory.indexOf(action);
          if (index >= 0) ctx.actionHistory.splice(index, 1);
        }
      });
  }
  ["click", "change", "input"].forEach(function (type) {
    ctx.root.addEventListener(type, recordAction, true);
  });
  function frame(whole) {
    sceneLayout.frame(whole, mode === "map");
  }
  function coach(text, icon) {
    return ctx.h("p", { class: "cb-coach" }, [
      ctx.ico(icon || "bulb"),
      ctx.h("span", { text: text }),
    ]);
  }
  function fb(text, ok) {
    return text
      ? ctx.h(
          "div",
          {
            class: "cb-feedback" + (ok ? " is-ok" : ""),
            "data-cb-feedback": ok ? "ok" : "try",
          },
          [
            ctx.h(
              "span",
              { class: "cb-feedback-badge", "aria-hidden": "true" },
              [ctx.ico(ok ? "check" : "bulb")],
            ),
            ctx.h("p", { text: text }),
          ],
        )
      : null;
  }
  ctx.publish({
    say,
    setTitle,
    animalOf,
    nbById,
    btn,
    animalFace,
    fsTarget,
    fsEl,
    isGameFS,
    toggleFS,
    fsBtn,
    syncFS,
    renderBar,
    languageBtn,
    screen,
    progressEvent,
    guard,
    recordAction,
    frame,
    coach,
    fb,
  });
  ctx.bind({
    live: [() => live, (value) => (live = value)],
    bar: [() => bar, (value) => (bar = value)],
    main: [() => main, (value) => (main = value)],
    foot: [() => foot, (value) => (foot = value)],
    mode: [() => mode, (value) => (mode = value)],
    inStop: [() => inStop, (value) => (inStop = value)],
    justDone: [() => justDone, (value) => (justDone = value)],
    team: [() => team, (value) => (team = value)],
    baseTitle: [() => baseTitle, (value) => (baseTitle = value)],
    uid: [() => uid, (value) => (uid = value)],
    feedbackStop: [() => feedbackStop, (value) => (feedbackStop = value)],
    feedbackScore: [() => feedbackScore, (value) => (feedbackScore = value)],
    canFS: [() => canFS, (value) => (canFS = value)],
    acted: [() => acted, (value) => (acted = value)],
    nudged: [() => nudged, (value) => (nudged = value)],
    tapX: [() => tapX, (value) => (tapX = value)],
    tapY: [() => tapY, (value) => (tapY = value)],
    swapAt: [() => swapAt, (value) => (swapAt = value)],
    swapX: [() => swapX, (value) => (swapX = value)],
    swapY: [() => swapY, (value) => (swapY = value)],
  });
}
