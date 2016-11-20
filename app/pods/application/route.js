import Route from 'ember-route'
import service from 'ember-service/inject'
import RSVP from 'rsvp'
// import computed from 'ember-computed'
import fetchGitHub from "lolma-us/utils/fetch-github"

import _ from 'npm:lodash'



export default Route.extend({

  // ----- Services -----
  router:   service('-routing'),
  fastboot: service(),
  session: service(),



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
        gitHubProjectsStats: this.fetchGitHubProjectsStats()
      })

      .then(model => RSVP.hash({
        ...model,
        projects: this.fetchProjects({store, website: model.website})
      }))
  },



  // ----- Custom Methods -----
  fetchGitHubProjectsStats () {
    const session = this.get('session')

    return RSVP
      .all([
        fetchGitHub('users/lolmaus/repos?per_page=100',        session),
        fetchGitHub('users/lolmaus/repos?per_page=100&page=2', session),
      ])
      .then(responses => responses.reduce((a, b) => a.concat(b), [])) //flatten
      .then(repos => ({
        repos,
        reposById:  _.keyBy(repos, 'name'),
        totalStars: repos.reduce((result, {stargazers_count}) => result + stargazers_count, 0)
      }))
      .catch(() => false)
  },

  fetchProjects ({store, website}) {
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
