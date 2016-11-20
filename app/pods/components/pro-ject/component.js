import Component from 'ember-component'
// import conditional from "ember-cpm/macros/conditional"
// import templateString from 'ember-computed-template-string'
import computed from 'ember-computed'
import get from 'ember-metal/get'



export default Component.extend({

  // ----- Arguments -----
  project: undefined,
  locale:  'en',



  // ----- Services -----



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



  // ----- Overridden Methods -----



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
