import Route from 'ember-route'
import RSVP from 'rsvp'
import _ from 'npm:lodash'



export default Route.extend({

  // ----- Services -----



  // ----- Overridden properties -----
  title: 'lolmaus - Andrey Mikhaylov',



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----
  model () {
    const model  = this.modelFor('locale')
    const locale = model.locale
    const store  = this.get('store')

    return RSVP
      .hash({
        ...model,

        projects:       store.findAll('project'),
        markdownBlocks: store.query('markdown-block', {locale}),
        experiences:    store.query('experience',     {locale}),

        projectInfos: store
          .findAll('project-info')
          .catch(response => response.status === 403 ? null : RSVP.reject(response)), // Ignore 403 error

        stackoverflowUser: store
          .findRecord('stackoverflowUser', '901944')
          .catch(() => store.peekRecord('stackoverflowUser', '901944'))
      })

      .then(model => RSVP.hash({
        ...model,
        remainingProjectInfos: this.fetchRemainingProjectInfos(model.projects)
      }))
  },



  // ----- Custom Methods -----
  fetchRemainingProjectInfos (projects) {
    const store           = this.get('store')
    const existingIds     = store.peekAll('project-info').mapBy('id')

    if (!existingIds.length) return RSVP.resolve()

    const idsFormProjects = projects.mapBy('gitHubId')
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
