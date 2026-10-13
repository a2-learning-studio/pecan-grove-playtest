import { countsForBadges } from "./round-score.js";

export const BADGE_IDS = [
  "first-stop",
  "chapter-1",
  "chapter-2",
  "chapter-3",
  "chapter-4",
  "three-stars",
  "try-again",
  "all-ears",
  "source-checker",
  "good-question",
  "sign-spotter",
  "team-player",
  "quiet-pro",
  "journey-15",
  ...Array.from({ length: 11 }, (_, i) => "process-" + (i + 5)),
];
export function evaluateBadges(player, stops, event = {}) {
  const records = player.stops || {},
    done = Object.keys(records).filter((id) => countsForBadges(records[id])),
    earned = new Set();
  if (done.length) earned.add("first-stop");
  if (done.length >= 15) earned.add("journey-15");
  if (Object.values(records).some((record) => record.best >= 90))
    earned.add("three-stars");
  for (let chapter = 1; chapter <= 4; chapter++) {
    const members = stops.filter((stop) => Number(stop.chap) === chapter);
    if (members.length && members.every((stop) => done.includes(stop.id)))
      earned.add("chapter-" + chapter);
  }
  if (event.newBest) earned.add("try-again");
  if (event.quiet && event.stopId) earned.add("quiet-pro");
  if (event.team) earned.add("team-player");
  if (event.meta?.allListened) earned.add("all-ears");
  if (event.meta?.allSources) earned.add("source-checker");
  if (event.meta?.clearQuestions === 4) earned.add("good-question");
  if (event.meta?.allSigns && !event.meta?.extraTaps)
    earned.add("sign-spotter");
  if (
    event.meta?.processBadge &&
    /^process-(?:[5-9]|1[0-5])$/.test(event.meta.processBadge)
  )
    earned.add(event.meta.processBadge);
  return [...earned].filter((id) => !player.badges?.[id]);
}
export class Badges {
  constructor({ slots, stops = () => [], notify = () => {} }) {
    this.slots = slots;
    this.stops = stops;
    this.notify = notify;
  }
  unlock(id) {
    if (!BADGE_IDS.includes(id)) return false;
    const player = this.slots.current();
    if (player.badges[id]) return false;
    player.badges[id] = new Date().toISOString();
    this.slots.save();
    this.notify(id);
    return true;
  }
  evaluate(event) {
    const player = this.slots.current();
    player.badges = player.badges || {};
    const qualified = Object.values(player.stops || {}).filter(
      countsForBadges,
    ).length;
    const ids = evaluateBadges(player, this.stops(), event);
    const announce = [];
    ids.forEach((id) => {
      if (id === "first-stop" && qualified > 1 && !player.badges[id]) {
        player.badges[id] = new Date().toISOString();
        this.slots.save();
        return;
      }
      if (this.unlock(id)) announce.push(id);
    });
    return announce;
  }
}
