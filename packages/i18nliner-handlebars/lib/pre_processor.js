/* global window */

const { JSDOM } = require("jsdom");
const { inferKey } = require('@instructure/i18nliner-runtime');
const Errors = require("./errors");
const {
  pathString,
  stringNode,
  booleanNode,
  pathNode,
  hashNode,
  hashPair,
  subExpr
} = require("./ast_nodes");

var dom = (function(){
  if (typeof window !== 'undefined') {
    return window.document;
  } else {
    return (new JSDOM('')).window.document;
  }
})();

var slice = [].slice
  , TEMP_PLACEHOLDER = /__i18nliner_\d+__/g;

function firstLineOf(node) {
  return node.loc?.start?.line;
}

function safeNode(node) {
  return subExpr(pathNode('__i18nliner_safe'), [node]);
}

function escapeNode(node) {
  return subExpr(pathNode('__i18nliner_escape'), [node]);
}

function TempPlaceholderMap() {
  this._map = {};
  this._size = 0;
}
TempPlaceholderMap.prototype.get = function(key) {
  return this._map[key];
};
TempPlaceholderMap.prototype.add = function(node) {
  var key = "__i18nliner_" + this._size + "__";
  this._map[key] = node;
  this._size++;
  return key;
};

function splitCapture(pattern, string) {
  var result = []
    , lastIndex = pattern.lastIndex = 0
    , match
    , s;
  while ((match = pattern.exec(string))) {
    match = match[0];
    s = string.slice(lastIndex, pattern.lastIndex - match.length);
    if (s.length) result.push(s);
    result.push(match);
    lastIndex = pattern.lastIndex;
  }
  s = string.slice(lastIndex);
  if (s.length) result.push(s);
  return result;
}

function concatNode(string, tempMap) {
  var parts = splitCapture(TEMP_PLACEHOLDER, string)
    , partsLen = parts.length
    , params = []
    , part
    , i;
  for (i = 0; i < partsLen; i++) {
    part = parts[i];
    params.push(part.match(TEMP_PLACEHOLDER) ?
      escapeNode(tempMap.get(part)) :
      stringNode(part));
  }
  return subExpr(pathNode('__i18nliner_concat'), params);
}

var PreProcessor = {
  process: function(ast) {
    var statements = ast.body
      , statementsLen = statements.length
      , statement
      , i;
    for (i = 0; i < statementsLen; i++) {
      statement = this.processStatement(statements[i]);
      if (typeof statement !== 'undefined')
        statements[i] = statement;
    }
  },

  processStatement: function(statement) {
    if (!statement) return;

    if (statement.type === 'MustacheStatement' && pathString(statement.path) === 't') {
      return this.transformInline(statement);
    }
    else if (statement.type === 'MustacheStatement') {
      this.processExpressionChildren(statement);
    }
    else if (statement.type === 'BlockStatement') {
      // consume anything inside this first (e.g. if we have nested t blocks)
      this.process(statement.program);
      if (statement.inverse)
        this.process(statement.inverse);

      if (pathString(statement.path) !== "t") return;

      return this.transform(statement);
    }
    else if (statement.type === 'SubExpression') {
      this.processExpressionChildren(statement);

      if (pathString(statement.path) === 't') {
        this.transformInline(statement);
      }
    }
  },

  processExpressionChildren: function(node) {
    var params = node.params || []
      , i;
    for (i = 0; i < params.length; i++) {
      this.processStatement(params[i]);
    }
    if (node.hash) {
      for (i = 0; i < node.hash.pairs.length; i++) {
        this.processStatement(node.hash.pairs[i].value);
      }
    }
  },

  transformInline: function(node) {
    if (node.params.length === 1 && node.params[0].type === 'StringLiteral' && !node.hash) {
      const [defaultValue] = node.params

      node.params.unshift(this.inferKey(defaultValue.value))

      this.updateHash(node, [
        ["i18n_inferred_key", booleanNode(true)]
      ])
    }
    else {
      return node
    }
  },

  transform: function(node) {
    var parts = this.inferParts(node.program.body)
      , defaultValue = parts.defaultValue
      , hash = parts.hash
      , mustache = {
          type: 'MustacheStatement',
          path: node.path,
          params: node.params,
          hash: node.hash,
          escaped: true,
          strip: { open: false, close: false },
          loc: node.loc
        };
    if (!mustache.params.length) {
      mustache.params.push(this.inferKey(defaultValue));
      hash.push(["i18n_inferred_key", booleanNode(true)]);
    }
    mustache.params.push(stringNode(defaultValue));
    this.updateHash(mustache, hash);
    return mustache;
  },

  updateHash: function(node, additions) {
    if (!additions.length) return;

    if (!node.hash) {
      node.hash = hashNode([]);
    }
    var existingKeys = {}
      , len
      , i
      , pairs;
    pairs = node.hash.pairs;
    for (i = 0, len = pairs.length; i < len; i++)
      existingKeys[pairs[i].key] = true;
    for (i = 0, len = additions.length; i < len; i++)
      if (!existingKeys[additions[i][0]])
        pairs.push(hashPair(additions[i][0], additions[i][1]));
  },

  inferKey: function(defaultValue) {
    return stringNode(inferKey(defaultValue));
  },

  inferParts: function(statements) {
    var defaultValue
      , wrappers = []
      , hash = []
      , tempMap = new TempPlaceholderMap();
    defaultValue = this.extractTempPlaceholders(statements, tempMap);
    defaultValue = this.extractWrappers(defaultValue, wrappers, tempMap, statements[0]);
    defaultValue = this.extractPlaceholders(defaultValue, hash, tempMap);
    defaultValue = this.normalizeDefault(defaultValue);
    return {defaultValue: defaultValue, hash: hash.concat(wrappers)};
  },

  stringForStatement: function(statement, tempMap) {
    var node;
    switch (statement.type) {
      case 'BlockStatement':
        throw new Errors.TBlockNestingError(firstLineOf(statement), "can't nest block expressions inside a t block");
      case 'ContentStatement':
        return statement.value;
      case 'MustacheStatement':
        node = (statement.params.length || statement.hash) ?
          subExpr(statement.path, statement.params, statement.hash) :
          statement.path;
        if (!statement.escaped)
          node = safeNode(node);
        return tempMap.add(node);
    }
  },

  normalizeDefault: function(string) {
    return string.replace(/\s+/g, ' ').trim();
  },

  nodesFor: function(html) {
    var div = dom.createElement('div');
    div.innerHTML = html;
    return div.childNodes;
  },

  extractTempPlaceholders: function(statements, tempMap) {
    var defaultValue = ''
      , i
      , statementsLen = statements.length;
    for (i = 0; i < statementsLen; i++) {
      defaultValue += this.stringForStatement(statements[i], tempMap);
    }
    return defaultValue;
  },

  extractPlaceholders: function(string, hash, tempMap) {
    var keyMap = {};
    return string.replace(TEMP_PLACEHOLDER, function(match) {
      var sexpr = tempMap.get(match)
        , key = this.inferInterpolationKey(sexpr, keyMap);
      keyMap[key] = true;
      hash.push([key, sexpr]);
      return "%{" + key + "}";
    }.bind(this));
  },

  normalizeInterpolationKey: function(key) {
    key = key.replace(/[^a-z0-9]/gi, ' ');
    key = key.replace(/([A-Z\d]+|[a-z])([A-Z])/g, "$1_$2");
    key = key.toLowerCase();
    key = key.trim();
    key = key.replace(/ +/g, '_');
    return key.substring(0, 32);
  },

  inferInterpolationKey: function(sexpr, keyMap) {
    var key
      , baseKey
      , i = 0;
    key = this.stringParts(sexpr).join(" ");
    key = key.replace(/^__i18nliner_safe /, '');
    key = this.normalizeInterpolationKey(key);
    baseKey = key;
    while (keyMap[key] && keyMap[key] !== baseKey) {
      key = baseKey + "_" + i;
      i++;
    }
    return key;
  },

  stringParts: function(node, result) {
    var i
      , len
      , items;
    result = result || [];
    if (node.type === 'SubExpression') {
      this.stringParts(node.path, result);
      items = node.params;
      for (i = 0, len = items.length; i < len; i++) {
        this.stringParts(items[i], result);
      }
      if (node.hash) {
        items = node.hash.pairs;
        for (i = 0, len = items.length; i < len; i++) {
          result.push(items[i].key);
          this.stringParts(items[i].value, result);
        }
      }
    } else if (node.type !== 'BooleanLiteral') {
      // handlebars 1.x BOOLEAN nodes had no `original`, so a boolean hash value
      // never contributed to the inferred key; >= 4 BooleanLiteral has
      // `original: true`, which would leak `_true` and orphan the existing
      // translation. numbers/strings/paths did have an `original` in 1.x and
      // must still contribute.
      result.push(node.original);
    }
    return result;
  },

  extractWrappers: function(source, wrappers, tempMap, context) {
    var result = ''
      , nodes = this.nodesFor(source)
      , nodesLen = nodes.length
      , node
      , wrapper
      , wrappedText
      , i;
    for (i = 0; i < nodesLen; i++) {
      node = nodes[i];
      if (node.nodeName === '#text') {
        result += node.nodeValue;
      } else if ((wrappedText = this.extractText(node, context))) {
        wrapper = node.outerHTML.replace(wrappedText, "$1");
        this.findOrAddWrapper(wrapper, wrappers, tempMap);
        result += this.wrap(wrappedText, wrappers.length);
      } else {
        result += tempMap.add(safeNode(stringNode(node.outerHTML)));
      }
    }
    return result;
  },

  findOrAddWrapper: function(wrapper, wrappers, tempMap) {
    var wrappersLen = wrappers.length
      , factory = (wrapper.match(TEMP_PLACEHOLDER) ? concatNode : stringNode)
      , i;
    for (i = 0; i < wrappersLen; i++) {
      if (wrappers[i][1].value === wrapper)
        return i;
    }
    wrappers.push(["w" + i, factory(wrapper, tempMap)]);
    return i;
  },

  extractText: function(rootNode, context) {
    var text = ''
      , nodes = slice.call(rootNode.childNodes)
      , node;
    while ((node = nodes.shift())) {
      if (node.nodeName === '#text' && node.nodeValue.trim()) {
        if (text) // there can be only one
          throw new Errors.UnwrappableContentError(firstLineOf(context), "multiple text nodes in html markup");
        text = node.nodeValue;
      } else if (node.childNodes.length) {
        nodes = nodes.concat(slice.call(node.childNodes));
      }
    }
    return text;
  },

  wrap: function(text, index) {
    var delimiter = new Array(index + 1).join("*");
    return delimiter + text + delimiter;
  }
};

module.exports = PreProcessor;
