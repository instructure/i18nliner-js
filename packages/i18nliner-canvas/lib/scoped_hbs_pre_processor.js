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

var PreProcessor = require("@instructure/i18nliner-handlebars/hbs_pre_processor");
var { inferKey } = require('@instructure/i18nliner-runtime');
var Handlebars = require("handlebars");
var AST = Handlebars.AST;
var StringNode = AST.StringNode;
var HashNode = AST.HashNode;

const ScopedHbsPreProcessor = {...PreProcessor}

ScopedHbsPreProcessor.processWithScope = function(scope, ast) {
  this.scope = scope

  try {
    this.process(ast)
  }
  finally {
    this.scope = null
  }
}

// slightly more lax interpolation key format for hbs to support any
// existing translations (camel case and dot syntax, e.g. "foo.bar.baz")
ScopedHbsPreProcessor.normalizeInterpolationKey = function(key) {
  key = key.replace(/[^a-z0-9.]/gi, ' ');
  key = key.trim();
  key = key.replace(/ +/g, '_');
  return key.substring(0, 32);
};

// add explicit scope to all t calls (post block -> inline transformation)
ScopedHbsPreProcessor.processStatement = function(statement) {
  statement = PreProcessor.processStatement.call(this, statement) || statement;
  if (statement.type === 'mustache' && statement.id.string === 't')
    return this.injectScope(statement);
}

// ScopedHbsPreProcessor.inferKey = function(defaultValue) {
//   // console.log(this.scope)
//   // return new StringNode(`${inferKey(defaultValue)}`);
//   return new StringNode(`${this.scope}.${inferKey(defaultValue)}`);
// }

ScopedHbsPreProcessor.injectScope = function(node) {
  if (!node.hash) {
    node.hash = node.sexpr.hash = new HashNode([]);
  }

  const { pairs } = node.hash;
  const isInferred = pairs.length === 0 || pairs[pairs.length - 1][0] === "i18n_inferred_key"

  console.log('inferred?', hasInferredKey(node), pairs, require('handlebars').print(node))
  // if (!hasInferredKey(node)) {
  //   // console.log('hi im here trying to inject scope')
  //   node.params[0] = new StringNode(
  //     `${this.scope}.${node.params[0].original}`
  //   )
  // }

  // to match our .rb scoping behavior, don't scope inferred keys...
  // if inferred, it's always the last option
  if (!pairs.length || pairs[pairs.length - 1][0] !== "i18n_inferred_key") {
  // if (!hasInferredKey(node)) {
    // console.log(require('handlebars').print(node))
    node.hash.pairs = pairs.concat([["scope", new StringNode(this.scope)]]);
  }
  return node;
}

function hasInferredKey(node) {
  return (
    node.hash &&
    node.hash.pairs &&
    node.hash.pairs.length > 0 &&
    node.hash.pairs[node.hash.pairs.length - 1][0] === 'i18n_inferred_key'
  )
}

module.exports = ScopedHbsPreProcessor;
