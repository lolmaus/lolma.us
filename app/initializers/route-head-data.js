import Route from '@ember/routing/route'
import {inject as service} from '@ember/service'

export function initialize () {

  Route.reopen({
    headData : service(),

    afterModel (model, transition) {
      if (model && model.linkedData) {
        this.get('headData').set('linkedData', model.linkedData)
      }
    },
  })

}

export default {
  name : 'route-head-data',
  initialize,
}
