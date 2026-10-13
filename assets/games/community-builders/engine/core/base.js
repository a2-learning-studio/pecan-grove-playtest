export default function createBase(ctx) {
  var root = ctx.document.querySelector('[data-game="community-builders"]');
  if (!root) return;
  var BASE =
    root.getAttribute("data-base") || "/assets/games/community-builders/";
  var L =
    (ctx.document.documentElement.lang || "en").slice(0, 2) === "es"
      ? "es"
      : "en";
  var feedbackSession = root.getAttribute("data-feedback-session") || "";
  var KEY =
    "pecan-grove-journey" +
    (/^[A-Za-z0-9_-]{16,80}$/.test(feedbackSession)
      ? ":" + feedbackSession
      : "");
  var REDUCED =
    ctx.window.matchMedia &&
    ctx.window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rngState = seedValue(),
    roundSeed = rngState,
    activeController = null,
    restoring = false,
    gamePaused = false,
    pausedVoice = null;
  var activeLifecycle = null,
    actionHistory = [],
    replayClock = 0;
  var roundRecord = null,
    restoringRecord = null,
    lastResultInfo = null,
    restoringResultInfo = null;
  var resumeRecord = null;
  try {
    resumeRecord = JSON.parse(
      ctx.sessionStorage.getItem("pecan-grove-resume") || "null",
    );
    if (
      !resumeRecord ||
      resumeRecord.v !== 1 ||
      Date.now() - resumeRecord.ts > 600000 ||
      resumeRecord.session !== feedbackSession
    )
      resumeRecord = null;
  } catch (_) {
    resumeRecord = null;
  }
  function seedValue() {
    var requested;
    try {
      requested = new ctx.URLSearchParams(ctx.location.search).get("seed");
    } catch (_) {}
    if (
      requested !== null &&
      requested !== undefined &&
      /^-?\d+$/.test(requested)
    )
      return Number(requested) >>> 0;
    try {
      var bytes = new Uint32Array(1);
      ctx.window.crypto.getRandomValues(bytes);
      return bytes[0];
    } catch (_) {
      return (Date.now() ^ Math.floor(Math.random() * 4294967296)) >>> 0;
    }
  }
  function rng() {
    var t = (rngState += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function emit(type, detail) {
    if (ctx.window.CustomEvent)
      ctx.document.dispatchEvent(
        new ctx.window.CustomEvent(type, { detail: detail }),
      );
  }
  function motionAllowed() {
    var reduced = ctx.window.matchMedia
      ? ctx.window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : REDUCED;
    return !reduced && !(typeof ctx.CFG !== "undefined" && ctx.CFG.calm);
  }
  function resolveAsset(path) {
    return (ctx.window.PG_ASSET_MAP && ctx.window.PG_ASSET_MAP[path]) || path;
  }
  ctx.publish({ seedValue, rng, emit, motionAllowed, resolveAsset });
  ctx.bind({
    root: [() => root, (value) => (root = value)],
    BASE: [() => BASE, (value) => (BASE = value)],
    L: [() => L, (value) => (L = value)],
    feedbackSession: [
      () => feedbackSession,
      (value) => (feedbackSession = value),
    ],
    KEY: [() => KEY, (value) => (KEY = value)],
    REDUCED: [() => REDUCED, (value) => (REDUCED = value)],
    rngState: [() => rngState, (value) => (rngState = value)],
    roundSeed: [() => roundSeed, (value) => (roundSeed = value)],
    activeController: [
      () => activeController,
      (value) => (activeController = value),
    ],
    restoring: [() => restoring, (value) => (restoring = value)],
    gamePaused: [() => gamePaused, (value) => (gamePaused = value)],
    pausedVoice: [() => pausedVoice, (value) => (pausedVoice = value)],
    activeLifecycle: [
      () => activeLifecycle,
      (value) => (activeLifecycle = value),
    ],
    actionHistory: [() => actionHistory, (value) => (actionHistory = value)],
    replayClock: [() => replayClock, (value) => (replayClock = value)],
    roundRecord: [() => roundRecord, (value) => (roundRecord = value)],
    restoringRecord: [
      () => restoringRecord,
      (value) => (restoringRecord = value),
    ],
    lastResultInfo: [() => lastResultInfo, (value) => (lastResultInfo = value)],
    restoringResultInfo: [
      () => restoringResultInfo,
      (value) => (restoringResultInfo = value),
    ],
    resumeRecord: [() => resumeRecord, (value) => (resumeRecord = value)],
  });
}
