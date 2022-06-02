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

const scanner = require("./scanner");
const AbstractProcessor = require("@instructure/i18nliner/abstract_processor");

AbstractProcessor.prototype.checkFiles = function() {
  const names = this.constructor.names || [
    this.constructor.name.replace(/Processor/, '').toLowerCase()
  ];

  const files = names.reduce(
    (acc, name) => acc.concat(scanner.getFilesForProcessor(name) || []), []
  )

  for (const file of files) {
    this.checkWrapper(file, this.checkFile.bind(this))
  }
}

exports.register = require('./register');
exports.scanner = scanner
exports.Commands = {
  Check: require("./commands/check"),
  Export: require("./commands/export"),
}
