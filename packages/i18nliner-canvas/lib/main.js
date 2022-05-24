/*
 * Copyright (C) 2014 - present Instructure, Inc.
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

const CoffeeScript = require("coffee-script");
const babylon = require("@babel/parser");
const fs = require('fs');
const scanner = require("./scanner");
const { HbsProcessor } = require("@instructure/i18nliner-handlebars");
const {
  AbstractProcessor,
  CallHelpers,
  Commands,
  config,
  JsProcessor,
} = require("@instructure/i18nliner");

const Check = Commands.Check;

// tell i18nliner's babylon how to handle `import('../foo').then`
config.babylonPlugins.push('dynamicImport')
config.babylonPlugins.push('optionalChaining')
// tell i18nliner's babylon how to handle typescript
config.babylonPlugins.push('typescript')

AbstractProcessor.prototype.checkFiles = function() {
  const processor = this.constructor.name.replace(/Processor/, '').toLowerCase()
  const files = scanner.getFilesForProcessor(processor)

  for (const file of files) {
    this.checkWrapper(file, this.checkFile.bind(this))
  }
}

JsProcessor.prototype.sourceFor = function(file) {
  var source = fs.readFileSync(file).toString();
  var data = { source: source, skip: !source.match(/I18n\.t/) };

  if (!data.skip) {
    if (file.match(/\.coffee$/)) {
      data.source = CoffeeScript.compile(source, {});
    }
    data.ast = babylon.parse(data.source, { plugins: config.babylonPlugins, sourceType: "module" });
  }
  return data;
};

// we do the actual pre-processing in sourceFor, so just pass data straight through
JsProcessor.prototype.preProcess = function(data) {
  return data;
};

require("./scoped_hbs_pre_processor");
var ScopedESMExtractor = require("./scoped_esm_extractor");
var ScopedHbsExtractor = require("./scoped_hbs_extractor");
var ScopedTranslationHash = require("./scoped_translation_hash");

// remove path stuff we don't want in the scope
var pathRegex = new RegExp(
  '.*(' +
    'ui/shared/jst' +
    '|ui/features/screenreader_gradebook/jst' +
    '|packages/[^/]+/src/jst' +
    '|gems/plugins/[^/]+/app/views/jst' +
  ')'
)

ScopedHbsExtractor.prototype.normalizePath = function(path) {
  return path.replace(pathRegex, "").replace(/^([^\/]+\/)templates\//, '$1');
};

var GenerateJs = require("./generate_js");
Commands.Generate_js = GenerateJs;

// swap out the defaults for our scope-aware varieties
Check.prototype.TranslationHash = ScopedTranslationHash;
JsProcessor.prototype.I18nJsExtractor = ScopedESMExtractor;
HbsProcessor.prototype.Extractor = ScopedHbsExtractor;
CallHelpers.keyPattern = /^\#?\w+(\.\w+)+$/ // handle our absolute keys

module.exports = {
  Commands,
  scanner
};
