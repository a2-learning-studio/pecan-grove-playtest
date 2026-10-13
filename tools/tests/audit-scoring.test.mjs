import test from "node:test";
import assert from "node:assert/strict";
import { starsFor } from "../../assets/games/community-builders/engine/store.js";
import {
  disagreeScore,
  matchFixScore,
  futureScore,
  countsForBadges,
} from "../../assets/games/community-builders/engine/round-score.js";
import {
  evaluateBadges,
  Badges,
} from "../../assets/games/community-builders/engine/badges.js";

const stops = Array.from({ length: 15 }, (_, i) => ({
  id: "s" + (i + 1),
  chap: i < 6 ? 1 : i < 9 ? 2 : i < 13 ? 3 : 4,
}));

test("stop 8 careful tries cannot stay at 3 stars after two misses", () => {
  assert.equal(
    disagreeScore({ heardA: true, heardB: true, found: 2, misses: 0 }),
    100,
  );
  assert.equal(
    starsFor(
      disagreeScore({ heardA: true, heardB: true, found: 2, misses: 0 }),
    ),
    3,
  );
  assert.equal(
    disagreeScore({ heardA: true, heardB: true, found: 2, misses: 1 }),
    92,
  );
  assert.equal(
    disagreeScore({ heardA: true, heardB: true, found: 2, misses: 2 }),
    85,
  );
  assert.equal(starsFor(85), 2);
});

test("stop 10 first-try matches earn 3 stars without notes", () => {
  const problems = Array.from({ length: 5 }, () => ({
    by: "player",
    misses: [],
    note: false,
  }));
  assert.equal(matchFixScore(problems), 90);
  assert.equal(starsFor(90), 3);
  assert.equal(
    matchFixScore(problems.map((item) => ({ ...item, note: true }))),
    100,
  );
});

test("stop 15 five wishes earn 2 stars and a full plan stays at 100", () => {
  assert.equal(futureScore({ wishes: 5 }), 70);
  assert.equal(starsFor(70), 2);
  assert.equal(
    futureScore({ wishes: 6, places: 5, check: true, invite: 3 }),
    100,
  );
  assert.equal(starsFor(100), 3);
});

test("a zero-score round does not finish a chapter or announce First Stop late", () => {
  assert.equal(countsForBadges({ rounds: 1, best: 0 }), false);
  assert.equal(countsForBadges({ rounds: 1, best: 39 }), false);
  assert.equal(countsForBadges({ rounds: 1, best: 40 }), true);
  const player = {
    stops: {
      s7: { rounds: 1, best: 0 },
      s8: { rounds: 1, best: 0 },
      s9: { rounds: 1, best: 0 },
    },
    badges: {},
  };
  assert.equal(evaluateBadges(player, stops).includes("chapter-2"), false);
  assert.equal(evaluateBadges(player, stops).includes("first-stop"), false);
  player.stops.s1 = { rounds: 1, best: 90 };
  player.stops.s3 = { rounds: 1, best: 90 };
  const notices = [];
  const badges = new Badges({
    slots: { current: () => player, save() {} },
    stops: () => stops,
    notify: (id) => notices.push(id),
  });
  const announced = badges.evaluate({});
  assert.equal(announced.includes("first-stop"), false);
  assert.ok(player.badges["first-stop"]);
  assert.deepEqual(notices, ["three-stars"]);
});
