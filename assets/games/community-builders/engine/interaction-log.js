import { safeGet, safeSet, storageArea } from "./dom.js";
import { ANIMAL_IDS } from "./store.js";

// A short list of recent game steps on this device, so a grown-up can see
// where play stopped or got stuck. It keeps only fixed game values (screen,
// stop number, animal slot, language): never typed text, and no scores, so
// Clear scoreboard still erases every score. It is sent nowhere, and leaves
// the device only inside a progress file a grown-up saves.
export const STEP_LIMIT = 300;
export const STEP_EVENTS = ["screen", "pause", "resume", "language"];
export function stepKey(storageKey = "pecan-grove-journey") {
  return storageKey.replace(/^pecan-grove-journey/, "pecan-grove-steps");
}
export function stepEntry(event, detail = {}, now = new Date()) {
  if (!STEP_EVENTS.includes(event)) return null;
  const entry = { at: now.toISOString().slice(0, 19) + "Z", event };
  if (Number.isInteger(detail.stop) && detail.stop >= 0 && detail.stop <= 15)
    entry.stop = detail.stop;
  if (/^[a-z]{1,20}$/.test(detail.phase || "")) entry.phase = detail.phase;
  if (detail.slot === "you" || ANIMAL_IDS.includes(detail.slot))
    entry.slot = detail.slot;
  if (detail.language === "en" || detail.language === "es")
    entry.language = detail.language;
  return entry;
}
export function validSteps(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) =>
      item && typeof item === "object" && Number.isFinite(Date.parse(item.at))
        ? stepEntry(item.event, item, new Date(item.at))
        : null,
    )
    .filter(Boolean)
    .slice(-STEP_LIMIT);
}
export class StepLog {
  constructor({
    state,
    storage = storageArea("localStorage"),
    target = globalThis.document,
  }) {
    this.state = state;
    this.storage = storage;
    this.target = target;
  }
  key() {
    const state = this.state();
    return stepKey(state.storageKey || state.key);
  }
  entries() {
    return validSteps(safeGet(this.storage, this.key(), []));
  }
  record(event, detail = {}) {
    const entry = stepEntry(event, detail);
    if (!entry) return false;
    // Read first, so two tabs on one player add to the same list.
    const list = this.entries(),
      last = list.at(-1);
    const same =
      last &&
      Object.keys(entry).every(
        (key) => key === "at" || entry[key] === last[key],
      ) &&
      Object.keys(last).length === Object.keys(entry).length;
    if (same) return false;
    list.push(entry);
    return safeSet(
      this.storage,
      this.key(),
      list.slice(-STEP_LIMIT),
      this.target,
    );
  }
}
