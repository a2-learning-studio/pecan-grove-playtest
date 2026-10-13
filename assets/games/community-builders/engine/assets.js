/* Only the game's same-origin authored stop and voice scripts may reach a script URL sink. */
const policies = new WeakMap();
function trustedURL(window, value, worker) {
  const verify = (source, allowWorker = true) => {
    const url = new window.URL(source, window.location.href);
    const serviceWorker = new window.URL(
      "sw.js",
      window.document?.baseURI || window.location.href,
    );
    if (
      url.origin !== window.location.origin ||
      (!(allowWorker && url.href === serviceWorker.href) &&
        !/\/assets\/games\/community-builders\/(?:stops\/[\w.-]+|voice\/index(?:\.[\w-]+)?)\.js$/.test(
          url.pathname,
        ))
    ) {
      throw new TypeError("Only local game scripts may be loaded");
    }
    return source;
  };
  const source = verify(String(value), worker);
  if (
    worker &&
    new window.URL(source, window.location.href).href !==
      new window.URL("sw.js", window.document?.baseURI || window.location.href)
        .href
  )
    throw new TypeError("Only the scoped game worker may be registered");
  if (!window.trustedTypes) return source;
  let policy = policies.get(window);
  if (!policy) {
    policy = window.trustedTypes.createPolicy("pg-svg", {
      createScriptURL: (source) => verify(source, true),
    });
    policies.set(window, policy);
  }
  return policy.createScriptURL(source);
}
export const trustedScriptURL = (window, value) =>
  trustedURL(window, value, false);
export const trustedWorkerURL = (window, value) =>
  trustedURL(window, value, true);
