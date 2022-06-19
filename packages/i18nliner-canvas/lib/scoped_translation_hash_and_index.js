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

const TranslationHash = require('@instructure/i18nliner/translation_hash')
const ScopedHbsTranslateCall = require('./scoped_hbs_translate_call')
const ScopedTranslateCall = require('./scoped_translate_call')

class ScopedTranslationHashAndIndex extends TranslationHash {
  constructor() {
    super()
    this.index = []
  }

  set(key, value, meta) {
    if (value !== ScopedTranslateCall.INDEX_ONLY) {
      super.set(key, value, meta);
    }

    this.addToIndex(key, value, meta)
  }

  addToIndex(key, value, meta) {
    let record

    if (meta instanceof ScopedHbsTranslateCall) {
      record = { key }

      if (meta.options.i18n_scope) {
        record.scope = meta.options.i18n_scope.string
      }

      if (meta.options.i18n_used_in) {
        record.used_in = meta.options.i18n_used_in.string
      }
    }
    else {
      record = { key, scope: meta.scope }

      if (meta.absolute) {
        record.scope = key.split('.').slice(0, -1).join('.')
      }

      if (meta.scope !== record.scope) {
        record.used_in = meta.scope
      }
    }

    this.index.push(record)
  }

  toJSON() {
    return this.index
  }
}

module.exports = ScopedTranslationHashAndIndex;
