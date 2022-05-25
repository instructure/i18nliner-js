const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");
const Check = require("./check");
const I18nliner = require('../config');

function Export(options) {
  Check.call(this, options);
}

Export.prototype = Object.create(Check.prototype);
Export.prototype.constructor = Export;

Export.prototype.run = function() {
  var success = Check.prototype.run.call(this);
  var locale = 'en';
  var translations = {};
  translations[locale] = this.translations.translations;
  this.outputFile = path.resolve(this.options.outputFile ||
    (I18nliner.config.basePath + "/config/locales/generated/" + locale + ".json")
  );
  mkdirp.sync(path.dirname(this.outputFile));
  if (success) {
    fs.writeFileSync(this.outputFile, JSON.stringify(translations));
    this.print("Wrote default translations to " + this.outputFile + "\n");
  }
  return success;
};

module.exports = Export;
