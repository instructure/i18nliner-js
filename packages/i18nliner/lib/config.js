const fs = require('fs')
const runtime = require('@instructure/i18nliner-runtime')
const defaults = {
  /*
    Where to look for files. Additionally, the output json file
    will be relative to this.
   */
  basePath: ".",

  /*
    Further limit extraction to these directories. If empty,
    I18nliner will look everywhere under <basePath>
   */
  directories: [],

  /*
    The set of babylon plugins to use in AST parsing.
    See: https://github.com/babel/babel/tree/master/packages/babylon#plugins
   */
  babylonPlugins: ["jsx", "classProperties", "objectRestSpread"],

  processors: {},
};

const config = {...defaults};

exports.ignore = () => {
  var ignores = [];
  if (fs.existsSync(".i18nignore")) {
    ignores = fs.readFileSync(".i18nignore").toString().trim().split(/\r?\n|\r/);
  }
  return ignores;
}

exports.loadConfig = () => {
  const userConfig = maybeLoadJSON(".i18nrc");

  if (userConfig) {
    return useConfig(userConfig)
  }
}

const useConfig = userConfig => {
  const previousConfig = {...config}

  // for backward compat
  const runtimeConfig = {}
  const runtimeConfigKeys = [
    'inferredKeyFormat',
    'underscoredKeyLength',
  ]

  for (const key of Object.keys(userConfig)) {
    if (runtimeConfigKeys.includes(key)) {
      runtimeConfig[key] = userConfig[key]
    }
    else if (defaults.hasOwnProperty(key)) {
      config[key] = userConfig[key]
    }
    else {
      console.warn(`unknown configuration property: ${key}`)
    }
  }

  if (Object.keys(runtimeConfig).length > 0) {
    runtime.configure(runtimeConfig)
  }

  // plugins need to be loaded last to allow them to get
  //  the full config option when they are initialized
  if (userConfig.plugins && userConfig.plugins.length > 0) {
    loadPlugins(userConfig.plugins);
  }

  return previousConfig
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
      processors: config.processors,
      config: config
    });
  });
}

const maybeLoadJSON = function (path){
  if (fs.existsSync(path)) {
    try {
      return JSON.parse(fs.readFileSync(path, 'utf8'));
    } catch (e) {
      console.error(e);
    }
  }

  return null;
}

exports.defaults = defaults;
exports.config = config;
exports.configure = useConfig;
