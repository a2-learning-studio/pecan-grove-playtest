/* Authored vector artwork only. Nodes are constructed without an HTML parsing sink. */
const SVG = "http://www.w3.org/2000/svg";
const TAGS = new Set(
  "svg g path circle ellipse rect line polyline polygon defs clipPath mask linearGradient radialGradient stop pattern use title desc text tspan".split(
    " ",
  ),
);
const ATTRS = new Set(
  "id class viewBox role focusable d fill stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray stroke-dashoffset opacity fill-opacity stroke-opacity fill-rule clip-rule transform cx cy r rx ry x y x1 x2 y1 y2 width height points pathLength xmlns vector-effect clip-path mask offset stop-color stop-opacity gradientUnits gradientTransform patternUnits patternTransform preserveAspectRatio text-anchor font-size font-family href".split(
    " ",
  ),
);
const cache = new WeakMap();
function text(value) {
  return value.replace(
    /&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi,
    (match, entity) => {
      if (entity[0] === "#") {
        const hex = entity[1].toLowerCase() === "x";
        const point = parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
        return point > 0 &&
          point <= 0x10ffff &&
          !(point >= 0xd800 && point <= 0xdfff)
          ? String.fromCodePoint(point)
          : "\uFFFD";
      }
      return (
        { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[
          entity.toLowerCase()
        ] || match
      );
    },
  );
}
function fragment(document, markup) {
  const result = document.createDocumentFragment(),
    stack = [result];
  const tokens = String(markup).match(/<!--[^]*?-->|<[^>]*>|[^<]+/g) || [];
  for (const token of tokens) {
    if (token.startsWith("<!--")) continue;
    if (token[0] !== "<") {
      if (token.trim())
        stack.at(-1).appendChild(document.createTextNode(text(token)));
      continue;
    }
    const closing = token.match(/^<\/([\w:-]+)\s*>$/);
    if (closing) {
      if (stack.length < 2 || stack.at(-1).localName !== closing[1])
        throw new Error("Mismatched authored artwork tag");
      stack.pop();
      continue;
    }
    const open = token.match(/^<([\w:-]+)([^]*?)\/?\s*>$/);
    if (!open || !TAGS.has(open[1]))
      throw new Error("Unsupported authored artwork tag");
    const node = document.createElementNS(SVG, open[1]);
    let rest = open[2];
    const attribute = /^\s+([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/;
    while (rest.trim()) {
      const match = rest.match(attribute);
      if (!match) throw new Error("Malformed authored artwork attribute");
      const name = match[1],
        value = text(match[2] ?? match[3]);
      if (!(
        ATTRS.has(name) ||
        /^aria-[a-z-]+$/.test(name) ||
        /^data-[a-z-]+$/.test(name)
      ))
        throw new Error("Unsupported authored artwork attribute: " + name);
      if (name === "href" && !/^#[A-Za-z][\w:-]*$/.test(value))
        throw new Error("External artwork references are disabled");
      if (/url\(/i.test(value) && !/^url\(#[A-Za-z][\w:-]*\)$/.test(value))
        throw new Error("External artwork paint is disabled");
      node.setAttribute(name, value);
      rest = rest.slice(match[0].length);
    }
    stack.at(-1).appendChild(node);
    if (!/\/\s*>$/.test(token)) stack.push(node);
  }
  if (stack.length !== 1) throw new Error("Unclosed authored artwork tag");
  return result;
}
export function clear(element) {
  if (element.replaceChildren) element.replaceChildren();
  else while (element.firstChild) element.removeChild(element.firstChild);
  return element;
}
export function appendAuthoredMarkup(element, markup) {
  const document = element.ownerDocument || globalThis.document;
  let entries = cache.get(document);
  if (!entries) {
    entries = new Map();
    cache.set(document, entries);
  }
  const source = String(markup || "");
  let template = entries.get(source);
  if (!template) {
    template = fragment(document, source);
    entries.set(source, template);
  }
  element.appendChild(template.cloneNode(true));
  return element;
}
export function setAuthoredMarkup(element, markup) {
  clear(element);
  return appendAuthoredMarkup(element, markup);
}
