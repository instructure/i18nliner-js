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
var Handlebars = require("handlebars");
var AST = Handlebars.AST;
var StringNode = AST.StringNode;
var HashNode = AST.HashNode;

const ScopedHbsPreProcessor = {...PreProcessor}
const KeyType = {
  ABSOLUTE: Symbol.for('ScopedHbsPreProcessor.KeyType.ABSOLUTE'),
  INFERRED: Symbol.for('ScopedHbsPreProcessor.KeyType.INFERRED'),
  RELATIVE: Symbol.for('ScopedHbsPreProcessor.KeyType.RELATIVE'),
  UNKNOWN: Symbol.for('ScopedHbsPreProcessor.KeyType.UNKNOWN'),
}

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
  else if (statement.type === 'sexpr' && statement.id.string === 't')
    return this.injectScope(statement);
}

ScopedHbsPreProcessor.injectScope = function(node) {
  if (!node.hash) {
    node.hash = new HashNode([]);

    if (node.sexpr) {
      node.sexpr.hash = node.hash
    }
  }

  const { pairs } = node.hash;
  const keyType = classifyKey(node)

  switch (keyType) {
    case KeyType.RELATIVE:
      node.params[0] = new StringNode(`${this.scope}.${node.params[0].string}`)
      node.hash.pairs = pairs.concat([
        ["i18n_scope", new StringNode(this.scope)]
      ]);
    break;

    case KeyType.ABSOLUTE:
      node.params[0] = new StringNode(node.params[0].string.slice(1))
      node.hash.pairs = pairs.concat([
        ["i18n_scope", new StringNode(node.params[0].string.split('.').slice(0, -1).join('.'))],
        ["i18n_used_in", new StringNode(this.scope)],
      ]);
    break;

  // to match our .rb scoping behavior, don't scope inferred keys...
  // if inferred, it's always the last option
    case KeyType.INFERRED:
      node.hash.pairs = pairs.concat([
        ["i18n_scope", new StringNode(this.scope)]
      ]);
    break;
  }

  return node;
}

function classifyKey(node) {
  if (
    node.hash &&
    node.hash.pairs &&
    node.hash.pairs.length > 0 &&
    node.hash.pairs[node.hash.pairs.length - 1][0] === 'i18n_inferred_key'
  ) {
    return KeyType.INFERRED
  }

  else if (
    node.params[0] &&
    node.params[0].type === 'STRING' &&
    node.params[0].string.startsWith('#')
  ) {
    return KeyType.ABSOLUTE
  }
  else if (
    node.params[0] &&
    node.params[0].type === 'STRING' &&
    node.params[1] &&
    node.params[1].type === 'STRING'
  ) {
    return KeyType.RELATIVE
  }
  else {
    return KeyType.UNKNOWN
  }
}

module.exports = ScopedHbsPreProcessor;
