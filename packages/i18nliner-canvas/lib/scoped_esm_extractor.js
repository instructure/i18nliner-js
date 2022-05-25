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

const extract = require("@instructure/i18nliner/i18n_js_extractor");
const {default: traverse} = require("@babel/traverse");

const {
  CANVAS_I18N_PACKAGE,
  CANVAS_I18N_USE_SCOPE_SPECIFIER,
  CANVAS_I18N_RECEIVER,
} = require('./params')

// This extractor implementation is suitable for ES modules where a module
// imports the "useScope" function from the @canvas/i18n package and assigns the
// output of a call to that function to a receiver named exactly "I18n". Calls
// to the "t" or "translate" methods on that receiver will use the scope
// supplied to that "useScope" call.
//
//     import { useScope } from '@canvas/i18n'
//
//     const I18n = useScope('foo')
//
//     I18n.t('my_key', 'Hello world!')
//     // => { "foo": { "my_key": "Hello World" } }
//
// The extractor looks for the I18n receiver defined in the current lexical
// scope of the call to I18n.t():
//
//     function a() {
//       const I18n = useScope('foo')
//       I18n.t('my_key', 'Key in foo') // => foo.my_key
//     }
//
//     function b() {
//       const I18n = useScope('bar')
//       I18n.t('my_key', 'Key in bar') // => bar.my_key
//     }
//
// Note that the receiver MUST be identified as "I18n". The (base) extractor
// will fail to recognize any translate calls if the output of useScope is
// assigned to a receiver with a different identifier. With that said, the
// identifier for useScope can be renamed at will:
//
//     // this is OK:
//     import { useScope as useI18nScope } from '@canvas/i18n'
//     const I18n = useI18nScope('foo')
//
//     // this is NOT ok:
//     import { useScope } from '@canvas/i18n'
//     const smth = useScope('foo')
//
function extractCallsAndScopes(ast) {
  // the identifier for the "useScope" specifier imported from @canvas/i18n,
  // which may be renamed
  let useScopeIdentifier = null

  // mapping of "I18n" receivers to the (i18n) scopes they were assigned in
  // the call to useScope
  let receiverScopeMapping = new WeakMap()

  traverse(ast, {
    enter(path) {
      // import { useScope } from '@canvas/i18n'
      //          ^^^^^^^^
      // import { useScope as blah } from '@canvas/i18n'
      //                      ^^^^
      if (!useScopeIdentifier && path.type === 'ImportDeclaration') {
        useScopeIdentifier = trackUseScopeIdentifier(path);
      }
      // let I18n
      //     ^^^^
      // I18n = useScope('foo')
      //                  ^^^
      // (this happens in CoffeeScript when compiled to JS)
      else if (useScopeIdentifier && path.type === 'AssignmentExpression') {
        const binding = indexScope({
          path,
          left: path.node.left,
          right: path.node.right,
          specifier: useScopeIdentifier
        })

        if (binding) {
          receiverScopeMapping.set(binding.receiver, binding.scope)
        }
      }
      // const I18n = useScope('foo')
      //       ^^^^             ^^^
      else if (useScopeIdentifier && path.type === 'VariableDeclarator') {
        const binding = indexScope({
          path,
          left: path.node.id,
          right: path.node.init,
          specifier: useScopeIdentifier
        })

        if (binding) {
          receiverScopeMapping.set(binding.receiver, binding.scope)
        }
      }
    }
  })

  return [receiverScopeMapping, extract(ast)]
}

function trackUseScopeIdentifier({ node }) {
  if (
    node.source &&
    node.source.type === 'StringLiteral' &&
    node.source.value === CANVAS_I18N_PACKAGE
  ) {
    const specifier = node.specifiers.find(x =>
      x.type === 'ImportSpecifier'&&
      x.imported &&
      x.imported.type === 'Identifier' &&
      x.imported.name === CANVAS_I18N_USE_SCOPE_SPECIFIER
    )

    if (
      specifier &&
      specifier.type === 'ImportSpecifier' &&
      specifier.local &&
      specifier.local.type === 'Identifier' &&
      specifier.local.name
    ) {
      return specifier.local.name
    }
  }
};

// Find out if it's a call to whatever the "useScope" specifier was bound to
//
//     import { useScope as useI18nScope } from '@canvas/i18n'
//
//     const I18n = useI18nScope('foo')
//           ^^^^                 ^^^
//
// left: Identifier
// right: CallExpression
function indexScope({ path, left, right, specifier }) {
  if (
    left &&
    left.type === 'Identifier' &&
    left.name === CANVAS_I18N_RECEIVER &&
    right &&
    right.type === 'CallExpression' &&
    right.callee &&
    right.callee.type === 'Identifier' &&
    right.callee.name === specifier &&
    right.arguments &&
    right.arguments.length === 1 &&
    right.arguments[0].type === 'StringLiteral' &&
    right.arguments[0].value
  ) {
    return {
      receiver: path.scope.getBinding(CANVAS_I18N_RECEIVER),
      scope: right.arguments[0].value
    }
  }
};

module.exports = extractCallsAndScopes;
