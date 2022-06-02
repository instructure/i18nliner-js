const Errors = require("@instructure/i18nliner/errors");
const JsProcessor = require("../lib/processors/js_processor");
const TranslationHash = require("@instructure/i18nliner/translation_hash");
const {assert} = require("chai");

describe("JsProcessor.checkContents", function() {
  function subject(source) {
    const translations = new TranslationHash();
    const processor = new JsProcessor(translations, {})

    processor.checkContents(source)

    return translations.translations
  }

  it("should ignore non-t calls", function() {
    assert.deepEqual(
      subject("foo('Foo')"),
      {}
    );
  });

  it("should not extract t calls with no default", function() {
    assert.deepEqual(
      subject("I18n.t('foo.foo')"),
      {}
    );
  });

  it("should extract valid t calls", function() {
    assert.deepEqual(
      subject("I18n.t('Foo')"),
      {"foo_f44ad75d": "Foo"}
    );
    assert.deepEqual(
      subject("I18n.t('Foo ' + 'Bar')"),
      {"foo_bar_6c8e5736": "Foo Bar"}
    );
    assert.deepEqual(
      subject("I18n.t('bar', 'Baz')"),
      {bar: "Baz"}
    );
    assert.deepEqual(
      subject("I18n.t('bar', `Baz`)"),
      {bar: "Baz"}
    );
    assert.deepEqual(
      subject("I18n.translate('one', {one: '1', other: '2'}, {count: 1})"),
      {one: {one: "1", other: "2"}}
    );
    assert.deepEqual(
      subject("I18n.t({one: 'just one', other: 'zomg lots'}, {count: 1})"),
      {"zomg_lots_a54248c9": {one: "just one", other: "zomg lots"}}
    );
  });

  it("should support jsx and es6", function() {
    assert.deepEqual(
      subject("let foo = () => <b>{I18n.t('Foo', {bar})}</b>"),
      {"foo_f44ad75d": "Foo"}
    );
  });

  it('rejects an identifier argument', () => {
    assert.throws(function(){
      subject("I18n.t(foo)");
    }, Errors.InvalidSignature);
  })

  it('rejects a key with an identifier for a defaultValue', () => {
    assert.throws(function(){
      subject("I18n.t('foo', foo)");
    }, Errors.InvalidSignature);
  })

  it('rejects a non-parseable defaultValue', () => {
    assert.throws(function(){
      subject("I18n.t('foo', \"hello \" + man)");
    }, Errors.InvalidSignature);
  })

  it('rejects invalid signature', () => {
    assert.throws(function(){
      subject("I18n.t('a', \"a\", {}, {})");
    }, Errors.InvalidSignature);
  })

  it("rejects pluralized calls with no count argument", function() {
    assert.throws(function(){
      subject("I18n.t({one: '1', other: '2'})");
    }, Errors.MissingCountValue);
  });
});
