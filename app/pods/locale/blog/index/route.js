import Route from 'ember-route'
import RSVP from 'rsvp'



export default Route.extend({

  // ----- Services -----



  // ----- Overridden properties -----
  title: 'lolmaus - Andrey Mikhaylov',



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----
  model () {
    const model  = this.modelFor('locale')
    const locale = model.locale
    const store  = this.get('store')

    return RSVP
      .hash({
        ...model,
        blog: store.findRecord('junction', 'blog'),
      })

      .then(model => RSVP.hash({
        ...model,
        posts: model.blog.fetchChildRecords({locale, modelName: 'post'}),
      }))
  },



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
