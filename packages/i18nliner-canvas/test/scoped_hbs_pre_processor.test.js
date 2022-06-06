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

const dedent = require('dedent')
const {assert} = require('chai')
const ScopedHbsPreProcessor = require('../lib/scoped_hbs_pre_processor')
const Handlebars = require('handlebars')

describe('ScopedHbsPreProcessor', () => {
  it('calls I18n.t() with full key given an inline, relative key', () => {
    const ast = parse('some.scope', dedent`
      {{t 'something' 'Something'}}
    `)

    console.log(ast)
    console.log(Handlebars.print(ast))

    assert.equal(
      Handlebars.print(ast).trim(),
      `{{ ID:t ["some.scope.something", "Something"] HASH{scope="some.scope"} }}`
    )
  })

  it('calls I18n.t() with inferred key given an inline, inferred key', () => {
    const ast = parse('some.scope', dedent`
      {{t 'Something'}}
    `)

    assert.equal(
      Handlebars.print(ast).trim(),
      `{{ ID:t ["something_a8a2f3d1", "Something"] HASH{scope="some.scope"} }}`
    )
  })

  it('injects call to I18n.t() with inferred key')
  it('injects call to I18n.t() with absolute key')
});

function parse(scope, source) {
  const ast = Handlebars.parse(source)

  ScopedHbsPreProcessor.processWithScope(scope, ast)

  return ast;
}
