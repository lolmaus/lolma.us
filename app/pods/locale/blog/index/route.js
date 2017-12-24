import Route from '@ember/routing/route'
import {inject as service} from '@ember/service'
import RSVP from 'rsvp'



export default Route.extend({

  // ----- Services -----
  config : service(),
  i18n   : service(),



  // ----- Overridden properties -----
  title : 'lolmaus - Andrey Mikhaylov',



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----
  model () {
    const model  = this.modelFor('locale.blog')
    const locale = model.locale
    const store  = this.get('store')
    const i18n   = this.get('i18n')

    return RSVP
      .hash({
        ...model,
        posts : store.query('post', {locale}),

        linkedData : {
          ...model.linkedData,

          mainEntity : {
            '@type' : 'Blog',

            author     : model.linkedData.author,
            accessMode : model.linkedData.accessMode,
            inLanguage : model.linkedData.inLanguage,
            audience   : model.linkedData.audience,
            license    : model.linkedData.license,

            name        : i18n.t('blogIndex.name').string,
            description : i18n.t('blogIndex.description').string,
            url         : `https://lolma.us/${locale}/blog/`,

            keywords : [
              'development',
              'web development',
              'webdev',
              'ember',
              'emberjs',
              'js',
              'javascript',
              'frontend',
            ],
          },

        },
      })
  },



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
