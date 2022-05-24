/* global describe, it */

import Check from '../../lib/commands/check';
import I18nliner from '../../lib/i18nliner';
import {assert} from "chai";

describe('Check', function() {
  describe(".run", function() {
    it("should find errors in js files", function() {
      I18nliner.set('basePath', "test/fixtures/i18n_js", function() {
        var checker = new Check({silent: true});
        checker.run();
        assert.deepEqual(
          checker.translations.translations,
          {"welcome_name_4c6ebc3a": 'welcome, %{name}'}
        );
        assert.equal(checker.errors.length, 1);
        assert.match(checker.errors[0], /invalid signature/);
      });
    });

    it("should find errors in ts files", function() {
      I18nliner.set('basePath', "test/fixtures/i18n_ts", function() {
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
});
