import Route from '@ember/routing/route'
import {inject as service} from '@ember/service'
import RSVP from 'rsvp'
import $ from 'jquery'
// import _ from 'npm:lodash'



export default Route.extend({

  // ----- Services -----
  config   : service(),
  i18n     : service(),
  moment   : service(),
  fastboot : service(),



  // ----- Overridden properties -----



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----
  model ({locale}) {
    if (!['en', 'ru'].includes(locale)) locale = 'en'
    this.set('i18n.locale', locale)
    this.get('moment').changeLocale(locale)

    // const model = this.modelFor('application')
    const store      = this.get('store')
    const isFastBoot = this.get('fastboot.isFastBoot')

    return RSVP
      .hash({
        // ...model,
        locale,
        isFastBoot,
        cacheBuster : store.findRecord('cache-buster', 'buster'),
      })
  },

  afterModel () {
    this._checkCacheBuster()
  },



  // ----- Custom Methods -----
  _checkCacheBuster () {
    if (this.get('fastboot.isFastBoot')) return

    const store  = this.get('store')
    const buster = store.peekRecord('cache-buster', 'buster')

    if (!buster) return

    const oldString = buster.get('string')

    store
      .findRecord('cache-buster', 'buster', {reload : true})
      .then(buster => {
        if (oldString !== buster.get('string')) this._offerPageReload()
      })
  },

  _offerPageReload () {
    const i18n    = this.get('i18n')
    const message = i18n.t('refreshSuggestion')

    if (window.confirm(message)) window.location.reload(true)
  },

  _reloadPage () {
    // http://stackoverflow.com/a/27058362/901944
    $
      .ajax({
        url     : window.location.href,
        headers : {
          "Pragma"        : "no-cache",
          "Expires"       : -1,
          "Cache-Control" : "no-cache",
        },
      })
      .done(() => window.location.reload(true))
  },



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
