// Inspect the rendered scene after its finite transition completes. Infinite
// decorative loops and paused animations are checked separately by motion tests.
function runningFiniteAnimations() {
  return document.getAnimations().filter(animation =>
    animation.playState === 'running' &&
    Number.isFinite(animation.effect?.getComputedTiming().endTime)
  ).map(animation => ({
    target: animation.effect?.target?.className || animation.effect?.target?.nodeName,
    currentTime: animation.currentTime,
    endTime: animation.effect.getComputedTiming().endTime
  }));
}
async function settleFiniteAnimations(page, expect) {
  await expect.poll(() => page.evaluate(runningFiniteAnimations), {
    timeout: 5000,
    message: 'The finite scene transition must finish before inspecting its rendered colors'
  }).toEqual([]);
}
async function accessibilityDiagnostics(page, violations) {
  const selectors = [...new Set(violations.flatMap(violation =>
    violation.nodes.flatMap(node => node.target).filter(target => typeof target === 'string')
  ))];
  return page.evaluate(selectors => selectors.map(selector => {
    let node;
    try { node = document.querySelector(selector); } catch { /* Axe may identify a shadow/frame path. */ }
    const ancestors = [];
    for (let current = node; current; current = current.parentElement) {
      const style = getComputedStyle(current);
      ancestors.push({tag: current.tagName, id: current.id, className: current.className,
        opacity: style.opacity, color: style.color, background: style.backgroundColor,
        fontWeight: style.fontWeight});
    }
    return {selector, ancestors, animations: document.getAnimations().filter(animation =>
      animation.playState === 'running'
    ).map(animation => ({target: animation.effect?.target?.className,
      currentTime: animation.currentTime, timing: animation.effect?.getComputedTiming(),
      keyframes: animation.effect?.getKeyframes()}))};
  }), selectors);
}
module.exports = { runningFiniteAnimations, settleFiniteAnimations, accessibilityDiagnostics };
