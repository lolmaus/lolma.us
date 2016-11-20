import ToriiAuthenticator from 'ember-simple-auth/authenticators/torii'
import service from 'ember-service/inject'
import fetch from 'lolma-us/utils/fetch-rsvp'



export default ToriiAuthenticator.extend({

  // ----- Services -----
  torii: service(),



  // ----- Overridden methods -----
  authenticate (provider, options) {
    this._assertToriiIsPresent()

    return this
      .get('torii')
      .open(provider, options || {})
      .then(response => {
        const url = `https://lolma-us-dev-4200.herokuapp.com/authenticate/${response.authorizationCode}`
        return fetch(url)
      })
      .then(data => (this._authenticateWithProvider(provider, data), data))
  }
})
