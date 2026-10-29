import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
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
// Real-world claims (Stop 10's places and the grown-up notes about Georgia) are not story evidence, so
// they live in a separate register with outside sources, a checked date and a fingerprint of the
// checked EN/ES wording. Editing a checked line without re-checking its sources fails this gate.
export const REGISTER = "docs/fact-sources.json";
const STATUSES = new Set([
  "confirmed",
  "corrected",
  "partly-confirmed",
  "not-confirmed",
]);
const isoDate = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value + "T00:00:00Z"));
function localeText(root, file, key, language) {
  const data = JSON.parse(
    fs.readFileSync(
      path.join(
        root,
        "assets/games/community-builders/locales",
        language,
        file + ".json",
      ),
      "utf8",
    ),
  );
  return key.split(".").reduce((value, part) => value?.[part], data);
}
export function fingerprint(root, claim) {
  const texts = claim.keys.map((key) =>
    ["en", "es"].map((language) => localeText(root, claim.file, key, language)),
  );
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(texts))
    .digest("hex")
    .slice(0, 16);
}
// Stop 10's rows are [code, neighbor, problem, fix, place, stamp, note]; read them without running the stop.
export function stop10Rows(text) {
  const declaration = nodesOf(
    parse(text, { ecmaVersion: "latest", sourceType: "script" }),
  ).find(
    (node) =>
      node.type === "VariableDeclarator" &&
      node.id.name === "D" &&
      node.init?.type === "ArrayExpression",
  );
  const key = (node) =>
    node?.type === "CallExpression" &&
    propertyName(node.callee.property) === "pair"
      ? node.arguments[1]?.value
      : undefined;
  return (declaration ? declaration.init.elements : []).map((row) => ({
    code: row.elements[0]?.value,
    stamp: row.elements[5]?.value,
    keys: [key(row.elements[4]), key(row.elements[6])],
  }));
}
export function checkRegister(root, register) {
  const errors = [],
    records = [],
    where = REGISTER;
  if (!register || typeof register !== "object")
    return { errors: [`${where}: missing real-world fact register`], records };
  const sources = register.sources || {},
    claims = Array.isArray(register.claims) ? register.claims : [];
  if (!register.corrections?.email)
    errors.push(`${where}: no corrections contact for grown-ups`);
  for (const [id, source] of Object.entries(sources)) {
    for (const field of ["publisher", "title"])
      if (typeof source[field] !== "string" || !source[field].trim())
        errors.push(`${where}: source ${id} has no ${field}`);
    if (typeof source.url !== "string" || !source.url.startsWith("https://"))
      errors.push(`${where}: source ${id} needs an https URL`);
    if (!isoDate(source.checked))
      errors.push(`${where}: source ${id} has no checked date`);
  }
  const ids = new Set();
  for (const claim of claims) {
    const label = `${where}: ${claim.id}`;
    if (ids.has(claim.id)) errors.push(`${label} is listed twice`);
    ids.add(claim.id);
    if (!Array.isArray(claim.sources) || !claim.sources.length)
      errors.push(`${label} has no source`);
    for (const id of claim.sources || [])
      if (!sources[id]) errors.push(`${label} cites unknown source ${id}`);
    if (!isoDate(claim.checked)) errors.push(`${label} has no checked date`);
    if (!STATUSES.has(claim.status))
      errors.push(`${label} has no known status`);
    if (/^(?:partly|not)-/.test(claim.status || "") && !claim.note)
      errors.push(`${label} needs a note saying what is not confirmed`);
    try {
      if (!Array.isArray(claim.keys) || !claim.keys.length)
        throw new Error("lists no locale keys");
      for (const key of claim.keys)
        for (const language of ["en", "es"])
          if (typeof localeText(root, claim.file, key, language) !== "string")
            throw new Error(`has no ${language} text at ${claim.file} ${key}`);
      if (fingerprint(root, claim) !== claim.fingerprint)
        throw new Error(
          `wording changed since it was checked on ${claim.checked}; re-check its sources, then update checked and fingerprint`,
        );
    } catch (error) {
      errors.push(`${label} ${error.message}`);
    }
    records.push({ location: label, source: (claim.sources || []).join(" ") });
  }
  const byId = new Map(claims.map((claim) => [claim.id, claim]));
  const rows = stop10Rows(
    fs.readFileSync(
      path.join(root, "assets/games/community-builders/stops/10-match-a-fix.js"),
      "utf8",
    ),
  );
  if (rows.length !== 16)
    errors.push(`${where}: expected Stop 10's 16 real-place rows`);
  for (const row of rows) {
    const claim = byId.get("stop-10/" + row.code);
    if (!claim) errors.push(`${where}: Stop 10 row ${row.code} has no source`);
    else if (
      claim.file !== "stop-10" ||
      claim.stamp !== row.stamp ||
      JSON.stringify(claim.keys) !== JSON.stringify(row.keys)
    )
      errors.push(
        `${where}: stop-10/${row.code} does not match the card's place, note and stamp`,
      );
  }
  const english = path.join(root, "assets/games/community-builders/locales/en");
  for (const name of fs.readdirSync(english)) {
    if (!/^stop-\d\d\.json$/.test(name)) continue;
    const file = name.replace(/\.json$/, ""),
      data = JSON.parse(fs.readFileSync(path.join(english, name), "utf8"));
    for (const [space, words] of Object.entries(data))
      if (
        typeof words?.guText === "string" &&
        /\b(?:Georgia|Fulton)\b/.test(words.guText) &&
        !claims.some(
          (claim) =>
            claim.file === file && claim.keys?.includes(space + ".guText"),
        )
      )
        errors.push(
          `${where}: the Georgia note ${file} ${space}.guText has no source`,
        );
  }
  return { errors, records };
}
export function checkProject(root) {
  const errors = [],
    records = [];
  let register = null;
  try {
    register = JSON.parse(fs.readFileSync(path.join(root, REGISTER), "utf8"));
  } catch (error) {
    errors.push(`${REGISTER}: ${error.message}`);
  }
  if (register) {
    const result = checkRegister(root, register);
    errors.push(...result.errors);
    records.push(...result.records);
  }
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
  const root = fileURLToPath(new URL("../", import.meta.url));
  if (process.argv.includes("--fingerprints")) {
    // Print the current wording fingerprints, to record after re-checking a claim's sources.
    const register = JSON.parse(
      fs.readFileSync(path.join(root, REGISTER), "utf8"),
    );
    for (const claim of register.claims)
      console.log(`${claim.id} ${fingerprint(root, claim)}`);
    process.exit(0);
  }
  const result = checkProject(root);
  if (result.errors.length) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  } else
    console.log(
      `Fact sources: ${result.records.length} authored, derived or real-world records; all source references resolve and checked wording is unchanged. Human neutrality review remains separate.`,
    );
}
