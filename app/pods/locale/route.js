import Route from 'ember-route'
import service from 'ember-service/inject'
import RSVP from 'rsvp'
import _ from 'npm:lodash'



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

    const store = this.get('store')
    const model = this.modelFor('application')

    return RSVP
      .hash({
        ...model,
        locale,
        markdownBlocks: this.getMarkdownBlocks({store, locale, website: model.website})
      })
  },



  // ----- Custom Methods -----
  getMarkdownBlocks ({store, locale, website}) {
    const promises =
      website
        .hasMany('markdownBlocks')
        .ids()
        .filter(id => _.endsWith(id, `-${locale}`))
        .map(id => store.findRecord('markdown-block', id))

    return RSVP.all(promises)
  },



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  actions: {
    toggleLocale () {
      const oppositeLocale      = this.get('i18n.oppositeLocale')
      const currentRouteName    = this.get('router.currentRouteName')
      const currentHandlerInfos = this.get('router.router.currentHandlerInfos')

      const segments =
        currentHandlerInfos
          .slice(2)
          .map(info =>
            info._names.map(name => info.params[name])
          )
          .reduce((result, item) => result.concat(item), []) //flatten

      this.transitionTo(currentRouteName, oppositeLocale, ...segments)
    }
  }
})
