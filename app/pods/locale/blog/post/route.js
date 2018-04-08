import Route from '@ember/routing/route'
// import reads from 'ember-macro-helpers/reads'
import RSVP from 'rsvp'



export default Route.extend({

  // ----- Services -----



  // ----- Overridden properties -----



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

        ogType : 'article',

        linkedData : {
          ...model.linkedData,

          article : {
            '@type' : model.post.get('proficiency') ? 'TechArticle' : 'Article',

            author     : model.linkedData.website.author,
            accessMode : model.linkedData.website.accessMode,
            inLanguage : model.linkedData.website.inLanguage,
            audience   : model.linkedData.website.audience,
            license    : model.linkedData.website.license,

            headline       : model.post.get('title'),
            description    : model.post.get('summary'),
            image          : model.post.get('image') || 'https://lolma.us/favicon.jpg',
            datePublished  : model.post.get('created') && model.post.get('created').toISOString(),
            dateModified   : model.post.get('updated') && model.post.get('updated').toISOString(),
            dependencies   : model.post.get('dependencies'),
            oficiencyLevel : model.post.get('proficiency'),
            keywords       : model.post.get('keywords'),

            mainEntityOfPage : {
              '@type' : 'WebPage',
              '@id'   : model.post.get('url'),
            },
          },

          breadcrumb : {
            ...model.linkedData.breadcrumb,

            itemListElement : [
              ...model.linkedData.breadcrumb.itemListElement,
              {
                '@type'  : 'ListItem',
                position : model.linkedData.breadcrumb.itemListElement.length + 1,

                item : {
                  '@id' : model.post.get('url'),
                  name  : model.post.get('title'),
                },
              },
            ],
          },
        },
      }))
  },

  titleToken (model) {
    return model.post.get('title')
  },



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
