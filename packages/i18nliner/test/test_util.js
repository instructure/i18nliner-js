const {configure} = require("@instructure/i18nliner/config");
const {configure: configureRuntime} = require("@instructure/i18nliner-runtime");

exports.configureAndReset = () => {
  let previousConfig

  afterEach(() => {
    if (previousConfig) {
      configure(previousConfig)
    }
  })

  return partial => {
    previousConfig = configure(partial)
  }
}

exports.configureRuntimeAndReset = () => {
  let previousConfig

  afterEach(() => {
    if (previousConfig) {
      configureRuntime(previousConfig)
    }
  })

  return partial => {
    previousConfig = configureRuntime(partial)
  }
}
