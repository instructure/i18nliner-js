const { config, loadConfig } = require('./config');

exports.AbstractProcessor = require('./processors/abstract_processor');
exports.CallHelpers = require('./call_helpers');
exports.Commands = require('./commands');
exports.config = config;
exports.Errors = require('./errors');
exports.I18nJsExtractor = require('./extractors/i18n_js_extractor');
exports.JsProcessor = require("./processors/js_processor");
exports.TranslateCall = require('./extractors/translate_call');
exports.TranslationHash = require('./extractors/translation_hash');
exports.loadConfig = loadConfig
