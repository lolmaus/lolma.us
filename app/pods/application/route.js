// import {observer} from '@ember/object'
import Route from '@ember/routing/route'
// import {inject as service} from '@ember/service'
// import RSVP from 'rsvp'
// import _ from 'npm:lodash'



export default Route.extend({

  // ----- Services -----



  // ----- Overridden properties -----



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----
  title (tokens) {
    return tokens.reverse().join(' | ')
  },



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
