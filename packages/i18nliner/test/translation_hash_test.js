const {assert} = require("chai");
const TranslationHash = require('@instructure/i18nliner/translation_hash');
const Errors = require('@instructure/i18nliner/errors');

describe("TranslationHash", function() {
  describe(".set", function() {
    it("should accept identical key/values", function() {
      var hash = new TranslationHash();
      hash.set("foo.bar", "Foo", {});
      hash.set("foo.bar", "Foo", {});
      assert.deepEqual(hash.translations, {foo: {bar: "Foo"}});
    });

    it("should reject mismatched values", function() {
      assert.throws(function() {
        var hash = new TranslationHash();
        hash.set("foo.bar", "Foo", {});
        hash.set("foo.bar", "Bar", {});
      }, Errors.KeyInUse);
    });

    it("should not let you use a key as a scope", function() {
      assert.throws(function() {
        var hash = new TranslationHash();
        hash.set("foo", "Foo", {});
        hash.set("foo.bar", "Bar", {});
      }, Errors.KeyAsScope);
    });

    it("should not let you use a scope as a key", function() {
      assert.throws(function() {
        var hash = new TranslationHash();
        hash.set("foo.bar", "Bar", {});
        hash.set("foo", "Foo", {});
      }, Errors.KeyAsScope);
    });
  });
});

