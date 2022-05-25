/*
 * Copyright (C) 2022 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

const dedent = require('dedent')
const {assert} = require('chai')
const Translations = require('@instructure/i18nliner/translation_hash')
const ScopedEsmProcessor = require('../lib/scoped_esm_processor')

describe('ScopedEsmProcessor', () => {
  it('tracks scope through the call to @canvas/i18n#useScope', () => {
    const { translations } = extract(dedent`
      import { useScope } from '@canvas/i18n'
      const I18n = useScope('foo')
      I18n.t('keyed', 'something')
    `)

    assert.deepEqual(translations, {
      foo: {
        keyed: 'something'
      }
    });
  })

  it('tracks scope through the call to a renamed @canvas/i18n#useScope specifier', () => {
    const { translations } = extract(dedent`
      import { useScope as useI18nScope } from '@canvas/i18n'
      const I18n = useI18nScope('foo')
      I18n.t('keyed', 'something')
    `)

    assert.deepEqual(translations, {
      foo: {
        keyed: 'something'
      }
    });
  })

  it('tracks scope through assignment', () => {
    const { translations } = extract(dedent`
      import { useScope } from '@canvas/i18n'

      let I18n

      I18n = useScope('foo')
      I18n.t('keyed', 'something')
    `)

    assert.deepEqual(translations, {
      foo: {
        keyed: 'something'
      }
    });
  })

  it('resolves (i18n) scopes across different lexical scopes', () => {
    const { translations } = extract(dedent`
      import { useScope } from '@canvas/i18n'

      function a() {
        const I18n = useScope('foo')

        I18n.t('key', 'hello')
        I18n.t('inferred')
      }

      function b() {
        let I18n

        I18n = useScope('bar')
        I18n.t('key', 'world')
        I18n.t('inferred')
      }
    `)

    assert.deepEqual(translations, {
      foo: { key: 'hello' },
      bar: { key: 'world' },
      inferred_7cf5962e: 'inferred'
    })
  })

  it('extracts translations', () => {
    const { translations } = extract(dedent`
      import { useScope } from '@canvas/i18n'

      const I18n = useScope('foo')

      I18n.t('#absolute.key', 'Foreign')
      I18n.t('inferred')
      I18n.t('keyed', 'Keyed')
      I18n.t('nested.keyed', 'Nested')
    `)

    assert.deepEqual(translations, {
      absolute: {
        key: 'Foreign',
      },
      foo: {
        keyed: 'Keyed',
        nested: {
          keyed: 'Nested'
        }
      },
      inferred_7cf5962e: 'inferred'
    });
  })

  it('throws if no scope was defined by the time t() was called', () => {
    assert.throws(() => {
      extract(dedent`
        import I18n from '@canvas/i18n'
        I18n.t('hello')
      `)
    }, /unscoped translate call/);
  })

  it('throws if no scope was defined using the "useScope" specifier', () => {
    assert.throws(() => {
      extract(dedent`
        import { useScope } from '@canvas/i18n'
        const I18n = somethingElse('foo')
        I18n.t('hello')
      `)
    }, /unscoped translate call/);
  })

  it('throws if no scope was defined using the "useScope" interface from @canvas/i18n', () => {
    assert.throws(() => {
      extract(dedent`
        function useScope() {}
        const I18n = useScope('foo')
        I18n.t('hello')
      `)
    }, /unscoped translate call/);
  })
});

function extract(source) {
  const processor = new ScopedEsmProcessor(new Translations(), {})

  processor.checkContents(processor.parse(source))

  return processor.translations;
}
