const TranslateCall = require("@instructure/i18nliner/translate_call");
const {UNSUPPORTED_EXPRESSION} = require('@instructure/i18nliner/errors');
/*
 * hbs-capable version of TranslateCall
 *
 * normalizes args/etc into literals that TranslateCall can deal with
 */
function TCall(sexpr) {
  var line = sexpr.firstLine
    , method = sexpr.string
    , args = this.processArguments(sexpr);

  TranslateCall.call(this, line, method, args);
}

TCall.prototype = Object.create(TranslateCall.prototype);
TCall.prototype.constructor = TCall;
TCall.META_KEYS = ['i18n_inferred_key']

TCall.prototype.processArguments = function(sexpr) {
  var args = sexpr.params
    , hash = sexpr.hash
    , result = [];
  for (var i = 0, len = args.length; i < len; i++) {
    result.push(this.evaluateExpression(args[i]));
  }
  if (hash) {
    result.push(this.processHash(hash.pairs));
  }
  return result;
};

TCall.prototype.evaluateExpression = function(node) {
  return  node.type === 'STRING' ? node.string : UNSUPPORTED_EXPRESSION;
};

TCall.prototype.processHash = function(pairs) {
  // we need to know about the keys so we can ensure all interpolation
  // placeholders will get a value
  var result = {}
    , len = pairs.length
    , i;
  for (i = 0; i < len; i++) {
    if (this.constructor.META_KEYS.includes(pairs[i][0])) {
      result[pairs[i][0]] = pairs[i][1]
    }
    else {
      result[pairs[i][0]] = UNSUPPORTED_EXPRESSION;
    }
  }
  return result;
};

module.exports = TCall;
