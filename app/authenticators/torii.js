import ToriiAuthenticator from 'ember-simple-auth/authenticators/torii'
import service from 'ember-service/inject'
import fetch from 'lolma-us/utils/fetch-rsvp'
import RSVP from 'rsvp'



export default ToriiAuthenticator.extend({

  // ----- Services -----
  config: service(),
  torii: service(),



  // ----- Overridden methods -----
  authenticate (provider, options) {
    this._assertToriiIsPresent()

    const gatekeeperUrl = this.get('config.gatekeeperUrl')

    return this
      .get('torii')
      .open(provider, options || {})
      .then(response => {
        const url = `${gatekeeperUrl}/authenticate/${response.authorizationCode}`
        return fetch(url)
      })
      .then(data => {
        if (data.error) return RSVP.reject(data)
        return data
      })
      .then(data => (this._authenticateWithProvider(provider, data), data))
  }
})
