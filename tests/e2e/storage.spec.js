const { test, expect } = require('./fixtures');

// Saves, storage and tabs. Each case gets a fresh context; a second tab shares its storage.
const PLAYER = /^Player [0-9A-F]{6}$/;
async function ready(page, file = 'index.html') {
  await page.goto(`/${file}?seed=42`);
  await expect(page.locator('#community-builders')).toHaveAttribute('data-engine-mounted', 'true');
  await page.locator('#pt-feedback-save-draft').waitFor({ state: 'attached' });
}
const code = page => page.locator('#pt-feedback-player').textContent();

test('New player starts a fresh player while another tab is open on the same player', async ({ page, context }) => {
  await context.route(/^https:\/\/script\.google(?:usercontent)?\.com\//, route => route.abort());
  const other = await context.newPage();
  await ready(page); await ready(other);
  const before = await code(page);
  expect(before).toMatch(PLAYER);
  await expect(other.locator('#pt-feedback-player')).toHaveText(before);
  await page.bringToFront();
  await page.locator('#pt-feedback-new-player-top').click();
  await page.locator('#pt-new-player-confirm').click();
  // The other tab hears about it and must not write the old player back. Tabs share storage a
  // moment late, so this can only sometimes catch a regression; the unit test models it exactly.
  await expect(page.locator('#pt-feedback-player')).not.toHaveText(before);
  await expect(page.locator('#pt-feedback-player')).toHaveText(PLAYER);
  await expect(other.locator('#pt-feedback-player')).not.toHaveText(before);
  await expect(other.locator('#pt-feedback-player')).toHaveText(PLAYER);
  await page.waitForTimeout(500);
  const after = await code(page);
  expect(after, 'This tab starts a new player').not.toBe(before);
  const active = await page.evaluate(() => JSON.parse(localStorage.getItem('pecan-grove-feedback-v1')).activeSession.slice(-6).toUpperCase());
  expect(after).toBe(`Player ${active}`);
  await expect(other.locator('#pt-feedback-player')).toHaveText(after);
  await other.close();
});

test("two tabs on one player keep each other's finished stops", async ({ page, context }) => {
  const other = await context.newPage();
  await ready(page); await ready(other);
  const [first, second] = await page.evaluate(() => window.CommunityBuilders.getAPI().STOPS.slice(0, 2).map(stop => stop.id));
  // Finish a round in each tab through the same API the stops use.
  await page.evaluate(id => window.CommunityBuilders.getAPI().saveRound(id, 80, {}), first);
  await expect.poll(() => other.evaluate(id => {
    const store = window.CommunityBuilders.getState().store;
    return !!store.players[store.current].stops[id];
  }, first), 'The other tab hears about the finished stop').toBe(true);
  await other.evaluate(id => window.CommunityBuilders.getAPI().saveRound(id, 70, {}), second);
  await expect.poll(() => page.evaluate(([a, b]) => {
    const saved = JSON.parse(localStorage.getItem(window.CommunityBuilders.getState().storageKey));
    const player = saved.players[saved.current];
    return [player.stops[a] && player.stops[a].best, player.stops[b] && player.stops[b].best];
  }, [first, second])).toEqual([80, 70]);
  await other.close();
});

test('blocked site data still starts the game, with one save notice', async ({ page }) => {
  await page.addInitScript(() => {
    for (const name of ['localStorage', 'sessionStorage']) {
      try {
        Object.defineProperty(window, name, { configurable: true, get() { throw new DOMException('The operation is insecure.', 'SecurityError'); } });
      } catch (_) { /* checked below */ }
    }
  });
  await page.goto('/index.html?seed=42');
  const blocked = await page.evaluate(() => { try { void window.localStorage; return false; } catch (_) { return true; } });
  test.skip(!blocked, 'This browser does not let a page script stand in for blocked site data');
  await expect(page.locator('#community-builders')).toHaveAttribute('data-engine-mounted', 'true');
  await expect(page.locator('#pt-start')).toBeEnabled();
  await expect(page.locator('#pt-feedback-new-player-top')).toBeEnabled();
  await page.locator('#pt-quiet').check();
  await page.locator('#pt-start').click();
  await expect(page.locator('.cb-hero')).toBeVisible();
  const notices = page.locator('.cb-engine-save-warning, .cb-storage-warning');
  await expect(notices).toHaveCount(1);
  await expect(notices).toHaveText(/cannot save your progress/);
  const words = await page.evaluate(() => window.PecanGroveEngine.i18n.messages);
  await page.locator('.cb-engine-title-actions').getByRole('button', { name: words.newGame, exact: true }).click();
  await page.locator('dialog[open] .cb-engine-slot-pick').first().click();
  await expect(page.locator('.cb-world__pan')).toBeVisible();
  await expect(notices).toHaveCount(1);
});

test('blocked site data: Next player asks first, then the next player starts with nothing kept', async ({ page }) => {
  await page.addInitScript(() => {
    for (const name of ['localStorage', 'sessionStorage']) {
      try {
        Object.defineProperty(window, name, { configurable: true, get() { throw new DOMException('The operation is insecure.', 'SecurityError'); } });
      } catch (_) { /* checked below */ }
    }
  });
  await page.goto('/index.html?seed=42');
  const blocked = await page.evaluate(() => { try { void window.localStorage; return false; } catch (_) { return true; } });
  test.skip(!blocked, 'This browser does not let a page script stand in for blocked site data');
  await expect(page.locator('#community-builders')).toHaveAttribute('data-engine-mounted', 'true');
  await page.locator('#pt-feedback-save-draft').waitFor({ state: 'attached' });
  const before = await code(page);
  await page.evaluate(() => { const fix = document.getElementById('pt-feedback-fix'); fix.value = 'never saved anywhere'; fix.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(page.locator('#pt-feedback-status')).toContainText('not saving anything on this device');
  await page.locator('#pt-quiet').check();
  await page.locator('#pt-start').click();
  await expect(page.locator('.cb-hero')).toBeVisible();
  await page.evaluate(() => { const api = window.CommunityBuilders.getAPI(); api.saveRound(api.STOPS[0].id, 90, {}); });
  await page.locator('#pt-exit').click();
  await page.locator('#pt-feedback-new-player-top').click();
  await expect(page.locator('#pt-new-player-dialog')).toBeVisible();
  await expect(page.locator('#pt-new-player-cancel')).toBeFocused();
  await expect(page.locator('#pt-new-player-message')).toContainText("not saving anything on this device, so this player's game and notes will be gone");
  const reloaded = page.waitForEvent('load');
  await page.locator('#pt-new-player-confirm').click();
  await reloaded;
  await expect(page.locator('#community-builders')).toHaveAttribute('data-engine-mounted', 'true');
  await page.locator('#pt-feedback-save-draft').waitFor({ state: 'attached' });
  await expect(page.locator('#pt-feedback-player')).toHaveText(PLAYER);
  expect(await code(page), 'a new player with a new code').not.toBe(before);
  await expect(page.locator('#pt-feedback-fix')).toHaveValue('');
  expect(await page.evaluate(() => { const store = window.CommunityBuilders.getState().store; return Object.keys(store.players[store.current].stops); })).toEqual([]);
});

test('storage that fills after the first save: Next player says so and erases this device\'s Pecan Grove data to start over', async ({ page }) => {
  await page.addInitScript(() => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) { if (window.__full) throw new DOMException('full', 'QuotaExceededError'); return set.call(this, key, value); };
  });
  await ready(page);
  const before = await code(page);
  const note = text => page.evaluate(value => { const worked = document.getElementById('pt-feedback-worked'); worked.value = value; worked.dispatchEvent(new Event('input', { bubbles: true })); document.getElementById('pt-feedback-save-draft').click(); }, text);
  await note('saved before the storage filled');
  await page.evaluate(() => { window.__full = true; });
  await note('typed after it filled');
  await expect(page.locator('#pt-feedback-status')).toContainText('cannot save feedback on this device right now');
  await page.locator('#pt-feedback-new-player-top').click();
  await expect(page.locator('#pt-new-player-dialog')).toBeVisible();
  await expect(page.locator('#pt-new-player-cancel')).toBeFocused();
  await expect(page.locator('#pt-new-player-message')).toContainText("You can erase this device's Pecan Grove data and start over.");
  await expect(page.locator('#pt-new-player-confirm')).toHaveText('Erase and start over');
  const reloaded = page.waitForEvent('load');
  await page.locator('#pt-new-player-confirm').click();
  await reloaded;
  await expect(page.locator('#community-builders')).toHaveAttribute('data-engine-mounted', 'true');
  await page.locator('#pt-feedback-save-draft').waitFor({ state: 'attached' });
  expect(await code(page), 'a new player with a new code').not.toBe(before);
  await expect(page.locator('#pt-feedback-worked')).toHaveValue('');
  expect(await page.evaluate(() => Object.values(localStorage).join(''))).not.toContain('storage filled');
});

test('a grown-up saves a progress file and opens it on another device', async ({ page, browser, baseURL }) => {
  const AxeBuilder = require('@axe-core/playwright').default;
  async function grownups(target) {
    await target.locator('#pt-quiet').check();
    await target.locator('#pt-start').click();
    await expect(target.locator('.cb-hero')).toBeVisible();
    // Start opens native fullscreen. Firefox and Safari keep the first Escape to leave it, so the Escape below
    // would never reach For grown-ups; leave fullscreen first, as a grown-up's first Escape would.
    await target.evaluate(async () => {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if ((document.fullscreenElement || document.webkitFullscreenElement) && exit) await exit.call(document);
    });
    await expect.poll(() => target.evaluate(() => !!(document.fullscreenElement || document.webkitFullscreenElement))).toBe(false);
    await target.locator('.cb-hero .cb-btn--onstage').click();
    await expect(target.locator('dialog[open] .cb-progress-file')).toBeVisible();
    return target.locator('dialog[open] .cb-progress-file');
  }
  await ready(page);
  const first = await page.evaluate(() => {
    const api = window.CommunityBuilders.getAPI(), id = api.STOPS[0].id;
    api.saveRound(id, 90, {});
    return id;
  });
  const box = await grownups(page);
  const results = await new AxeBuilder({ page }).include('dialog[open]').analyze();
  expect(results.violations).toEqual([]);
  const [download] = await Promise.all([page.waitForEvent('download'), box.getByRole('button', { name: 'Save progress file' }).click()]);
  expect(download.suggestedFilename()).toMatch(/^pecan-grove-progress-\d{4}-\d\d-\d\d\.json$/);
  const file = await download.path();
  const saved = JSON.parse(require('node:fs').readFileSync(file, 'utf8'));
  expect(saved).toMatchObject({ format: 'pecan-grove-progress', version: 1 });
  expect(Object.values(saved.players)[0].stops[first]).toMatchObject({ stop: 1, best: 90, rounds: 1 });
  await expect(box.getByRole('status')).toHaveText(/Progress file saved/);

  // Another device: a fresh browser profile with no saves.
  const elsewhere = await browser.newContext({ baseURL });
  await elsewhere.route(/^https:\/\/script\.google(?:usercontent)?\.com\//, route => route.abort());
  const other = await elsewhere.newPage();
  await ready(other, 'espanol.html');
  const otherBox = await grownups(other);
  await otherBox.locator('input[type=file]').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"other"}') });
  await expect(otherBox.getByRole('status')).toHaveText(/No cambió nada/);
  await otherBox.locator('input[type=file]').setInputFiles(file);
  await expect(otherBox.getByRole('status')).toHaveText(/Archivo de progreso abierto/);
  await other.keyboard.press('Escape');
  await expect(other.locator('.cb-continue small')).toHaveText(/3 estrellas/);
  await elsewhere.close();
});
