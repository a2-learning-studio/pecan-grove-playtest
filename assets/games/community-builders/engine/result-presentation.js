import { h, button } from "./dom.js";
import { badgeIcon } from "./badge-art.js";
let pageId = 0;
export function installTipPages(root, i18n) {
  for (const card of root.querySelectorAll(".cb-card")) {
    if (card.dataset.cbPages) continue;
    const pages = [...card.querySelectorAll(".cb-tipcard")];
    if (pages.length < 2) continue;
    const wrapper = h("div", { class: "cb-tip-pages" }),
      id = "cb-tip-pages-" + ++pageId;
    pages[0].before(wrapper);
    wrapper.append(...pages);
    const status = h("span", {
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true",
    });
    let index = 0;
    const change = (delta) => {
      const next = Math.max(0, Math.min(pages.length - 1, index + delta));
      if (next === index) return;
      globalThis.CommunityBuilders?.performAction?.("stopVoice");
      const active = root.ownerDocument.activeElement;
      index = next;
      paint();
      if (active === previous && previous.disabled) nextButton.focus();
      else if (active === nextButton && nextButton.disabled) previous.focus();
      globalThis.PecanGroveEngine?.audio?.play("page");
    };
    const previous = button(i18n.t("tipPrevious"), () => change(-1), {
      class: "cb-btn cb-btn--quiet",
      "aria-controls": id,
    });
    const nextButton = button(i18n.t("tipNext"), () => change(1), {
      class: "cb-btn cb-btn--quiet",
      "aria-controls": id,
    });
    const paint = () => {
      pages.forEach((page, n) => {
        page.hidden = n !== index;
      });
      previous.disabled = index === 0;
      nextButton.disabled = index === pages.length - 1;
      status.textContent = i18n.t("tipPageCount", {
        current: index + 1,
        count: pages.length,
      });
    };
    wrapper.id = id;
    wrapper.append(
      h(
        "div",
        {
          class: "cb-tip-page-controls",
          "data-cb-nav-group": "row",
          "data-cb-novoice": "",
        },
        [previous, status, nextButton],
      ),
    );
    card.dataset.cbPages = String(pages.length);
    card.addEventListener("cb:page", (event) => {
      change(event.detail?.delta || 0);
    });
    paint();
  }
}
export function showResultBadges(root, ids, i18n) {
  installTipPages(root, i18n);
  for (const card of root.querySelectorAll(".cb-card")) {
    if (card.querySelector(".cb-result-badges") || !ids?.length) continue;
    const row = h("div", { class: "cb-result-badges", "data-cb-novoice": "" });
    for (const id of ids)
      row.append(
        h("p", { class: "cb-result-badge" }, [
          badgeIcon(id),
          h("span", { text: i18n.t("badgeUnlocked", { badge: i18n.t(id) }) }),
        ]),
      );
    (card.querySelector(".cb-card__body") || card).append(row);
  }
}
export function observeFeedback(root, fx, audio) {
  const seen = new WeakSet();
  const paint = () => {
    for (const node of root.querySelectorAll("[data-cb-feedback]")) {
      if (seen.has(node)) continue;
      seen.add(node);
      const correct = node.dataset.cbFeedback === "ok";
      if (correct) {
        fx.pulse(node);
        const rect = node.getBoundingClientRect?.();
        if (rect && fx.burst)
          fx.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, {
            kind: "sparkle",
          });
      } else fx.nudge(node);
      audio.play(correct ? "ok" : "try");
    }
  };
  const observer = new root.ownerDocument.defaultView.MutationObserver(paint);
  observer.observe(root, { childList: true, subtree: true });
  return () => observer.disconnect();
}
