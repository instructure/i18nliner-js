import { parse } from "@babel/parser";
import JsProcessor from "./js_processor";
import I18nliner from "../i18nliner";

function TsProcessor(translations, options) {
  JsProcessor.call(this, translations, options);
}

TsProcessor.prototype = Object.create(JsProcessor.prototype);
TsProcessor.prototype.constructor = TsProcessor;
TsProcessor.prototype.defaultPattern = ["**/*.ts", "**/*.tsx"];

TsProcessor.prototype.parse = function (source) {
  return parse(source, {
    plugins: [...I18nliner.config.babylonPlugins, "typescript"],
    sourceType: "module",
  });
};

export default TsProcessor;
