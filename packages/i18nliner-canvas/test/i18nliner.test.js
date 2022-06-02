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

const mkdirp = require("mkdirp");
const path = require("path");
const scanner = require("../lib/scanner");
const {configure, loadConfig} = require('@instructure/i18nliner/config')
const { Commands } = require("../lib/main");
const { assert } = require('chai');

class PanickyCheck extends Commands.Check {
  // don't print to TTY
  // print() {};

  // and do throw errors
  checkWrapper(file, checker) {
    checker(file)
  };
};

const expand = dir => path.resolve(__dirname, dir)

var subject = function(dir) {
  var owd = process.cwd()
  let previousConfig

  process.chdir(dir)

  try {
    previousConfig = loadConfig()
    const command = new PanickyCheck({});
    scanner.scanFilesFromI18nrc(scanner.loadConfigFromDirectory(dir))
    command.run();
    return command.translations.translations;
  }
  finally {
    if (previousConfig) {
      configure(previousConfig)
    }
    process.chdir(owd)
  }
}

describe("i18nliner-canvas", function() {
  afterEach(function() {
    scanner.reset()
  })

  describe("handlebars", function() {
    it("extracts default translations", function() {
      assert.deepEqual(subject(expand("./fixtures/hbs")), {
        absolute: {
          key: "Absolute key",
          inline_with_absolute_key: "Inline with absolute key",
        },
        inferred_key_c49e3743: "Inferred key",
        inline_with_inferred_key_88e68761: "Inline with inferred key",
        foo: {
          bar_baz: {
            inline_with_relative_key: "Inline with relative key",
            relative_key: "Relative key"
          },
          bar_fizz_buzz: {
            inline_with_relative_key: "Inline with relative key"
          }
        }
      });
    });

    it('throws if no scope was specified', () => {
      const command = new PanickyCheck({});

      scanner.scanFilesFromI18nrc(
        scanner.loadConfigFromDirectory(
          expand('./fixtures/hbs-missing-i18n-scope')
        )
      )

      assert.throws(() => {
        command.checkFiles()
      }, /expected i18nScope for Handlebars template to be specified/)
    })
  });

  describe("javascript", function() {
    it("extracts default translations", function() {
      assert.deepEqual(subject(expand("./fixtures/js")), {
        absolute: {
          key: "Absolute key",
        },
        inferred_key_c49e3743: "Inferred key",
        esm: {
          my_key: 'Hello world',
          nested: {
            relative_key: "Relative key in nested scope"
          },
        },
        foo: {
          relative_key: "Relative key"
        },
        bar: {
          relative_key: "Another relative key"
        },
        yay_coffee_d4d65736: 'yay coffee',
        yay_typescript_2a26bb91: 'yay typescript'
      });
    });
  });
});
