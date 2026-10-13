export default function createStore(ctx) {
  var store = load();
  function load() {
    try {
      var s = JSON.parse(ctx.localStorage.getItem(ctx.KEY) || "null");
      if (s && (s.version === 1 || s.version === 2) && s.players) return s;
    } catch (e) {
      /* storage blocked: the game still works */
    }
    return { version: 1, players: { you: { stops: {} } }, current: "you" };
  }
  var storageWarned = false;
  function storageError(kind) {
    if (!storageWarned && typeof ctx.root !== "undefined") {
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
  ctx.publish({
    load,
    storageError,
    save,
    player,
    rec,
    saveRound,
    journeyOf,
    playerLabel,
  });
  ctx.bind({
    store: [() => store, (value) => (store = value)],
    storageWarned: [() => storageWarned, (value) => (storageWarned = value)],
  });
}
