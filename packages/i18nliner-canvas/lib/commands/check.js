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

const {Check} = require("@instructure/i18nliner/commands");
const ScopedTranslationHashAndIndex = require('../scoped_translation_hash_and_index')

// swap out the defaults for our scope-aware varieties
class ScopedCheck extends Check {};
ScopedCheck.prototype.TranslationHash = ScopedTranslationHashAndIndex;

module.exports = ScopedCheck;

