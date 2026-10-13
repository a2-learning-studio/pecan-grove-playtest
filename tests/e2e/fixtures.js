const { test: base, expect } = require('@playwright/test');
const { classifyRequest } = require('./network-policy.cjs');

/** Every test gets a clean context from Playwright. No real feedback reaches Drive. */
const test = base.extend({
  allowFeedback: [false, { option: true }],
  noNetwork: [async ({ page, allowFeedback }, use) => {
    const unexpected = [], requests = [], receiverRequests = [], consoleProblems = [];
    let loaded = false;
    page.on('domcontentloaded', () => { loaded = true; });
    page.on('request', request => {
      let origin; try { origin = new URL(page.url()).origin; } catch (_) { origin = ''; }
      const { recorded, receiver, unexpected: rejected } = classifyRequest(request.url(), origin, { loaded, allowFeedback });
      if (!recorded) return;
      requests.push(request);
      if (receiver) receiverRequests.push(request);
      if (rejected) unexpected.push(request.url());
    });
    page.on('pageerror', error => consoleProblems.push(error.message));
    page.on('console', message => { if (['error', 'warning'].includes(message.type())) consoleProblems.push(message.text()); });
    await use({ requests, receiverRequests, consoleProblems, assertClean: () => expect(unexpected, 'No unapproved external receiver/network requests').toEqual([]) });
    expect(unexpected, 'No unapproved external receiver/network requests').toEqual([]);
    expect(consoleProblems, 'Every browser scenario must finish without console warnings, errors or page errors').toEqual([]);
  }, { auto: true }]
});
module.exports = { test, expect };
