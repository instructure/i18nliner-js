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

const path = require('path')
const HbsProcessor = require("@instructure/i18nliner-handlebars/hbs_processor");
const ScopedHbsExtractor = require("./scoped_hbs_extractor");
const ScopedHbsPreProcessor = require("./scoped_hbs_pre_processor");
const Handlebars = require("handlebars");
const {readI18nScopeFromJSONFile} = require('./scoped_hbs_resolver')

class ScopedHbsProcessor extends HbsProcessor {
  static names = ['hbs'];

  checkContents(source, filepath) {
    return this.checkContentsWithScope(
      // read it from the i18nScope property in the accompanying .json file:
      readI18nScopeFromJSONFile(path.resolve(filepath)),
      source,
      filepath
    )
  };

  checkContentsWithScope(scope, source, filepath) {
    const ast =  this.preProcessWithScope(scope, source)
    const extractor = new ScopedHbsExtractor(ast, { path: filepath, scope });

    extractor.forEach((key, value, context) => {
      this.translations.set(key, value, context);
      this.translationCount++;
    });
  }

  preProcessWithScope(scope, source) {
    const ast = Handlebars.parse(source.toString());
    ScopedHbsPreProcessor.processWithScope(scope, ast);
    return ast;
  }
}

module.exports = ScopedHbsProcessor;
module.exports.readI18nScopeFromJSONFile = readI18nScopeFromJSONFile