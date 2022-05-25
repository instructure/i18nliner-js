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

const HbsProcessor = require("@instructure/i18nliner-handlebars/hbs_processor");
const ScopedHbsExtractor = require("./scoped_hbs_extractor");
const ScopedHbsPreProcessor = require("./scoped_hbs_pre_processor");

class ScopedHbsProcessor extends HbsProcessor {
  static names = ['hbs'];
}

ScopedHbsProcessor.prototype.Extractor = ScopedHbsExtractor;
ScopedHbsProcessor.prototype.PreProcessor = ScopedHbsPreProcessor;

module.exports = ScopedHbsProcessor;
