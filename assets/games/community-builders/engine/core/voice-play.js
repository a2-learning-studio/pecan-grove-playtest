export default function createVoicePlay(ctx) {
  function vFollow(a, item, el) {
    // light each shown word while it is said
    ctx.vUnread();
    var c = ctx.vClips[item.f];
    if (!c || !el) return;
    var S = c.s.split(" ").map(ctx.vTok),
      map = []; // map[i]: the shown word for spoken word i, across every part of the line
    (el._vParts || [el])
      .filter(function (p) {
        return p.isConnected;
      })
      .forEach(function (p) {
        var spans = [].slice.call(p.querySelectorAll(".cb-w")),
          d = ctx.vAlign(
            spans.map(function (s) {
              return ctx.vTok(s.textContent);
            }),
            S,
          );
        if (d !== null)
          spans.forEach(function (s, j) {
            if (j + d >= 0 && !map[j + d]) map[j + d] = s;
          });
      });
    ctx.vRead = {
      t: c.t,
      map: map,
      cur: -2,
      on: null,
      hud: c.h ? ctx.root.querySelector(".cb-stophud__h") : null,
      h: c.h,
      cues: ctx.CFG.circles ? ctx.vCues(item.f, c) : [],
      cw: c.s.split(" "),
      who: ctx.vWho(item.f),
      ck: -1,
      capW: [],
      box: null,
    };
    ctx.vRead.ch = ctx.capChunks(ctx.vRead.cw);
    var set = el.closest(".cb-set"); // the sample in Settings plays into the caption preview there
    if (set) ctx.vRead.box = set.querySelector(".cb-set__cap .cb-cap__box");
    else if (ctx.CFG.cap && !el.closest("dialog")) {
      ctx.vRead.box = ctx.capBox;
      ctx.cap.hidden = false;
    } // a window's own words are right there in it
    ctx.capDraw(-1);
    (function tick() {
      if (!ctx.vRead || ctx.vAudio !== a) return;
      if (ctx.gamePaused) {
        ctx.vRaf = 0;
        return;
      }
      var ms = a.currentTime * 1000,
        t = ctx.vRead.t,
        i = -1;
      ctx.vRead.cues.forEach(function (q) {
        if (!q.done && a.currentTime > 0 && ms >= q.at) {
          q.done = true;
          if (ctx.CFG.circles) ctx.vCue(q);
        }
      });
      if (a.currentTime > 0 && ms < t[t.length - 1]) {
        i = 0;
        while (i + 1 < t.length - 1 && t[i + 1] <= ms) i++;
      }
      if (i !== ctx.vRead.cur) {
        if (ctx.vRead.on) ctx.vRead.on.classList.remove("is-now");
        ctx.vRead.on =
          ctx.CFG.words && i >= 0 ? ctx.vRead.map[i] || null : null;
        if (ctx.vRead.on) ctx.vRead.on.classList.add("is-now");
        if (ctx.vRead.hud)
          ctx.vRead.hud.classList.toggle(
            "is-now",
            ctx.CFG.words && i >= 0 && i < ctx.vRead.h,
          ); // the spoken stop name lights the stop's title
        ctx.capDraw(i);
        ctx.vRead.cur = i;
      }
      ctx.vRaf = ctx.requestAnimationFrame(tick);
    })();
  }
  function vPlay(item, el, startAt) {
    if (
      !ctx.vOn ||
      (typeof ctx.vSuspended !== "undefined" && ctx.vSuspended) ||
      (typeof ctx.gamePaused !== "undefined" &&
        ctx.gamePaused &&
        item.k !== "sample")
    )
      return;
    if (ctx.vAudio) ctx.vAudio.pause();
    ctx.vUnread();
    ctx.vMark(ctx.vEl, false);
    var a = new ctx.Audio(
      typeof ctx.resolveAsset === "function"
        ? ctx.resolveAsset(ctx.BASE + "voice/" + item.f)
        : ctx.BASE + "voice/" + item.f,
    );
    ctx.vAudio = a;
    ctx.vEl = el || null;
    ctx.vMark(ctx.vEl, true);
    ctx.vLast = { f: item.f, t: ctx.performance.now() };
    a.volume = ctx.CFG.vol;
    a.defaultPlaybackRate = a.playbackRate = ctx.CFG.rate; // speed changes keep the pitch; the read-along follows the audio clock
    if (
      typeof ctx.window !== "undefined" &&
      ctx.window.PecanGroveEngine &&
      ctx.window.PecanGroveEngine.audio
    )
      ctx.window.PecanGroveEngine.audio.attachVoice(a);
    if (typeof ctx.emit === "function")
      ctx.emit("cb:voice", { playing: true, audio: a });
    if (item.k === "guide") ctx.vHeard[item.f] = 1; // neighbors speak on every tap; the guide once a visit
    if (item.k !== "sample") {
      ctx.vLastItem = item;
      ctx.vLastEl = ctx.vEl;
    }
    function done() {
      if (ctx.vAudio !== a) return;
      ctx.vUnread();
      ctx.vMark(ctx.vEl, false);
      ctx.vAudio = null;
      ctx.vEl = null;
      var nx = ctx.vQueue.shift();
      if (nx && nx.el.isConnected) vPlay(nx.item, nx.el);
    }
    a.onended = done;
    a.onerror = done;
    if (Number.isFinite(startAt) && startAt > 0) {
      function seek() {
        try {
          a.currentTime = startAt;
        } catch (_) {}
      }
      seek();
      a.addEventListener("loadedmetadata", seek, { once: true });
    }
    var p = a.play();
    if (p && p.catch) p.catch(done); // the browser said no (no tap yet): stay quiet
    vFollow(a, item, el);
  }
  function voiceSnapshot() {
    if (!ctx.vAudio || !ctx.vLastItem || ctx.vLastItem.k === "sample")
      return null;
    var clip = ctx.vClips[ctx.vLastItem.f],
      time = Number(ctx.vAudio.currentTime) || 0,
      line = 0;
    if (clip) {
      var word = 0;
      while (word + 1 < clip.t.length && clip.t[word + 1] <= time * 1000)
        word++;
      var chunks = ctx.capChunks(clip.s.split(" "));
      while (line + 1 < chunks.length && word > chunks[line][1]) line++;
    }
    return {
      file: ctx.vLastItem.f.replace(/^..\//, ""),
      kind: ctx.vLastItem.k,
      language: ctx.L,
      time: time,
      line: line,
      playing:
        !ctx.vAudio.paused ||
        (ctx.gamePaused && ctx.pausedVoice === ctx.vAudio),
    };
  }
  function restoreVoice(found) {
    var record = ctx.pendingVoice;
    if (ctx.gamePaused) return false;
    if (!record || !record.playing || !ctx.vOn || ctx.vSuspended) {
      ctx.pendingVoice = null;
      return false;
    }
    var match = found.filter(function (item) {
      return item.item.f.replace(/^..\//, "") === record.file;
    })[0];
    if (!match) return false;
    var clip = ctx.vClips[match.item.f],
      at = record.language === ctx.L ? record.time : 0;
    if (clip && record.language !== ctx.L) {
      var chunks = ctx.capChunks(clip.s.split(" "));
      var chunk = chunks[Math.min(record.line || 0, chunks.length - 1)];
      at = (clip.t[chunk[0]] || 0) / 1000;
    }
    ctx.pendingVoice = null;
    ctx.vQueue = [];
    ctx.vPlay(match.item, match.el, at);
    return true;
  }
  ctx.publish({ vFollow, vPlay, voiceSnapshot, restoreVoice });
}
