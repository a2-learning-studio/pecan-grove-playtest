import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const { parse } = createRequire(import.meta.url)("espree");
const UNKNOWN = Symbol("dynamic");
const propertyName = (node) =>
  node?.type === "Identifier" ? node.name : node?.value;
const taggedFact = (value) =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  ["kind", "type", "tag", "classification", "right", "basket"].some(
    (key) => value[key] === "fact",
  );
function nodesOf(node, result = []) {
  if (!node || typeof node !== "object") return result;
  if (node.type) result.push(node);
  for (const value of Object.values(node))
    if (Array.isArray(value)) value.forEach((child) => nodesOf(child, result));
    else if (value && typeof value === "object") nodesOf(value, result);
  return result;
}
function literal(node) {
  if (!node) return UNKNOWN;
  if (node.type === "Literal") return node.value;
  if (node.type === "ArrayExpression") return node.elements.map(literal);
  if (node.type === "ObjectExpression")
    return Object.fromEntries(
      node.properties
        .filter((p) => p.type === "Property")
        .map((p) => [propertyName(p.key), literal(p.value)]),
    );
  if (
    node.type === "CallExpression" &&
    node.callee.type === "MemberExpression"
  ) {
    if (propertyName(node.callee.property) === "concat") {
      const initial = literal(node.callee.object),
        args = node.arguments.map(literal);
      if (Array.isArray(initial) && args.every((value) => value !== UNKNOWN))
        return initial.concat(...args);
    }
    // Only recognize the authored data reference, never execute its JavaScript.
    if (
      propertyName(node.callee.property) === "pair" &&
      node.callee.object?.type === "MemberExpression" &&
      propertyName(node.callee.object.property) === "CBLocale"
    )
      return ["<English locale text>", "<Spanish locale text>"];
  }
  return UNKNOWN;
}
function sourceValue(value) {
  return value?.source ?? value?.sourceId ?? value?.src;
}
function validateSource(source, ids, location, errors) {
  if (typeof source !== "string" || !source.trim())
    errors.push(`${location}: fact has no nonempty source id`);
  else if (!ids.has(source))
    errors.push(`${location}: unknown source id ${JSON.stringify(source)}`);
}
export function inspectJavaScript(text, filename = "fixture.js") {
  const ast = parse(text, {
      ecmaVersion: "latest",
      sourceType: "module",
      loc: true,
    }),
    nodes = nodesOf(ast),
    ids = new Set(),
    errors = [],
    records = [],
    banks = new Map(),
    aliases = new Map();
  const declarations = nodes.filter(
    (node) => node.type === "VariableDeclarator",
  );
  for (const declaration of declarations) {
    const name = declaration.id.name;
    if (
      /^(SRC|SOURCES|sources)$/.test(name) &&
      declaration.init?.type === "ObjectExpression"
    )
      for (const property of declaration.init.properties)
        ids.add(propertyName(property.key));
    if (/^(?:.*_)?(?:FACTS|CLAIMS|OLDS)$/.test(name))
      banks.set(name, literal(declaration.init));
    if (
      declaration.init?.type === "MemberExpression" &&
      declaration.init.object.type === "Identifier"
    )
      aliases.set(name, declaration.init.object.name);
  }
  const validBanks = new Set();
  for (const [name, bank] of banks) {
    if (!Array.isArray(bank)) {
      errors.push(`${filename}:${name}: cannot statically inspect fact bank`);
      continue;
    }
    let count = 0,
      before = errors.length;
    bank.forEach((record, index) => {
      const isClaim = Array.isArray(record),
        fact = isClaim
          ? record[0] === "fact"
          : /FACTS$|OLDS$/.test(name) || taggedFact(record);
      if (!fact) return;
      const source = isClaim ? record[2] : sourceValue(record),
        location = `${filename}:${name}[${index}]`;
      validateSource(source, ids, location, errors);
      records.push({ location, source });
      count++;
    });
    if (count && errors.length === before) validBanks.add(name);
  }
  for (const node of nodes.filter(
    (value) => value.type === "ObjectExpression",
  )) {
    const value = literal(node);
    if (!taggedFact(value)) continue;
    const property = node.properties.find((p) =>
        ["source", "sourceId", "src"].includes(propertyName(p.key)),
      ),
      source = sourceValue(value),
      location = `${filename}:${node.loc.start.line}`;
    if (
      source === UNKNOWN &&
      property?.value.type === "MemberExpression" &&
      ["source", "sourceId", "src"].includes(
        propertyName(property.value.property),
      ) &&
      validBanks.has(aliases.get(property.value.object.name))
    ) {
      records.push({
        location,
        derivedFrom: aliases.get(property.value.object.name),
      });
      continue;
    }
    validateSource(source, ids, location, errors);
    records.push({ location, source });
  }
  return { errors, records, sourceIds: [...ids] };
}
export function inspectJson(
  value,
  filename = "fixture.json",
  inheritedSources = [],
) {
  const errors = [],
    records = [];
  function visit(item, location, known) {
    if (!item || typeof item !== "object") return;
    const table = item.sources || item.SRC || item.SOURCES,
      ids = new Set(known);
    if (table && typeof table === "object" && !Array.isArray(table))
      for (const id of Object.keys(table)) ids.add(id);
    if (taggedFact(item)) {
      const source = sourceValue(item);
      validateSource(source, ids, location, errors);
      records.push({ location, source });
    }
    if (Array.isArray(item) && item[0] === "fact") {
      validateSource(item[2], ids, location, errors);
      records.push({ location, source: item[2] });
    }
    if (Array.isArray(item))
      item.forEach((child, index) =>
        visit(child, `${location}[${index}]`, ids),
      );
    else
      for (const [key, child] of Object.entries(item))
        visit(child, `${location}.${key}`, ids);
  }
  visit(value, filename, inheritedSources);
  return { errors, records };
}
function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(full) : [full];
  });
}
export function checkProject(root) {
  const errors = [],
    records = [];
  for (const file of filesIn(
    path.join(root, "assets/games/community-builders"),
  )) {
    const filename = path.relative(root, file).split(path.sep).join("/");
    if (!/\.(js|json)$/.test(file) || file.endsWith("catalog.js")) continue;
    try {
      const result = file.endsWith(".json")
        ? inspectJson(JSON.parse(fs.readFileSync(file, "utf8")), filename)
        : inspectJavaScript(fs.readFileSync(file, "utf8"), filename);
      errors.push(...result.errors);
      records.push(...result.records);
    } catch (error) {
      errors.push(`${filename}: ${error.message}`);
    }
  }
  return { errors, records };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const result = checkProject(fileURLToPath(new URL("../", import.meta.url)));
  if (result.errors.length) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  } else
    console.log(
      `Fact sources: ${result.records.length} authored or checked derived records; all source references resolve. Human neutrality review remains separate.`,
    );
}
