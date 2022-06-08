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
const {UnscopedAbsoluteKey} = require('./errors')

module.exports = function(TranslateCall) {
  var ScopedTranslateCall = function() {
    var args = [].slice.call(arguments);
    this.scope = args.pop();

    TranslateCall.apply(this, arguments);
  }

  ScopedTranslateCall.prototype = Object.create(TranslateCall.prototype);
  ScopedTranslateCall.prototype.constructor = ScopedTranslateCall;

  ScopedTranslateCall.prototype.normalize = function() {
    // console.log(this.options)
    // TODO: make i18nliner-js use the latter, just like i18nliner(.rb) ...
    // i18nliner-handlebars can't use the former
    if (!this.inferredKey && !this.options.i18n_inferred_key) {
      // console.log('assigning scope because key is not inferred', this.key)
      const key = this.key

      if (key[0] === '#') {
        if (!key.includes('.')) {
          throw new UnscopedAbsoluteKey(this.line, key)
        }

        this.key = key.slice(1);
        this.absolute = true;
      }
      else {
        this.key = this.scope + "." + key;
      }
    }
    // else {
      // console.log('not assigning scope because key is inferred:', this.key, this.scope)
    // }

    TranslateCall.prototype.normalize.call(this);
  };

  return ScopedTranslateCall;
}
