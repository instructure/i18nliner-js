const {default: traverse} = require("@babel/traverse");
const {UNSUPPORTED_EXPRESSION} = require('#errors');

module.exports = function extract(ast) {
  const calls = []

  traverse(ast, {
    enter(path) {
      if (path.type === "CallExpression") {
        var callee = path.node.callee;
        var receiver = callee.object;
        var method = callee.property;

        if (isExtractableCall(callee, receiver, method)) {
          calls.push({
            line: receiver.loc.start.line,
            receiver: receiver.name,
            method: method.name,
            // convert nodes to literals where possible
            args: path.node.arguments.map(evaluateExpression),
            path,
          });
        }
      }
    }
  });

  return calls
}

const isExtractableCall = (node, receiver, method) => {
  return node.type === "MemberExpression" &&
    !node.computed &&
    receiver.type === "Identifier" &&
    receiver.name === "I18n" &&
    method.type === "Identifier" &&
    (method.name === "t" || method.name === "translate");
}

const evaluateExpression = (node) => {
  if (node.type === "StringLiteral")
    return node.value;
  if (node.type === "ObjectExpression")
    return objectFrom(node);
  if (node.type === "BinaryExpression" && node.operator === "+")
    return stringFromConcatenation(node);
  if (node.type === "TemplateLiteral")
    return stringFromTemplateLiteral(node);
  return UNSUPPORTED_EXPRESSION;
};

const objectFrom = (node) => {
  const object = {};

  for (const prop of node.properties) {
    const key = evaluatePropName(prop)

    if (typeof key !== 'string') {
      return UNSUPPORTED_EXPRESSION;
    }

    object[key] = evaluateExpression(prop.value);
  }

  return object;
};

const evaluatePropName = ({ key, value }) => {
  if (key.type === 'Identifier') {
    return key.name
  }
  else {
    return evaluateExpression(key)
  }
}

const stringFromConcatenation = (node) => {
  var left = evaluateExpression(node.left);
  var right = evaluateExpression(node.right);
  if (typeof left !== "string" || typeof right !== "string")
    return UNSUPPORTED_EXPRESSION;
  return left + right;
};

const stringFromTemplateLiteral = (node) => {
  if (node.quasis.length === 1 && node.quasis[0].type === "TemplateElement") {
    return node.quasis[0].value.raw;
  }
  return UNSUPPORTED_EXPRESSION;
}
