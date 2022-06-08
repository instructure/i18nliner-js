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
  it('expands into scope-qualified key given an inline relative key and a default value', () => {
    const ast = parseAndPreProcess({
      scope: 'a',
      source: dedent`
        {{t 'something' 'Something'}}
      `
    })

    assert.equal(
      pp(ast),
      pp(parse(`
        {{t "a.something" "Something" i18n_scope="a"}}
      `))
    )
  })

  it('expands into absolute key given an inline absolute key and a default value', () => {
    const ast = parseAndPreProcess({
      scope: 'a',
      source: dedent`
        {{t '#b.thing' 'Thing of another'}}
      `
    })

    assert.deepEqual(
      pp(ast),
      pp(parse(`
        {{t "b.thing" "Thing of another" i18n_scope="b" i18n_used_in="a"}}
      `))
    )
  })

  it('expands into the inferred key and default value given an inline default value', () => {
    const ast = parseAndPreProcess({
      scope: 'a',
      source: dedent`{{t 'Something'}}`
    })

    assert.equal(
      pp(ast),
      pp(parse(`
        {{t "something_2a537172" "Something" i18n_inferred_key=true i18n_scope="a"}}
      `))
    )
  })

  it('expands into the inferred key and default value given an anonymous block', () => {
    const ast = parseAndPreProcess({
      scope: 'a',
      source: dedent`
        {{#t}}Something{{/t}}
      `
    })

    assert.deepEqual(
      pp(ast),
      pp(parse(`
        {{t "something_2a537172" "Something" i18n_inferred_key=true i18n_scope="a"}}
      `))
    )
  })

  it('expands into the relative key and default value given a block', () => {
    const ast = parseAndPreProcess({
      scope: 'a',
      source: dedent`
        {{#t 'something'}}Something{{/t}}
      `
    })

    assert.deepEqual(pp(ast), pp(parse(`
      {{t "a.something" "Something" i18n_scope="a"}}
    `))
    )
  })

  it('expands into the absolute key and default value given a block', () => {
    const ast = parseAndPreProcess({
      scope: 'a',
      source: dedent`
        {{#t '#b.thing'}}Thing of another{{/t}}
      `
    })

    assert.deepEqual(
      pp(ast),
      pp(parse(`
        {{t "b.thing" "Thing of another" i18n_scope="b" i18n_used_in="a" }}
      `)),
    )
  })

  it('extracts from sexpr', () => {
    const ast = parseAndPreProcess({
      scope: 'a',
      source: dedent`
        {{checkbox aria-label=(t "#b.thing" "Thing of another")}}
      `
    })

    assert.deepEqual(
      pp(ast),
      pp(parse(`
        {{checkbox aria-label=(t "b.thing" "Thing of another" i18n_scope="b" i18n_used_in="a") }}
      `))
    )
  })
});

function parseAndPreProcess({ scope, source }) {
  const ast = parse(source)

  ScopedHbsPreProcessor.processWithScope(scope, ast)

  return ast;
}

const parse =(source, scope) => Handlebars.parse(dedent(source))
const pp = ast => Handlebars.print(ast).trim()