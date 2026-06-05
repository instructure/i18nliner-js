const TCall = require("./t_call");
const { pathString } = require("./ast_nodes");

function Extractor(ast, options){
  options = options || {};
  this.ast = ast;
  this.helperKey = options.helperKey || 't';
}

Extractor.prototype.forEach = function(handler) {
  this.handler = handler;
  this.process(this.ast);
};

Extractor.prototype.buildTranslateCall = function(sexpr) {
  return new TCall(sexpr);
};

Extractor.prototype.process = function(ast) {
  var statements = ast.body
    , statementsLen = statements.length
    , i;
  for (i = 0; i < statementsLen; i++) {
    this.processExpression(statements[i]);
  }
}

Extractor.prototype.processExpression = function(statement) {
  switch (statement.type) {
    case 'BlockStatement':
      this.process(statement.program);
      if (statement.inverse)
        this.process(statement.inverse);
      break;
    case 'MustacheStatement':
      this.processSexpr(statement);
      break;
    case 'SubExpression':
      this.processSexpr(statement);
      break;
  }
}

Extractor.prototype.processSexpr = function(sexpr) {
  var i
    , len
    , items;
  items = sexpr.params;
  for (i = 0, len = items.length; i < len; i++) {
    this.processExpression(items[i]);
  }
  if (sexpr.hash) {
    items = sexpr.hash.pairs;
    for (i = 0, len = items.length; i < len; i++) {
      this.processExpression(items[i].value);
    }
  }
  if (pathString(sexpr.path) === this.helperKey) {
    this.processTranslateCall(sexpr);
  }
}

Extractor.prototype.processTranslateCall = function(sexpr) {
  var call = this.buildTranslateCall(sexpr)
    , translations = call.translations()
    , translation
    , i
    , len;
  for (i = 0, len = translations.length; i < len; i++) {
    translation = translations[i];
    this.handler(translation[0], translation[1], call);
  }
};

module.exports = Extractor;
