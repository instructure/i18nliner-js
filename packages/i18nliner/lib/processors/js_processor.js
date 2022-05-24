const fs = require("fs");
const { parse } = require("@babel/parser");
const AbstractProcessor = require("./abstract_processor");
const I18nJsExtractor = require("../extractors/i18n_js_extractor");
const {config} = require('../config');

function JsProcessor(translations, options) {
  AbstractProcessor.call(this, translations, options);
}

JsProcessor.prototype = Object.create(AbstractProcessor.prototype);
JsProcessor.prototype.constructor = JsProcessor;
JsProcessor.prototype.defaultPattern = "**/*.js";
JsProcessor.prototype.I18nJsExtractor = I18nJsExtractor;

JsProcessor.prototype.checkContents = function(source) {
  var fileData = this.preProcess(source);
  if (fileData.skip) return;
  fileData.ast = fileData.ast || this.parse(fileData.source);
  var extractor = new this.I18nJsExtractor(fileData);
  extractor.forEach(function(key, value, meta) {
    this.translations.set(key, value, meta);
    this.translationCount++;
  }.bind(this));
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
