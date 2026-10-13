const { test: base, expect } = require('@playwright/test');
const { classifyRequest } = require('./network-policy.cjs');

/** Every test gets a clean context from Playwright. No real feedback reaches Drive. */
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
