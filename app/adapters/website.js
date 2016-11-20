import ApplicationAdapter from './application'

export default ApplicationAdapter.extend({
  pathForType (/*modelName*/) {
    return ''
  },

  urlForFindRecord (id, modelName, snapshot) {
    return this._super(id, modelName, snapshot) + '.json'
  }
})
