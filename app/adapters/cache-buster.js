import ApplicationAdapter from './application'
import {inject as service} from '@ember/service'



export default ApplicationAdapter.extend({

  fastboot : service(),

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
