import ToriiAuthenticator from 'ember-simple-auth/authenticators/torii'
import {inject as service} from '@ember/service'
import fetch from 'lolma-us/utils/fetch-rsvp'
import fetchGithub from 'lolma-us/utils/fetch-github'
import RSVP from 'rsvp'



export default ToriiAuthenticator.extend({

  // ----- Services -----
  config  : service(),
  metrics : service(),
  rollbar : service(),
  torii   : service(),



  // ----- Overridden methods -----
  authenticate (provider, options = {}) {
    this._assertToriiIsPresent()

    const gatekeeperUrl = this.get('config.gatekeeperUrl')

    return this
      .get('torii')

      // Open popup with GitHub Auth
      .open(provider, options)

      // Retrieve GitHub token using authorizationCode
      .then(response => {
        const url = `${gatekeeperUrl}/authenticate/${response.authorizationCode}`
        return fetch(url)
      })

      // Fail if HTTP code is ok but payload contains error
      .then(data => {
        if (data.error) {
          if (options.analConsent) {
            this.get('metrics').trackEvent({
              category : 'Logging in and out',
              action   : 'login failure',
              label    : `GitHub: ${JSON.stringify(data.error)}`,
            })
          }

          return RSVP.reject(data)
        }

        return {...data, analConsent : options.analConsent}
      })

      // Required by ToriiAuthenticator
      .then(data => (this._authenticateWithProvider(provider, data), data))

      // Track and retireve GitHub user info
      .then(data => {
        this.get('metrics').trackEvent({
          category : 'Logging in and out',
          action   : 'login',
          label    : 'GitHub',
          value    : data.analConsent && data.login,
        })

        if (!data.analConsent) return data

        return fetchGithub('user', data.token)
          .then(user => {
            this.set('rollbar.currentUser', {id : data.login})

            const metrics = this.get('metrics')

            metrics.set('context.userName', user.login)
            metrics.identify({distinctId : user.login})

            return {...data, ...user}
          })
      })
  },



  restore (data) {
    return this
      ._super(data)
      .then((data) => {
        const metrics    = this.get('metrics')
        const gitHubLogin = data.analConsent && data.login

        if (gitHubLogin) {
          this.set('rollbar.currentUser', {id : data.login})
          metrics.set('context.userName', gitHubLogin)
          metrics.identify({distinctId : gitHubLogin})
        }

        metrics.trackEvent({
          category : 'Logging in and out',
          action   : 'restore',
          label    : 'GitHub',
          value    : gitHubLogin,
        })

        return data
      })
  },



  invalidate (data = {}) {
    const gitHubLogin = data.analConsent && data.login

    return this
      ._super(data)
      .then(() => {
        this.set('rollbar.currentUser', null)

        const metrics = this.get('metrics')

        if (gitHubLogin) {
          metrics.set('context.userName', null)
          metrics.identify({distinctId : null})
        }

        metrics.trackEvent({
          category : 'Logging in and out',
          action   : 'logout',
          label    : 'GitHub',
          value    : gitHubLogin,
        })
      })
  },



  // ----- Custom methods -----
})
