/* global window */

const Handlebars = require("handlebars");
const { JSDOM } = require("jsdom");
const { inferKey } = require('@instructure/i18nliner-runtime');
const Errors = require("./errors");

var dom = (function(){
  if (typeof window !== 'undefined') {
    return window.document;
  } else {
    return (new JSDOM('')).window.document;
  }
})();

var AST = Handlebars.AST
  , StringNode = AST.StringNode
  , BooleanNode = AST.BooleanNode
  , HashNode = AST.HashNode
  , SexprNode = AST.SexprNode
  , IdNode = AST.IdNode
  , slice = [].slice
  , TEMP_PLACEHOLDER = /__i18nliner_\d+__/g;

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

function stringNode(string) {
  return new StringNode(string);
}

function safeNode(sexpr) {
  var parts = [
    new IdNode([{part: '__i18nliner_safe'}]),
    sexpr
  ];
  return new SexprNode(parts);
}

function escapeNode(sexpr) {
  var parts = [
    new IdNode([{part: '__i18nliner_escape'}]),
    sexpr
  ];
  return new SexprNode(parts);
}

function concatNode(string, tempMap) {
  var parts = splitCapture(TEMP_PLACEHOLDER, string)
    , partsLen = parts.length
    , part
    , i;
  for (i = 0; i < partsLen; i++) {
    part = parts[i];
    parts[i] = part.match(TEMP_PLACEHOLDER) ?
      escapeNode(tempMap.get(part)) :
      stringNode(part);
  }
  parts.unshift(new IdNode([{part: '__i18nliner_concat'}]));
  return new SexprNode(parts);
}

var PreProcessor = {
  process: function(ast) {
    var statements = ast.statements
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
    if (statement.type === 'mustache' && statement.id.string === 't') {
      return this.transformInline(statement)
    }
    else if (statement.type === 'mustache') {
      return this.process({ statements: [statement.sexpr] });
    }
    else if (statement.type === 'block') {
      // consume anything inside this first (e.g. if we have nested t blocks)
      this.process(statement.program);
      if (statement.inverse)
        this.process(statement.inverse);

      if (statement.mustache.id.string !== "t") return;

      return this.transform(statement);
    }
    else if (statement.type === 'sexpr') {
      const sexpr = statement

      this.processStatement(sexpr.id);

      for (const param of sexpr.params) {
        this.processStatement(param)
      }

      if (sexpr.hash) {
        for (const pair of sexpr.hash.pairs) {
          this.processStatement(pair[1]);
        }
      }

      if (sexpr.id.string === 't') {
        this.transformInline(sexpr);
      }
    }
  },

  transformInline: function(node) {
    if (node.params.length === 1 && node.params[0].type === 'STRING' && !node.hash) {
      const [defaultValue] = node.params

      node.params.unshift(this.inferKey(defaultValue.string))

      this.updateHash(node, [
        ["i18n_inferred_key", new BooleanNode(true)]
      ])
    }
    else {
      return node
    }
  },

  transform: function(node) {
    var parts = this.inferParts(node.program.statements)
      , defaultValue = parts.defaultValue
      , hash = parts.hash;
    node = node.mustache;
    if (!node.params.length) {
      node.params.push(this.inferKey(defaultValue));
      hash.push(["i18n_inferred_key", new BooleanNode(true)]);
    }
    node.params.push(new StringNode(defaultValue));
    node.isHelper = 1;
    node.sexpr.isHelper = 1;
    this.updateHash(node, hash);
    return node;
  },

  updateHash: function(node, hash) {
    if (!hash.length) return;

    if (!node.hash) {
      node.hash = new HashNode([]);
      if (node.sexpr) {
        node.sexpr.hash = node.hash
      }
    }
    var existingKeys = {}
      , len
      , i
      , pairs;
    pairs = node.hash.pairs;
    for (i = 0, len = pairs.length; i < len; i++)
      existingKeys[pairs[i][0]] = true;
    for (i = 0, len = hash.length; i < len; i++)
      if (!existingKeys[hash[i][0]])
        pairs.push(hash[i]);
    if (Handlebars.VERSION < "2.0")
      this.applySubExpressionHack(node);
  },

  /*
   * handlebars 1.3 doesn't correctly handle 2+ subexpressions
   * within an options hash. additionally an earlier multi-level
   * path in the hash will stomp a later sub-expression. so we
   * work around what we can and raise an error for things we
   * can't
   *
   * https://github.com/wycats/handlebars.js/issues/748
   * https://github.com/wycats/handlebars.js/issues/767
   */
  applySubExpressionHack: function(node) {
    node.hash.pairs = node.hash.pairs.sort(function(a,b) {
      if (a[1].type === b[1].type) {
        return 0
      }
      else if (a[1].type === 'sexpr') {
        return -1;
      }
      else if (b[1].type === 'sexpr') {
        return 1;
      }
    });
    var pairs = node.hash.pairs;
    if (pairs.length > 1 && pairs[1][1].type === "sexpr")
      throw new Errors.MultipleSubExpressionsError(node.firstLine, "Handlebars 1.3 doesn't support multiple sub-expressions in the options hash");
  },

  inferKey: function(defaultValue) {
    return new StringNode(inferKey(defaultValue));
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
      case 'block':
        throw new Errors.TBlockNestingError(statement.firstLine, "can't nest block expressions inside a t block");
      case 'content':
        return statement.string;
      case 'mustache':
        node = statement.sexpr;
        if (!node.isHelper) node = node.id;
        delete node.isRoot;
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

  stringParts: function(sexpr, result) {
    var i
      , len
      , items;
    result = result || [];
    if (sexpr.type === 'sexpr') {
      this.stringParts(sexpr.id, result);
      items = sexpr.params;
      for (i = 0, len = items.length; i < len; i++) {
        this.stringParts(items[i], result);
      }
      if (sexpr.hash) {
        items = sexpr.hash.pairs;
        for (i = 0, len = items.length; i < len; i++) {
          result.push(items[i][0]);
          this.stringParts(items[i][1], result);
        }
      }
    } else {
      result.push(sexpr.original);
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
      if (wrappers[i][1].string === wrapper)
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
          throw new Errors.UnwrappableContentError(context.firstLine, "multiple text nodes in html markup");
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
