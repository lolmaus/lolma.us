import Route from '@ember/routing/route'
import {inject as service} from '@ember/service'
import RSVP from 'rsvp'



export default Route.extend({

  // ----- Services -----
  config : service(),
  // i18n   : service(),



  // ----- Overridden properties -----



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----
  model () {
    const model  = this.modelFor('locale.blog')
    const locale = model.locale
    const store  = this.get('store')

    return RSVP
      .hash({
        ...model,
        posts  : store.query('post', {locale}),
        ogType : 'blog',
      })
  },



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
