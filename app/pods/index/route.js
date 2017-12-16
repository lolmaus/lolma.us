import Route from '@ember/routing/route'
import {inject as service} from '@ember/service'



export default Route.extend({

  // ----- Services -----
  fastboot : service(),
  headData : service(),



  // ----- Overridden properties -----



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----
  redirect () {
    if (!this.get('fastboot.isFastBoot')) this.transitionTo('locale.blog', 'en')
    else this.set('headData.redirectToEn', true)
  },
  // model() {
  //   /* jshint unused:false */
  //   const model = this.modelFor('')
  //
  //   return RSVP.hash({
  //     /* jshint ignore:start */
  //     ...model,
  //     /* jshint ignore:end */
  //   })
  // },



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
