/* global describe, it */

const {assert} = require("chai");
const TranslationHash = require("@instructure/i18nliner/translation_hash");
const HbsProcessor = require("../lib/hbs_processor");

describe("HbsProcessor", function() {
  describe("checkContents", function() {
    it("should extract valid translation calls", function() {
      var translations = new TranslationHash();
      var processor = new HbsProcessor(translations, {});

      processor.checkContents(
        '{{t "Inline!"}}                        \n' +
        '{{#t}}                                 \n' +
        '  Zomg a block                         \n' +
        '  <a href="/nesting"                   \n' +
        '     title="{{#t}}what is this?{{/t}}" \n' +
        '     >with nesting</a>!!!              \n' +
        '{{/t}}');

      assert.deepEqual(
        translations.translations,
        {
          "inline_577fe3d3": "Inline!",
          "what_is_this_1a5e67": "what is this?",
          "zomg_a_block_with_nesting_8cd2f66c": "Zomg a block *with nesting*!!!"
        }
      );
    });
  });
});
