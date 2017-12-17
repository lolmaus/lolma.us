import Controller from '@ember/controller'
import {inject as service} from '@ember/service'
import $ from 'jquery'



export default Controller.extend({

  // ----- Services -----
  htmlState : service(),



  // ----- Overridden properties -----



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----



  // ----- Custom Methods -----



  // ----- Events and observers -----
  init () {
    this._super(...arguments)

    if (typeof FastBoot === 'undefined') {
      $('html').addClass('-live')
    }
  },



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
