module.exports = ({ processors }) => {
  processors.JsProcessor = require('./scoped_esm_processor');
  processors.HbsProcessor = require('./scoped_hbs_processor');
};
