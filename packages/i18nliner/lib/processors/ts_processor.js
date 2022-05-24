const { parse } = require("@babel/parser");
const JsProcessor = require("./js_processor");
const {config} = require("../config");

function TsProcessor(translations, options) {
  JsProcessor.call(this, translations, options);
}

TsProcessor.prototype = Object.create(JsProcessor.prototype);
TsProcessor.prototype.constructor = TsProcessor;
TsProcessor.prototype.defaultPattern = ["**/*.ts", "**/*.tsx"];

TsProcessor.prototype.parse = function (source) {
  return parse(source, {
    plugins: [...config.babylonPlugins, "typescript"],
    sourceType: "module",
  });
};

module.exports = TsProcessor;
