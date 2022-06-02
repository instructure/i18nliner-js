const {configure} = require('@instructure/i18nliner-runtime')

module.exports = ({ processors }) => {
  configure({
    keyPattern: /^#?\w+(\.\w+)+$/ // handle our absolute keys
  })

  processors.JsProcessor = require('./scoped_esm_processor');
  processors.HbsProcessor = require('./scoped_hbs_processor');
};
