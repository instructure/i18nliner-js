const AbstractProcessor = require("./abstract_processor");
const extract = require("./js_processor/i18n_js_extractor");
const fs = require("fs");
const TranslateCall = require("./js_processor/translate_call");
const {parse} = require("@babel/parser");
const {config} = require('../config');

function JsProcessor(translations, options) {
  AbstractProcessor.call(this, translations, options);
}

JsProcessor.prototype = Object.create(AbstractProcessor.prototype);
JsProcessor.prototype.constructor = JsProcessor;
JsProcessor.prototype.defaultPattern = "**/*.js";

JsProcessor.prototype.checkContents = function(source) {
  var fileData = this.preProcess(source);
  if (fileData.skip) return;
  const ast = fileData.ast || this.parse(fileData.source);

  for (const {line, method, args, path} of extract(ast)) {
    var call = new TranslateCall(line, method, args, path);
    var translations = call.translations();

    for (var i = 0, len = translations.length; i < len; i++) {
      const key = translations[i][0];
      const value = translations[i][1]
      const meta = call

      this.translations.set(key, value, meta);
      this.translationCount++;
    }
  }
};

JsProcessor.prototype.sourceFor = function(file) {
  return fs.readFileSync(file).toString();
};

JsProcessor.prototype.parse = function(source) {
  return parse(source, { plugins: config.babylonPlugins, sourceType: "module" });
};

JsProcessor.prototype.preProcess = function(source) {
  return {
    source: source,
    skip: !source.match(/I18n\.t/)
  };
};

module.exports = JsProcessor;
