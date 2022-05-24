const {
  HbsExtractor,
  HbsTranslateCall
} = require('@instructure/i18nliner-handlebars')
const ScopedHbsTranslateCall = require("./scoped_translate_call")(HbsTranslateCall);
const path = require('path')
const fs = require('fs')

function ScopedHbsExtractor(ast, options) {
  // read the scope from the i18nScope property in the accompanying .json file:
  this.scope = ScopedHbsExtractor.readI18nScopeFromJSONFile(
    // resolve relative to process.cwd() in case it's not absolute
    path.resolve(options.path)
  )

  this.path = options.path // need this for error reporting

  HbsExtractor.apply(this, arguments);
};

ScopedHbsExtractor.prototype = Object.create(HbsExtractor.prototype);
ScopedHbsExtractor.prototype.constructor = ScopedHbsExtractor;

ScopedHbsExtractor.prototype.normalizePath = function(path) {
  return path;
};

ScopedHbsExtractor.prototype.buildTranslateCall = function(sexpr) {
  if (!this.scope) {
    const friendlyFile = path.relative(process.cwd(), this.path)

    throw new Error(`
canvas_i18nliner: expected i18nScope for Handlebars template to be specified in
the accompanying .json file, but found none:

    ${friendlyFile}

To fix this, create the following JSON file with the "i18nScope" property set to
the i18n scope to use for the template (e.g. similar to what you'd do in
JavaScript, like \`import I18n from "i18n!foo.bar"\`):
                                         ^^^^^^^

    // file: ${friendlyFile + '.json'}
    {
      "i18nScope": "..."
    }
`)
  }

  return new ScopedHbsTranslateCall(sexpr, this.scope);
};

ScopedHbsExtractor.readI18nScopeFromJSONFile = function(filepath) {
  const metadataFilepath = `${filepath}.json`

  if (fs.existsSync(metadataFilepath)) {
    return require(metadataFilepath).i18nScope
  }
};

module.exports = ScopedHbsExtractor;
