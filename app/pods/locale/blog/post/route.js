import Route from 'ember-route'
import RSVP from 'rsvp'



export default Route.extend({

  // ----- Services -----



  // ----- Overridden properties -----
  title: 'lolmaus - Andrey Mikhaylov',



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----
  model ({slug}) {
    const model  = this.modelFor('locale')
    const store  = this.get('store')
    const id     = `${slug}-${model.locale}`

    return RSVP
      .hash({
        ...model,
        post: store.findRecord('post', id),
      })
  },



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
