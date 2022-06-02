const Errors = require("#errors");
const {
  ALLOWED_PLURALIZATION_KEYS,
  REQUIRED_PLURALIZATION_KEYS,
  inferArguments,
  normalizeDefault,
  isValidDefault,
} = require('@instructure/i18nliner-runtime')

function TranslateCall(line, method, args) {
  this.line = line;
  this.method = method;

  this.normalizeArguments(args);

  this.validate();
  this.normalize();
}

TranslateCall.prototype.validate = function() {
  this.validateKey();
  this.validateDefault();
  this.validateOptions();
};

TranslateCall.prototype.normalize = function() {
  this.defaultValue = normalizeDefault(this.defaultValue, this.options || {});
};

TranslateCall.prototype.translations = function() {
  var key = this.key;
  var defaultValue = this.defaultValue;

  if (!defaultValue)
    return [];
  if (typeof defaultValue === 'string')
    return [[key, defaultValue]];

  var translations = [];
  for (var k in defaultValue) {
    if (defaultValue.hasOwnProperty(k)) {
      translations.push([key + "." + k, defaultValue[k]]);
    }
  }
  return translations;
};

TranslateCall.prototype.validateKey = function() {};

TranslateCall.prototype.validateDefault = function() {
  var defaultValue = this.defaultValue;
  if (typeof defaultValue === 'object') {
    var defaultKeys = Object.keys(defaultValue);
    var dKeys;
    if ((dKeys = difference(defaultKeys, ALLOWED_PLURALIZATION_KEYS)).length > 0)
      throw new Errors.InvalidPluralizationKey(this.line, dKeys);
    if ((dKeys = difference(REQUIRED_PLURALIZATION_KEYS, defaultKeys)).length > 0)
      throw new Errors.MissingPluralizationKey(this.line, dKeys);

    for (var k in defaultValue) {
      if (defaultValue.hasOwnProperty(k)) {
        var v = defaultValue[k];
        if (typeof v !== 'string')
          throw new Errors.InvalidPluralizationDefault(this.line);
        this.validateInterpolationValues(k, v);
      }
    }
  }
  else {
    this.validateInterpolationValues(this.key, this.defaultValue);
  }
};

/**
 * Possible translate signatures:
 *
 * key [, options]
 * key, default_string [, options]
 * key, default_object, options
 * default_string [, options]
 * default_object, options
 **/
TranslateCall.prototype.normalizeArguments = function(args) {
  if (!args.length)
    throw new Errors.InvalidSignature(this.line, args);

  var others = inferArguments(args.slice(), this);
  var key = this.key = others.shift();
  var options = this.options = others.shift();

  if (others.length)
    throw new Errors.InvalidSignature(this.line, args);
  if (typeof key !== 'string')
    throw new Errors.InvalidSignature(this.line, args);
  if (options === Errors.UNSUPPORTED_EXPRESSION)
    throw new Errors.InvalidSignature(this.line, args);
  if (options && typeof options !== 'object')
    throw new Errors.InvalidSignature(this.line, args);
  if (options) {
    this.defaultValue = options.defaultValue;
    delete options.defaultValue;
  }
  if (!isValidDefault(true, this.defaultValue))
    throw new Errors.InvalidSignature(this.line, args);
};

TranslateCall.prototype.validateInterpolationValues = function(key, defaultValue) {
  var match;
  var pattern = /%\{([^\}]+)\}/g;
  var options = this.options;
  var placeholder;
  while ((match = pattern.exec(defaultValue)) !== null) {
    placeholder = match[1];
    if (!(placeholder in options))
      throw new Errors.MissingInterpolationValue(this.line, placeholder);
  }
};

TranslateCall.prototype.validateOptions = function() {
  var options = this.options;
  if (typeof this.defaultValue === 'object' && (!options || !options.count))
    throw new Errors.MissingCountValue(this.line);
  if (options) {
    for (var k in options) {
      if (typeof k !== 'string')
        throw new Errors.InvalidOptionKey(this.line);
    }
  }
};

module.exports = TranslateCall;

function difference(a1, a2) {
  var result = [];
  for (var i = 0, len = a1.length; i < len; i++) {
    if (a2.indexOf(a1[i]) === -1)
      result.push(a1[i]);
  }
  return result;
}
