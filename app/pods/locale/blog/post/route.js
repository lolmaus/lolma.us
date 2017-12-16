import Route from '@ember/routing/route'
import RSVP from 'rsvp'



export default Route.extend({

  // ----- Services -----



  // ----- Overridden properties -----
  title : 'lolmaus - Andrey Mikhaylov',



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----
  model ({slug}) {
    const model  = this.modelFor('locale')
    const locale = model.locale
    const store  = this.get('store')

    return RSVP
      .hash({
        ...model,
        post : store.queryRecord('post', {locale, slug}),
      })
  },



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
