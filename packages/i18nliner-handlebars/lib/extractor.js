const TCall = require("./t_call");

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
  var statements = ast.statements
    , statementsLen = statements.length
    , i;
  for (i = 0; i < statementsLen; i++) {
    this.processExpression(statements[i]);
  }
}

Extractor.prototype.processExpression = function(statement) {
  switch (statement.type) {
    case 'block':
      this.process(statement.program);
      if (statement.inverse)
        this.process(statement.inverse);
      break;
    case 'mustache':
      this.processSexpr(statement.sexpr);
      break;
    case 'sexpr':
      this.processSexpr(statement);
      break;
  }
}

Extractor.prototype.processSexpr = function(sexpr) {
  var i
    , len
    , items;
  if (sexpr.type === 'sexpr') {
    this.processExpression(sexpr.id);
    items = sexpr.params;
    for (i = 0, len = items.length; i < len; i++) {
      this.processExpression(items[i]);
    }
    if (sexpr.hash) {
      items = sexpr.hash.pairs;
      for (i = 0, len = items.length; i < len; i++) {
        this.processExpression(items[i][1]);
      }
    }
  }
  if (sexpr.id.string === this.helperKey) {
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
