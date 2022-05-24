const { Errors } = require("@instructure/i18nliner");

Errors.register('TBlockNestingError');
Errors.register('UnwrappableContentError');
Errors.register('MultipleSubExpressionsError');

module.exports = Errors;
