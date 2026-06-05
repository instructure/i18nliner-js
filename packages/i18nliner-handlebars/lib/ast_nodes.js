/*
 * builders for handlebars >= 4 AST nodes (plain objects; the old AST.*
 * constructors were dropped in 2.0). shared by the pre-processor and its
 * canvas-scoped subclass so node construction stays in one place.
 */

/*
 * every node gets a loc: the >= 4 JavaScriptCompiler bakes node.loc into the
 * compiled output for helper calls, so a synthesized node without one emits
 * invalid JS (`"loc":` with no value). these nodes have no real source
 * position, so a zero-width stub is used.
 */
function stubLoc() {
  return { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } };
}

function pathString(path) {
  return path?.original;
}

function stringNode(value) {
  return { type: 'StringLiteral', value: value, original: value, loc: stubLoc() };
}

function booleanNode(value) {
  return { type: 'BooleanLiteral', value: value, original: value, loc: stubLoc() };
}

function pathNode(name) {
  return { type: 'PathExpression', data: false, depth: 0, parts: [name], original: name, loc: stubLoc() };
}

function hashNode(pairs) {
  return { type: 'Hash', pairs: pairs, loc: stubLoc() };
}

function hashPair(key, value) {
  return { type: 'HashPair', key: key, value: value, loc: stubLoc() };
}

function subExpr(path, params, hash) {
  var node = { type: 'SubExpression', path: path, params: params || [], loc: stubLoc() };
  if (hash) node.hash = hash;
  return node;
}

module.exports = {
  pathString: pathString,
  stringNode: stringNode,
  booleanNode: booleanNode,
  pathNode: pathNode,
  hashNode: hashNode,
  hashPair: hashPair,
  subExpr: subExpr
};
