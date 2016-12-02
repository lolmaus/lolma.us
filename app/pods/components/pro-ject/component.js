import Component from 'ember-component'
// import conditional from "ember-cpm/macros/conditional"
// import templateString from 'ember-computed-template-string'
import computed from 'ember-computed'
import get from 'ember-metal/get'
import service from 'ember-service/inject'



export default Component.extend({

  // ----- Arguments -----
  project:            undefined,
  gitHubProjectsStats: undefined,
  locale:             'en',
  loginAction:         undefined,
  isAuthenticating:    undefined,
  isAuthenticated:     undefined,



  // ----- Services -----
  session: service(),



  // ----- Overridden properties -----
  classNames: ['proJect'],



  // ----- Static properties -----
  emptyString: '',



  // ----- Computed properties -----
  currentDescription: computed('locale', 'project.description', function () {
    const locale            = this.get('locale')
    const descriptionObject = this.get('project.description')
    return get(descriptionObject, locale)
  }),

  statusLabel: computed('project.status', function () {
    const status = this.get('project.status')

    return (
      status === 2 ? 'WIP' :
      status === 3 ? 'PoC' :
      status === 4 ? 'stalled' :
                     ''
    )
  }),

  starButtonLabel: computed(
    'session.isAuthenticated',
    'project.projectInfo.starPromisePending',
    'project.projectInfo.starPromiseFailed',
    'project.projectInfo.effectiveIsStarred',
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

  starCount: computed(
  'session.isAuthenticated',
  'project.projectInfoSync',
  'project.projectInfo.stargazersCount',
  'project.projectInfo.effectiveStargazersCount',
    function () {
      if (this.get('session.isAuthenticated')) return this.get('project.projectInfo.effectiveStargazersCount')
      if (this.get('project.projectInfoSync')) return this.get('project.projectInfo.stargazersCount')
    }
  ),



  // ----- Overridden Methods -----



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  actions: {
    toggleStar () {
      if (!this.get('session.isAuthenticated')) {
        window.open(this.get('project.gitHubUrl'), '_blank')
        return
      }

      this
        .get('project.projectInfo')
        .then(project => project.toggleStar())
    }
  }
})
