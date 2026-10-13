export default function createVoiceScan(ctx) {
  function vWords(el) {
    // each word of the line in its own span, for the read-along
    if (el.querySelector(".cb-w")) return;
    var w = ctx.document.createTreeWalker(el, ctx.NodeFilter.SHOW_TEXT, null),
      list = [],
      n;
    while ((n = w.nextNode()))
      if (
        n.nodeValue.trim() &&
        !(n.parentElement && n.parentElement.closest(".cb-vbtn"))
      )
        list.push(n);
    list.forEach(function (tn) {
      var host = tn.parentElement;
      if (/flex|grid/.test(ctx.getComputedStyle(host).display)) {
        // bare text in a flex or grid box: give it one inline home first
        var wrap = ctx.h("span", { class: "cb-vbtn-wrap" });
        host.replaceChild(wrap, tn);
        wrap.appendChild(tn);
      }
      var frag = ctx.document.createDocumentFragment();
      tn.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        frag.appendChild(
          /^\s+$/.test(part)
            ? ctx.document.createTextNode(part)
            : ctx.h("span", { class: "cb-w", text: part }),
        );
      });
      tn.parentNode.replaceChild(frag, tn);
    });
  }
  function vAttach(el, b) {
    // the button stays on the line's last word, whatever the layout
    vWords(el);
    var ws = el.querySelectorAll(".cb-w"),
      last = ws[ws.length - 1];
    if (!last) {
      el.appendChild(b);
      return;
    }
    var glue = ctx.h("span", { class: "cb-vbtn-glue" });
    last.parentNode.replaceChild(glue, last);
    glue.appendChild(last);
    glue.appendChild(b);
  }
  function vDirect(el) {
    for (var n = el.firstChild; n; n = n.nextSibling)
      if (n.nodeType === 3 && n.nodeValue.trim()) return true;
    return false;
  }
  function vFind(el) {
    // the clip for this element: its whole text, or a line it shows among other words
    var t = ctx.vNorm(el.textContent);
    if (!t || t.length > 700) return null;
    if (ctx.vIdx[t]) return ctx.vIdx[t];
    if (!vDirect(el)) return null;
    if (!ctx.vKeys)
      ctx.vKeys = Object.keys(ctx.vIdx)
        .filter(function (k) {
          return k.length >= 12;
        })
        .sort(function (a, b) {
          return b.length - a.length;
        });
    for (var i = 0; i < ctx.vKeys.length; i++)
      if (t.indexOf(ctx.vKeys[i]) >= 0) return ctx.vIdx[ctx.vKeys[i]];
    return null;
  }
  function vScan(nodes) {
    if (!ctx.vIdx) return;
    var hits = {}; // per clip, every element that shows its text or a part of it
    function first(a, b) {
      return a.compareDocumentPosition(b) & 4 ? -1 : 1;
    }
    nodes.forEach(function (n) {
      if (!n || !n.querySelectorAll) return;
      [n]
        .concat(
          [].slice.call(
            n.querySelectorAll("p, h2, h3, span, li, div, strong, blockquote"),
          ),
        )
        .forEach(function (el) {
          if (
            el.closest(
              '.cb-vbtn, .cb-w, .cb-vbtn-glue, .cb-live, .cb-vh, [hidden], [aria-hidden="true"], [data-cb-novoice]',
            )
          )
            return;
          var item = vFind(el);
          if (!item) return;
          var voiced = el.closest('[data-cb-voiced="' + item.f + '"]');
          if (voiced && !(ctx.pendingVoice && voiced === el)) return;
          (hits[item.f] = hits[item.f] || { item: item, els: [] }).els.push(el);
        });
    });
    var found = Object.keys(hits).map(function (k) {
      // a line told in two paragraphs reads and lights up as one
      var all = hits[k].els,
        els = all
          .filter(function (e, i) {
            return (
              all.indexOf(e) === i &&
              !all.some(function (o) {
                return o !== e && e.contains(o);
              })
            );
          })
          .sort(first);
      return { item: hits[k].item, el: els[els.length - 1], els: els };
    });
    if (!found.length) return;
    found.sort(function (a, b) {
      return first(a.els[0], b.els[0]);
    });
    found.forEach(function (f) {
      f.el._vParts = f.els;
      var attached = f.el.getAttribute("data-cb-voiced") === f.item.f;
      f.els.forEach(function (e) {
        e.setAttribute("data-cb-voiced", f.item.f);
        if (e !== f.el) vWords(e);
      });
      if (attached) return;
      if (f.el.closest("button")) {
        vWords(f.el);
        return;
      } // never a button inside a button: the line still plays and lights up
      vAttach(
        f.el,
        ctx.h(
          "button",
          {
            type: "button",
            class: "cb-vbtn",
            "aria-label": ctx.X.replay,
            title: ctx.vOn ? ctx.X.replay : ctx.X.voiceOff,
            disabled: !ctx.vOn || null,
            onclick: function (e) {
              e.stopPropagation();
              ctx.vQueue = [];
              ctx.vPlay(f.item, f.el);
            },
          },
          [ctx.ico("voice")],
        ),
      );
    });
    if (ctx.restoreVoice(found)) return;
    if (
      ctx.restoring ||
      ctx.gamePaused ||
      ctx.vSuspended ||
      ctx.root.hasAttribute("data-playtest-paused") ||
      !ctx.vOn ||
      !ctx.acted ||
      !ctx.CFG.auto
    )
      return;
    var now = ctx.performance.now();
    var nbs = found.filter(function (f) {
      return f.item.k === "nb";
    }).length; // a whole board of neighbors' lines: tap to hear each
    var play = found
      .filter(function (f) {
        return f.item.k === "nb"
          ? nbs <= 2
          : !ctx.vHeard[f.item.f] || (ctx.vAudio && f.item.f === ctx.vLast.f);
      })
      .slice(0, 3);
    if (!play.length) return;
    if (
      ctx.vAudio &&
      play[0].item.f === ctx.vLast.f &&
      now - ctx.vLast.t < 30000
    ) {
      // the same line was redrawn: keep reading, follow the new copy
      ctx.vMark(ctx.vEl, false);
      ctx.vEl = play[0].el;
      ctx.vMark(ctx.vEl, true);
      ctx.vFollow(ctx.vAudio, play[0].item, ctx.vEl);
      ctx.vQueue = play.slice(1);
      return;
    }
    ctx.vStop();
    ctx.vQueue = play.slice(1);
    ctx.vPlay(play[0].item, play[0].el);
  }
  function voiceBtn(iconOnly) {
    return ctx.h(
      "button",
      {
        type: "button",
        class:
          "cb-btn cb-btn--onstage cb-voice" + (iconOnly ? " cb-fs--icon" : ""),
        "aria-pressed": ctx.vOn ? "true" : "false",
        "aria-label": ctx.X.voice,
        title: (ctx.vOn ? ctx.X.voiceOn : ctx.X.voiceOff) + " (M)",
        onclick: function () {
          setVoice(!ctx.vOn, true);
        },
      },
      [
        ctx.ico(ctx.vOn ? "voice" : "voiceOff"),
        iconOnly ? null : ctx.h("span", { text: ctx.X.voice }),
      ],
    );
  }
  function setVoice(on, tell) {
    ctx.vOn = ctx.CFG.voice = on;
    ctx.cfgSave();
    if (!ctx.vOn) {
      ctx.vStop();
      ctx.vInkClear();
    }
    [].forEach.call(ctx.root.querySelectorAll(".cb-voice"), function (b) {
      b.setAttribute("aria-pressed", ctx.vOn ? "true" : "false");
      b.title = (ctx.vOn ? ctx.X.voiceOn : ctx.X.voiceOff) + " (M)";
      var i = b.querySelector("svg");
      if (i) b.replaceChild(ctx.ico(ctx.vOn ? "voice" : "voiceOff"), i);
    });
    ctx.root.classList.toggle("is-quiet", !ctx.vOn);
    [].forEach.call(
      ctx.root.querySelectorAll(".cb-vbtn, .cb-set__sample"),
      function (b) {
        b.disabled = !ctx.vOn;
        b.title = ctx.vOn
          ? b.classList.contains("cb-set__sample")
            ? ctx.X.sample
            : ctx.X.replay
          : ctx.X.voiceOff;
      },
    );
    if (tell) ctx.say(ctx.vOn ? ctx.X.voiceOn : ctx.X.voiceOff);
  }
  function setCap(on, tell) {
    ctx.CFG.cap = on;
    ctx.cfgSave();
    if (ctx.vRead && !on && ctx.vRead.box === ctx.capBox) {
      ctx.vRead.box = null;
      ctx.cap.hidden = true;
    }
    if (
      ctx.vRead &&
      on &&
      !ctx.vRead.box &&
      ctx.vEl &&
      !ctx.vEl.closest("dialog")
    ) {
      ctx.vRead.box = ctx.capBox;
      ctx.vRead.ck = -1;
      ctx.cap.hidden = false;
      ctx.capDraw(ctx.vRead.cur);
    }
    if (tell) ctx.say(on ? ctx.X.capOn : ctx.X.capOff);
  }
  function setBtn(iconOnly) {
    return ctx.h(
      "button",
      {
        type: "button",
        class:
          "cb-btn cb-btn--onstage cb-setbtn" + (iconOnly ? " cb-fs--icon" : ""),
        "aria-label": ctx.X.settings,
        "aria-haspopup": "dialog",
        title: ctx.X.settings + " (Esc)",
        onclick: function (e) {
          ctx.openSettings(e.currentTarget);
        },
      },
      [
        ctx.ico("sliders"),
        iconOnly ? null : ctx.h("span", { text: ctx.X.settings }),
      ],
    );
  }
  function replayNow() {
    // R: the line just read, or the first one on screen
    if (ctx.vLastEl && ctx.vLastEl.isConnected && ctx.vLastItem) {
      ctx.vQueue = [];
      ctx.vPlay(ctx.vLastItem, ctx.vLastEl);
      return;
    }
    var scope = ctx.root.querySelector("dialog[open]") || ctx.main;
    var bs = [].slice
      .call(scope.querySelectorAll(".cb-vbtn"))
      .filter(function (b) {
        var r = b.getBoundingClientRect();
        return r.width > 0 && r.bottom > 0 && r.top < ctx.window.innerHeight;
      });
    if (bs[0]) bs[0].click();
  }
  new ctx.MutationObserver(function (recs) {
    if (ctx.vEl && !ctx.vEl.isConnected) {
      ctx.vUnread();
      ctx.vMark(ctx.vEl, false);
      ctx.vEl = null;
    }
    var nodes = [];
    recs.forEach(function (r) {
      if (r.target === ctx.cap || ctx.cap.contains(r.target)) return; // the caption bar rewrites itself every few words
      if (
        r.target.nodeType === 1 &&
        r.target.closest(".cb-medal, [data-cb-novoice], .cb-live, .cb-vh")
      )
        return;
      [].forEach.call(r.addedNodes, function (n) {
        if (
          n.nodeType === 1 &&
          !n.classList.contains("cb-vbtn") &&
          !n.classList.contains("cb-w")
        )
          nodes.push(n);
        else if (
          n.nodeType === 3 &&
          n.parentElement &&
          !n.parentElement.closest(".cb-w")
        )
          nodes.push(n.parentElement); // a line rewritten in place
      });
    });
    if (nodes.length) {
      ctx.vLoad();
      vScan(nodes);
    }
    if (ctx.vAudio && !ctx.vEl) ctx.vStop(); // the line being read left the screen: stop
  }).observe(ctx.root, { childList: true, subtree: true });
  ctx.publish({
    vWords,
    vAttach,
    vDirect,
    vFind,
    vScan,
    voiceBtn,
    setVoice,
    setCap,
    setBtn,
    replayNow,
  });
}
