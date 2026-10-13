// Capture the visit before the target handler runs. The recorder is a capture
// listener, so model changes are accepted only in a post-dispatch event task.
export function captureActionSave(ctx) {
  if (!playing(ctx)) return null;
  const controller = ctx.activeController;
  return {
    controller,
    lifecycle: ctx.activeLifecycle,
    stopId: ctx.feedbackStop,
    slot: ctx.store.current,
    state: controller?.snapshot ? JSON.stringify(controller.snapshot()) : null,
  };
}

function playing(ctx) {
  return (
    !ctx.restoring &&
    !ctx.gamePaused &&
    ctx.mode === "stop" &&
    ctx.inStop &&
    ctx.feedbackScore === null
  );
}

export function saveAcceptedAction(ctx, visit, event, domChanged) {
  if (
    !visit ||
    event.defaultPrevented ||
    !playing(ctx) ||
    ctx.activeController !== visit.controller ||
    ctx.activeLifecycle !== visit.lifecycle ||
    ctx.feedbackStop !== visit.stopId ||
    ctx.store.current !== visit.slot
  )
    return false;
  const changed = visit.controller?.snapshot
    ? JSON.stringify(visit.controller.snapshot()) !== visit.state
    : domChanged;
  if (!changed) return false;
  ctx.emit("cb:step", { snapshot: ctx.snapshot() });
  return true;
}

// The debounce owns one active scene and player. Scene/phase changes cancel it;
// the final check also protects a player switch during the pending delay.
export function createProgressAutosave({
  root,
  core,
  slots,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) {
  let timer;
  function cancel() {
    clearTimer(timer);
    timer = null;
  }
  function schedule(record = core().snapshot?.()) {
    cancel();
    if (!record?.stopId) return;
    const visit = core().getState().visit;
    timer = setTimer(() => {
      timer = null;
      const state = core().getState();
      if (
        state.mode === "stop" &&
        state.inStop !== false &&
        !state.paused &&
        !state.restoring &&
        state.visit === visit &&
        root.dataset.feedbackPhase === "playing" &&
        state.stopId === record.stopId &&
        state.store.current === record.slot &&
        state.session === record.session
      )
        slots.resume(record);
    }, 50);
  }
  return { schedule, cancel };
}
