/* global describe, it */

const Export = require('../../lib/commands/export');
const {set} = require('../../lib/config');
const {assert} = require("chai");
const fs = require("fs");
const temp = require("temp");
const rimraf = require("rimraf");

describe('Export', function() {
  describe(".run", function() {
    it("should dump translations in utf8", function() {
      var tmpDir = temp.mkdirSync();
      set('basePath', tmpDir, function() {
        var exporter = new Export({silent: true});
        exporter.checkFiles = function() {
          this.translations = {translations: {i18n: "Iñtërnâtiônàlizætiøn"}};
        };
        exporter.run();
        assert.deepEqual(
          {en: {i18n: "Iñtërnâtiônàlizætiøn"}},
          JSON.parse(fs.readFileSync(exporter.outputFile))
        );
      });
      rimraf.sync(tmpDir);
    });
  });
});

