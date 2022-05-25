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
const Translations = require('@instructure/i18nliner/translation_hash')

describe("ScopedTranslationCall", function() {
  it('bails if an absolute key is not scoped', () => {
    assert.throws(() => {
      subject(`
        import { useScope } from '@canvas/i18n'
        const I18n = useScope('foo')
        I18n.t('#something', 'bar')
      `)
    }, /unscoped absolute key/)
  })
});

const subject = (source) => {
  const processor = new ScopedEsmProcessor(new Translations(), {})

  processor.checkContents(processor.parse(source))

  return processor.translations
}
