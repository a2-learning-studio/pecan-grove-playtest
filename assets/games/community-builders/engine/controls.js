import { h, button } from "./dom.js";
import { DEFAULT_BINDINGS } from "./bindings.js";

export function bindingTable(editor) {
  const table = h("table", { class: "cb-engine-bindings" }, [
    h("caption", { text: editor.label("controls") }),
  ]);
  const head = h("tr");
  for (const key of [
    "bindingAction",
    "bindingPrimary",
    "bindingAlternate",
    "change",
  ]) {
    head.append(h("th", { scope: "col", text: editor.label(key) }));
  }
  table.append(h("thead", {}, head));
  const body = h("tbody");
  for (const action of Object.keys(DEFAULT_BINDINGS)) {
    const codes = editor.input.bindings.value[action];
    const change = button(
      editor.label("change"),
      () => editor.capture(action, change),
      {
        "aria-label": editor.label("change") + ": " + editor.label(action),
      },
    );
    body.append(
      h("tr", {}, [
        h("th", { scope: "row", text: editor.label(action) }),
        h("td", {}, h("kbd", { text: editor.input.bindings.label(codes[0]) })),
        h(
          "td",
          {},
          h("kbd", {
            text: codes[1] ? editor.input.bindings.label(codes[1]) : "—",
          }),
        ),
        h("td", {}, change),
      ]),
    );
  }
  table.append(body);
  return table;
}
