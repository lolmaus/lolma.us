import Component from '@ember/component'
// import conditional from "ember-cpm/macros/conditional"
// import {tag} from 'ember-awesome-macros'
import {computed, get} from '@ember/object'
import {inject as service} from '@ember/service'



export default Component.extend({

  // ----- Arguments -----
  project             : undefined,
  gitHubProjectsStats : undefined,
  locale              : 'en',
  loginAction         : undefined,
  isAuthenticating    : undefined,
  isAuthenticated     : undefined,



  // ----- Services -----
  session : service(),



  // ----- Overridden properties -----
  classNameBindings : [':proJect', 'stalledClass'],



  // ----- Static properties -----
  emptyString : '',



  // ----- Computed properties -----
  currentDescription : computed('locale', 'project.description', function () {
    const locale            = this.get('locale')
    const descriptionObject = this.get('project.description')
    return get(descriptionObject, locale)
  }),

  statusLabel : computed('project.status', function () {
    const status = this.get('project.status')

    return (
      status === 2 ? 'WIP' :
        status === 3 ? 'PoC' :
          status === 4 ? 'stalled' :
            ''
    )
  }),

  statusTitle : computed('project.status', function () {
    const status = this.get('project.status')

    return (
      status === 2 ? 'Work in Progress' :
        status === 3 ? 'Proof of Concept' :
          null
    )
  }),

  starButtonLabel : computed(
    'session.isAuthenticated',
    'project.projectInfo.{starPromisePending,starPromiseFailed,effectiveIsStarred}',
    function () {
      return (
        !this.get('session.isAuthenticated')               ? 'Star'        :
          this.get('project.projectInfo.starPromisePending') ? 'Updating...' :
            this.get('project.projectInfo.starPromiseFailed')  ? 'Retry'       :
              this.get('project.projectInfo.effectiveIsStarred') ? 'Unstar'      :
                'Star'
      )
    }
  ),

  starCount : computed(
    'session.isAuthenticated',
    'project.projectInfoSync',
    'project.projectInfo.{stargazersCount,effectiveStargazersCount}',
    function () {
      if (this.get('session.isAuthenticated')) return this.get('project.projectInfo.effectiveStargazersCount')
      if (this.get('project.projectInfoSync')) return this.get('project.projectInfo.stargazersCount')
    }
  ),

  stalledClass : computed('project.status', function () {
    return this.get('project.status') === 4 ? '-stalled' : ''
  }),



  // ----- Overridden Methods -----



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  actions : {
    toggleStar () {
      if (!this.get('session.isAuthenticated')) {
        window.open(this.get('project.gitHubUrl'), '_blank')
        return
      }

      this
        .get('project.projectInfo')
        .then(project => project.toggleStar())
    },
  },
})
