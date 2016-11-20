import Route from 'ember-route'
import service from 'ember-service/inject'
// import computed from 'ember-computed'



export default Route.extend({

  // ----- Services -----
  router: service('-routing'),
  i18n:   service('i18n'),



  // ----- Overridden properties -----



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----
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
  actions: {
    toggleLocale () {
      const oppositeLocale      = this.get('i18n.oppositeLocale')
      const currentRouteName    = this.get('router.currentRouteName')
      const currentHandlerInfos = this.get('router.router.currentHandlerInfos')

      const segments =
        currentHandlerInfos
          .slice(2)
          .map(info =>
            info._names.map(name => info.params[name])
          )
          .reduce((result, item) => result.concat(item), []) //flatten

      this.transitionTo(currentRouteName, oppositeLocale, ...segments)
    }
  }
})
