/* global describe, it */

const Export = require('../../lib/commands/export');
const {configureAndReset} = require("#test_util");
const {assert} = require("chai");
const fs = require("fs");
const temp = require("temp");
const rimraf = require("rimraf");

describe('Export', function() {
  const configureOnce = configureAndReset()

  describe(".run", function() {
    let tmpDir

    beforeEach(() => {
      tmpDir = temp.mkdirSync();
    })

    afterEach(() => {
      rimraf.sync(tmpDir);
    })

    it("should dump translations in utf8", function() {
      configureOnce({ basePath: tmpDir })

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
  });
});

