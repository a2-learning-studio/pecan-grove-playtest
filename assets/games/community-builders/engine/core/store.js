export default function createStore(ctx) {
  // A save this version cannot keep safely (one from a newer version, or one
  // whose recovery copy could not be made) is never written over.
  var saveLocked = false;
  var store = load();
  function isRecord(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
  function keepRecovery(raw) {
    // Keep the original text before anything replaces it.
    try {
      var key = ctx.KEY + "-recovery",
        earlier = ctx.localStorage.getItem(key);
      if (!earlier) ctx.localStorage.setItem(key, raw);
      else if (earlier !== raw)
        ctx.localStorage.setItem(key + "-" + Date.now(), raw);
      return true;
    } catch (e) {
      return false;
    }
  }
  function usable(s) {
    // Set aside damaged players and stop records instead of failing to start.
    var damaged = false;
    for (var id in s.players) {
      var pl = s.players[id];
      if (!isRecord(pl)) {
        delete s.players[id];
        damaged = true;
        continue;
      }
      if (!isRecord(pl.stops)) {
        damaged = damaged || pl.stops !== undefined;
        pl.stops = {};
      }
      for (var k in pl.stops)
        if (!isRecord(pl.stops[k])) {
          delete pl.stops[k];
          damaged = true;
        }
    }
    return damaged;
  }
  function load() {
    var raw = null;
    try {
      raw = ctx.localStorage.getItem(ctx.KEY);
      var s = JSON.parse(raw || "null");
      if (s && (s.version === 1 || s.version === 2) && isRecord(s.players)) {
        if (usable(s) && !keepRecovery(raw)) saveLocked = true;
        return s;
      }
      if (s && typeof s.version === "number" && s.version > 2)
        saveLocked = true;
    } catch (e) {
      /* storage blocked or unreadable: the game still works */
    }
    if (raw && !keepRecovery(raw)) saveLocked = true;
    return { version: 1, players: { you: { stops: {} } }, current: "you" };
  }
  var storageWarned = false;
  function storageError(kind) {
    // The enhanced engine shows the same notice. Keep one for screen readers.
    if (
      !storageWarned &&
      typeof ctx.root !== "undefined" &&
      !(ctx.root.dataset && ctx.root.dataset.engineMounted) &&
      !ctx.root.querySelector(".cb-engine-save-warning")
    ) {
      storageWarned = true;
      var note = ctx.h("p", {
        class: "cb-storage-warning",
        role: "status",
        "aria-live": "polite",
        text:
          ctx.L === "es"
            ? "Este navegador no puede guardar tu progreso. Pide ayuda a un adulto o deja esta pestaña abierta."
            : "This browser cannot save your progress. Ask a grown-up, or keep this tab open.",
      });
      ctx.root.insertBefore(note, ctx.root.firstChild);
    }
    if (typeof ctx.emit === "function")
      ctx.emit("cb:storage-error", { kind: kind });
  }
  function save() {
    try {
      if (saveLocked) throw new Error("A newer or unrecoverable save");
      ctx.localStorage.setItem(ctx.KEY, JSON.stringify(store));
      return true;
    } catch (e) {
      if (typeof storageError === "function") storageError("progress");
      return false;
    }
  }
  function player() {
    var p = store.current || "you";
    if (!store.players[p]) store.players[p] = { stops: {} };
    return store.players[p];
  }
  function rec(stopId, pl) {
    pl = pl || player();
    return pl.stops[stopId] || null;
  }
  function saveRound(stopId, score, extra) {
    var pl = player(),
      r = pl.stops[stopId] || {
        best: 0,
        first: score,
        last5: [],
        rounds: 0,
        all: [],
      };
    if (typeof ctx.restoring !== "undefined" && ctx.restoring)
      return (
        ctx.restoringResultInfo || {
          first: r.rounds === 0,
          newBest: false,
          best: Math.max(r.best, score),
        }
      );
    var previousBest = r.best;
    var wasFirst = r.rounds === 0,
      newBest = !wasFirst && score > r.best;
    r.rounds += 1;
    r.best = Math.max(r.best, score);
    if (wasFirst) r.first = score;
    var history = (r.last5 || []).concat([score]);
    var keep = { last5: 1, all: 1, best: 1, rounds: 1, first: 1 };
    for (var k in extra) if (!keep[k]) r[k] = extra[k];
    r.last5 = history.slice(-5);
    r.all = (r.all || []).concat([score]).slice(-50);
    pl.stops[stopId] = r;
    save();
    if (wasFirst) ctx.justDone = stopId;
    if (typeof ctx.emit === "function")
      ctx.emit("cb:result", {
        stopId: stopId,
        score: score,
        newBest: newBest,
        previousBest: previousBest,
        meta: extra || {},
      });
    ctx.lastResultInfo = { first: wasFirst, newBest: newBest, best: r.best };
    return ctx.lastResultInfo;
  }
  function journeyOf(pl) {
    var t = 0;
    for (var k in pl.stops) t += pl.stops[k].best || 0;
    return t;
  }
  function playerLabel() {
    var p = store.current;
    if (!p || p === "you") return ctx.W.you;
    var a = ctx.ANIMALS.filter(function (x) {
      return x.id === p;
    })[0];
    return a ? a.name : ctx.W.you;
  }
  // Another tab on the same player saved. Take its new games, finished stops
  // and badges, so this tab's next save does not erase them.
  function mergeSaved(raw) {
    var other;
    try {
      other = JSON.parse(raw || "null");
    } catch (e) {
      return false;
    }
    if (
      !other ||
      !(other.version === 1 || other.version === 2) ||
      !isRecord(other.players)
    )
      return false;
    usable(other);
    for (var id in other.players) {
      var theirs = other.players[id],
        ours = store.players[id];
      if (!ours) {
        store.players[id] = theirs;
        continue;
      }
      // A game deleted and started again for the same animal is a new game.
      if (theirs.created !== ours.created) continue;
      if (!isRecord(ours.stops)) ours.stops = {};
      for (var k in theirs.stops) {
        var r = ours.stops[k];
        if (!r || (theirs.stops[k].rounds || 0) > (r.rounds || 0))
          ours.stops[k] = theirs.stops[k];
      }
      if (isRecord(theirs.badges)) {
        if (!isRecord(ours.badges)) ours.badges = {};
        for (var b in theirs.badges)
          if (!ours.badges[b]) ours.badges[b] = theirs.badges[b];
      }
    }
    return true;
  }
  if (ctx.window && ctx.window.addEventListener)
    ctx.window.addEventListener("storage", function (event) {
      if (event.key === ctx.KEY) mergeSaved(event.newValue);
    });
  ctx.publish({
    load,
    storageError,
    save,
    player,
    rec,
    saveRound,
    journeyOf,
    playerLabel,
    mergeSaved,
  });
  ctx.bind({
    store: [() => store, (value) => (store = value)],
    storageWarned: [() => storageWarned, (value) => (storageWarned = value)],
    saveLocked: [() => saveLocked, (value) => (saveLocked = value)],
  });
}
