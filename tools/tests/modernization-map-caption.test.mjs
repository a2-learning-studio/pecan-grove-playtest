import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  fitStopPoints,
  installMapPresentation,
  platePlacement,
} from "../../assets/games/community-builders/engine/map-layout.js";

const positions = [
  [9, 39],
  [15, 52],
  [18, 77],
  [31, 58],
  [31, 24],
  [43, 44],
  [46, 72],
  [57, 52],
  [68, 30],
  [65, 73],
  [78, 53],
  [88, 74],
  [91, 50],
  [75, 18],
  [91, 20],
];

function mobileMap(language = "en", width = 377, next = 0) {
  const dom = new JSDOM("<main></main>", { pretendToBeVisual: true });
  const document = dom.window.document,
    main = document.querySelector("main"),
    height = (width * 768) / 1376;
  const h = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs))
      key === "text"
        ? (node.textContent = value)
        : node.setAttribute(key, value);
    node.append(...children);
    return node;
  };
  const rect = (left, top, width, height) => ({
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
  });
  const bounds = rect(18, 310, width, height),
    fit = fitStopPoints(positions, width, height, 44),
    discs = fit.map(([x, y]) =>
      rect(bounds.left + x - 22, bounds.top + y - 22, 44, 44),
    ),
    canvas = h("div", { class: "cb-world__canvas" }),
    pan = h("div", { class: "cb-world__pan" }, [canvas]),
    world = h("div", { class: "cb-world" }, [pan]);
  main.append(world);
  const names =
    language === "es"
      ? ["Observa las señales", "Haz mejores preguntas"]
      : ["Notice the signs", "Ask better questions"];
  const controls = fit.map((_, index) => {
    const name = names[index] || `Stop ${index + 1}`,
      plate = h("span", { class: "cb-stop__plate", "aria-hidden": "true" }, [
        h("span", {
          class: "cb-stop__n",
          text: `${language === "es" ? "Parada" : "Stop"} ${index + 1}`,
        }),
        h("b", { text: name }),
      ]),
      disc = h("span", { class: "cb-stop__disc" }),
      button = h(
        "button",
        {
          class: "cb-stop",
          "data-state":
            index === next ? "next" : index < next ? "done" : "open",
          "data-stop-n": index + 1,
          "aria-label": `${index + 1}. ${name}${index === next ? (language === "es" ? ", Siguiente" : ", Next") : ""}`,
        },
        [disc, plate],
      );
    if (index === next)
      button.prepend(
        h("span", {
          class: "cb-tag",
          "aria-hidden": "true",
          text: language === "es" ? "Siguiente" : "Next",
        }),
      );
    button.getBoundingClientRect = disc.getBoundingClientRect = () =>
      discs[index];
    plate.getBoundingClientRect = () => rect(0, 0, 180, 74);
    canvas.append(h("div", {}, [button]));
    return button;
  });
  Object.defineProperties(canvas, {
    clientWidth: { value: width },
    clientHeight: { value: height },
  });
  canvas.getBoundingClientRect = pan.getBoundingClientRect = () => bounds;
  const view = installMapPresentation(
    {
      document,
      window: dom.window,
      main,
      h,
      POS: positions,
      btn: (text, className, onclick) => {
        const button = h("button", { text, class: className });
        button.addEventListener("click", onclick);
        return button;
      },
      W: {
        chapters: ["Chapter"],
        mapLegend: "Legend",
        mapList: "List",
        mapMap: "Map",
      },
    },
    world,
    canvas,
    pan,
  );
  return { dom, document, canvas, controls, discs, bounds, view, names, world };
}

for (const language of ["en", "es"]) {
  test(`${language}: crowded mobile map keeps the complete focused stop name visible without covering a disc`, () => {
    const map = mobileMap(language);
    try {
      assert.equal(
        platePlacement(
          map.discs[0],
          { width: 180, height: 74 },
          map.bounds,
          map.discs.slice(1),
        ),
        null,
        "The actual fifteen-stop mobile geometry has no collision-free four-way slot",
      );
      map.controls[0].focus();
      map.view.layout();
      const caption = map.world.querySelector(".cb-map-caption");
      assert.ok(
        caption,
        "A reserved readout exists outside the map disc layer",
      );
      assert.equal(caption.closest(".cb-world__canvas"), null);
      assert.equal(caption.querySelector("b")?.textContent, map.names[0]);
      assert.equal(map.controls[0].dataset.plateVisible, "true");
      assert.equal(
        map.controls[0].dataset.plateHidden,
        "false",
        "The priority stop remains visibly labelled when the floating plate cannot fit",
      );
      assert.equal(map.controls[0].dataset.plateDocked, "true");
      assert.equal(map.document.activeElement, map.controls[0]);
      assert.match(
        map.controls[0].getAttribute("aria-label"),
        new RegExp(map.names[0]),
      );
      assert.equal(map.controls[0].style.getPropertyValue("--d"), "44px");
      assert.equal(map.canvas.querySelectorAll(".cb-stop").length, 15);
    } finally {
      map.view.close();
      map.dom.window.close();
    }
  });
}

test("caption focus changes replace only the readout, preserve all disc geometry, and restore the next-stop label", () => {
  const map = mobileMap();
  try {
    map.view.layout();
    const caption = map.world.querySelector(".cb-map-caption");
    assert.ok(caption);
    const geometry = map.controls.map((button) =>
        button.parentNode.getAttribute("style"),
      ),
      first = caption.firstElementChild;
    map.view.placeLabels();
    assert.equal(
      caption.firstElementChild,
      first,
      "Unchanged focus does not rebuild the caption",
    );
    map.controls[1].focus();
    assert.equal(caption.querySelector("b")?.textContent, map.names[1]);
    assert.equal(
      map.world.querySelector(".cb-map-caption"),
      caption,
      "The reserved row is never removed or recreated",
    );
    assert.equal(caption.children.length, 1);
    assert.deepEqual(
      map.controls.map((button) => button.parentNode.getAttribute("style")),
      geometry,
      "Reading another name never moves or shrinks a map disc",
    );
    map.controls[1].blur();
    map.view.placeLabels();
    assert.equal(caption.querySelector("b")?.textContent, map.names[0]);
  } finally {
    map.view.close();
    map.dom.window.close();
  }
});

for (const language of ["en", "es"]) {
  test(`${language}: the next badge stays in the reserved readout at 600px after two completed stops`, () => {
    const map = mobileMap(language, 580, 2);
    try {
      const next = map.controls[2],
        tag = next.querySelector(".cb-tag");
      tag.getBoundingClientRect = () => {
        throw new Error(
          "Next must not depend on absolute children of a native button",
        );
      };
      map.view.layout();
      const caption = map.world.querySelector(".cb-map-caption"),
        badge = caption.querySelector(".cb-tag");
      assert.ok(
        badge,
        "The actual next stop has a visible Next badge beside its name",
      );
      assert.equal(badge.hidden, false);
      assert.equal(
        tag.hidden,
        true,
        "The fragile floating badge cannot cover another map disc",
      );
      assert.equal(badge.closest(".cb-world__canvas"), null);
      assert.equal(caption.dataset.stopN, "3");
      assert.match(
        next.getAttribute("aria-label"),
        language === "es" ? /Siguiente/ : /Next/,
      );
      map.controls[5].focus();
      assert.equal(caption.dataset.stopN, "6");
      assert.equal(
        caption.querySelector(".cb-tag"),
        null,
        "A different focused name is never mislabelled as Next",
      );
      next.focus();
      assert.equal(caption.dataset.stopN, "3");
      assert.equal(caption.querySelector(".cb-tag")?.hidden, false);
      assert.equal(map.canvas.querySelectorAll(".cb-stop__disc").length, 15);
      assert.ok(
        map.controls.every(
          (button) => button.style.getPropertyValue("--d") === "44px",
        ),
      );
    } finally {
      map.view.close();
      map.dom.window.close();
    }
  });
}
