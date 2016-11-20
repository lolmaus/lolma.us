import Route from 'ember-route'
import service from 'ember-service/inject'



export default Route.extend({

  // ----- Services -----
  fastboot: service(),
  headData: service(),



  // ----- Overridden properties -----



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----
  redirect () {
    if (!this.get('fastboot.isFastBoot')) this.transitionTo('locale', {locale: 'en'})
    else this.set('headData.redirectToEn', true)
  },
  // model() {
  //   /* jshint unused:false */
  //   const parentModel = this.modelFor('')
  //
  //   return RSVP.hash({
  //     /* jshint ignore:start */
  //     ...parentModel,
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
