import Component from '@ember/component'
import {computed} from '@ember/object'
import {randomString} from 'lolma-us/helpers/random-string'
import {inject as service} from '@ember/service'



export default Component.extend({

  // ----- Arguments -----
  projects            : undefined,
  gitHubProjectsStats : undefined,
  locale              : 'en',
  loginAction         : undefined,
  isAuthenticating    : undefined,
  isAuthenticated     : undefined,



  // ----- Services -----
  htmlState : service(),



  // ----- Overridden properties -----
  classNames : ['proJects'],



  // ----- Static properties -----



  // ----- Computed properties -----
  checkboxId : computed(randomString),



  // ----- Overridden Methods -----



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
