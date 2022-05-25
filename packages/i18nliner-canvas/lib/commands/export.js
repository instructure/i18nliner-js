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

const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");
const ScopedTranslationHashAndIndex = require('../scoped_translation_hash_and_index');
const {config} = require('@instructure/i18nliner/config');
const {Check} = require("@instructure/i18nliner/commands");

class Export extends Check {
  constructor(options) {
    options = Object.assign({
      translationsFile: path.resolve(config.basePath, "config/locales/generated/en.json"),
      indexFile: path.resolve(config.basePath, "config/locales/generated/en-index.json"),
      ...options
    })

    super(options)
  }

  run() {
    if (!super.run()) {
      return false
    }

    { // translations
      const file = this.options.translationsFile

      mkdirp.sync(path.dirname(file));

      fs.writeFileSync(file, JSON.stringify({
        en: this.translations.translations
      }));

      this.print("Wrote default translations to " + file + "\n");
    }

    { // index
      const file = this.options.indexFile

      mkdirp.sync(path.dirname(file));

      fs.writeFileSync(file, JSON.stringify(this.translations.index));

      this.print("Wrote translation index to " + file + "\n");
    }

    return true;
  }
}

Export.prototype.TranslationHash = ScopedTranslationHashAndIndex;

module.exports = Export;
