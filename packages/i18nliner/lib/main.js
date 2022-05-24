const I18nliner = require('./i18nliner');
const CallHelpers = require('./call_helpers');
const Errors = require('./errors');
const TranslateCall = require('./extractors/translate_call');
const TranslationHash = require('./extractors/translation_hash');
const Commands = require('./commands');

I18nliner.CallHelpers = CallHelpers;
I18nliner.Errors = Errors;
I18nliner.TranslateCall = TranslateCall;
I18nliner.TranslationHash = TranslationHash;
I18nliner.Commands = Commands;

I18nliner.loadConfig();

module.exports = I18nliner;
