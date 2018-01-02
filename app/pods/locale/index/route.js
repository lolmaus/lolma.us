import {observer} from '@ember/object'
import Route from '@ember/routing/route'
import {inject as service} from '@ember/service'
import RSVP from 'rsvp'
import _ from 'npm:lodash'
import t from 'lolma-us/macros/t'



export default Route.extend({

  // ----- Services -----
  config  : service(),
  i18n    : service(),
  session : service(),



  // ----- Overridden properties -----
  titleToken : t('localeIndex.title'),



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----
  model () {
    const model  = this.modelFor('locale')
    const locale = model.locale
    const store  = this.get('store')

    this.get('session.isAuthenticated') // consume the property for the observer to work

    return RSVP
      .hash({
        ...model,

        projects       : store.findAll('project'),
        markdownBlocks : store.query('markdown-block', {locale}),
        experiences    : store.query('experience',     {locale}),

        projectInfos : store
          .findAll('project-info')
          .catch(response => response.status === 403 ? null : RSVP.reject(response)), // Ignore 403 error

        stackoverflowUser : store
          .findRecord('stackoverflowUser', '901944')
          .catch(() => store.peekRecord('stackoverflowUser', '901944')),

        linkedData : {
          ...model.linkedData,

          profile : {
            ...model.linkedData.website,
            '@type' : 'ProfilePage',
            name    : 'Andrey Mikhaylov (lolmaus)',
          },
        },

        ogType : 'profile',
      })

      .then(model => RSVP.hash({
        ...model,
        remainingProjectInfos : this.fetchRemainingProjectInfos(model.projects),
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
  reloadOnAuth : observer('session.isAuthenticated', function () {
    if (this.get('session.isAuthenticated')) this.refresh()
  }),



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
