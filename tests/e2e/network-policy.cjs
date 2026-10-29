/** Shared by the browser fixture and the actual legacy-mount regression proof. */
function isReceiver(value) {
  const url = new URL(value);
  return /^https?:$/.test(url.protocol) && (url.pathname.includes('/macros/') || /(^|\.)script\.google(?:usercontent)?\.com$/.test(url.hostname));
}
function classifyRequest(value, origin, { loaded = false, allowFeedback = false } = {}) {
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol)) return { recorded: false, receiver: false, unexpected: false };
  const receiver = isReceiver(url);
  // Receiver traffic counts even when deferred mount code runs before DOMContentLoaded.
  if (!loaded && !receiver) return { recorded: false, receiver: false, unexpected: false };
  return { recorded: true, receiver, unexpected: (receiver && !allowFeedback) || (!receiver && url.origin !== origin) };
}
module.exports = { classifyRequest, isReceiver };
