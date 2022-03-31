/* global describe, it */
import {assert} from "chai";
import I18nJsExtractor from "../../lib/extractors/i18n_js_extractor";
import Errors from "../../lib/errors";
import JsProcessor from "../../lib/processors/js_processor"

describe("I18nJsExtractor", function() {
  describe(".translations", function() {
    function extract(source) {
      var ast = JsProcessor.prototype.parse(source);
      var extractor = new I18nJsExtractor({ast: ast});
      extractor.run();
      return extractor.translations.translations;
    }

    it("should ignore non-t calls", function() {
      assert.deepEqual(
        extract("foo('Foo')"),
        {}
      );
    });

    it("should not extract t calls with no default", function() {
      assert.deepEqual(
        extract("I18n.t('foo.foo')"),
        {}
      );
    });

    it("should extract valid t calls", function() {
      assert.deepEqual(
        extract("I18n.t('Foo')"),
        {"foo_f44ad75d": "Foo"}
      );
      assert.deepEqual(
        extract("I18n.t('Foo ' + 'Bar')"),
        {"foo_bar_6c8e5736": "Foo Bar"}
      );
      assert.deepEqual(
        extract("I18n.t('bar', 'Baz')"),
        {bar: "Baz"}
      );
      assert.deepEqual(
        extract("I18n.t('bar', `Baz`)"),
        {bar: "Baz"}
      );
      assert.deepEqual(
        extract("I18n.translate('one', {one: '1', other: '2'}, {count: 1})"),
        {one: {one: "1", other: "2"}}
      );
      assert.deepEqual(
        extract("I18n.t({one: 'just one', other: 'zomg lots'}, {count: 1})"),
        {"zomg_lots_a54248c9": {one: "just one", other: "zomg lots"}}
      );
    });

    it("should support jsx and es6", function() {
      assert.deepEqual(
        extract("let foo = () => <b>{I18n.t('Foo', {bar})}</b>"),
        {"foo_f44ad75d": "Foo"}
      );
    });

    it("should bail on invalid t calls", function() {
      assert.throws(function(){
        extract("I18n.t(foo)");
      }, Errors.InvalidSignature);
      assert.throws(function(){
        extract("I18n.t('foo', foo)");
      }, Errors.InvalidSignature);
      assert.throws(function(){
        extract("I18n.t('foo', \"hello \" + man)");
      }, Errors.InvalidSignature);
      assert.throws(function(){
        extract("I18n.t('a', \"a\", {}, {})");
      }, Errors.InvalidSignature);
      assert.throws(function(){
        extract("I18n.t({one: '1', other: '2'})");
      }, Errors.MissingCountValue);
    });

    it("should bail on a t call with an identifier count", function() {
      assert.throws(function() {
        extract(`I18n.t({one: '1', other: '2'}, {count: myVar})`);
      }, Errors.InvalidCountValue);
    });

    it("provides a helpful error message for invalid count errors", function() {
      let errMsg = ''
      try {
        extract(`I18n.t({one: '1', other: '2'}, {count: myVar})`);
      } catch ({message}) {
        errMsg = message
      }
      assert.match(errMsg, /Values for `count` must be wrapped in parseInt\/parseFloat or fall back to a numeric literal/)
    });

    it("should bail on a t call with a null literal count", function() {
      assert.throws(function() {
        extract(`I18n.t({one: '1', other: '2'}, {count: null})`);
      }, Errors.InvalidCountValue);
    });

    it("should bail on a t call with a undefined literal count", function() {
      assert.throws(function() {
        extract(`I18n.t({one: '1', other: '2'}, {count: undefined})`);
      }, Errors.InvalidCountValue);
    });

    it("should bail on a t call with a string literal count", function() {
      assert.throws(function() {
        extract(`I18n.t({one: '1', other: '2'}, {count: 'potato'})`);
      }, Errors.InvalidCountValue);
    });

    it("should bail on a t call with an OR expression with an invalid value on right-hand side for count", function() {
      assert.throws(function() {
        extract(`I18n.t({one: '1', other: '2'}, {count: myVar || 'potato'})`);
      }, Errors.InvalidCountValue);
    });

    it("should bail on a t call with an AND expression with an invalid value on right-hand side for count", function() {
      assert.throws(function() {
        extract(`I18n.t({one: '1', other: '2'}, {count: 5 && myVar})`);
      }, Errors.InvalidCountValue);
    });

    it("should bail on a t call with ternary with an invalid consequent value for count", function() {
      assert.throws(function() {
        extract(`I18n.t({one: '1', other: '2'}, {count: myVar ? myVar : 0})`);
      }, Errors.InvalidCountValue);
    });

    it("should bail on a t call with ternary with an invalid alternate value for count", function() {
      assert.throws(function() {
        extract(`I18n.t({one: '1', other: '2'}, {count: myVar ? 1 : 'potato'})`);
      }, Errors.InvalidCountValue);
    });

    it("should bail on a t call with a custom named function call for count", function() {
      assert.throws(function() {
        extract(`I18n.t({one: '1', other: '2'}, {count: foo(bar)})`);
      }, Errors.InvalidCountValue);
    });

    it("should bail on a t call with builtin named function call (not parseInt or parseFloat) for count", function() {
      assert.throws(function() {
        extract(`I18n.t({one: '1', other: '2'}, {count: Number.isNaN(bar)})`);
      }, Errors.InvalidCountValue);
    });

    it("should not bail when a variable named count is used without plurality", function() {
      assert.doesNotThrow(function() {
        extract(`I18n.t('fast', '%{count}Fast2Furious', {count: null})`)
      })
    });

    it("should not bail on a t call with a number literal count", function() {
      assert.doesNotThrow(function() {
        extract(`I18n.t({one: '1', other: '2'}, {count: 5})`);
      });
    });

    it("should not bail on a t call with an OR expression with valid number on right-hand side for count", function() {
      assert.doesNotThrow(function() {
        extract(`I18n.t({one: '1', other: '2'}, {count: myVar || 0})`);
      });
    });

    it("should not bail on a t call with an AND expression with valid number on right-hand side for count", function() {
      assert.doesNotThrow(function() {
        extract(`I18n.t({one: '1', other: '2'}, {count: myVar && 0})`);
      });
    });

    it("should not bail on a t call with ternary with valid consequent and alternate values for count", function() {
      assert.doesNotThrow(function() {
        extract(`I18n.t({one: '1', other: '2'}, {count: myVar ? 1 : 0 })`);
      });
    });

    it("should not bail on a t call with value passed to Number for count", function() {
      assert.doesNotThrow(function() {
        extract(`I18n.t({one: '1', other: '2'}, {count: Number('1') })`);
      });
    });

    it("should not bail on a t call with value passed to parseInt for count", function() {
      assert.doesNotThrow(function() {
        extract(`I18n.t({one: '1', other: '2'}, {count: parseInt('1', 10) })`);
      });
    });

    it("should not bail on a t call with value passed to parseFloat for count", function() {
      assert.doesNotThrow(function() {
        extract(`I18n.t({one: '1', other: '2'}, {count: parseFloat('1.23') })`);
      });
    });

    it("should not bail on a t call with value passed to Number.parseInt for count", function() {
      assert.doesNotThrow(function() {
        extract(`I18n.t({one: '1', other: '2'}, {count: Number.parseInt('1', 10) })`);
      });
    });

    it("should not bail on a t call with value passed to Number.parseFloat for count", function() {
      assert.doesNotThrow(function() {
        extract(`I18n.t({one: '1', other: '2'}, {count: Number.parseFloat('1.23') })`);
      });
    });
  });

  describe("custom translator implementations", () => {
    it("exposes the path to buildTranslateCall", () => {
      const calls = []

      class CustomI18nJsExtractor extends I18nJsExtractor {
        buildTranslateCall(line, method, args, path) {
          const retValue = I18nJsExtractor.prototype.buildTranslateCall.apply(this, arguments)
          calls.push([line, method, args, path])
          return retValue
        }
      }

      const extractor = new CustomI18nJsExtractor({
        ast: JsProcessor.prototype.parse(`
          I18n.t('hello')
        `)
      });

      extractor.run();

      assert.deepEqual(calls.length, 1)
      assert.ok(calls[0][3])
      assert.include(calls[0][3], { type: 'CallExpression' })
    })
  })
});
