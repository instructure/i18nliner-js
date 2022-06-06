const fs = require("fs");
const Handlebars = require("handlebars");
const AbstractProcessor = require("@instructure/i18nliner/abstract_processor");
const PreProcessor = require("./pre_processor");
const Extractor = require("./extractor");

var HbsProcessor = function(translations, options) {
  AbstractProcessor.call(this, translations, options);
};

HbsProcessor.prototype = Object.create(AbstractProcessor.prototype);
HbsProcessor.prototype.constructor = HbsProcessor;

HbsProcessor.prototype.defaultPattern = "**/*.hbs";
HbsProcessor.prototype.Extractor = Extractor;
HbsProcessor.prototype.PreProcessor = PreProcessor;

HbsProcessor.prototype.checkContents = function(source, path, contexts = {}) {
  const ast =  this.preProcess(source, contexts.preProcessor)
  const extractor = new this.Extractor(ast, {path: path, ...contexts.extractor});

  extractor.forEach(function(key, value, context) {
    this.translations.set(key, value, context);
    this.translationCount++;
  }.bind(this));
};

HbsProcessor.prototype.sourceFor = function(file) {
  return fs.readFileSync(file);
};

HbsProcessor.prototype.preProcess = function(source, context) {
  var ast = Handlebars.parse(source.toString());
  this.PreProcessor.process(ast, context);
  return ast;
};

module.exports = HbsProcessor;
