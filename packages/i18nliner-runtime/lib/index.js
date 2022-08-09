const getSlug = require('speakingurl');
const crc32 = require('crc32');
const ALLOWED_PLURALIZATION_KEYS = ["zero", "one", "few", "many", "other"]
const REQUIRED_PLURALIZATION_KEYS = ["one", "other"]
const UNSUPPORTED_EXPRESSION = Symbol.for('I18nliner.UNSUPPORTED_EXPRESSION')
const config = {
  HtmlSafeString: I18nlinerHtmlSafeString,
  keyPattern: /^(\w+\.)+\w+$/,
  /*
    literal:
      Just use the literal string as its translation key
    underscored:
      Underscored ascii representation of the string, truncated to
      <underscoredKeyLength> bytes
    underscored_crc32:
      Underscored, with a checksum at the end to avoid collisions
  */
  inferredKeyFormat: 'underscored_crc32',
  underscoredKeyLength: 50,
  inferKey: keyifyDefaultValue,
  normalizeDefault: pluralizeSingleWord,
  normalizeKey: identity,
}

exports.ALLOWED_PLURALIZATION_KEYS = ALLOWED_PLURALIZATION_KEYS
exports.REQUIRED_PLURALIZATION_KEYS = REQUIRED_PLURALIZATION_KEYS
exports.configure = configure;
exports.inferArguments = inferArguments;
exports.inferKey = keyifyDefaultValue;
exports.normalizeDefault = pluralizeSingleWord;
exports.extend = extend
exports.isValidDefault = isValidDefault

function extend(I18n, partialConfig) {
  configure(partialConfig);

  // add html-safety hint, i.e. "%h{...}"
  I18n.placeholder = /(?:\{\{|%h?\{)(.*?)(?:\}\}?)/gm;
  I18n.interpolateWithoutHtmlSafety = I18n.interpolate;
  I18n.interpolate = function(message, options) {
    const { HtmlSafeString } = config;

    var needsEscaping = false;
    var matches = message.match(I18n.placeholder) || [];
    var len = matches.length;
    var match;
    var keys = [];
    var key;
    var i;
    var wrappers = options.wrappers || options.wrapper;

    if (wrappers) {
      needsEscaping = true;
      message = htmlEscape(message, HtmlSafeString);
      message = applyWrappers(message, wrappers);
    }

    for (i = 0; i < len; i++) {
      match = matches[i];
      key = match.replace(I18n.placeholder, "$1");
      keys.push(key);
      if (!(key in options)) continue;
      if (match[1] === 'h') options[key] = new HtmlSafeString(options[key]);
      if (options[key] instanceof HtmlSafeString)
        needsEscaping = true;
    }

    if (needsEscaping) {
      if (!wrappers)
        message = htmlEscape(message, HtmlSafeString);
      for (i = 0; i < len; i++) {
        key = keys[i];
        if (!(key in options)) continue;
        options[key] = htmlEscape(options[key], HtmlSafeString);
      }
    }

    message = I18n.interpolateWithoutHtmlSafety(message, options);
    return needsEscaping ? new HtmlSafeString(message) : message;
  };

  I18n.translateWithoutI18nliner = I18n.translate;
  I18n.translate = function() {
    const {normalizeDefault, normalizeKey} = config;
    const [key, options] = inferArguments([].slice.call(arguments));
    const normalKey = normalizeKey(key, options);
    const normalDefaultValue = options.defaultValue
      ? normalizeDefault(options.defaultValue, options)
      : undefined
    ;

    return I18n.translateWithoutI18nliner(normalKey, {
      ...options,
      defaultValue: normalDefaultValue
    });
  };
  I18n.t = I18n.translate;

  return {
    reset: () => {
      I18n.t = I18n.translateWithoutI18nliner
      I18n.translate = I18n.translateWithoutI18nliner
      I18n.interpolate = I18n.interpolateWithoutHtmlSafety
      I18n.interpolateWithoutHtmlSafety = null
      I18n.translateWithoutI18nliner = null
    }
  }
};

function configure(customConfig) {
  const previousConfig = {...config}
  Object.assign(config, customConfig)
  return previousConfig
}

function inferArguments(args, meta) {
  const {inferKey} = config

  if (args.length === 2 && typeof args[1] === 'object' && args[1].defaultValue) {
    return args;
  }

  var hasKey = isKeyProvided(...args);

  if (meta) {
    meta.inferredKey = !hasKey;
  }

  if (!hasKey) {
    args.unshift(null);
  }

  var defaultValue = null;
  var defaultOrOptions = args[1];

  if (args[2] || typeof defaultOrOptions === 'string' || isPluralizationHash(defaultOrOptions)) {
    defaultValue = args.splice(1, 1)[0];
  }

  if (args.length === 1) {
    args.push({});
  }

  var options = args[1];

  if (defaultValue) {
    options.defaultValue = defaultValue;
  }

  if (!hasKey) {
    args[0] = inferKey(defaultValue, options);
  }

  return args;
}

function keyifyDefaultValue(defaultValue, translateOptions) {
  const {normalizeDefault} = config;

  if (isValidDefault(!!defaultValue, translateOptions)) {
    defaultValue = normalizeDefault(defaultValue, translateOptions);

    if (typeof defaultValue === 'object' && defaultValue.other !== UNSUPPORTED_EXPRESSION) {
      defaultValue = "" + defaultValue.other;
    }

    return keyify(defaultValue);
  }
}

function keyify(string) {
  switch (config.inferredKeyFormat) {
    case 'underscored':
      return keyifyUnderscored(string);
    case 'underscored_crc32':
      return keyifyUnderscoredCrc32(string);
    default:
      return string;
  }
}

function keyifyUnderscored(string) {
  return (
    getSlug(string, {separator: '_', lang: false})
      .replace(/[-_]+/g, '_')
      .substring(0, config.underscoredKeyLength)
  );
}

function keyifyUnderscoredCrc32(string) {
  var checksum = crc32(string.length + ":" + string).toString(16);
  return keyifyUnderscored(string) + "_" + checksum;
}

function isValidDefault(allowBlank, defaultValue) {
  return (
    allowBlank &&
    (typeof defaultValue === 'undefined' || defaultValue === null) ||
    typeof defaultValue === 'string' ||
    (defaultValue && typeof defaultValue === 'object')
  );
}

function pluralizeSingleWord(defaultValue, translateOptions) {
  if (typeof defaultValue === 'string' && defaultValue.match(/^[\w-]+$/) && translateOptions && ("count" in translateOptions)) {
    return {one: "1 " + defaultValue, other: "%{count} " + pluralize(defaultValue)};
  }
  else {
    return defaultValue;
  }
}

// PRIVATE

function applyWrappers(string, wrappers) {
  var i;
  var len;
  var keys;
  if (typeof wrappers === 'string')
    wrappers = [wrappers];
  string = string.replace(/\\\\/g, String.fromCharCode(26))
  string = string.replace(/\\\*/g, String.fromCharCode(27))
  if (wrappers instanceof Array) {
    for (i = wrappers.length; i; i--)
      string = applyWrapper(string, new Array(i + 1).join("*"), wrappers[i - 1]);
  }
  else {
    keys = Object.keys(wrappers);
    keys.sort(function(a, b) { return b.length - a.length; }); // longest first
    for (i = 0, len = keys.length; i < len; i++)
      string = applyWrapper(string, keys[i], wrappers[keys[i]]);
  }
  string = string.replace(new RegExp(String.fromCharCode(27), 'g'), '*')
  string = string.replace(new RegExp(String.fromCharCode(26), 'g'), "\\")
  return string;
}

function applyWrapper(string, delimiter, wrapper) {
  var escapedDelimiter = regexpEscape(delimiter);
  var pattern = new RegExp(escapedDelimiter + "(.*?)" + escapedDelimiter, "g");
  return string.replace(pattern, wrapper);
}

function regexpEscape(string) {
  if (typeof string === 'undefined' || string === null) return '';
  return String(string).replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

/**
 * Possible translate signatures:
 *
 * key [, options]
 * key, default_string [, options]
 * key, default_object, options
 * default_string [, options]
 * default_object, options
 **/
function isKeyProvided(keyOrDefault, defaultOrOptions, maybeOptions) {
  if (typeof keyOrDefault === 'object')
    return false;
  if (typeof defaultOrOptions === 'string')
    return true;
  if (maybeOptions)
    return true;
  if (typeof keyOrDefault === 'string' && keyOrDefault.match(config.keyPattern))
    return true;
  return false;
}

function isPluralizationHash(object) {
  if (!object || typeof object !== 'object') {
    return false
  }

  const keys = Object.keys(object)

  return (
    keys.length > 0 &&
    difference(keys, ALLOWED_PLURALIZATION_KEYS).length === 0
  );
}

function difference(a1, a2) {
  var result = [];
  for (var i = 0, len = a1.length; i < len; i++) {
    if (a2.indexOf(a1[i]) === -1)
      result.push(a1[i]);
  }
  return result;
}

// ported pluralizations from active_support/inflections.rb
// (except for cow -> kine, because nobody does that)
const PLURALIZE_SKIP = ['equipment', 'information', 'rice', 'money', 'species', 'series', 'fish', 'sheep', 'jeans'];
const PLURALIZE_PATTERNS = [
  [/person$/i, 'people'],
  [/man$/i, 'men'],
  [/child$/i, 'children'],
  [/sex$/i, 'sexes'],
  [/move$/i, 'moves'],
  [/(quiz)$/i, '$1zes'],
  [/^(ox)$/i, '$1en'],
  [/([m|l])ouse$/i, '$1ice'],
  [/(matr|vert|ind)(?:ix|ex)$/i, '$1ices'],
  [/(x|ch|ss|sh)$/i, '$1es'],
  [/([^aeiouy]|qu)y$/i, '$1ies'],
  [/(hive)$/i, '$1s'],
  [/(?:([^f])fe|([lr])f)$/i, '$1$2ves'],
  [/sis$/i, 'ses'],
  [/([ti])um$/i, '$1a'],
  [/(buffal|tomat)o$/i, '$1oes'],
  [/(bu)s$/i, '$1ses'],
  [/(alias|status)$/i, '$1es'],
  [/(octop|vir)us$/i, '$1i'],
  [/(ax|test)is$/i, '$1es'],
  [/s$/i, 's']
];

function pluralize(string) {
  string = string || '';
  if (PLURALIZE_SKIP.indexOf(string) >= 0) {
    return string;
  }
  for (var i = 0, len = PLURALIZE_PATTERNS.length; i < len; i++) {
    var pair = PLURALIZE_PATTERNS[i];
    if (string.match(pair[0])) {
      return string.replace(pair[0], pair[1]);
    }
  }
  return string + "s";
}

const htmlEntities = {
  "'": "&#39;",
  "&": "&amp;",
  '"': "&quot;",
  ">": "&gt;",
  "<": "&lt;"
};

function htmlEscape(string, HtmlSafeStringType) {
  if (typeof string === 'undefined' || string === null) {
    return '';
  }

  if (string instanceof HtmlSafeStringType) {
    return string.toString();
  }

  return String(string).replace(/[&<>"']/g, function(m) {
    return htmlEntities[m];
  });
}

function I18nlinerHtmlSafeString(string) {
  this.string = (typeof string === 'string' ? string : "" + string);
}

I18nlinerHtmlSafeString.prototype.toString = function() {
  return this.string;
};

function identity(x) {
  return x
}
