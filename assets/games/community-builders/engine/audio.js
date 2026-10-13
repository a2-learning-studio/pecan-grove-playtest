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
    this.primed = false;
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
      const running = this.context.state === "running";
      // Android Chrome drops a context that only called resume() and never
      // started a node during the tap. A silent buffer keeps it running.
      if (!running && this.context.resume)
        this.context
          .resume()
          ?.then?.(() => this.flushRoutes())
          ?.catch?.(() => {});
      else this.flushRoutes();
      if (!running || !this.primed) this.prime();
      this.primed = true;
      return true;
    } catch {
      return false;
    }
  }
  prime() {
    const context = this.context;
    if (
      !context?.createBuffer ||
      !context.createBufferSource ||
      !context.createGain
    )
      return;
    try {
      const buffer = context.createBuffer(1, 8, context.sampleRate || 44100);
      const source = context.createBufferSource();
      source.buffer = buffer;
      const level = context.createGain();
      if (level.gain.setValueAtTime)
        level.gain.setValueAtTime(0.0001, context.currentTime || 0);
      else level.gain.value = 0.0001;
      source.connect(level);
      level.connect(context.destination);
      source.start(0);
    } catch {
      /* The next tap can prime again. resume() still ran. */
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
    this.elements.set(element, null);
    const on = () => this.voice(true),
      off = () => this.voice(false);
    element.addEventListener("playing", on);
    element.addEventListener("pause", off);
    element.addEventListener("ended", off);
    this.route(element);
    this.apply();
  }
  route(element) {
    if (!this.elements.has(element) || this.elements.get(element)) return;
    // A media element piped into a suspended context is silent on Android,
    // even when play() succeeds. Leave it on the speakers until we can hear.
    if (
      !this.context ||
      this.context.state !== "running" ||
      element.paused === false
    ) {
      element.volume = this.gain("master") * this.gain("voice");
      return;
    }
    try {
      const source = this.context.createMediaElementSource(element);
      source.connect(this.buses.voice);
      element.volume = 1;
      this.elements.set(element, source);
    } catch {
      element.volume = this.gain("master") * this.gain("voice");
    }
  }
  flushRoutes() {
    for (const element of this.elements.keys()) this.route(element);
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
    if (
      kind === "page" &&
      this.context.createBuffer &&
      this.context.createBufferSource
    ) {
      this.pageSwish(now);
      return;
    }
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
  pageSwish(now) {
    const context = this.context,
      duration = 0.18,
      buffer = context.createBuffer(
        1,
        Math.ceil(context.sampleRate * duration),
        context.sampleRate,
      ),
      samples = buffer.getChannelData(0);
    let seed = 1771;
    for (let i = 0; i < samples.length; i++) {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      samples[i] = (((seed >>> 0) / 4294967296) * 2 - 1) * 0.4;
    }
    const source = context.createBufferSource(),
      level = context.createGain();
    source.buffer = buffer;
    let filter;
    if (context.createBiquadFilter) {
      filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1800;
      source.connect(filter);
      filter.connect(level);
    } else source.connect(level);
    level.connect(this.buses.sfx);
    level.gain.setValueAtTime(0, now);
    level.gain.linearRampToValueAtTime(0.08, now + 0.025);
    level.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.start(now);
    source.stop(now + duration);
    source.onended = () => {
      source.disconnect();
      filter?.disconnect();
      level.disconnect();
    };
  }
}
