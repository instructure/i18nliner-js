const JsProcessor = require("@instructure/i18nliner/js_processor");
const sinon = require('sinon')
const {assert} = require("chai");
const extract = require("@instructure/i18nliner/i18n_js_extractor");
const {UNSUPPORTED_EXPRESSION} = require('#errors')

describe("extract", function() {
  const parse = source => JsProcessor.prototype.parse(source);

  it('extracts calls to I18n.t', () => {
    const [call] = extract(parse("I18n.t('hi')"))

    assert.ok(call)
    assert.include(call, {
      receiver: 'I18n',
      method: 't',
    })
  })

  it('extracts calls to I18n.translate', () => {
    const [call] = extract(parse("I18n.translate('hi')"))

    assert.ok(call)
    assert.include(call, {
      receiver: 'I18n',
      method: 'translate',
    })
  })

  it("should ignore non-t calls", function() {
    assert.deepEqual(extract(parse("foo('Foo')")), [])
  });

  it("extracts calls even if they have no default value", function() {
    const [call] = extract(parse("I18n.t('foo.bar')"));
    assert.ok(call)
    assert.deepEqual(call.args, ['foo.bar'])
  });

  it("extracts a string literal argument", function() {
    const [call] = extract(parse("I18n.t('Foo')"))

    assert.ok(call)
    assert.deepEqual(call.args, ['Foo'])
  })

  it("extracts a concatenated string", function() {
    const [call] = extract(parse("I18n.t('Foo ' + 'Bar')"))

    assert.ok(call)
    assert.deepEqual(call.args, ['Foo Bar'])
  })

  it("extracts a key with a default value of string literal", function() {
    const [call] = extract(parse("I18n.t('bar', 'Baz')"))

    assert.ok(call)
    assert.deepEqual(call.args, ['bar', 'Baz'])
  })

  it("extracts a key with a default value of template literal", function() {
    const [call] = extract(parse("I18n.t('bar', `Baz`)"))

    assert.ok(call)
    assert.deepEqual(call.args, ['bar', 'Baz'])
  })

  it("extracts a pluralized call", function() {
    const [call] = extract(parse(`
      I18n.t({
        one: 'just one',
        other: 'zomg lots'
      }, {count: 1})
    `))

    assert.ok(call)
    assert.deepEqual(call.args, [
      { one: 'just one', other: 'zomg lots' },
      { count: UNSUPPORTED_EXPRESSION }
    ])
  })

  it("extracts a keyed pluralized call", function() {
    const [call] = extract(parse(`
      I18n.t('one', {
        one: '1',
        other: '2'
      }, { count: 1 })
    `))

    assert.ok(call)
    assert.deepEqual(call.args, [
      'one',
      { one: '1', other: '2' },
      { count: UNSUPPORTED_EXPRESSION }
    ])
  })

  it("should support jsx and es6", function() {
    const [call] = extract(parse(`
      let foo = () => <b>{I18n.t('Foo', {bar})}</b>`
    ))

    assert.ok(call)
    assert.deepEqual(call.args, ['Foo', {bar: UNSUPPORTED_EXPRESSION}])
  });

  it('marks it when an argument is an unsupported expression', () => {
    const [call] = extract(parse("I18n.t(foo)"));
    assert.ok(call)
    assert.equal(call.args[0], UNSUPPORTED_EXPRESSION)
  })

  it('marks it when an argument is an unsupported expression 2', () => {
    const [call] = extract(parse("I18n.t('foo', foo)"));
    assert.ok(call)
    assert.equal(call.args[1], UNSUPPORTED_EXPRESSION)
  })

  it('exposes the path', () => {
    const [call] = extract(parse("I18n.t('hi')"))
    const {NodePath} = require('@babel/traverse')
    assert.ok(call)
    assert.ok(call.path instanceof NodePath)
  })
})
