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
var { pathString, stringNode, hashNode, hashPair } = require("@instructure/i18nliner-handlebars/ast_nodes");

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
  if (statement.type === 'MustacheStatement' && pathString(statement.path) === 't')
    return this.injectScope(statement);
  else if (statement.type === 'SubExpression' && pathString(statement.path) === 't')
    return this.injectScope(statement);
}

ScopedHbsPreProcessor.injectScope = function(node) {
  if (!node.hash) {
    node.hash = hashNode([]);
  }

  const { pairs } = node.hash;
  const keyType = classifyKey(node)

  switch (keyType) {
    case KeyType.RELATIVE:
      node.params[0] = stringNode(`${this.scope}.${node.params[0].value}`)
      node.hash.pairs = pairs.concat([
        hashPair("i18n_scope", stringNode(this.scope))
      ]);
    break;

    case KeyType.ABSOLUTE:
      node.params[0] = stringNode(node.params[0].value.slice(1))
      node.hash.pairs = pairs.concat([
        hashPair("i18n_scope", stringNode(node.params[0].value.split('.').slice(0, -1).join('.'))),
        hashPair("i18n_used_in", stringNode(this.scope)),
      ]);
    break;

  // to match our .rb scoping behavior, don't scope inferred keys...
  // if inferred, it's always the last option
    case KeyType.INFERRED:
      node.hash.pairs = pairs.concat([
        hashPair("i18n_scope", stringNode(this.scope))
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
    node.hash.pairs[node.hash.pairs.length - 1].key === 'i18n_inferred_key'
  ) {
    return KeyType.INFERRED
  }

  else if (
    node.params[0] &&
    node.params[0].type === 'StringLiteral' &&
    node.params[0].value.startsWith('#')
  ) {
    return KeyType.ABSOLUTE
  }
  else if (
    node.params[0] &&
    node.params[0].type === 'StringLiteral' &&
    node.params[1] &&
    node.params[1].type === 'StringLiteral'
  ) {
    return KeyType.RELATIVE
  }
  else {
    return KeyType.UNKNOWN
  }
}

module.exports = ScopedHbsPreProcessor;
