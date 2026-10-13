/* One stop visit owns its listeners, subscriptions and pausable clocks. */
export function createLifecycle({
  root,
  document = globalThis.document,
  window = globalThis.window,
  definitionOnly = false,
  isRestoring = () => false,
  isReplaying = isRestoring,
  replayClock = () => 0,
}) {
  let listeners = [],
    cleanups = [],
    nextTask = 0;
  const tasks = new Map();
  const animations = new Set();
  let suspended = false,
    disposed = false,
    pausedAt = 0,
    pausedDuration = 0;
  const now = () => window.Date.now();
  const clock = () =>
    isReplaying()
      ? replayClock()
      : now() - pausedDuration - (suspended ? now() - pausedAt : 0);
  function facade(target) {
    return new Proxy(target, {
      set(object, key, value) {
        // Native DOM setters, such as Document.title, require their real receiver.
        return Reflect.set(object, key, value, object);
      },
      get(object, key) {
        if (key === "addEventListener")
          return (type, callback, options) => {
            if (definitionOnly || disposed) return;
            const guarded = (event) => {
              if (
                suspended ||
                disposed ||
                (type === "keydown" &&
                  root.getAttribute("data-engine-input") === "true")
              )
                return;
              callback.call(object, event);
            };
            listeners.push({ object, type, callback, guarded, options });
            object.addEventListener(type, guarded, options);
          };
        if (key === "removeEventListener")
          return (type, callback, options) => {
            listeners = listeners.filter((item) => {
              if (
                item.object !== object ||
                item.type !== type ||
                item.callback !== callback
              )
                return true;
              object.removeEventListener(type, item.guarded, item.options);
              return false;
            });
            object.removeEventListener(type, callback, options);
          };
        const value = object[key];
        return typeof value === "function" ? value.bind(object) : value;
      },
    });
  }
  function cancel(id) {
    const task = tasks.get(id);
    if (!task) return;
    (task.frame ? window.cancelAnimationFrame : window.clearTimeout).call(
      window,
      task.native,
    );
    tasks.delete(id);
  }
  function schedule(callback, delay, frame) {
    if (definitionOnly || disposed) return 0;
    const id = ++nextTask;
    const task = {
      callback,
      remaining: Math.max(0, Number(delay) || 0),
      frame,
    };
    tasks.set(id, task);
    task.arm = () => {
      task.at = now();
      const run = (time) => {
        if (disposed || suspended) return;
        tasks.delete(id);
        callback(
          frame && typeof time === "number" ? time - pausedDuration : time,
        );
      };
      task.native = frame
        ? window.requestAnimationFrame(run)
        : window.setTimeout(run, isReplaying() ? 0 : task.remaining);
    };
    if (!suspended) task.arm();
    return id;
  }
  return {
    document: facade(document),
    window: facade(window),
    Date: new Proxy(window.Date, {
      get: (object, key) => (key === "now" ? clock : object[key]),
    }),
    setTimeout: (fn, ms) => schedule(fn, ms, false),
    clearTimeout: cancel,
    requestAnimationFrame: (fn) => schedule(fn, 0, true),
    cancelAnimationFrame: cancel,
    animation(value) {
      if (!value) return value;
      if (disposed || definitionOnly) value.cancel?.();
      else {
        animations.add(value);
        if (suspended) value.pause?.();
        value.finished?.then(
          () => animations.delete(value),
          () => animations.delete(value),
        );
      }
      return value;
    },
    cleanup(fn) {
      if (typeof fn !== "function") return fn;
      if (disposed || definitionOnly) fn();
      else cleanups.push(fn);
      return fn;
    },
    pause() {
      if (disposed || suspended) return;
      pausedAt = now();
      suspended = true;
      for (const animation of animations) animation.pause?.();
      for (const task of tasks.values()) {
        (task.frame ? window.cancelAnimationFrame : window.clearTimeout).call(
          window,
          task.native,
        );
        task.remaining = Math.max(0, task.remaining - (now() - task.at));
      }
    },
    resume() {
      if (disposed || !suspended) return;
      pausedDuration += now() - pausedAt;
      suspended = false;
      for (const animation of animations) animation.play?.();
      for (const task of tasks.values()) task.arm();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const item of listeners)
        item.object.removeEventListener(item.type, item.guarded, item.options);
      listeners = [];
      for (const id of tasks.keys()) cancel(id);
      for (const animation of animations) animation.cancel?.();
      animations.clear();
      for (const fn of cleanups) fn();
      cleanups = [];
    },
  };
}
