import { h, button } from "./dom.js";
import { ANIMAL_IDS, isEmptyPlaceholder, slotStars } from "./store.js";
import { BADGE_IDS } from "./badges.js";
import { validSteps } from "./interaction-log.js";

// A progress file is a grown-up's own copy of the saved games on this device:
// scores, badges and recent game steps, keyed by animal slot. It holds no
// names or typed text, and the game never sends it anywhere.
export const PROGRESS_FORMAT = "pecan-grove-progress";
export const PROGRESS_VERSION = 1;
export const PROGRESS_MAX_BYTES = 512 * 1024;
const SLOT_IDS = ["you", ...ANIMAL_IDS];
const UNSAFE_KEYS = ["__proto__", "constructor", "prototype"];
const plain = (value) =>
  !!value && typeof value === "object" && !Array.isArray(value);
const score = (value) => Number.isFinite(value) && value >= 0 && value <= 100;
const date = (value) =>
  typeof value === "string" &&
  value.length <= 40 &&
  Number.isFinite(Date.parse(value))
    ? value
    : null;
// Stops remember their last round as short ids, numbers and flags.
function simple(value, depth = 0) {
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.length <= 200;
  if (depth > 2) return false;
  if (Array.isArray(value))
    return value.length <= 50 && value.every((v) => simple(v, depth + 1));
  return (
    plain(value) &&
    Object.keys(value).length <= 20 &&
    Object.entries(value).every(
      ([key, v]) => !UNSAFE_KEYS.includes(key) && simple(v, depth + 1),
    )
  );
}
const short = (value) => typeof value === "string" && value.length <= 200;
const number = (value) => Number.isFinite(value);
const flag = (value) => typeof value === "boolean";
const code = (value) => short(value) || number(value);
const list = (value) =>
  Array.isArray(value) && value.length <= 50 && value.every(code);
const map = (value) => plain(value) && simple(value);
const badge = (value) => value === null || /^process-\d{1,2}$/.test(value);
// What each stop keeps about its last round, by stop number: the names and
// types the stops read back. A file's other or wrong-typed extras are dropped,
// so a damaged or hostile file cannot make a stop fail.
const EXTRAS = {
  1: {
    lastRound: short,
    allSigns: flag,
    extraTaps: number,
    processBadge: badge,
  },
  2: { lastRound: list, lastOrder: list },
  3: { lastSet: short, allListened: flag, processBadge: badge },
  4: { lastClaims: list, allSources: flag, processBadge: badge },
  5: { lastRound: list },
  6: { lastQs: list, lastDesks: short },
  7: { lastSpark: code, lastTiles: list },
  8: { lastRound: short, lastTopic: short, lastPair: list, sides: map },
  9: {
    processBadge: badge,
    lastRound: short,
    lastPeople: list,
    lastWays: list,
  },
  10: { processBadge: badge, lastRound: list, lastOpen: code },
  11: { processBadge: badge, lastRound: map, lastOrder: list },
  12: { lastRound: short, lastSet: short, processBadge: badge, lastHard: list },
  13: {
    allSources: flag,
    processBadge: badge,
    lastRumor: number,
    lastOld: number,
    lastFacts: list,
  },
  14: { processBadge: badge, lastPath: short, noClue: map, lastRound: short },
  15: {
    processBadge: badge,
    lastRound: short,
    lastDeal: map,
    lastGuests: list,
  },
};
function cleanRecord(record, n) {
  if (
    !plain(record) ||
    !score(record.best) ||
    !Number.isInteger(record.rounds) ||
    record.rounds < 1
  )
    return null;
  const out = {
    best: record.best,
    first: score(record.first) ? record.first : record.best,
    rounds: record.rounds,
    last5: (Array.isArray(record.last5) ? record.last5 : [])
      .filter(score)
      .slice(-5),
    all: (Array.isArray(record.all) ? record.all : []).filter(score).slice(-50),
  };
  const extras = EXTRAS[n] || {};
  for (const [key, value] of Object.entries(record))
    if (Object.keys(extras).includes(key) && extras[key](value))
      out[key] = value;
  return out;
}
function cleanBadges(badges) {
  const out = {};
  for (const [id, at] of Object.entries(plain(badges) ? badges : {}))
    if (BADGE_IDS.includes(id) && date(at)) out[id] = at;
  return out;
}
export function progressFile(
  store,
  { stops = [], steps = [], language = "en", now = new Date() } = {},
) {
  const numbers = Object.fromEntries(stops.map((stop) => [stop.id, stop.n]));
  const players = {};
  for (const [id, player] of Object.entries(store.players || {})) {
    if (!SLOT_IDS.includes(id) || !plain(player)) continue;
    if (id === "you" && isEmptyPlaceholder(player)) continue;
    const records = {};
    for (const [stopId, record] of Object.entries(player.stops || {})) {
      const clean = numbers[stopId] && cleanRecord(record, numbers[stopId]);
      if (clean) records[stopId] = { stop: numbers[stopId], ...clean };
    }
    players[id] = {
      stars: slotStars({ stops: records }),
      created: date(player.created),
      updated: date(player.updated),
      stops: records,
      badges: cleanBadges(player.badges),
    };
  }
  return {
    format: PROGRESS_FORMAT,
    version: PROGRESS_VERSION,
    savedAt: now.toISOString(),
    language: language === "es" ? "es" : "en",
    current: players[store.current] ? store.current : null,
    players,
    steps: validSteps(steps),
  };
}
// Returns { players, current } or { error: "invalid" | "newer" }. Nothing in
// the file is trusted: unknown stops and extras are skipped, a damaged score or
// player is refused.
export function readProgressFile(text, { stops = [], now = new Date() } = {}) {
  let file;
  if (typeof text !== "string" || text.length > PROGRESS_MAX_BYTES)
    return { error: "invalid" };
  try {
    file = JSON.parse(text);
  } catch {
    return { error: "invalid" };
  }
  if (
    !plain(file) ||
    file.format !== PROGRESS_FORMAT ||
    !Number.isInteger(file.version)
  )
    return { error: "invalid" };
  if (file.version > PROGRESS_VERSION) return { error: "newer" };
  if (file.version !== PROGRESS_VERSION || !plain(file.players))
    return { error: "invalid" };
  const numbers = Object.fromEntries(stops.map((stop) => [stop.id, stop.n])),
    players = {};
  for (const [id, player] of Object.entries(file.players)) {
    if (
      !SLOT_IDS.includes(id) ||
      !plain(player) ||
      !plain(player.stops ?? {}) ||
      !plain(player.badges ?? {})
    )
      return { error: "invalid" };
    const records = {};
    for (const [stopId, record] of Object.entries(player.stops ?? {})) {
      if (!numbers[stopId]) continue;
      const clean = cleanRecord(record, numbers[stopId]);
      if (!clean) return { error: "invalid" };
      records[stopId] = clean;
    }
    const created = date(player.created) || now.toISOString();
    players[id] = {
      stops: records,
      badges: cleanBadges(player.badges),
      created,
      updated: date(player.updated) || created,
    };
  }
  return { players, current: players[file.current] ? file.current : null };
}
// Opening a file only adds: a stop keeps whichever copy has more rounds, and
// badges are combined. A device keeps at most eight saved games.
export function mergeProgress(store, { players, current }) {
  let opened = 0,
    skipped = 0;
  const used = () =>
    Object.keys(store.players).filter(
      (id) => id !== "you" || !isEmptyPlaceholder(store.players.you),
    ).length;
  for (const [id, theirs] of Object.entries(players)) {
    const ours = store.players[id],
      replaces = id === "you" && isEmptyPlaceholder(ours);
    if (ours && !replaces) {
      ours.stops ||= {};
      ours.badges ||= {};
      for (const [stopId, record] of Object.entries(theirs.stops))
        if (record.rounds > (ours.stops[stopId]?.rounds || 0))
          ours.stops[stopId] = record;
      for (const [badge, at] of Object.entries(theirs.badges))
        ours.badges[badge] ||= at;
      if (!(Date.parse(ours.updated) >= Date.parse(theirs.updated)))
        ours.updated = theirs.updated;
    } else if (!replaces && used() >= 8) {
      skipped++;
      continue;
    } else store.players[id] = theirs;
    opened++;
  }
  // The empty default player gives way to the opened games, like New game.
  const you = store.players.you;
  if (
    opened &&
    isEmptyPlaceholder(you) &&
    Object.keys(store.players).length > 1
  )
    delete store.players.you;
  if (!store.players[store.current])
    store.current = store.players[current]
      ? current
      : Object.keys(store.players)[0];
  return { opened, skipped };
}
export function progressControls({
  i18n,
  slots,
  stops = () => [],
  steps = () => [],
  onChange = () => {},
}) {
  const status = h("p", {
    class: "cb-progress-file__status",
    role: "status",
    "aria-live": "polite",
  });
  const picker = h("input", {
    type: "file",
    accept: ".json,application/json",
    hidden: true,
  });
  picker.addEventListener("change", async () => {
    const chosen = picker.files?.[0];
    picker.value = "";
    if (!chosen) return;
    let text = "";
    try {
      if (chosen.size <= PROGRESS_MAX_BYTES) text = await chosen.text();
    } catch {
      text = "";
    }
    const read = readProgressFile(text, { stops: stops() });
    if (read.error) {
      status.textContent = i18n.t(
        read.error === "newer" ? "progressNewer" : "progressInvalid",
      );
      return;
    }
    const result = mergeProgress(slots.store(), read);
    const saved = slots.save();
    onChange(result);
    // The real outcome: nothing added, open only in this tab, or saved here.
    status.textContent = i18n.t(
      !result.opened
        ? "progressNothing"
        : !saved
          ? "progressUnsaved"
          : result.skipped
            ? "progressFull"
            : "progressOpened",
    );
  });
  const save = button(i18n.t("progressSave"), () => {
    try {
      const file = progressFile(slots.store(), {
        stops: stops(),
        steps: steps(),
        language: i18n.language,
      });
      const blob = new globalThis.Blob([JSON.stringify(file, null, 2) + "\n"], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = h("a", {
        href: url,
        download: "pecan-grove-progress-" + file.savedAt.slice(0, 10) + ".json",
        hidden: true,
      });
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      status.textContent = i18n.t("progressSaved");
    } catch {
      status.textContent = i18n.t("progressSaveFailed");
    }
  });
  const open = button(i18n.t("progressOpen"), () => picker.click());
  return h(
    "fieldset",
    { class: "cb-consent cb-progress-file", "data-cb-novoice": "" },
    [
      h("legend", { text: i18n.t("progressHeading") }),
      h("p", { text: i18n.t("progressNote") }),
      h("div", { class: "cb-row" }, [save, open]),
      picker,
      status,
    ],
  );
}
