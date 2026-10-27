import { h, button, safeGet, safeSet, storageArea } from "./dom.js";
import { reserved } from "./bindings.js";
import { bindingTable } from "./controls.js";
import { motion, configureMotion } from "./motion.js";
import { SETTINGS_DEFAULTS, migrateSettings } from "./settings-store.js";
export { SETTINGS_DEFAULTS, migrateSettings };
const TABS = ["audio", "display", "controls", "accessibility", "language"];
export class Settings {
  constructor({
    root,
    i18n,
    input,
    focus,
    core,
    audio,
    onChange = () => {},
    storage = storageArea("localStorage"),
  }) {
    Object.assign(this, {
      root,
      i18n,
      input,
      focus,
      core,
      audio,
      onChange,
      storage,
    });
    this.value = migrateSettings(safeGet(storage, "pecan-grove-settings", {}));
    this.dialog = null;
    this.active = "audio";
    this.uid = 0;
    this.fsListeners = [];
    configureMotion(() => this.value);
    for (const query of [
      "(prefers-reduced-motion: reduce)",
      "(prefers-contrast: more)",
    ])
      globalThis
        .matchMedia?.(query)
        .addEventListener?.("change", () => this.apply());
    this.apply();
  }
  get() {
    return this.value;
  }
  update(patch) {
    Object.assign(this.value, patch, { v: 2 });
    if (patch.voiceVolume != null) this.value.vol = patch.voiceVolume / 100;
    safeSet(this.storage, "pecan-grove-settings", this.value);
    this.core()?.updateSettings?.(patch);
    this.apply();
    this.onChange(this.value);
  }
  apply() {
    const c = this.value;
    this.root.style.setProperty("--cb-text-scale", c.textScale);
    this.root.dataset.contrast =
      c.contrast === "high" ||
      (c.contrast === "system" &&
        globalThis.matchMedia?.("(prefers-contrast: more)").matches)
        ? "high"
        : "normal";
    this.root.classList.toggle("cb-focus-thick", c.focusThick);
    this.root.classList.toggle("is-calm", !motion.allowed());
    this.root.dataset.motion = motion.allowed() ? "full" : "calm";
    this.audio?.apply();
  }
  label(key, params) {
    return this.i18n.t(key, params);
  }
  row(key, control, hint) {
    return h("div", { class: "cb-engine-setting" }, [
      h("div", {}, [
        h("label", { for: control.id, text: this.label(key) }),
        hint ? h("p", { class: "cb-engine-note", text: hint }) : null,
      ]),
      control,
    ]);
  }
  toggle(key, disabled = false) {
    const input = h("input", {
      type: "checkbox",
      id: "cb-engine-setting-" + ++this.uid,
      disabled,
    });
    input.checked = !!this.value[key];
    input.addEventListener("change", () =>
      this.update({ [key]: input.checked }),
    );
    return this.row(key, input);
  }
  range(key) {
    const id = "cb-engine-setting-" + ++this.uid,
      input = h("input", {
        id,
        type: "range",
        min: "0",
        max: "100",
        step: "5",
      });
    input.value = this.value[key];
    input.setAttribute("aria-valuetext", input.value + "%");
    input.addEventListener("input", () => {
      input.setAttribute("aria-valuetext", input.value + "%");
      this.update({ [key]: Number(input.value) });
    });
    if (key === "music") input.disabled = true;
    return this.row(
      key,
      input,
      key === "music" ? this.label("musicSoon") : null,
    );
  }
  select(key, values) {
    const input = h("select", { id: "cb-engine-setting-" + ++this.uid });
    for (const [value, label] of values)
      input.append(h("option", { value, text: this.label(label) }));
    input.value = String(this.value[key]);
    input.addEventListener("change", () =>
      this.update({
        [key]:
          typeof this.value[key] === "number"
            ? Number(input.value)
            : input.value,
      }),
    );
    return this.row(key, input);
  }
  choose(tab, focusTab = false) {
    if (!TABS.includes(tab)) return;
    this.active = tab;
    if (!this.dialog) return;
    for (const node of this.dialog.querySelectorAll('[role="tab"]')) {
      const active = node.dataset.tab === tab;
      node.setAttribute("aria-selected", String(active));
      node.tabIndex = active ? 0 : -1;
      if (active && focusTab) this.focus.focus(node);
    }
    for (const node of this.dialog.querySelectorAll('[role="tabpanel"]'))
      node.hidden = node.dataset.panel !== tab;
  }
  next(delta) {
    this.choose(
      TABS[(TABS.indexOf(this.active) + delta + TABS.length) % TABS.length],
      true,
    );
    return true;
  }
  open(opener = globalThis.document.activeElement, tab = "audio") {
    if (this.dialog?.open) {
      this.choose(tab, true);
      return this.dialog;
    }
    // The game's speaker and captions buttons (and the M and C keys) save
    // these two by themselves. Show what is really on.
    const shared = this.core()?.getState?.().settings;
    for (const key of ["voice", "cap"])
      if (typeof shared?.[key] === "boolean") this.value[key] = shared[key];
    const d = h("dialog", {
      class: "cb-engine-dialog cb-engine-settings",
      "aria-labelledby": "cb-engine-settings-heading",
      "data-cb-novoice": "",
    });
    d.append(
      h("div", { class: "cb-engine-dialog-head" }, [
        h("h2", {
          id: "cb-engine-settings-heading",
          text: this.label("settings"),
        }),
        button(this.label("close"), () => d.close()),
      ]),
    );
    const tabs = h("div", {
      role: "tablist",
      "aria-label": this.label("settings"),
      class: "cb-engine-tabs",
    });
    for (const name of TABS) {
      const tabButton = button(this.label(name), () => this.choose(name), {
        role: "tab",
        id: "cb-engine-tab-" + name,
        "aria-controls": "cb-engine-panel-" + name,
        "data-tab": name,
      });
      tabButton.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          this.next(e.key === "ArrowRight" ? 1 : -1);
        } else if (e.key === "Home" || e.key === "End") {
          e.preventDefault();
          this.choose(e.key === "Home" ? TABS[0] : TABS.at(-1), true);
        }
      });
      tabs.append(tabButton);
    }
    d.append(tabs);
    for (const name of TABS) {
      const panel = h("section", {
        role: "tabpanel",
        id: "cb-engine-panel-" + name,
        "aria-labelledby": "cb-engine-tab-" + name,
        "data-panel": name,
        tabindex: "0",
        class: "cb-engine-settings-panel",
      });
      this.fill(panel, name);
      d.append(panel);
    }
    d.append(
      button(
        this.label("resetAll"),
        () => {
          this.update({ ...SETTINGS_DEFAULTS });
          this.refresh();
        },
        { class: "cb-btn cb-btn--quiet" },
      ),
    );
    this.root.append(d);
    this.dialog = d;
    this.core()?.pause?.();
    d.addEventListener("close", () => {
      this.clearFSListeners();
      this.input.capture = null;
      this.focus.pop(d);
      d.remove();
      this.dialog = null;
      if (!this.root.classList.contains("is-paused"))
        this.core()?.resumePlay?.();
      else this.audio?.mute(true);
    });
    d.addEventListener("cancel", (e) => {
      e.preventDefault();
      d.close();
    });
    d.showModal();
    this.focus.push(d, opener);
    this.choose(tab, true);
    return d;
  }
  refresh() {
    if (!this.dialog) return;
    this.clearFSListeners();
    for (const panel of this.dialog.querySelectorAll('[role="tabpanel"]')) {
      panel.replaceChildren();
      this.fill(panel, panel.dataset.panel);
    }
    this.choose(this.active);
  }
  clearFSListeners() {
    for (const paint of this.fsListeners)
      document.removeEventListener("fullscreenchange", paint);
    this.fsListeners = [];
  }
  fill(panel, name) {
    const append = (...nodes) => panel.append(...nodes);
    if (name === "audio") {
      append(
        ...["master", "voiceVolume", "music", "sfx"].map((key) =>
          this.range(key),
        ),
        this.toggle("voice"),
        this.toggle("auto"),
        this.select("rate", [
          [0.85, "slow"],
          [1, "normal"],
          [1.15, "fast"],
        ]),
        button(this.label("sample"), () => {
          this.audio?.unlock();
          this.audio?.mute(false);
          this.core()?.performAction?.("voice.sample");
        }),
        this.toggle("musicOn", true),
        h("p", { text: this.label("musicSoon") }),
        this.toggle("duck"),
      );
      if (this.root.classList.contains("is-quiet"))
        append(h("p", { text: this.label("quietNote") }));
    }
    if (name === "display") {
      const fs = button(this.label("fullscreen"), () =>
        this.core()?.performAction?.("fullscreen.toggle"),
      );
      const paint = () => {
        const target = this.root.closest("[data-playtest-stage]") || this.root;
        fs.textContent = this.label(
          document.fullscreenElement === target
            ? "exitFullscreen"
            : "fullscreen",
        );
      };
      paint();
      document.addEventListener("fullscreenchange", paint);
      this.fsListeners.push(paint);
      append(
        fs,
        this.toggle("cap"),
        this.select("capSize", [
          ["s", "small"],
          ["m", "medium"],
          ["l", "large"],
        ]),
        this.select("textScale", [
          [0.9, "small"],
          [1, "medium"],
          [1.15, "large"],
        ]),
        this.select("contrast", [
          ["system", "system"],
          ["high", "on"],
          ["normal", "off"],
        ]),
        this.toggle("words"),
        this.toggle("numericScore"),
      );
    }
    if (name === "controls") {
      append(
        this.select("hints", [
          ["auto", "automatic"],
          ["on", "on"],
          ["off", "off"],
        ]),
        this.select("padLayout", [
          ["auto", "automatic"],
          ["xbox", "Xbox"],
          ["playstation", "PlayStation"],
          ["nintendo", "Nintendo"],
        ]),
        this.toggle("padSwap"),
        this.select("stickRepeat", [
          [110, "normal"],
          [180, "slow"],
          [80, "fast"],
        ]),
        this.toggle("rumble"),
        this.toggle("wasdNav"),
        this.toggle("letterKeys"),
        this.toggle("holdConfirm"),
      );
      append(
        this.bindingTable(),
        button(this.label("resetControls"), () => {
          this.input.bindings.reset();
          this.refresh();
        }),
      );
    }
    if (name === "accessibility") {
      append(
        this.toggle(
          "calm",
          !!globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
        ),
        this.toggle("circles"),
        h("p", { text: this.label("noFlashing") }),
        this.toggle("findCards"),
        this.toggle("focusThick"),
        h("p", { text: this.label("noTimers") }),
      );
    }
    if (name === "language") {
      const select = h("select", { id: "cb-engine-language" }, [
        h("option", { value: "en", text: "English" }),
        h("option", { value: "es", text: "Español" }),
      ]);
      select.value = this.i18n.language;
      select.addEventListener("change", () =>
        this.core()?.setLanguage?.(select.value),
      );
      append(this.row("language", select));
      const offline = h("div", { id: "pg-offline-voice-controls" });
      append(offline);
      if (globalThis.PecanGroveOffline?.openVoicePacks)
        globalThis.PecanGroveOffline.openVoicePacks(offline);
      else offline.append(h("p", { text: this.label("voicePackSoon") }));
    }
    append(
      button(
        this.label("resetTab"),
        () => {
          const groups = {
            audio: [
              "master",
              "voiceVolume",
              "music",
              "sfx",
              "voice",
              "auto",
              "rate",
              "musicOn",
              "duck",
            ],
            display: [
              "cap",
              "capSize",
              "textScale",
              "contrast",
              "words",
              "numericScore",
            ],
            controls: [
              "hints",
              "padLayout",
              "padSwap",
              "stickRepeat",
              "rumble",
              "wasdNav",
              "letterKeys",
              "holdConfirm",
            ],
            accessibility: ["calm", "circles", "findCards", "focusThick"],
            language: [],
          };
          this.update(
            Object.fromEntries(
              groups[name].map((key) => [key, SETTINGS_DEFAULTS[key]]),
            ),
          );
          this.refresh();
        },
        { class: "cb-btn cb-btn--quiet" },
      ),
    );
  }
  bindingTable() {
    return bindingTable(this);
  }
  capture(action, opener) {
    const message = h("p", { role: "status", text: this.label("capture") });
    opener.after(message);
    this.input.capture = (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.code === "Escape") {
        this.input.capture = null;
        message.remove();
        return;
      }
      if (reserved(e)) {
        message.textContent = this.label("reserved");
        return;
      }
      const result = this.input.bindings.assign(action, e);
      this.input.capture = null;
      message.remove();
      if (result.reason === "conflict") {
        this.confirm(
          this.label("conflict", { action: this.label(result.conflict) }),
          () => {
            this.input.bindings.assign(action, e, true);
            this.refresh();
          },
          opener,
        );
      } else this.refresh();
    };
  }
  confirm(text, run, opener) {
    const d = h(
      "dialog",
      { class: "cb-engine-dialog", "aria-label": this.label("settings") },
      [
        h("p", { text }),
        button(this.label("swap"), () => {
          run();
          d.close();
        }),
        button(this.label("cancel"), () => d.close()),
      ],
    );
    this.root.append(d);
    d.addEventListener("close", () => {
      this.focus.pop(d);
      d.remove();
    });
    d.showModal();
    this.focus.push(d, opener);
  }
}
