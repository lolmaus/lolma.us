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
    const model  = this.modelFor('locale.blog')
    const locale = model.locale
    const store  = this.get('store')

    return RSVP
      .hash({
        ...model,
        post : store.queryRecord('post', {locale, slug}),
      })
      .then((model) => RSVP.hash({
        ...model,
        linkedData : {
          ...model.linkedData,

          mainEntity : {
            '@type' : 'TechArticle',

            author     : model.linkedData.author,
            accessMode : model.linkedData.accessMode,
            inLanguage : model.linkedData.inLanguage,
            audience   : model.linkedData.audience,
            license    : model.linkedData.license,

            headline      : model.post.get('title'),
            description   : model.post.get('summary'),
            image         : model.post.get('image') || 'https://lolma.us/images/andrey-mikhaylov-lolmaus.jpg',
            datePublished : model.post.get('created') && model.post.get('created').toISOString(),
            dateModified  : model.post.get('updated') && model.post.get('updated').toISOString(),
            dependencies  : model.post.get('dependencies'),
            proficiency   : model.post.get('proficiency'),
            keywords      : model.post.get('keywords'),
          },
        },
      }))
  },



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
