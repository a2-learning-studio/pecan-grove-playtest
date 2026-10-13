/** Process scores for stops whose star results were out of line with the work. */
export function disagreeScore({
  heardA = false,
  heardB = false,
  found = 0,
  misses = 0,
} = {}) {
  const careful = Math.max(0, 15 - 8 * Math.max(0, misses));
  return (
    (heardA ? 15 : 0) +
    (heardB ? 15 : 0) +
    (found >= 1 ? 35 : 0) +
    (found >= 2 ? 20 : 0) +
    careful
  );
}

export function matchFixScore(problems = []) {
  return problems.reduce((score, item) => {
    if (!item || item.by !== "player") return score;
    const misses = item.misses?.length || 0;
    return score + (misses ? 14 : 18) + (item.note ? 2 : 0);
  }, 0);
}

export function futureScore({
  wishes = 0,
  places = 0,
  check = false,
  invite = 0,
} = {}) {
  return 14 * wishes + 2 * places + (check ? 3 : 0) + invite;
}

export function countsForBadges(record) {
  return (record?.rounds || 0) > 0 && (record?.best || 0) >= 40;
}
