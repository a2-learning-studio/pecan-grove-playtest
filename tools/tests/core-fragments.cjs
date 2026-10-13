/* Legacy unit doubles consume the real modular function/statement bodies.
   ctx is their VM global object; no function source is rewritten. */
const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('espree');
const base = path.join(__dirname, '../../assets/games/community-builders');
function readModule(name) {
  const filename = name === 'data' ? path.join(base, 'data/catalog.js') : path.join(base, 'engine/core', name + '.js');
  const source = fs.readFileSync(filename, 'utf8');
  const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'module', range: true });
  return { source, body: ast.body.find(n => n.type === 'ExportDefaultDeclaration').declaration.body.body };
}
const names = () => fs.readdirSync(path.join(base, 'engine/core')).filter(n => n.endsWith('.js')).map(n => n.slice(0, -3)).concat('data');
const emit = (source, nodes) => 'var ctx=this;\n' + nodes.map(n => source.slice(...n.range)).join('\n');
function sectionSource(name) {
  const { source, body } = readModule(name);
  return emit(source, body.filter(n => !(n.type === 'ExpressionStatement' && ['publish', 'bind'].includes(n.expression.callee?.property?.name))));
}
function findNode(predicate) {
  for (const name of names()) {
    const { source, body } = readModule(name);
    const node = body.find(predicate);
    if (node) return emit(source, [node]);
  }
  throw new Error('Core fixture cannot locate actual module declaration');
}
const functionSource = name => findNode(n => n.type === 'FunctionDeclaration' && n.id.name === name);
const variableSource = name => findNode(n => n.type === 'VariableDeclaration' && n.declarations.some(d => d.id.name === name));
const objectStatementSource = name => findNode(n => n.type === 'ExpressionStatement' && n.expression.type === 'AssignmentExpression' && n.expression.left.property?.name === name);
const dataSource = () => sectionSource('words') + '\n' + sectionSource('data');
module.exports = { functionSource, variableSource, objectStatementSource, sectionSource, dataSource };
