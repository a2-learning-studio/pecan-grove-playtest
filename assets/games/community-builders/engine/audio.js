const clamp = (value) => Math.max(0, Math.min(1, Number(value) || 0));
export const AUDIO_DEFAULTS = {
  master: 90,
  voiceVolume: 90,
  music: 40,
  sfx: 60,
  musicOn: false,
  duck: true,
};
const NOTES = {
  "ui.move": [330],
  "ui.confirm": [392, 523],
  "ui.back": [392, 294],
  ok: [392, 494, 587],
  try: [262, 247],
  star: [523, 659, 784],
  badge: [392, 523, 659, 784],
  page: [160, 210],
};
export class AudioMixer {
  constructor({
    settings = () => AUDIO_DEFAULTS,
    window: win = globalThis.window,
  } = {}) {
    this.settings = settings;
    this.win = win;
    this.context = null;
    this.buses = {};
    this.muted = false;
    this.voicing = false;
    this.elements = new Map();
    this.lastSfx = 0;
  }
  unlock() {
    const Context = this.win.AudioContext || this.win.webkitAudioContext;
    if (!Context) return false;
    try {
      if (!this.context) {
        this.context = new Context();
        for (const name of ["master", "voice", "music", "sfx"])
          this.buses[name] = this.context.createGain();
        this.buses.master.connect(this.context.destination);
        for (const name of ["voice", "music", "sfx"])
          this.buses[name].connect(this.buses.master);
        this.apply();
      }
      if (this.context.state === "suspended")
        this.context.resume()?.catch?.(() => {});
      return true;
    } catch {
      return false;
    }
  }
  gain(name) {
    const cfg = { ...AUDIO_DEFAULTS, ...this.settings() };
    if (name === "master") return this.muted ? 0 : clamp(cfg.master / 100);
    if (name === "voice")
      return clamp((cfg.voiceVolume ?? cfg.vol * 100) / 100);
    if (name === "music")
      return cfg.musicOn
        ? clamp(cfg.music / 100) *
            (this.voicing && cfg.duck ? Math.pow(10, -12 / 20) : 1)
        : 0;
    return clamp(cfg.sfx / 100);
  }
  apply() {
    if (this.context)
      for (const name of Object.keys(this.buses))
        this.buses[name].gain.setTargetAtTime(
          this.gain(name),
          this.context.currentTime,
          0.025,
        );
    for (const [element, source] of this.elements)
      element.volume = source ? 1 : this.gain("master") * this.gain("voice");
  }
  attachVoice(element) {
    if (!element || this.elements.has(element)) return;
    let source = null;
    if (this.context)
      try {
        source = this.context.createMediaElementSource(element);
        source.connect(this.buses.voice);
        element.volume = 1;
      } catch {
        /* Older browsers use the element volume. */
      }
    this.elements.set(element, source);
    const on = () => this.voice(true),
      off = () => this.voice(false);
    element.addEventListener("playing", on);
    element.addEventListener("pause", off);
    element.addEventListener("ended", off);
    this.apply();
  }
  voice(playing) {
    this.voicing = playing;
    if (!this.context) return;
    const gain = this.buses.music.gain;
    gain.cancelScheduledValues(this.context.currentTime);
    gain.setValueAtTime(gain.value, this.context.currentTime);
    gain.linearRampToValueAtTime(
      this.gain("music"),
      this.context.currentTime + (playing ? 0.15 : 0.4),
    );
  }
  mute(value) {
    this.muted = value;
    this.apply();
  }
  play(kind) {
    if (!this.context || this.muted || !NOTES[kind]) return;
    const now = this.context.currentTime;
    if (now - this.lastSfx < 0.035) return;
    this.lastSfx = now;
    const notes = NOTES[kind],
      duration = kind === "ui.move" ? 0.03 : 0.075;
    notes.forEach((frequency, i) => {
      const oscillator = this.context.createOscillator(),
        level = this.context.createGain();
      const at = now + i * 0.065;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      level.gain.setValueAtTime(0, at);
      level.gain.linearRampToValueAtTime(0.08, at + 0.007);
      level.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      oscillator.connect(level);
      level.connect(this.buses.sfx);
      oscillator.start(at);
      oscillator.stop(at + duration + 0.01);
      oscillator.onended = () => {
        oscillator.disconnect();
        level.disconnect();
      };
    });
  }
}
