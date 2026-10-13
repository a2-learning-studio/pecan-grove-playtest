import { h, button } from "./dom.js";
import { slotStars, resumable } from "./store.js";
import { titleParallax } from "./title-parallax.js";

export function enhanceTitle({
  root,
  slots,
  api,
  core,
  i18n,
  resumeCurrent,
  openSlots,
  settings,
}) {
  const hero = root.querySelector(".cb-hero__copy");
  if (!hero || hero.querySelector(".cb-engine-title-actions")) return;
  const row = h("div", {
    class: "cb-engine-title-actions",
    "aria-label": i18n.t("gameMenu"),
    "data-cb-novoice": "",
  });
  const store = slots.store();
  const saved = Object.entries(store.players).filter(
    ([id, player]) =>
      id !== "you" ||
      Object.values(player.stops).some((record) => record.rounds > 0) ||
      resumable(player.resume),
  );
  const selected =
    saved.find(([id]) => id === store.current) ||
    saved.sort(
      (a, b) => Date.parse(b[1].updated) - Date.parse(a[1].updated),
    )[0];
  if (selected) {
    const [id, player] = selected;
    const animal = api().ANIMALS.find((item) => item.id === id);
    const next = resumable(player.resume)
      ? api().STOPS.find((stop) => stop.id === player.resume.stopId)
      : api().STOPS.find((stop) => !player.stops[stop.id]?.rounds) ||
        api().STOPS.at(-1);
    const control = button(
      "",
      () => {
        slots.select(id);
        resumeCurrent();
      },
      {
        class:
          "cb-btn cb-btn--go cb-btn--big cb-continue" +
          (animal ? "" : " cb-continue--legacy"),
        "data-cb-nav-entry": "",
      },
    );
    control.append(
      h("span", { class: "cb-continue-label", text: i18n.t("continue") }),
    );
    if (animal) control.prepend(api().animalFace(animal));
    control.append(
      h("small", {
        text: i18n.t("continueSummary", {
          player: animal?.name || i18n.t("player1"),
          number: next?.n || 1,
          stars: slotStars(player),
        }),
      }),
    );
    row.append(control);
  }
  row.append(
    button(i18n.t("newGame"), () => openSlots(document.activeElement, true)),
    button(i18n.t("loadGame"), () => openSlots(document.activeElement)),
    button(i18n.t("settings"), () => settings.open(document.activeElement)),
  );
  const grownups = hero.querySelector(".cb-btn--onstage");
  if (grownups) row.append(grownups);
  // The core Start remains a usable fallback if the enhanced engine cannot load.
  hero.querySelector(":scope > .cb-row")?.remove();
  hero.append(row);
  titleParallax(root, hero.closest(".cb-hero"));
}
