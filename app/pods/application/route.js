import Route from 'ember-route'
import service from 'ember-service/inject'
import RSVP from 'rsvp'
// import computed from 'ember-computed'
import fetch from 'lolma-us/utils/fetch-rsvp'

import _ from 'npm:lodash'



export default Route.extend({

  // ----- Services -----
  router:   service('-routing'),
  fastboot: service(),



  // ----- Overridden properties -----



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----
  model () {
    const store = this.get('store')

    return RSVP
      .hash({
        isFastBoot:          this.get('fastboot.isFastBoot'),
        website:             store.findRecord('website', 'website'),
        gitHubProjectsStats: this.fetchgitHubProjectsStats()
      })

      .then(model => RSVP.hash({
        ...model,
        projects: this.fetchProjects({store, website: model.website})
      }))
  },



  // ----- Custom Methods -----
  fetchgitHubProjectsStats () {
    return fetch('https://api.github.com/users/lolmaus/repos', {
      headers: {Accept: 'application/vnd.github.v3+json'}
    })
      .then(response => {
        const repos = response.json()
        return {
          repos,
          reposById:  _.keyBy(repos, 'name'),
          totalStars: repos.reduce((result, {stargazers_count}) => result + stargazers_count, 0)
        }
      })
      .catch(() => false)
  },

  fetchProjects ({store, locale, website}) {
    const promises =
      website
        .hasMany('projects')
        .ids()
        .map(id => store.findRecord('project', id))

    return RSVP.all(promises)
  },


  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
