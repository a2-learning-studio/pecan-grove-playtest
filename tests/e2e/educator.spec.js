const { test, expect } = require('./fixtures');
const AxeBuilder = require('@axe-core/playwright').default;

// The printable educator sheets ship beside the game in every build.
for (const { lang, file, game } of [
  { lang: 'en', file: 'educator.html', game: 'index.html' },
  { lang: 'es', file: 'educador.html', game: 'espanol.html' },
]) {
  test(`${lang}: educator sheet loads cleanly, is accessible and links back to the game`, async ({ page, noNetwork }) => {
    await page.goto(`/${file}`);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator(`a[href="${game}"]`)).toBeVisible();
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    noNetwork.assertClean();
    expect(noNetwork.consoleProblems).toEqual([]);
  });

  test(`${lang}: educator sheet prints on one page before its sources`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Only Chromium can print to PDF in Playwright.');
    await page.goto(`/${file}`);
    const pages = async () => ((await page.pdf({ format: 'Letter', preferCSSPageSize: true })).toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    expect(await pages()).toBeGreaterThan(1);
    await page.evaluate(() => document.querySelector('.sources').remove());
    expect(await pages()).toBe(1);
  });
}
