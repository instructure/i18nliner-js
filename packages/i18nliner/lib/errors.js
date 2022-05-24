const CallHelpers = require("./call_helpers");

function wordify(string) {
  return string.replace(/[A-Z]/g, function(s) {
    return " " + s.toLowerCase();
  }).trim();
}

function parseDetails(details) {
  var parts = [];
  var part;
  if (typeof details === "string" || !details.length) details = [details];
  for (var i = 0; i < details.length; i++) {
    part = details[i];
    part = part === CallHelpers.UNSUPPORTED_EXPRESSION ?
      "<unsupported expression>" :
      JSON.stringify(part);
    parts.push(part);
  }

  return parts.join(', ');
}

var Errors = {
  register: function(name) {
    const klass = class extends Error {
      constructor(line, details) {
        if (details) {
          super(wordify(name) + ": " + parseDetails(details))
        }
        else {
          super(wordify(name))
        }

        this.name = name;
        this.line = line;
      }
    };
    klass.name = name;
    this[name] = klass;
  }
};

Errors.register('InvalidSignature');
Errors.register('InvalidPluralizationKey');
Errors.register('MissingPluralizationKey');
Errors.register('InvalidPluralizationDefault');
Errors.register('MissingInterpolationValue');
Errors.register('MissingCountValue');
Errors.register('InvalidOptionKey');
Errors.register('KeyAsScope');
Errors.register('KeyInUse');

module.exports = Errors;
