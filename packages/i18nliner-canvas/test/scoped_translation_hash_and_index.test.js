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

const {assert} = require('chai');
const ScopedEsmProcessor = require('../lib/scoped_esm_processor')
const ScopedTranslationHashAndIndex = require('../lib/scoped_translation_hash_and_index');

describe("ScopedTranslationHashAndIndex", function() {
  it('forwards key and scope', () => {
    const [phrase] = subject(`
      import { useScope } from '@canvas/i18n'
      const I18n = useScope('foo')
      I18n.t('hello_world', 'Hello World!')
    `)

    assert.include(phrase, {
      scope: 'foo',
      key: 'foo.hello_world',
    })
  })

  it('extracts the first fragment as a scope from an absolute key', () => {
    const [phrase] = subject(`
      import { useScope } from '@canvas/i18n'
      const I18n = useScope('foo')
      I18n.t('#buttons.submit', 'Submit')
    `)

    assert.include(phrase, {
      scope: 'buttons',
      key: 'buttons.submit',
      used_in: 'foo',
    })
  })

  it('otherwise omits "used_in"', () => {
    const [phrase] = subject(`
      import { useScope } from '@canvas/i18n'
      const I18n = useScope('foo')
      I18n.t('hello_world', 'Hello World!')
    `)

    assert.notInclude(Object.keys(phrase), 'used_in')
  })

  it('does not dupe records', () => {
    const phrases = subject(`
      import { useScope } from '@canvas/i18n'
      const I18n = useScope('foo')
      I18n.t('hello_world', 'Hello World!')
      I18n.t('hello_world', 'Hello World!')
    `)

    assert.equal(phrases.length, 1)
  })
});

const subject = (source) => {
  const translations = new ScopedTranslationHashAndIndex()
  const processor = new ScopedEsmProcessor(translations, {})

  processor.checkContents(processor.parse(source))

  return translations.toJSON()
}
