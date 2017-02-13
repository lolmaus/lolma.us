import ApplicationAdapter from './application'
import service from 'ember-service/inject'



export default ApplicationAdapter.extend({

  fastboot: service(),

  urlForFindRecord (id, modelName, snapshot) {
    const url  = this._super(id, modelName, snapshot)
    const rand = Date.now()

    return `${url}?bust=${rand}`
  },

  shouldBackgroundReloadAll    () { return false },
  shouldBackgroundReloadRecord () { return false },
  shouldReloadAll              () { return false },
  shouldReloadRecord           () { return false },
})
