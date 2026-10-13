import { h, button, icon } from "./dom.js";
import { I18n } from "./i18n.js";
import { Input } from "./input.js";
import { Focus } from "./focus.js";
import { Gamepad } from "./gamepad.js";
import { Settings } from "./settings.js";
import { Pause } from "./pause.js";
import { AudioMixer } from "./audio.js";
import { FX } from "./fx.js";
import { Hints } from "./hints.js";
import { Slots, slotStars, resumable } from "./store.js";
import { Badges, BADGE_IDS } from "./badges.js";
import { Gestures } from "./gestures.js";
import { HUD } from "./hud.js";
import { motion, configureMotion } from "./motion.js";

export async function mount(
  root = document.getElementById("community-builders"),
) {
  if (!root || root.dataset.engineMounted) return globalThis.PecanGroveEngine;
  const core = () => globalThis.CommunityBuilders;
  if (!core()?.getState || !core()?.getAPI) return null;
  const i18n = new I18n(document.documentElement.lang);
  await i18n.load();
  root.dataset.engineMounted = "true";
  const state = () => core().getState();
  const api = () => core().getAPI();
  const focus = new Focus(root);
  let settings;
  const audio = new AudioMixer({ settings: () => settings?.get() });
  const fx = new FX(root);
  const input = new Input({
    root,
    scope: () => focus.active(),
    settings: () => settings?.get() || {},
  });
  settings = new Settings({
    root,
    i18n,
    input,
    focus,
    core,
    audio,
    onChange: () => {
      hints.render();
      configureMotion(() => settings.get());
    },
  });
  configureMotion(() => settings.get());
  const slots = new Slots({ state });
  slots.store();
  slots.save();
  const toastHost = h("div", {
    class: "cb-engine-toast-host",
    "data-cb-novoice": "",
  });
  root.append(toastHost);
  const toastQueue = [];
  let toastTimer = 0;
  function toast(text, badgeId) {
    toastQueue.push({ text, badgeId });
    showToast();
  }
  function showToast() {
    if (toastTimer || !toastQueue.length) return;
    const next = toastQueue.shift();
    const card = h("div", { class: "cb-engine-toast", role: "status" }, [
      icon(next.badgeId ? "badge" : "check"),
      h("span", { text: next.text }),
    ]);
    toastHost.append(card);
    if (next.badgeId) {
      audio.play("badge");
      const r = card.getBoundingClientRect();
      fx.burst(r.left + r.width / 2, r.top + r.height / 2, { kind: "pecans" });
    }
    toastTimer = setTimeout(() => {
      card.remove();
      toastTimer = 0;
      showToast();
    }, 4000);
  }
  function openDialog(title, children, opener = document.activeElement) {
    const d = h("dialog", {
      class: "cb-engine-dialog",
      "aria-label": title,
      "data-cb-novoice": "",
    });
    d.append(
      h("div", { class: "cb-engine-dialog-head" }, [
        h("h2", { text: title }),
        button(i18n.t("close"), () => d.close()),
      ]),
      ...children,
    );
    root.append(d);
    d.addEventListener("close", () => {
      focus.pop(d);
      d.remove();
    });
    d.showModal();
    focus.push(d, opener);
    return d;
  }
  function openBadges(opener) {
    const earned = slots.current().badges;
    const grid = h("div", { class: "cb-engine-badge-grid" });
    for (const id of BADGE_IDS) {
      const entry = h(
        "article",
        { class: "cb-engine-badge" + (earned[id] ? " is-earned" : "") },
        [
          icon("badge"),
          h("h3", { text: i18n.t(id) }),
          h("p", { text: i18n.t(earned[id] ? "earned" : "badgeLocked") }),
        ],
      );
      grid.append(entry);
    }
    return openDialog(i18n.t("badges"), [grid], opener);
  }
  function resumeCurrent() {
    const record = slots.current().resume;
    if (resumable(record))
      core().resume?.({
        ...record,
        slot: slots.store().current,
      });
    else core().showMap?.();
  }
  function deleteSlot(id, dialog) {
    const row = h("div", { class: "cb-engine-slots" });
    let confirmation;
    for (const animal of api().ANIMALS) {
      const b = button(animal.name, () => {
        if (animal.id !== "turtle") return;
        slots.remove(id);
        confirmation.close();
        dialog.close();
        toast(i18n.t("slotDeleted"));
        const undo = button(i18n.t("undo"), () => {
          slots.undo();
          undo.remove();
          core().showMap?.();
        });
        toastHost.append(undo);
        core().showMap?.();
      });
      b.prepend(api().animalFace(animal));
      row.append(b);
    }
    confirmation = openDialog(i18n.t("delete"), [
      h("p", { text: i18n.t("deleteQuestion") }),
      row,
    ]);
  }
  function openSlots(opener, newOnly = false) {
    const store = slots.store(),
      grid = h("div", { class: "cb-engine-slots" });
    let dialog;
    const animals = api().ANIMALS;
    const placeholder = store.players.you;
    const emptyPlaceholder =
      placeholder &&
      !Object.keys(placeholder.stops || {}).length &&
      !Object.keys(placeholder.badges || {}).length &&
      !placeholder.resume;
    const full =
      Object.keys(store.players).length - (emptyPlaceholder ? 1 : 0) >= 8;
    const unused = full
      ? []
      : animals.filter((animal) => !store.players[animal.id]);
    if (newOnly && !unused.length)
      grid.append(h("p", { text: i18n.t("allSlots") }));
    const ids = newOnly
      ? unused.map((animal) => animal.id)
      : Object.keys(store.players);
    for (const id of ids) {
      const animal = animals.find((a) => a.id === id),
        player = store.players[id];
      const name = animal?.name || i18n.t("player1");
      const card = h("div", { class: "cb-engine-slot" });
      const b = button(
        name,
        () => {
          if (player) slots.select(id);
          else slots.create(id);
          dialog.close();
          resumeCurrent();
        },
        { class: "cb-btn cb-engine-slot-pick" },
      );
      if (animal) b.prepend(api().animalFace(animal));
      card.append(b);
      if (player) {
        card.append(
          h("p", {
            text: i18n.t("slotSummary", {
              stars: slotStars(player),
              badges: Object.keys(player.badges).length,
            }),
          }),
          h("p", { text: i18n.relative(player.updated) }),
          button(i18n.t("delete"), () => deleteSlot(id, dialog), {
            class: "cb-btn cb-btn--quiet",
          }),
        );
      }
      grid.append(card);
    }
    if (!newOnly)
      grid.append(
        button(i18n.t("newGame"), () => {
          dialog.close();
          openSlots(opener, true);
        }),
      );
    dialog = openDialog(
      i18n.t(newOnly ? "newGame" : "loadGame"),
      [grid],
      opener,
    );
    return dialog;
  }
  const pause = new Pause({
    root,
    focus,
    core,
    i18n,
    settings,
    fx,
    audio,
    onBadges: openBadges,
    onSlots: openSlots,
    onQuit: () => {
      const exit = document.getElementById("pt-exit");
      if (exit) exit.click();
      else core().showTitle?.();
    },
  });
  const pad = new Gamepad({
    input,
    settings: () => settings.get(),
    onConnect: (p) => {
      if (p.mapping !== "standard") toast(i18n.t("controllerBasic"));
    },
    onDisconnect: () => {
      if (state().mode === "stop") pause.open();
      toast(i18n.t("controllerDisconnected"));
    },
  });
  const hints = new Hints({
    root,
    input,
    i18n,
    settings: () => settings.get(),
    pad: () => pad.pad,
  });
  const gestures = new Gestures({ root, i18n, focus, core, settings });
  const badge = new Badges({
    slots,
    stops: () => api().STOPS,
    notify: (id) => toast(i18n.t("badgeUnlocked", { badge: i18n.t(id) }), id),
  });
  const hud = new HUD({
    root,
    core,
    slots,
    pause,
    i18n,
    onSlots: openSlots,
    onBadges: openBadges,
  });
  const engine = {
    input,
    focus,
    motion,
    audio,
    fx,
    pause,
    settings,
    store: slots,
    badge,
    hints: (items) => hints.set(items),
    hud,
    i18n,
    openSlots,
    openBadges,
  };
  globalThis.PecanGroveEngine = engine;
  root.dataset.engineInput = "true";
  for (const direction of ["up", "down", "left", "right"])
    input.on("nav." + direction, () => {
      const handled = focus.move(direction);
      if (handled) audio.play("ui.move");
      return handled;
    });
  input.on("confirm", () => {
    const handled = focus.confirm();
    if (handled) audio.play("ui.confirm");
    return handled;
  });
  for (let n = 1; n <= 9; n++) input.on("choice." + n, () => focus.choice(n));
  function back() {
    const dialog = [...document.querySelectorAll("dialog[open]")].at(-1);
    if (dialog) {
      const event = new globalThis.Event("cancel", { cancelable: true });
      if (dialog.dispatchEvent(event)) dialog.close();
      audio.play("ui.back");
    } else pause.open();
    return true;
  }
  input.on("back", back);
  input.on("pause", back);
  input.on("help", () => {
    settings.open(document.activeElement, "controls");
    return true;
  });
  input.on("tab.prev", () =>
    settings.dialog?.open ? settings.next(-1) : focus.path(-1),
  );
  input.on("tab.next", () =>
    settings.dialog?.open ? settings.next(1) : focus.path(1),
  );
  for (const [action, legacy] of Object.entries({
    "voice.toggle": "voice",
    "voice.replay": "replay",
    "voice.stop": "stopVoice",
    "captions.toggle": "captions",
    "fullscreen.toggle": "fullscreen",
  }))
    input.on(action, () => {
      core().performAction?.(legacy);
      return true;
    });
  input.on("map.zoom", () => {
    if (!gestures.map) return false;
    gestures.toggle();
    return true;
  });
  function annotateChoices() {
    for (const group of root.querySelectorAll("[data-cb-choices]")) {
      const choices = [
        ...group.querySelectorAll("button:not(:disabled), [data-cb-choice]"),
      ].filter((node) => node.closest("[data-cb-choices]") === group);
      choices.slice(0, 9).forEach((node, i) => {
        const n = node.dataset.cbChoice || String(i + 1);
        node.dataset.cbChoice = n;
        node.classList.add("cb-choice");
        node.setAttribute("aria-keyshortcuts", n);
        if (!node.querySelector(".cb-keycap"))
          node.append(
            h("span", { class: "cb-keycap", "aria-hidden": "true", text: n }),
          );
      });
    }
  }
  function enhanceTitle() {
    const hero = root.querySelector(".cb-hero__copy");
    if (!hero || hero.querySelector(".cb-engine-title-actions")) return;
    const row = h("div", { class: "cb-engine-title-actions" });
    const saved = Object.values(slots.store().players).some(
      (p) => Object.keys(p.stops).length || p.resume,
    );
    if (saved)
      row.append(
        button(i18n.t("continue"), resumeCurrent, {
          class: "cb-btn cb-btn--go cb-btn--big",
          "data-cb-nav-entry": "",
        }),
      );
    row.append(
      button(i18n.t("newGame"), () => openSlots(document.activeElement, true)),
      button(i18n.t("loadGame"), () => openSlots(document.activeElement)),
      button(i18n.t("settings"), () => settings.open(document.activeElement)),
    );
    hero.append(row);
  }
  let saveTimer;
  function refresh(event) {
    if (settings.dialog?.open) return;
    if (state().quiet && settings.get().voice !== false)
      settings.update({ voice: false, musicOn: false, sfx: 30 });
    hud.render();
    annotateChoices();
    gestures.refresh();
    enhanceTitle();
    const screen = root.dataset.screen;
    hints.set(
      screen === "title"
        ? [{ action: "confirm", label: i18n.t("hintChoose") }]
        : [
            { action: "nav.right", label: i18n.t("hintMove") },
            { action: "confirm", label: i18n.t("hintChoose") },
            { action: "pause", label: i18n.t("hintPause") },
          ],
    );
    if (event?.detail?.phase === "playing") {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        const record = core().snapshot?.();
        if (record?.stopId) slots.resume(record);
      }, 50);
    }
    if (event?.detail?.phase === "result") {
      clearTimeout(saveTimer);
      slots.finished(event.detail.stopId);
      badge.evaluate({
        stopId: event.detail.stopId,
        quiet: root.classList.contains("is-quiet"),
      });
    }
  }
  document.addEventListener("cb:screen", refresh);
  document.addEventListener("cb:step", (event) => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const record = event.detail?.snapshot || core().snapshot?.();
      if (record?.stopId) slots.resume(record);
    }, 50);
  });
  document.addEventListener("cb:result", (e) => {
    clearTimeout(saveTimer);
    badge.evaluate({ ...e.detail, quiet: root.classList.contains("is-quiet") });
    if (e.detail?.score >= 40) pad.rumble();
    audio.play(e.detail?.newBest ? "star" : "ok");
  });
  document.addEventListener("cb:voice", (e) => {
    if (e.detail?.audio) audio.attachVoice(e.detail.audio);
    audio.voice(!!e.detail?.playing);
  });
  document.addEventListener("cb:storage-error", () => {
    if (root.querySelector(".cb-engine-save-warning")) return;
    root.prepend(
      h("p", {
        class: "cb-engine-save-warning",
        role: "status",
        text: i18n.t("saveFailed"),
      }),
    );
  });
  const unlock = () => audio.unlock();
  document.addEventListener("pointerdown", unlock, { once: true });
  document.addEventListener("keydown", unlock, { once: true });
  document.addEventListener("visibilitychange", () => {
    audio.mute(document.hidden || !!pause.dialog);
    if (document.hidden && state().mode === "stop" && !pause.dialog)
      pause.open();
  });
  window.addEventListener("blur", () => {
    if (input.device === "gamepad" && state().mode === "stop" && !pause.dialog)
      pause.open();
  });
  window.addEventListener("online", () => hud.render());
  window.addEventListener("offline", () => hud.render());
  root.addEventListener("click", () => {
    if (!root.classList.contains("is-quiet")) return;
    if (settings.get().voice !== false)
      settings.update({ voice: false, musicOn: false, sfx: 30 });
  });
  refresh();
  return engine;
}
function boot() {
  if (!globalThis.CommunityBuilders?.getState) {
    document.addEventListener("cb:screen", boot, { once: true });
    return;
  }
  mount().catch((error) => {
    console.error("Game controls could not start", error);
  });
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
}
