"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _parser = require("@babel/parser");

var _js_processor = _interopRequireDefault(require("./js_processor"));

var _i18nliner = _interopRequireDefault(require("../i18nliner"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function TsProcessor(translations, options) {
  _js_processor.default.call(this, translations, options);
}

TsProcessor.prototype = Object.create(_js_processor.default.prototype);
TsProcessor.prototype.constructor = TsProcessor;
TsProcessor.prototype.defaultPattern = ["**/*.ts", "**/*.tsx"];

TsProcessor.prototype.parse = function (source) {
  return (0, _parser.parse)(source, {
    plugins: [..._i18nliner.default.config.babylonPlugins, "typescript"],
    sourceType: "module"
  });
};

var _default = TsProcessor;
exports.default = _default;
