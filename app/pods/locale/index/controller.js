import Controller from '@ember/controller'
import {inject as service} from '@ember/service'



export default Controller.extend({

  // ----- Services -----
  session : service(),



  // ----- Overridden properties -----



  // ----- Static properties -----
  isAuthenticating : false,



  // ----- Computed properties -----



  // ----- Overridden Methods -----



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  actions : {
    login () {
      this.set('isAuthenticating', true)

      this
        .get('session')
        .authenticate('authenticator:torii', 'github-oauth2')
        .finally(() => this.set('isAuthenticating', false))
    },

    logout () {
      this.get('session').invalidate()
    },
  },
})
