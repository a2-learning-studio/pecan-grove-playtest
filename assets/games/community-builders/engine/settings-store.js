export const SETTINGS_DEFAULTS = {
  v: 2,
  voice: true,
  auto: true,
  vol: 0.9,
  rate: 1,
  words: true,
  cap: false,
  capSize: "m",
  circles: true,
  calm: false,
  master: 90,
  voiceVolume: 90,
  music: 40,
  sfx: 60,
  musicOn: false,
  duck: true,
  textScale: 1,
  contrast: "system",
  hints: "auto",
  wasdNav: true,
  holdConfirm: false,
  findCards: false,
  focusThick: false,
  padLayout: "auto",
  padSwap: false,
  rumble: false,
  stickRepeat: 110,
};
export function migrateSettings(value) {
  const data = {
    ...SETTINGS_DEFAULTS,
    ...(value && typeof value === "object" ? value : {}),
  };
  data.v = 2;
  if (value?.voiceVolume == null && typeof value?.vol === "number")
    data.voiceVolume = Math.round(value.vol * 100);
  return data;
}
