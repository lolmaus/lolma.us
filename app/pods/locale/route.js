import Route from 'ember-route'
import service from 'ember-service/inject'
import RSVP from 'rsvp'
import _ from 'npm:lodash'
// import retrieveFromShoeboxOrStoreFind from 'lolma-us/utils/retrieve-from-shoebox-or-store-find'



export default Route.extend({

  // ----- Services -----
  i18n:     service(),
  // fastboot: service(),



  // ----- Overridden properties -----



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----
  model ({locale}) {
    if (!['en', 'ru'].includes(locale)) locale = 'en'
    this.set('i18n.locale', locale)

    const store       = this.get('store')
    const parentModel = this.modelFor('application')
    // const fastboot    = this.get('fastboot')

    return RSVP
      .hash({
        ...parentModel,
        locale,
        website: store.findRecord('website', 'website')
      })
      .then(model => RSVP.hash({
        ...model,

        frontPageSections: RSVP.all(
          model
            .website
            .hasMany('frontPageSections')
            .ids()
            .filter(id => _.endsWith(id, `-${locale}`))
            .map(id => store.findRecord('front-page-section', id))
        ),

        projects: RSVP.all(
          model
            .website
            .hasMany('projects')
            .ids()
            .map(id => store.findRecord('project', id))
        ),
      }))
  },



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
