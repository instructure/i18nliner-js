import clc from "cli-color";

import TranslationHash from "../extractors/translation_hash";
import GenericCommand from "./generic_command";
import JsProcessor from "../processors/js_processor";
import TsProcessor from "../processors/ts_processor";

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
  for (var key in Check.processors) {
    var Processor = Check.processors[key];
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
    if (!(e instanceof Error)) {
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
  var i;

  var translationCount = sum(processors, 'translationCount');
  var fileCount = sum(processors, 'fileCount');
  var elapsed = (new Date()).getTime() - this.startTime;

  if (errors.length) {
    this.print("\n\n");

    for (const error of errors) {
      this.print(red(error) + "\n");
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

Check.processors = { JsProcessor, TsProcessor };

export default Check;
