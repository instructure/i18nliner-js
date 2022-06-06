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
const ScopedHbsProcessor = require('../lib/scoped_hbs_processor')
const ScopedTranslationHashAndIndex = require('../lib/scoped_translation_hash_and_index')

describe('ScopedHbsProcessor', () => {
  it('processes keyed phrases', () => {
    const { index, translations } = extract('some.scope', dedent`
      {{t 'keyed' 'something'}}
    `)

    assert.deepEqual(translations, {
      some: {
        scope: {
          keyed: 'something'
        }
      }
    });

    assert.deepEqual(index, [
      { key: 'some.scope.keyed', scope: 'some.scope' }
    ])
  })

  it('processes inferred-key phrases', () => {
    const { index, translations } = extract('some.scope', dedent`
      {{t 'something'}}
    `)

    assert.deepEqual(translations, {
      something_a8a2f3d1: 'something'
    });

    assert.deepEqual(index, [
      { key: 'something_a8a2f3d1', scope: 'some.scope' }
    ])
  })

  it('processes external-key phrases', () => {
    const { index, translations } = extract('some.scope', dedent`
      {{t '#other.thing' 'Thing of another' }}
    `)

    assert.deepEqual(translations, {
      other: {
        thing: 'Thing of another'
      }
    });

    assert.deepEqual(index, [
      { key: 'other.thing', scope: 'other', used_in: 'some.scope' }
    ])
  })

  it('reads the i18nScope from the accompanying .json file', () => {
    const path = require('path')

    assert.deepEqual(
      ScopedHbsProcessor.readI18nScopeFromJSONFile(
        path.resolve(__dirname, 'fixtures/hbs/app/views/jst/foo/_barBaz.hbs')
      ),
      'foo.bar_baz'
    )
  })
});

function extract(scope, source) {
  const translations = new ScopedTranslationHashAndIndex()
  const processor = new ScopedHbsProcessor(translations, {})

  processor.checkContentsWithScope(scope, source, '<<test>>')

  return translations;
}
