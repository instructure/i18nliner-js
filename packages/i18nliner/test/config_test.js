const runtime = require("@instructure/i18nliner-runtime");
const sinon = require("sinon");
const {assert} = require("chai");
const {configure} = require('@instructure/i18nliner/config')

describe('config.useConfig', function() {
  afterEach(() => {
    sinon.restore()
  })

  it('forwards inferredKeyFormat to runtime', function() {
    sinon.stub(runtime, 'configure')

    configure({
      inferredKeyFormat: 'blah'
    })

    sinon.assert.calledWith(runtime.configure, {
      inferredKeyFormat: 'blah'
    })
  })

  it('forwards inferredKeyFormat to runtime', function() {
    sinon.stub(runtime, 'configure')

    configure({
      underscoredKeyLength: 33
    })

    sinon.assert.calledWith(runtime.configure, {
      underscoredKeyLength: 33
    })
  })
})
