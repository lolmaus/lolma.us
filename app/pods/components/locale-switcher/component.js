import Component from 'ember-component'
import computed from 'ember-computed'
import service from 'ember-service/inject'



export default Component.extend({

  // ----- Arguments -----
  toggleLocaleAction: undefined,



  // ----- Services -----
  i18n:   service('i18n'),



  // ----- Overridden properties -----
  attributeBindings: ['href'],
  classNames:        ['localeSwitcher'],
  tagName:           'a',



  // ----- Static properties -----
  href: computed('i18n.oppositeLocale', function () {
    return '/' + this.get('i18n.oppositeLocale')
  }),



  // ----- Computed properties -----



  // ----- Overridden Methods -----
  click (event) {
    event.preventDefault()
    this.get('toggleLocaleAction')()
  },



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
