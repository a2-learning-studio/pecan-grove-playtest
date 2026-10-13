/* Serializable: Puppeteer evaluates this in the page without a module closure. */
export function stageReady({ mode, stopId = null }) {
  const root = document.getElementById("community-builders");
  const state = window.CommunityBuilders?.getState();
  if (
    !root ||
    !state ||
    state.mode !== mode ||
    root.getAttribute("aria-busy") === "true" ||
    root.dataset.sceneLayout === "pending" ||
    root.hasAttribute("inert")
  )
    return false;
  if (stopId && state.stopId !== stopId) return false;
  if (mode === "map" && root.querySelector('[data-map-layout="pending"]'))
    return false;
  return true;
}

export function inspectStep(step, { language, run }) {
  const lhr = step.lhr,
    failures = [];
  if (lhr.runtimeError) failures.push(lhr.runtimeError.message);
  const mode = lhr.gatherMode;
  if (!["snapshot", "timespan"].includes(mode))
    failures.push("Unexpected gather mode: " + mode);
  for (const category of ["accessibility", "best-practices"]) {
    const score = lhr.categories?.[category]?.score;
    if (mode === "snapshot" && typeof score !== "number")
      failures.push("Missing " + category + " score");
    else if (typeof score === "number" && score < 1)
      failures.push(category + " " + score);
  }
  const tbt = lhr.audits?.["total-blocking-time"]?.numericValue;
  const cls = lhr.audits?.["cumulative-layout-shift"]?.numericValue;
  if (mode === "timespan") {
    if (!Number.isFinite(tbt)) failures.push("Missing timespan TBT");
    if (!Number.isFinite(cls)) failures.push("Missing timespan CLS");
  }
  if (typeof tbt === "number" && tbt > 50) failures.push("TBT " + tbt + "ms");
  if (typeof cls === "number" && cls > 0) failures.push("CLS " + cls);
  return {
    language,
    run,
    screen: step.name,
    gatherMode: mode,
    tbt: tbt ?? null,
    cls: cls ?? null,
    accessibility: lhr.categories?.accessibility?.score ?? null,
    bestPractices: lhr.categories?.["best-practices"]?.score ?? null,
    failures,
  };
}
