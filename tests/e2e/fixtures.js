const { test: base, expect } = require('@playwright/test');
const { classifyRequest, isReceiver } = require('./network-policy.cjs');

// Firefox warns "Layout was forced before the page was fully loaded" when Playwright itself measures a page that is
// still loading: the trace snapshotter ('retain-on-failure') runs around every action, so the click that makes the game
// reload (Next player, Erase, bringing a player back) can land its snapshot in the new page while it is still loading.
// With --trace off the same tests log nothing. Playwright's code runs as "debugger eval code"; the game's own
// scripts never do, so a layout the game forces early still fails every test.
const playwrightLayoutWarning = message => message.type() === 'warning'
  && message.location().url === 'debugger eval code'
  && message.text().includes('Layout was forced before the page was fully loaded');

/** Every test gets a clean context; explicit transport supplies its own isolated mock. */
const test = base.extend({
  allowFeedback: [false, { option: true }],
  noNetwork: [async ({ page, allowFeedback, baseURL }, use) => {
    const unexpected = [], requests = [], receiverRequests = [], consoleProblems = [];
    // A navigation request can fire while page.url() is still about:blank (or
    // while reloading another document). The configured server is authoritative.
    const origin = new URL(baseURL).origin;
    await page.addInitScript(() => {
      window.__pgCspViolations = [];
      document.addEventListener('securitypolicyviolation', event => {
        window.__pgCspViolations.push({
          time: performance.now(), directive: event.effectiveDirective,
          blockedURI: event.blockedURI, sourceFile: event.sourceFile,
          lineNumber: event.lineNumber, columnNumber: event.columnNumber,
          sample: event.sample
        });
      });
    });
    // No browser test may reach a feedback receiver, even when CI tests a build that names one. Every receiver
    // request is aborted here; a test that approves transport installs its own mock later, which runs first.
    // The request listener below still records each attempt, and the assertions fail unapproved ones.
    await page.context().route(isReceiver, route => route.abort('blockedbyclient'));
    let loaded = false;
    page.on('domcontentloaded', () => { loaded = true; });
    page.on('request', request => {
      const { recorded, receiver, unexpected: rejected } = classifyRequest(request.url(), origin, { loaded, allowFeedback });
      if (!recorded) return;
      requests.push(request);
      if (receiver) receiverRequests.push(request);
      if (rejected) unexpected.push(request.url());
    });
    page.on('pageerror', error => consoleProblems.push({
      type: 'pageerror', text: error.message, stack: error.stack, time: Date.now()
    }));
    page.on('console', message => {
      if (playwrightLayoutWarning(message)) return;
      if (['error', 'warning'].includes(message.type())) consoleProblems.push({
        text: message.text(), location: message.location(), time: Date.now()
      });
    });
    await use({ requests, receiverRequests, consoleProblems, assertClean: () => expect(unexpected, 'No unapproved external receiver/network requests').toEqual([]) });
    expect(unexpected, 'No unapproved external receiver/network requests').toEqual([]);
    const policyViolations = await page.evaluate(() => window.__pgCspViolations || []);
    expect({consoleProblems,policyViolations}, 'Every browser scenario must finish without console warnings, errors, page errors or CSP violations').toEqual({consoleProblems:[],policyViolations:[]});
  }, { auto: true }]
});
module.exports = { test, expect };
