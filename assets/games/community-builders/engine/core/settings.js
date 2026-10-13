export default function createSettings(ctx) {
  var SKEY = "pecan-grove-settings",
    SYS_CALM = ctx.REDUCED,
    RATES = [0.85, 1, 1.15],
    SIZES = ["s", "m", "l"];
  var CFG_DEF = {
    voice: true,
    auto: true,
    vol: 0.9,
    rate: 1,
    words: true,
    numericScore: false,
    cap: false,
    capSize: "m",
    circles: true,
    calm: false,
  };
  var CFG = cfgLoad();
  function cfgLoad() {
    var c = {},
      k,
      s = null;
    for (k in CFG_DEF) c[k] = CFG_DEF[k];
    try {
      s = JSON.parse(ctx.localStorage.getItem(SKEY) || "null");
      if (!s && ctx.localStorage.getItem("pecan-grove-voice") === "off")
        s = { voice: false }; // the Voice switch from before Settings existed
    } catch (e) {
      /* storage blocked: the usual settings */
    }
    if (s && typeof s === "object") {
      for (k in s)
        if (
          !Object.prototype.hasOwnProperty.call(CFG_DEF, k) &&
          k !== "__proto__" &&
          k !== "constructor"
        )
          c[k] = s[k];
      for (k in CFG_DEF) if (typeof s[k] === typeof CFG_DEF[k]) c[k] = s[k];
    }
    c.vol = Math.min(1, Math.max(0, Math.round(c.vol * 10) / 10));
    if (RATES.indexOf(c.rate) < 0) c.rate = 1;
    if (SIZES.indexOf(c.capSize) < 0) c.capSize = "m";
    return c;
  }
  function cfgSave() {
    try {
      ctx.localStorage.setItem(SKEY, JSON.stringify(CFG));
      ctx.localStorage.setItem(ctx.VKEY, CFG.voice ? "on" : "off");
      return true;
    } catch (e) {
      if (typeof ctx.storageError === "function") ctx.storageError("settings");
      return false;
    }
  }
  function applyCalm() {
    ctx.REDUCED = SYS_CALM || CFG.calm;
    ctx.root.classList.toggle("is-calm", CFG.calm && !SYS_CALM);
  }
  ctx.vOn = CFG.voice;
  applyCalm();
  ctx.root.classList.toggle("is-quiet", !ctx.vOn);
  var setOpen = false;
  function openSettings(opener, toKeys) {
    if (ctx.window.PecanGroveEngine && ctx.window.PecanGroveEngine.settings)
      return ctx.window.PecanGroveEngine.settings.open(
        opener,
        toKeys ? "controls" : undefined,
      );
    if (setOpen) return;
    setOpen = true;
    ctx.vLoad();
    var held = ctx.vAudio && !ctx.vAudio.paused ? ctx.vAudio : null;
    if (held) held.pause();
    var body = ctx.h("div", { class: "cb-dlg__body cb-set" });
    fillSettings(body);
    var d = ctx.dialog(
      ctx.X.settings,
      [body],
      opener && opener.isConnected ? opener : null,
      function () {
        setOpen = false;
        if (
          held &&
          ctx.vAudio === held &&
          ctx.vEl &&
          ctx.vEl.isConnected &&
          ctx.vOn &&
          !ctx.vSuspended
        ) {
          var p = held.play();
          if (p && p.catch) p.catch(function () {});
        }
      },
      {
        sub: ctx.X.setSub,
        closeLabel: ctx.mode === "stop" ? ctx.X.keepPlaying : null,
      },
    );
    if (toKeys) {
      var k = d.querySelector(".cb-set__keys");
      if (k) {
        k.focus({ preventScroll: true });
        k.scrollIntoView({ block: "start", behavior: "auto" });
      }
    }
  }
  function fillSettings(body) {
    ctx.clear(body);
    function sec(icon, title, kids, cls) {
      return ctx.h(
        "section",
        {
          class: "cb-set__sec" + (cls ? " " + cls : ""),
          tabindex: cls ? "-1" : null,
        },
        [
          ctx.h("h3", { class: "cb-set__h" }, [
            ctx.ico(icon),
            ctx.h("span", { text: title }),
          ]),
        ].concat(kids),
      );
    }
    function sw(label, hint, get, set, off) {
      // an on/off switch with its label (and a short hint)
      var id = "cb-set" + ++ctx.uid,
        b = ctx.h(
          "button",
          {
            type: "button",
            role: "switch",
            id: id,
            class: "cb-switch",
            "aria-describedby": hint ? id + "h" : null,
            onclick: function () {
              if (!b.disabled) {
                set(!get());
                paint();
              }
            },
          },
          [
            ctx.h(
              "span",
              { class: "cb-switch__track", "aria-hidden": "true" },
              [ctx.h("span", { class: "cb-switch__thumb" })],
            ),
            ctx.h("span", { class: "cb-switch__state", "aria-hidden": "true" }),
          ],
        );
      function paint() {
        var on = !!get();
        b.setAttribute("aria-checked", on ? "true" : "false");
        b.lastChild.textContent = on ? ctx.X.on : ctx.X.off;
      }
      paint();
      if (off) b.disabled = true;
      return ctx.h("div", { class: "cb-set__row" }, [
        ctx.h("div", { class: "cb-set__txt" }, [
          ctx.h("label", { for: id, text: label }),
          hint
            ? ctx.h("p", { class: "cb-set__hint", id: id + "h", text: hint })
            : null,
        ]),
        b,
      ]);
    }
    function seg(legend, vals, names, get, set) {
      // one choice of a few, as a row of pills
      var name = "cb-seg" + ++ctx.uid,
        row = ctx.h("div", { class: "cb-seg__opts" });
      vals.forEach(function (v, i) {
        var inp = ctx.h("input", {
          type: "radio",
          name: name,
          value: String(v),
        });
        inp.checked = get() === v;
        inp.addEventListener("change", function () {
          if (inp.checked) set(v);
        });
        row.appendChild(
          ctx.h("label", { class: "cb-seg__opt" }, [
            inp,
            ctx.h("span", { text: names[i] }),
          ]),
        );
      });
      return ctx.h("fieldset", { class: "cb-seg" }, [
        ctx.h("legend", { text: legend }),
        row,
      ]);
    }
    var volId = "cb-set" + ++ctx.uid,
      vol = ctx.h("input", {
        type: "range",
        id: volId,
        class: "cb-range",
        min: "0",
        max: "100",
        step: "10",
      });
    var out = ctx.h("output", {
      class: "cb-set__val",
      for: volId,
      "aria-hidden": "true",
    });
    function volPaint() {
      var p = Math.round(CFG.vol * 100);
      vol.value = String(p);
      vol.setAttribute("aria-valuetext", p + "%");
      out.textContent = p + "%";
      vol.style.setProperty("--p", p + "%");
    }
    vol.addEventListener("input", function () {
      CFG.vol = +vol.value / 100;
      if (ctx.vAudio) ctx.vAudio.volume = CFG.vol;
      volPaint();
      cfgSave();
    });
    volPaint();
    var sample = ctx.h(
      "button",
      {
        type: "button",
        class: "cb-btn cb-set__sample",
        disabled: !ctx.vOn || null,
        title: ctx.vOn ? ctx.X.sample : ctx.X.voiceOff,
        onclick: function () {
          if (ctx.vAudio && ctx.vEl === sample) {
            ctx.vStop();
            return;
          }
          ctx.vStop();
          ctx.vPlay({ f: ctx.L + "/g-intro.mp3", k: "sample" }, sample);
        },
      },
      [
        ctx.ico("voice"),
        ctx.h("span", { class: "cb-set__play", text: ctx.X.sample }),
        ctx.h("span", { class: "cb-set__stop", text: ctx.X.sampleStop }),
      ],
    );
    var preview = ctx.h(
      "div",
      {
        class: "cb-set__cap",
        "aria-hidden": "true",
        "data-cb-novoice": "",
        "data-size": CFG.capSize,
      },
      [
        ctx.h("p", { class: "cb-cap__box" }, [
          ctx.h("b", { class: "cb-cap__who", text: ctx.X.guide }),
          ctx.h("span", {
            class: "cb-cap__line",
            text: ctx.W.intro1.split(". ")[0] + ".",
          }),
        ]),
      ],
    );
    var keys = ctx.h("dl", { class: "cb-keys" });
    ctx.X.keys.forEach(function (k) {
      keys.appendChild(
        ctx.h(
          "dt",
          null,
          k[0].split("|").map(function (c) {
            return ctx.h("kbd", { text: c });
          }),
        ),
      );
      keys.appendChild(ctx.h("dd", { text: k[1] }));
    });
    var reset = ctx.btn(
      ctx.X.reset,
      "cb-btn--quiet cb-set__reset",
      function () {
        for (var k in CFG_DEF) CFG[k] = CFG_DEF[k];
        cfgSave();
        applyCalm();
        ctx.setVoice(CFG.voice, false);
        ctx.setCap(CFG.cap, false);
        ctx.cap.setAttribute("data-size", CFG.capSize);
        if (ctx.vAudio) {
          ctx.vAudio.volume = CFG.vol;
          ctx.vAudio.playbackRate = CFG.rate;
        }
        fillSettings(body);
        ctx.say(ctx.X.resetDone);
        var r = body.querySelector(".cb-set__reset");
        if (r) r.focus();
      },
      "replay",
    );
    [
      sec("voice", ctx.X.secVoice, [
        sw(
          ctx.X.voice,
          null,
          function () {
            return ctx.vOn;
          },
          function (v) {
            ctx.setVoice(v, false);
          },
        ),
        sw(
          ctx.X.auto,
          ctx.X.autoHint,
          function () {
            return CFG.auto;
          },
          function (v) {
            CFG.auto = v;
            cfgSave();
          },
        ),
        ctx.h("div", { class: "cb-set__row cb-set__row--vol" }, [
          ctx.h("label", { class: "cb-set__lbl", for: volId, text: ctx.X.vol }),
          ctx.h("div", { class: "cb-set__volume" }, [vol, out]),
        ]),
        seg(
          ctx.X.speed,
          RATES,
          ctx.X.speeds,
          function () {
            return CFG.rate;
          },
          function (v) {
            CFG.rate = v;
            if (ctx.vAudio) ctx.vAudio.playbackRate = v;
            cfgSave();
          },
        ),
        ctx.h("div", { class: "cb-row" }, [sample]),
      ]),
      sec("captions", ctx.X.secCap, [
        sw(
          ctx.X.words,
          null,
          function () {
            return CFG.words;
          },
          function (v) {
            CFG.words = v;
            cfgSave();
            if (!v && ctx.vRead) {
              if (ctx.vRead.on) ctx.vRead.on.classList.remove("is-now");
              ctx.vRead.on = null;
              if (ctx.vRead.hud) ctx.vRead.hud.classList.remove("is-now");
            }
            if (ctx.vRead) ctx.vRead.cur = -2; // repaint on the next frame
          },
        ),
        sw(
          ctx.X.capBar,
          ctx.X.capHint,
          function () {
            return CFG.cap;
          },
          function (v) {
            ctx.setCap(v, false);
          },
        ),
        seg(
          ctx.X.capSize,
          SIZES,
          ctx.X.sizes,
          function () {
            return CFG.capSize;
          },
          function (v) {
            CFG.capSize = v;
            ctx.cap.setAttribute("data-size", v);
            preview.setAttribute("data-size", v);
            cfgSave();
          },
        ),
        preview,
      ]),
      sec("hand", ctx.X.secHelp, [
        ctx.canFS
          ? ctx.h("div", { class: "cb-row" }, [ctx.fsBtn(false)])
          : null,
        sw(
          ctx.X.circles,
          ctx.X.circlesHint,
          function () {
            return CFG.circles;
          },
          function (v) {
            CFG.circles = v;
            if (!v) ctx.vInkClear();
            cfgSave();
          },
        ),
        sw(
          ctx.X.calm,
          SYS_CALM ? ctx.X.calmSys : ctx.X.calmHint,
          function () {
            return SYS_CALM || CFG.calm;
          },
          function (v) {
            CFG.calm = v;
            applyCalm();
            cfgSave();
          },
          SYS_CALM,
        ),
      ]),
      sec(
        "keys",
        ctx.X.secKeys,
        [ctx.h("p", { class: "cb-set__hint", text: ctx.X.keysNote }), keys],
        "cb-set__keys",
      ),
      ctx.h("div", { class: "cb-row cb-set__end" }, [reset]),
    ].forEach(function (s) {
      body.appendChild(s);
    });
  }
  ctx.publish({ cfgLoad, cfgSave, applyCalm, openSettings, fillSettings });
  ctx.bind({
    SKEY: [() => SKEY, (value) => (SKEY = value)],
    SYS_CALM: [() => SYS_CALM, (value) => (SYS_CALM = value)],
    RATES: [() => RATES, (value) => (RATES = value)],
    SIZES: [() => SIZES, (value) => (SIZES = value)],
    CFG_DEF: [() => CFG_DEF, (value) => (CFG_DEF = value)],
    CFG: [() => CFG, (value) => (CFG = value)],
    setOpen: [() => setOpen, (value) => (setOpen = value)],
  });
}
