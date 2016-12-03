import Route from 'ember-route'
import service from 'ember-service/inject'
import RSVP from 'rsvp'
// import _ from 'npm:lodash'



export default Route.extend({

  // ----- Services -----
  i18n:    service(),
  moment:  service(),



  // ----- Overridden properties -----



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----
  model ({locale}) {
    if (!['en', 'ru'].includes(locale)) locale = 'en'
    this.set('i18n.locale', locale)
    this.get('moment').changeLocale(locale)

    const model = this.modelFor('application')

    return RSVP
      .hash({
        ...model,
        locale
      })
  },



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
