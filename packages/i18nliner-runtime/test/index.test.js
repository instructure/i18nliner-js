const { assert } = require("chai")
const { extend, inferArguments, inferKey } = require('@instructure/i18nliner-runtime')
const I18n = require('i18n-js')
const sinon = require('sinon')
const extendAndReset = () => {
  let reset

  afterEach(() => {
    if (reset) {
      reset()
    }
  })

  return (...args) => {
    reset = extend(...args).reset
  }
}

describe('extend', () => {
  const extend = extendAndReset()

  it('works', () => {
    extend(I18n, {})
    I18n.translate('foo')
  })
})

describe('I18n.CallHelpers.inferArguments', () => {
  // no idea what this implies, but this test is written 8 years after the code
  it('does nothing if the second argument is an object containing defaultValue', () => {
    const args = [null, { defaultValue: 'a' }]
    assert.equal(inferArguments(args), args)
  })

  it('infers key when none is provided', () => {
    assert.equal(inferArguments(['Hello World'])[0], 'hello_world_e2033670')
  })

  it('otherwise uses the provided key', () => {
    assert.equal(inferArguments(['foo.bar'])[0], 'foo.bar')
  })

  it('assigns meta.inferredKey when no key is provided', () => {
    const meta = {}
    inferArguments(['foo.bar'], meta)
    assert.equal(meta.inferredKey, false)
    inferArguments(['Hello World'], meta)
    assert.equal(meta.inferredKey, true)
  })

  it('infers key from the "other" value given a pluralization hash', () => {
    assert.equal(inferArguments([{
      one: 'one banana',
      other: 'many bananas'
    }])[0], 'many_bananas_155431f8')
  })

  it('expands into a pluralization hash given a default value that is a hyphenated word', () => {
    assert.equal(inferArguments(['Banana', {
      count: 3
    }])[0], 'count_bananas_d9ee02b9')
  })
})

describe('I18n.interpolate', () => {
  const extend = extendAndReset()
  class HtmlSafeString {
    constructor(x) {
      this.value = x
    }

    toString() {
      return this.value
    }
  }

  it('interpolates {{wrappers}}', () => {
    extend(I18n, {})
    assert.equal(I18n.t('foo {{bar}}', { bar: 'baz' }), 'foo baz')
  })

  it('interpolates %{} wrappers', () => {
    extend(I18n, {})
    assert.equal(I18n.t('foo %{bar}', { bar: 'baz' }), 'foo baz')
  })

  it("does not escape anything if none of the components are marked html-safe", function() {
    extend(I18n, {})
    assert.equal(
      I18n.interpolate("hello & good day, %{name}", {name: "<script>"}),
      "hello & good day, <script>"
    )
  })

  it("should html-escape the string and other values if any placeholder is flagged as html-safe", function() {
    extend(I18n, {})

    assert.equal(
      I18n.interpolate("type %{input} & you get this: %h{output}", {
        input: "<input>",
        output: "<input>",
      }).toString(),

      "type &lt;input&gt; &amp; you get this: <input>"
    )
  })

  it("should html-escape the string and other values if any value is an HtmlSafeString", function() {
    extend(I18n, { HtmlSafeString })

    assert.equal(
      I18n.interpolate("type %{input} & you get this: %{output}", {
        input: '<input>',
        output: new HtmlSafeString('<input>')
      }).toString(),
      "type &lt;input&gt; &amp; you get this: <input>"
    )
  })

  describe('wrappers', function() {
    beforeEach(() => extend(I18n, { HtmlSafeString }))

    it("should apply a single wrapper", function() {
      var result = I18n.translate("Hello *bob*.", {wrapper: '<b>$1</b>'});
      assert.equal(result.toString(), "Hello <b>bob</b>.");
    });

    it("should be html-safe", function() {
      var result = I18n.translate("Hello *bob*.", {wrapper: '<b>$1</b>'});
      assert(result instanceof HtmlSafeString);
    });

    it("should apply multiple wrappers", function() {
      var result = I18n.translate("Hello *bob*. Click **here**", {wrappers: ['<b>$1</b>', '<a href="/">$1</a>']});
      assert.equal(result, "Hello <b>bob</b>. Click <a href=\"/\">here</a>");
    });

    it("should apply multiple wrappers with arbitrary delimiters", function() {
      var result = I18n.translate("Hello !!!bob!!!. Click ???here???", {wrappers: {'!!!': '<b>$1</b>', '???': '<a href="/">$1</a>'}});
      assert.equal(result, "Hello <b>bob</b>. Click <a href=\"/\">here</a>");
    });

    it("should html-escape the default when applying wrappers", function() {
      var result = I18n.translate("*bacon* > narwhals", {wrappers: ['<b>$1</b>']});
      assert.equal(result, "<b>bacon</b> &gt; narwhals");
    });

    it("should interpolate placeholders in the wrapper", function() {
      var result = I18n.translate("ohai *click here*", {wrapper: '<a href="%{url}">$1</a>', url: "about:blank"});
      assert.equal(result, 'ohai <a href="about:blank">click here</a>');
    });

    it("should allow escaping asterisks and backslashes", function() {
      var result = I18n.translate("Hello \\\\*b\\*b*.", {wrapper: '<b>$1</b>'})
      assert.equal(result.value, 'Hello \\<b>b*b</b>.')
    });
  });
})

describe('I18n.translate (old specs)', () => {
  const extend = extendAndReset()

  beforeEach(() => extend(I18n, {}))

  it("should should normalize the arguments passed into the original translate", function() {
    var spy = sinon.spy(I18n, "translateWithoutI18nliner");
    assert.equal(
      I18n.translate("Hello %{name}", {name: "bob"}),
      "Hello bob"
    );
    assert.deepEqual(
      ["hello_name_84ff273f", {defaultValue: "Hello %{name}", name: "bob"}],
      spy.args[0]
    );
    spy.restore();
  });

  it("should infer pluralization objects", function() {
    var spy = sinon.spy(I18n, "translateWithoutI18nliner");
    I18n.translate("light", {count: 1});
    assert.deepEqual(
      ["count_lights_58339e29", {defaultValue: {one: "1 light", other: "%{count} lights"}, count: 1}],
      spy.args[0]
    );
    spy.restore();
  });
})

describe('I18n.translate', () => {
  const extend = extendAndReset()

  afterEach(() => {
    I18n.translations = {}
  })

  it('infers arguments and performs a lookup', () => {
    extend(I18n, {})

    I18n.translations = {}
    I18n.translations['en'] = {
      [`${inferKey('hi!')}`]: 'HAH'
    }

    I18n.defaultLocale = 'en'
    I18n.locale = 'en'

    assert.equal(I18n.translate('hi!'), 'HAH');
  })

  it('returns defaultValue when no record was found', () => {
    extend(I18n, {})

    assert.equal(I18n.translate('hi!'), 'hi!');
  })

  it('normalizes key', () => {
    const normalizeKey = sinon.spy(x => x)

    extend(I18n, { normalizeKey })

    I18n.t('foo.bar')
    sinon.assert.calledWith(normalizeKey, 'foo.bar')
  })

  // no idea what kind of shape inferArguments expects or returns, punting on
  // this if/until that changes
  it('normalizes default value')

  it('forwards normals to i18n-js', () => {
    const originalTranslate = sinon.spy(I18n, 'translate')
    extend(I18n, {})
    I18n.t('foo.bar')
    sinon.assert.calledWith(originalTranslate, 'foo.bar')
  })

  it('aliases I18n.translate as I18n.t', () => {
    extend(I18n, {})
    assert(I18n.t === I18n.translate)
  })

  it('truncates inferred key when they exceed the threshold', () => {
    const longString = new Array(100).join("trolololo");
    const maxKeyLength = 50

    extend(I18n, {
      inferredKeyFormat: 'underscored',
      underscoredKeyLength: maxKeyLength,
    })

    I18n.translations['en'] = {
      [longString.slice(0, maxKeyLength)]: 'hah!'
    }

    assert.equal(I18n.t(longString), 'hah!')
  })
})