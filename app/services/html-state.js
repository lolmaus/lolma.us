import Service, {inject as service} from '@ember/service'
import {computed} from '@ember/object'
import {scheduleOnce} from '@ember/runloop'
import _ from 'npm:lodash'
import $ from 'jquery'



export default Service.extend({

  // ----- Services -----
  fastboot : service(),



  // ----- Overridden properties -----



  // ----- Static properties -----
  htmlStateIsRestored : false,



  // ----- Computed properties -----
  menuToggler : computed(function () {
    if (this.get('fastboot.isFastBoot')) return false
    return window.lolmausHtmlState['#route-locale-menuToggler'].value
  }),

  timelineShowDetails : computed(function () {
    if (this.get('fastboot.isFastBoot')) return false
    return window.lolmausHtmlState['.timeLine-showDetails'].value
  }),

  showStalledProjects : computed(function () {
    if (this.get('fastboot.isFastBoot')) return false
    return window.lolmausHtmlState['.proJects-stalledInput'].value
  }),



  // ----- Overridden Methods -----



  // ----- Custom Methods -----
  restoreHtmlState () {
    if (
      this.get('htmlStateIsRestored')
      || !window.lolmausHtmlState
    ) return

    scheduleOnce('afterRender', this, this._restoreHtmlState)
  },

  _restoreHtmlState () {
    this.set('htmlStateIsRestored', true)

    _.forOwn(window.lolmausHtmlState, ({type, value}, selector) => {
      switch (type) {
        // case 'checkbox':
        //   break
        case 'vertical-scroll':
          $(selector).scrollTop(value)
          break
      }
    })
  },



  // ----- Events and observers -----



  // ----- Tasks -----

})
