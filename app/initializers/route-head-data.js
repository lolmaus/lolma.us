import Route from '@ember/routing/route'
import {inject as service} from '@ember/service'

export function initialize () {

  Route.reopen({
    headData : service(),

    afterModel (model, transition) {
      this.get('headData').setProperties({model})
    },
  })

}

export default {
  name : 'route-head-data',
  initialize,
}
