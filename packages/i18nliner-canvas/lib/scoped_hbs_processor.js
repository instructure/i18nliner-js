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

const fs = require('fs')
const path = require('path')
const HbsProcessor = require("@instructure/i18nliner-handlebars/hbs_processor");
const ScopedHbsExtractor = require("./scoped_hbs_extractor");
const ScopedHbsPreProcessor = require("./scoped_hbs_pre_processor");
const Handlebars = require("handlebars");
// const { readI18nScopeFromJSONFile } = ScopedHbsExtractor

class ScopedHbsProcessor extends HbsProcessor {
  static names = ['hbs'];

  checkContents(source, filepath) {
    return this.checkContentsWithScope(
      readI18nScopeFromJSONFile(path.resolve(filepath)),
      source,
      filepath
    )
    // var extractor = new this.Extractor(this.preProcess(source), {path: path});
    // extractor.forEach(function(key, value, context) {
    //   this.translations.set(key, value, context);
    //   this.translationCount++;
    // }.bind(this));
  };

  checkContentsWithScope(scope, source, filepath) {
    const ast =  this.preProcessWithScope(scope, source)
    const extractor = new ScopedHbsExtractor(ast, { path: filepath, scope });

    extractor.forEach((key, value, context) => {
      this.translations.set(key, value, context);
      this.translationCount++;
    });

    // ScopedHbsPreProcessor.scope = scope
    // return super.checkContents(source, filepath, {
    //   extractorContext: { scope },
    //   preProcessorContext: { scope }
    // })
  }

  preProcessWithScope(scope, source) {
    const ast = Handlebars.parse(source.toString());
    ScopedHbsPreProcessor.processWithScope(scope, ast);
    return ast;
  }
}


// ScopedHbsProcessor.prototype.Extractor = ScopedHbsExtractor;
// ScopedHbsProcessor.prototype.PreProcessor = ScopedHbsPreProcessor;

const readI18nScopeFromJSONFile = function(filepath) {
  const metadataFilepath = `${filepath}.json`

  if (fs.existsSync(metadataFilepath)) {
    return require(metadataFilepath).i18nScope
  }
};

module.exports = ScopedHbsProcessor;
module.exports.readI18nScopeFromJSONFile = readI18nScopeFromJSONFile