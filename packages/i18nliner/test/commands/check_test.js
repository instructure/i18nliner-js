/* global describe, it */

const Check = require('../../lib/commands/check');
const {configureAndReset} = require("#test_util");
const {assert} = require("chai");

describe('Check', function() {
  const configureOnce = configureAndReset()

  describe(".run", function() {
    it("should find errors in js files", function() {
      configureOnce({
        basePath: "test/fixtures/i18n_js"
      })

      var checker = new Check({silent: true});
      checker.run();
      assert.deepEqual(
        checker.translations.translations,
        {"welcome_name_4c6ebc3a": 'welcome, %{name}'}
      );
      assert.equal(checker.errors.length, 1);
      assert.match(checker.errors[0], /invalid signature/);
    });

    it("should find errors in ts files", function() {
      configureOnce({
        basePath: "test/fixtures/i18n_ts"
      })

      var checker = new Check({silent: true});
      checker.run();
      assert.deepEqual(
        checker.translations.translations,
        {"welcome_fname_45c9b6bf": 'welcome, %{fname}'}
      );
      assert.equal(checker.errors.length, 1);
      assert.match(checker.errors[0], /invalid signature/);
    });
  });
});
