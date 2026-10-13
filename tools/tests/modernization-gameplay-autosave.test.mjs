import test from "node:test";
import assert from "node:assert/strict";
import { setTimeout as sleep } from "node:timers/promises";
import { mountedGame, until } from "./modernization-mounted-game-fixture.mjs";

const clone = (value) => JSON.parse(JSON.stringify(value));
function click(r, selector) {
  const button = r.main().querySelector(selector);
  assert.ok(button, "The real game control exists: " + selector);
  assert.equal(button.disabled, false);
  button.click();
}
async function begin(r, n) {
  r.core.enterPlay({ quiet: true });
  assert.equal(r.core.getState().mode, "title");
  await r.core.startStop(r.core.getAPI().STOPS[n - 1].id);
  click(r, ".cb-btn--go");
  await until(() => {
    const state = r.storedPlayer().resume?.state;
    return state && state.screenKey !== "intro";
  }, "The actual mounted engine persists the initial play screen");
}
async function findSix(r) {
  click(r, '[data-view="today"]');
  await until(
    () => r.storedPlayer().resume?.state.seenToday === true,
    "Today must save without changing screens or calling api.save",
  );
  assert.equal(r.storedPlayer().resume.state.view, "today");
  const signs = r.w.__stopTestFlow.spots.filter((spot) => spot.item.sign);
  assert.equal(signs.length, 6);
  for (const [i, spot] of signs.entries()) {
    click(r, '[data-spot="' + spot.i + '"]');
    await until(
      () => r.storedPlayer().resume?.state.found.length === i + 1,
      "Finding " + (i + 1) + " must persist before another screen",
    );
    assert.equal(r.storedPlayer().resume.state.screenKey, "look");
  }
  return clone(r.core.snapshot().state);
}
async function continueReload(language, saved, expected) {
  const r = await mountedGame(language, saved);
  try {
    r.core.enterPlay({ quiet: true });
    const button = r.main().querySelector(".cb-continue");
    assert.ok(button, "The real title shows Continue from durable storage");
    button.click();
    await until(
      () =>
        r.core.getState().mode === "stop" &&
        r.core.snapshot().state.screenKey === expected.screenKey,
      "Continue must restore the stored authored phase",
    );
    assert.deepEqual(clone(r.core.snapshot().state), expected);
    assert.equal(r.runtimeErrors.length, 0, String(r.runtimeErrors));
    assert.equal(r.errors.length, 0, String(r.errors));
  } finally {
    r.close();
  }
}

for (const language of ["en", "es"]) {
  test(
    language +
      " Stop 1 incremental Today and six findings survive actual title Continue",
    async () => {
      const r = await mountedGame(language);
      let saved, expected;
      try {
        await begin(r, 1);
        expected = await findSix(r);
        saved = r.persisted();
        assert.deepEqual(clone(r.storedPlayer().resume.state), expected);
        assert.deepEqual(Object.keys(r.storedPlayer().stops), []);
        assert.equal(r.runtimeErrors.length, 0, String(r.runtimeErrors));
      } finally {
        r.close();
      }
      await continueReload(language, saved, expected);
    },
  );

  test(
    language +
      " Stop 2 partial question and assessment survive actual title Continue",
    async () => {
      const r = await mountedGame(language);
      let saved, expected;
      try {
        await begin(r, 2);
        for (const row of ["start", "topic", "detail"])
          click(r, '.cb-s02-tile[data-row="' + row + '"]');
        click(r, ".cb-s02-ask");
        await until(
          () => r.storedPlayer().resume?.state.answers.length === 1,
          "The first assessed answer must persist without a new screen",
        );
        assert.equal(r.storedPlayer().resume.state.screenKey, "answer");
        click(r, ".cb-btn--go");
        click(r, '.cb-s02-tile[data-row="start"]');
        click(r, '.cb-s02-tile[data-row="topic"]');
        expected = clone(r.core.snapshot().state);
        await until(
          () =>
            JSON.stringify(r.storedPlayer().resume?.state) ===
            JSON.stringify(expected),
          "An unfinished second question must persist after the selected tiles",
        );
        assert.equal(expected.wi, 1);
        assert.equal(expected.answers.length, 1);
        saved = r.persisted();
        assert.equal(r.runtimeErrors.length, 0, String(r.runtimeErrors));
      } finally {
        r.close();
      }
      await continueReload(language, saved, expected);
    },
  );

  test(
    language +
      " completed Stop 1 deletes durable resume and pending actions cannot resurrect it",
    async () => {
      const r = await mountedGame(language);
      let saved;
      try {
        await begin(r, 1);
        await findSix(r);
        click(r, ".cb-btn--go");
        await until(
          () =>
            r.main().querySelector(".cb-board--result") &&
            !r.storedPlayer().resume,
          "Finishing must delete the actual durable resume record",
        );
        const stopId = r.core.getAPI().STOPS[0].id;
        assert.equal(r.storedPlayer().stops[stopId].rounds, 1);
        await sleep(100); // Cross the actual 50ms debounce after the terminal action.
        assert.equal(r.storedPlayer().resume, undefined);
        saved = r.persisted();
      } finally {
        r.close();
      }
      const reloaded = await mountedGame(language, saved);
      try {
        reloaded.core.enterPlay({ quiet: true });
        click(reloaded, ".cb-continue");
        await until(
          () => reloaded.core.getState().mode === "map",
          "Continue must open the journey after completion",
        );
        assert.equal(reloaded.main().querySelector(".cb-board--result"), null);
        assert.equal(reloaded.storedPlayer().resume, undefined);
        assert.equal(
          reloaded.runtimeErrors.length,
          0,
          String(reloaded.runtimeErrors),
        );
        assert.equal(reloaded.errors.length, 0, String(reloaded.errors));
      } finally {
        reloaded.close();
      }
    },
  );
}
