const fs = require('fs')
const config = {
  inferredKeyFormat: 'underscored_crc32',
  /*
    literal:
      Just use the literal string as its translation key
    underscored:
      Underscored ascii representation of the string, truncated to
      <underscoredKeyLength> bytes
    underscored_crc32:
      Underscored, with a checksum at the end to avoid collisions
  */

  underscoredKeyLength: 50,

  basePath: ".",
  /*
    Where to look for files. Additionally, the output json file
    will be relative to this.
   */

  directories: [],
  /*
    Further limit extraction to these directories. If empty,
    I18nliner will look everywhere under <basePath>
   */

  babylonPlugins: ["jsx", "classProperties", "objectRestSpread"]
  /*
    The set of babylon plugins to use in AST parsing.
    See: https://github.com/babel/babel/tree/master/packages/babylon#plugins
   */
};

exports.ignore = () => {
  var ignores = [];
  if (fs.existsSync(".i18nignore")) {
    ignores = fs.readFileSync(".i18nignore").toString().trim().split(/\r?\n|\r/);
  }
  return ignores;
}

const set = (key, value, fn) => {
  var prevValue = config[key];
  config[key] = value;
  if (fn) {
    try {
      fn();
    }
    finally {
      config[key] = prevValue;
    }
  }
}

exports.loadConfig = () => {
  var config = maybeLoadJSON(".i18nrc");

  for (var key in config) {
    if (key !== "plugins") {
      set(key, config[key]);
    }
  }

  // plugins need to be loaded last to allow them to get
  //  the full config option when they are initialized
  if (config.plugins && config.plugins.length > 0) {
    loadPlugins(config.plugins);
  }
}

const loadPlugins = (plugins) => {
  plugins.forEach(function(pluginName) {
    var plugin = require(pluginName);
    if (plugin.default) {
      plugin = plugin.default
    };

    if (typeof plugin.register === 'function') {
      plugin = plugin.register
    }

    plugin({
      processors: require('./processors'),
      config: config
    });
  });
}

const maybeLoadJSON = function (path){
  var data = {}
  if (fs.existsSync(path)) {
    try {
      data = JSON.parse(fs.readFileSync(path, 'utf8'));
    } catch (e) {
      console.log(e);
    }
  }
  return data;
}

exports.config = config;
exports.set = set;
