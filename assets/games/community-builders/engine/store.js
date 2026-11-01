import { safeSet, storageArea, unavailableStorage } from "./dom.js";
export const ANIMAL_IDS = [
  "fox",
  "owl",
  "turtle",
  "rabbit",
  "deer",
  "heron",
  "bee",
  "otter",
];
export const starsFor = (score) =>
  score >= 90 ? 3 : score >= 70 ? 2 : score >= 40 ? 1 : 0;
export const slotStars = (player) =>
  Object.values(player?.stops || {}).reduce(
    (sum, record) => sum + starsFor(record.best || 0),
    0,
  );
export function migrateStore(value, now = new Date().toISOString()) {
  const store = value && typeof value === "object" ? value : {};
  store.version = 2;
  store.players ||= { you: { stops: {} } };
  for (const player of Object.values(store.players)) {
    player.stops ||= {};
    player.badges ||= {};
    player.created ||= now;
    player.updated ||= player.created;
  }
  if (!store.players[store.current])
    store.current = Object.keys(store.players)[0] || "you";
  if (!store.players[store.current])
    store.players[store.current] = {
      stops: {},
      badges: {},
      created: now,
      updated: now,
    };
  return store;
}
export function resumable(record, now = Date.now()) {
  return (
    !!record?.stopId &&
    record.v === 1 &&
    record.mode === "stop" &&
    record.state != null &&
    Number.isFinite(Date.parse(record.ts)) &&
    now - Date.parse(record.ts) < 7 * 86400000 &&
    now >= Date.parse(record.ts)
  );
}
export function isEmptyPlaceholder(player) {
  return (
    !!player &&
    !Object.keys(player.stops || {}).length &&
    !Object.keys(player.badges || {}).length &&
    !resumable(player.resume)
  );
}
export class Slots {
  constructor({
    state,
    storage = storageArea("localStorage"),
    target = globalThis.document,
  }) {
    this.state = state;
    this.storage = storage;
    this.target = target;
    this.deleted = null;
  }
  store() {
    return migrateStore(this.state().store);
  }
  save() {
    const state = this.state();
    // The core keeps a newer or unrecoverable save untouched.
    return safeSet(
      state.saveLocked ? unavailableStorage : this.storage,
      state.storageKey || state.key || "pecan-grove-journey",
      this.store(),
      this.target,
    );
  }
  current() {
    const s = this.store();
    return s.players[s.current];
  }
  select(id) {
    const store = this.store();
    if (!store.players[id]) return false;
    store.current = id;
    return this.save();
  }
  create(id) {
    if (!ANIMAL_IDS.includes(id)) return false;
    const s = this.store();
    if (s.players[id]) return false;
    const placeholder = s.players.you;
    const emptyPlaceholder = isEmptyPlaceholder(placeholder);
    if (Object.keys(s.players).length - (emptyPlaceholder ? 1 : 0) >= 8)
      return false;
    if (emptyPlaceholder) delete s.players.you;
    const now = new Date().toISOString();
    s.players[id] = { stops: {}, badges: {}, created: now, updated: now };
    s.current = id;
    return this.save();
  }
  // Each deletion returns its own undo record, so an older Undo restores the
  // game it was made for.
  remove(id) {
    const store = this.store();
    if (!store.players[id]) return null;
    const deleted = {
      id,
      player: structuredClone(store.players[id]),
      current: store.current === id,
    };
    this.deleted = deleted;
    delete store.players[id];
    if (store.current === id)
      store.current = Object.keys(store.players)[0] || "you";
    migrateStore(store);
    this.save();
    return deleted;
  }
  undo(deleted = this.deleted) {
    if (!deleted) return false;
    const store = this.store();
    if (this.deleted === deleted) this.deleted = null;
    // Never replace a newer game for the same animal or pass eight players.
    // Only the empty default player may be replaced.
    const emptyPlaceholder = isEmptyPlaceholder(store.players.you),
      replacesPlaceholder = deleted.id === "you" && emptyPlaceholder;
    if (store.players[deleted.id] && !replacesPlaceholder) return false;
    if (
      !replacesPlaceholder &&
      Object.keys(store.players).length - (emptyPlaceholder ? 1 : 0) >= 8
    )
      return false;
    store.players[deleted.id] = deleted.player;
    // The game being played comes back as the one being played: deleting it
    // had passed play to another player's slot (or the empty default one).
    if (deleted.current) store.current = deleted.id;
    return this.save();
  }
  resume(record) {
    if (!record?.stopId) return;
    const player = this.current();
    player.resume = { ...record, ts: new Date().toISOString() };
    player.updated = player.resume.ts;
    this.save();
  }
  finished(stopId) {
    const player = this.current();
    if (player.resume?.stopId === stopId) delete player.resume;
    player.updated = new Date().toISOString();
    this.save();
  }
}
