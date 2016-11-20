import Controller from 'ember-controller'
import service from 'ember-service/inject'



export default Controller.extend({

  // ----- Services -----
  session: service(),



  // ----- Overridden properties -----



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  actions: {
    login () {
      this.get('session').authenticate('authenticator:torii', 'github-oauth2')
    },

    logout () {
      this.get('session').invalidate()
    },
  }
})
