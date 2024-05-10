const clc = require("cli-color");
const TranslationHash = require("../translation_hash");
const GenericCommand = require("./generic_command");
const Errors = require('../errors')
const {config, defaults} = require('../config')

defaults.processors.JsProcessor = require('../processors/js_processor');
defaults.processors.TsProcessor = require('../processors/ts_processor');

var red = clc.red;
var green = clc.green;

function sum(array, prop) {
  var total = 0;
  for (var i = 0, len = array.length; i < len; i++) {
    total += array[i][prop];
  }
  return total;
}

function Check(options) {
  GenericCommand.call(this, options);
  this.errors = [];
  this.translations = new this.TranslationHash();
  this.setUpProcessors();
}

Check.prototype = Object.create(GenericCommand.prototype);
Check.prototype.constructor = Check;

Check.prototype.TranslationHash = TranslationHash;

Check.prototype.setUpProcessors = function() {
  this.processors = [];
  for (const Processor of Object.values(config.processors)) {
    this.processors.push(
      new Processor(this.translations, {
        translations: this.translations,
        checkWrapper: this.checkWrapper.bind(this),
        only: this.options.only,
        directory: this.options.directory
      })
    );
  }
};

Check.prototype.checkFiles = function() {
  for (var i = 0; i < this.processors.length; i++) {
    this.processors[i].checkFiles();
  }
};

Check.prototype.checkWrapper = function(file, checker) {
  try {
    checker(file);
    this.print(green("."));
  } catch (e) {
    const friendlyFile = file.startsWith(process.cwd()) ?
      file.slice(process.cwd().length + 1) :
      file
    ;

    if (Errors.hasOwnProperty(e.constructor.name)) {
      this.errors.push(`${friendlyFile}:${e.line}: ${e.message}`);
      this.print(red("F"));
    }
    else {
      this.errors.push(`${friendlyFile}: InternalError: ${e.message}\n${e.stack}`)
      this.print(red("F"));
    }
  }
};

Check.prototype.isSuccess = function() {
  return !this.errors.length;
};

Check.prototype.printSummary = function() {
  var processors = this.processors;
  var summary;
  var errors = this.errors;
  var errorsLen = errors.length;

  var translationCount = sum(processors, 'translationCount');
  var fileCount = sum(processors, 'fileCount');
  var elapsed = (new Date()).getTime() - this.startTime;

  if (errors.length) {
    this.print("\n\n");

    for (const error of errors) {
      this.print(red(error) + "\n", 'error');
    }

    this.print("\n");
  }

  this.print("Finished in " + (elapsed / 1000) + " seconds\n\n");
  summary = fileCount + " files, " + translationCount + " strings, " + errorsLen + " failures";
  this.print((this.isSuccess() ? green : red)(summary) + "\n");
};

Check.prototype.run = function() {
  this.startTime = (new Date()).getTime();
  this.checkFiles();
  this.printSummary();
  return this.isSuccess();
};

module.exports = Check;
