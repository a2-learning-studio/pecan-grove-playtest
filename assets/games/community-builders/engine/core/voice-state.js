export default function createVoiceState(ctx) {
  var VKEY = "pecan-grove-voice",
    vOn = ctx.CFG.voice,
    vIdx = null,
    vClips = {},
    vKeys = null,
    vLoading = false,
    voiceReady = null,
    voiceFailed = false;
  var vAudio = null,
    vEl = null,
    vQueue = [],
    vLast = { f: "", t: -1e9 },
    vRead = null,
    vRaf = 0,
    vLastItem = null,
    vLastEl = null;
  var vSuspended = ctx.root.hasAttribute("data-playtest-paused");
  var vHeard = {};
  var pendingVoice = null;
  var cap = ctx.h("div", {
      class: "cb-cap",
      "aria-hidden": "true",
      "data-cb-novoice": "",
      "data-size": ctx.CFG.capSize,
    }),
    capBox = ctx.h("p", { class: "cb-cap__box" });
  cap.appendChild(capBox);
  cap.hidden = true;
  ctx.root.insertBefore(cap, ctx.foot);
  function vWho(f) {
    var id = f.replace(/^..\//, "").replace(/\.mp3$/, ""),
      m = /^nb-([a-z]+)-/.exec(id),
      n = m ? ctx.nbById(m[1]) : null;
    return n ? ctx.nmCap(n) : /^s15-theo/.test(id) ? ctx.X.guide2 : ctx.X.guide;
  }
  function capChunks(ws) {
    // a sentence, or about a dozen words, per caption
    var out = [],
      s = 0;
    ws.forEach(function (w, i) {
      var n = i - s + 1;
      if (
        i === ws.length - 1 ||
        (n >= 3 && /[.!?…]["”»)]?$/.test(w)) ||
        (n >= 12 && /[,;:]$/.test(w)) ||
        n >= 16
      ) {
        out.push([s, i]);
        s = i + 1;
      }
    });
    return out;
  }
  function capPlace() {
    // sit above the sticky action bar when it is on screen
    var bar = ctx.main.querySelector(".cb-actions"),
      b = 14;
    if (bar && ctx.getComputedStyle(bar).position === "sticky") {
      var r = bar.getBoundingClientRect(),
        vb =
          ctx.fsEl() === ctx.root
            ? ctx.root.getBoundingClientRect().bottom
            : ctx.window.innerHeight;
      if (r.top < vb && r.bottom > 0)
        b = Math.max(14, Math.round(vb - r.top + 10));
    }
    cap.style.setProperty("--cb-cap-b", b + "px");
  }
  function capDraw(i) {
    // i: the spoken word now (-1 before the first one)
    var R = vRead;
    if (!R || !R.box || !R.ch.length) return;
    var k = 0;
    if (i >= 0) while (k < R.ch.length - 1 && R.ch[k][1] < i) k++;
    if (k !== R.ck) {
      R.ck = k;
      ctx.clear(R.box);
      var line = ctx.h("span", { class: "cb-cap__line" });
      for (var j = R.ch[k][0]; j <= R.ch[k][1]; j++) {
        if (j > R.ch[k][0]) line.appendChild(ctx.document.createTextNode(" "));
        line.appendChild(ctx.h("span", { class: "cb-cap__w", text: R.cw[j] }));
      }
      R.box.appendChild(ctx.h("b", { class: "cb-cap__who", text: R.who }));
      R.box.appendChild(line);
      R.capW = line.children;
      if (R.box === capBox) capPlace();
    }
    for (var q = 0; q < R.capW.length; q++)
      R.capW[q].classList.toggle(
        "is-now",
        ctx.CFG.words && q === i - R.ch[k][0],
      );
  }
  function vNorm(t) {
    return (t || "").replace(/\s+/g, " ").trim();
  }
  function vTok(w) {
    return (w || "").toLowerCase().replace(/[^0-9a-záéíóúüñ']/g, "");
  }
  function vLoad(retry) {
    if (retry && voiceFailed) {
      vIdx = null;
      vLoading = false;
      voiceReady = null;
    }
    if (vIdx) return Promise.resolve(!voiceFailed);
    if (vLoading) return voiceReady;
    vLoading = true;
    voiceReady = new Promise(function (resolve) {
      var s = ctx.h("script", {
        src: ctx.resolveAsset(ctx.BASE + "voice/index.js"),
      });
      s.onload = function () {
        voiceFailed = false;
        var V = ctx.window.CB_VOICE || {};
        vIdx = V[ctx.L] || {};
        vClips = V.clips || {};
        ctx.vScan(
          [ctx.main].concat(
            [].slice.call(ctx.root.querySelectorAll("dialog[open]")),
          ),
        );
        resolve(true);
      };
      s.onerror = function () {
        voiceFailed = true;
        vIdx = {};
        vLoading = false;
        resolve(false);
      };
      ctx.document.head.appendChild(s);
    });
    return voiceReady;
  }
  function vMark(el, on) {
    if (el) el.classList.toggle("is-speaking", on);
  }
  function vUnread() {
    // clear the read-along highlight
    if (vRaf) ctx.cancelAnimationFrame(vRaf);
    vRaf = 0;
    if (vRead) {
      if (vRead.on) vRead.on.classList.remove("is-now");
      if (vRead.hud) vRead.hud.classList.remove("is-now");
    }
    vRead = null;
    cap.hidden = true;
  }
  function vStop() {
    vQueue = [];
    vUnread();
    if (vAudio) {
      vAudio.pause();
      vAudio = null;
    }
    vMark(vEl, false);
    vEl = null;
    if (typeof ctx.emit === "function")
      ctx.emit("cb:voice", { playing: false });
  }
  function suspendVoice(paused) {
    vSuspended = !!paused;
    if (vSuspended) {
      vStop();
      ctx.vInkClear();
    }
  }
  function vAlign(E, S) {
    // where the line's shown words sit among the spoken words
    var best = 0,
      bd = null;
    for (var d = 1 - E.length; d < S.length; d++) {
      var m = 0;
      for (var i = 0; i < E.length; i++) if (E[i] && E[i] === S[i + d]) m++;
      if (m > best) {
        best = m;
        bd = d;
      }
    }
    return best >= Math.min(E.length, S.length) * 0.6 ? bd : null;
  }
  ctx.publish({
    vWho,
    capChunks,
    capPlace,
    capDraw,
    vNorm,
    vTok,
    vLoad,
    vMark,
    vUnread,
    vStop,
    suspendVoice,
    vAlign,
  });
  ctx.bind({
    VKEY: [() => VKEY, (value) => (VKEY = value)],
    vOn: [() => vOn, (value) => (vOn = value)],
    vIdx: [() => vIdx, (value) => (vIdx = value)],
    vClips: [() => vClips, (value) => (vClips = value)],
    vKeys: [() => vKeys, (value) => (vKeys = value)],
    vLoading: [() => vLoading, (value) => (vLoading = value)],
    voiceReady: [() => voiceReady, (value) => (voiceReady = value)],
    voiceFailed: [() => voiceFailed, (value) => (voiceFailed = value)],
    vAudio: [() => vAudio, (value) => (vAudio = value)],
    vEl: [() => vEl, (value) => (vEl = value)],
    vQueue: [() => vQueue, (value) => (vQueue = value)],
    vLast: [() => vLast, (value) => (vLast = value)],
    vRead: [() => vRead, (value) => (vRead = value)],
    vRaf: [() => vRaf, (value) => (vRaf = value)],
    vLastItem: [() => vLastItem, (value) => (vLastItem = value)],
    vLastEl: [() => vLastEl, (value) => (vLastEl = value)],
    vSuspended: [() => vSuspended, (value) => (vSuspended = value)],
    vHeard: [() => vHeard, (value) => (vHeard = value)],
    pendingVoice: [() => pendingVoice, (value) => (pendingVoice = value)],
    cap: [() => cap, (value) => (cap = value)],
    capBox: [() => capBox, (value) => (capBox = value)],
  });
}
