import Adapter from 'ember-data/adapter'
import fetchGitHub from 'lolma-us/utils/fetch-github'
import RSVP from 'rsvp'
import _ from 'npm:lodash'
import service from 'ember-service/inject'



export default Adapter.extend({

  // ----- Services -----
  session: service(),



  // ----- Overridden methods -----
  findRecord (store, type, id, snapshot) {
    const session = this.get('session')
    const url     = `repos/${id}`

    return fetchGitHub(url, session)
  },

  findAll (store, type, sinceToken, snapshotRecordArray) {
    const session = this.get('session')

    // Fetch user info with repo count
    return fetchGitHub('users/lolmaus', session)

      // Fetch repos in batches of 100
      .then(({public_repos}) =>
        RSVP.all(
          _.times(Math.ceil(public_repos / 100), i =>
            fetchGitHub(`users/lolmaus/repos?per_page=100&page=${i + 1}`, session)
          )
        )
      )

      // Join repo batches into a single array of batches
      .then(projectInfoBatches => projectInfoBatches.reduce((a, b) => a.concat(b), [])) //flatten

      // .then(projectInfos => (console.log('projectInfos', projectInfos), projectInfos))
  },

  shouldBackgroundReloadAll    () { return false },
  shouldBackgroundReloadRecord () { return false },
  shouldReloadAll              () { return true },
  shouldReloadRecord           () { return true },
})
