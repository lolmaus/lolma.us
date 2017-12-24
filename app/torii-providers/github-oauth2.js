import {inject as service} from '@ember/service'
import {tag} from 'ember-awesome-macros'
import GitHubOAuth2Provider from 'torii/providers/github-oauth2'

export default GitHubOAuth2Provider.extend({

  // ----- Services -----
  config : service(),



  // ----- Overridden methods -----
  fetch (data) {
    return data
  },

  redirectUri : tag`${'config.host'}/torii/redirect.html`,
})
