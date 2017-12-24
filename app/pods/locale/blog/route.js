import Route from '@ember/routing/route'
import {inject as service} from '@ember/service'
import RSVP from 'rsvp'



export default Route.extend({

  // ----- Services -----
  i18n : service(),



  // ----- Overridden properties -----



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----
  model () {
    const model  = this.modelFor('locale')
    const locale = model.locale
    const i18n   = this.get('i18n')

    return RSVP
      .hash({
        ...model,


        linkedData : {
          ...model.linkedData,

          blog : {
            '@type' : 'Blog',

            author     : model.linkedData.website.author,
            accessMode : model.linkedData.website.accessMode,
            inLanguage : model.linkedData.website.inLanguage,
            audience   : model.linkedData.website.audience,
            license    : model.linkedData.website.license,

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

          breadcrumb : {
            '@type' : 'BreadcrumbList',

            itemListElement : [
              {
                '@type'  : 'ListItem',
                position : 1,

                item : {
                  '@id' : `https://lolma.us/${locale}/blog/`,
                  name  : i18n.t('menu.blog').string,
                },
              },
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
