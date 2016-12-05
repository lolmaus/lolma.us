import Component from 'ember-component'
import service from 'ember-service/inject'
import on from  'ember-evented/on'
import $ from 'jquery'



export default Component.extend({

  // ----- Arguments -----



  // ----- Services -----
  htmlState: service(),
  routing:   service('-routing'),



  // ----- Overridden properties -----
  classNames: ['sideMenu'],



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----



  // ----- Custom Methods -----
  _isElementAMenuItem (element) {
    return $(element).closest('.route-locale-menu-item').length > 0
  },



  // ----- Events and observers -----
  collapseMenu: on('click', function ({target}) {
    if (this._isElementAMenuItem(target)) this.set('htmlState.menuToggler', false)
  }),



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
