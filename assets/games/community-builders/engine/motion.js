let settings = () => ({});
let media = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
export function configureMotion(
  getSettings,
  matchMedia = globalThis.matchMedia?.bind(globalThis),
) {
  settings = getSettings || settings;
  media = matchMedia?.("(prefers-reduced-motion: reduce)");
}
export const motion = {
  allowed() {
    return !(media?.matches || settings().calm);
  },
  duration(ms) {
    return this.allowed() ? ms : Math.min(ms, 120);
  },
  get reduced() {
    return !this.allowed();
  },
};
export function REDUCED() {
  return motion.reduced;
}
