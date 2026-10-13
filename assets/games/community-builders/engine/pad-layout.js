export const PAD_BUTTONS = {
  0: "confirm",
  1: "back",
  2: "voice.replay",
  3: "help",
  4: "tab.prev",
  5: "tab.next",
  8: "captions.toggle",
  9: "pause",
  12: "nav.up",
  13: "nav.down",
  14: "nav.left",
  15: "nav.right",
};
export function padLayout(id = "", preference = "auto") {
  return preference !== "auto"
    ? preference
    : /054c|DualShock|DualSense/i.test(id)
      ? "playstation"
      : /057e|Pro Controller/i.test(id)
        ? "nintendo"
        : "xbox";
}
export function padActions(pad, swap = false) {
  const actions = new Set();
  const standard = pad.mapping === "standard";
  pad.buttons.forEach((button, i) => {
    if (!button?.pressed || (!standard && i > 3)) return;
    let action = PAD_BUTTONS[i];
    if (swap && i < 2) action = i === 0 ? "back" : "confirm";
    if (action) actions.add(action);
  });
  if ((pad.axes[0] || 0) < -0.5) actions.add("nav.left");
  if ((pad.axes[0] || 0) > 0.5) actions.add("nav.right");
  if ((pad.axes[1] || 0) < -0.5) actions.add("nav.up");
  if ((pad.axes[1] || 0) > 0.5) actions.add("nav.down");
  return actions;
}
