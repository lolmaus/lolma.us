import Controller from '@ember/controller'
import {inject as service} from '@ember/service'

const ANAL_CONSENT_LS_KEY = 'lolma.us analytics consent'



export default Controller.extend({

  // ----- Services -----
  i18n    : service(),
  session : service(),



  // ----- Overridden properties -----



  // ----- Static properties -----
  isAuthenticating : false,



  // ----- Computed properties -----



  // ----- Overridden Methods -----



  // ----- Custom Methods -----
  _getAnalConsent () {
    const maybeConsentStr = localStorage.getItem(ANAL_CONSENT_LS_KEY)

    if (maybeConsentStr) return JSON.parse(maybeConsentStr)

    const message     = this.get('i18n').t('localeIndex.loginWarning').string
    const consentBool = window.confirm(message)

    localStorage.setItem(ANAL_CONSENT_LS_KEY, JSON.stringify(consentBool))
    return consentBool
  },



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  actions : {
    login () {
      let analConsent = this._getAnalConsent()

      this.set('isAuthenticating', true)

      this
        .get('session')
        .authenticate('authenticator:torii', 'github-oauth2', {analConsent})
        .finally(() => this.set('isAuthenticating', false))
    },

    logout () {
      this.get('session').invalidate()
    },
  },
})
