import ToriiAuthenticator from 'ember-simple-auth/authenticators/torii'
import {inject as service} from '@ember/service'
import fetch from 'lolma-us/utils/fetch-rsvp'
import fetchGithub from 'lolma-us/utils/fetch-github'
import RSVP from 'rsvp'



export default ToriiAuthenticator.extend({

  // ----- Services -----
  config  : service(),
  metrics : service(),
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

      // Retireve GitHub user info
      .then(data => this._maybeRetrieveGitHubUserInfoAndTrack(data, options))
  },



  restore (data) {
    return this
      ._super(data)
      .then((data) => {
        const gitHubLogin = data.analConsent && data.login

        if (gitHubLogin) {
          const metrics = this.get('metrics')

          metrics.set('context.userName', gitHubLogin)
          metrics.identify({distinctId : gitHubLogin})

          metrics.trackEvent({
            category : 'Logging in and out',
            action   : 'restore',
            label    : 'GitHub',
            value    : gitHubLogin,
          })
        }
      })
  },



  invalidate (data = {}) {
    const gitHubLogin = data.analConsent && data.login

    return this
      ._super(data)
      .then(() => {
        if (gitHubLogin) {
          const metrics = this.get('metrics')

          metrics.trackEvent({
            category : 'Logging in and out',
            action   : 'logout',
            label    : 'GitHub',
            value    : gitHubLogin,
          })

          metrics.set('context.userName', null)
          metrics.identify({distinctId : null})
        }
      })
  },



  // ----- Custom methods -----
  _maybeRetrieveGitHubUserInfoAndTrack (data, {analConsent}) {
    if (!analConsent) return data

    return fetchGithub('user', data.token)
      .then(user => {
        const metrics = this.get('metrics')

        metrics.set('context.userName', user.login)
        metrics.identify({distinctId : user.login})

        metrics.trackEvent({
          category : 'Logging in and out',
          action   : 'login',
          label    : 'GitHub',
          value    : user.login,
        })

        return {...data, ...user}
      })
  },
})
