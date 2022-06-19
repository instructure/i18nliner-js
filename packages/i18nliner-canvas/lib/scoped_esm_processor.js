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

const babylon = require("@babel/parser");
const CoffeeScript = require("coffee-script");
const ScopedTranslateCall = require("./scoped_translate_call")
const Errors = require("./errors");
const extract = require('./scoped_esm_extractor')
const fs = require('fs');
const JsProcessor = require("@instructure/i18nliner/js_processor");
const {CANVAS_I18N_RECEIVER} = require('./params')

class ScopedEsmProcessor extends JsProcessor {
  static names = ['js', 'esm'];

  checkContents(ast) {
    if (!ast) {
      return
    }

    const [receiverScopes, calls] = extract(ast)

    for (const {line, method, args, path} of calls) {
      const binding = path.scope.getBinding(CANVAS_I18N_RECEIVER)
      const scope = receiverScopes.get(binding)

      if (!scope) {
        throw new Errors.UnscopedTranslateCall(line)
      }

      const call = new ScopedTranslateCall(line, method, args, scope);

      for (const [key, value] of call.translations()) {
        this.translations.set(key, value, call);
        this.translationCount++;
      }
    }
  }

  sourceFor(file) {
    const source = fs.readFileSync(file).toString();

    if (!source.match(/I18n\.t/)) {
      return null
    }

    if (file.match(/\.coffee$/)) {
      return this.parse(CoffeeScript.compile(source, {}))
    }
    else {
      return this.parse(source)
    }
  }

  parse(source) {
    return babylon.parse(source, {
      plugins: [
        'classProperties',
        'dynamicImport',
        'jsx',
        'objectRestSpread',
        'optionalChaining',
        'typescript',
      ],
      sourceType: 'module'
    });
  }
}

module.exports = ScopedEsmProcessor;
