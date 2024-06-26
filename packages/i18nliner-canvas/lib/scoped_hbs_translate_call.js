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
const HbsTranslateCall = require('@instructure/i18nliner-handlebars/hbs_translate_call');
const { INDEX_ONLY } = require('./scoped_translate_call')

class ScopedHbsTranslateCall extends HbsTranslateCall {
  static META_KEYS = HbsTranslateCall.META_KEYS.concat([
    'i18n_scope',
    'i18n_used_in',
  ]);

  translations() {
    if (!this.defaultValue) {
      return [[this.key, INDEX_ONLY]]
    }
    else {
      return super.translations()
    }
  }
}

module.exports = ScopedHbsTranslateCall
