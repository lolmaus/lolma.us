import Route from 'ember-route'
import service from 'ember-service/inject'
import RSVP from 'rsvp'
// import computed from 'ember-computed'
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
        isFastBoot:   this.get('fastboot.isFastBoot'),
        website:      store.findRecord('website', 'website'),
        projectInfos: store
          .findAll('project-info')
          // Ignore 403 error
          .catch(response => {
            if (response.status === 403) return null
            return RSVP.reject(response)
          }),

        stackoverflowUser: store
          .findRecord('stackoverflowUser', '901944')
          .catch(() => store.peekRecord('stackoverflowUser', '901944'))
      })

      .then(model => RSVP.hash({
        ...model,
        projects: this.fetchProjects(model.website),
      }))

      .then(model => RSVP.hash({
        ...model,
        remainingProjectInfos: this.fetchRemainingProjectInfos(model.projects)
      }))
  },



  // ----- Custom Methods -----
  fetchProjects (website) {
    const store = this.get('store')

    const promises =
      website
        .hasMany('projects')
        .ids()
        .map(id => store.findRecord('project', id))

    return RSVP.all(promises)
  },

  fetchRemainingProjectInfos (projects) {
    const store           = this.get('store')
    const existingIds     = store.peekAll('project-info').mapBy('id')

    if (!existingIds.length) return RSVP.resolve()

    const idsFormProjects = projects.map(project => project.belongsTo('projectInfo').id())
    const remainingIds    = _.reject(idsFormProjects, id => existingIds.includes(id))

    const promises =
      remainingIds
        .map(id =>
          store
            .findRecord('project-info', id)
            .catch(response => {
              if (response.status === 403) return null
              return RSVP.reject(response)
            })
        )

    return RSVP.all(promises)
  },


  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
