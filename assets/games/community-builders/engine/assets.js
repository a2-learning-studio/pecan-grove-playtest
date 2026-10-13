/* Only the game's same-origin authored stop and voice scripts may reach a script URL sink. */
const policies = new WeakMap();
export function trustedScriptURL(window, value) {
  const verify = (source) => {
    const url = new window.URL(source, window.location.href);
    if (
      url.origin !== window.location.origin ||
      !/\/assets\/games\/community-builders\/(?:stops\/[\w.-]+|voice\/index(?:\.[\w-]+)?)\.js$/.test(
        url.pathname,
      )
    ) {
      throw new TypeError("Only local game scripts may be loaded");
    }
    return source;
  };
  const source = verify(String(value));
  if (!window.trustedTypes) return source;
  let policy = policies.get(window);
  if (!policy) {
    policy = window.trustedTypes.createPolicy("pg-svg", {
      createScriptURL: verify,
    });
    policies.set(window, policy);
  }
  return policy.createScriptURL(source);
}
