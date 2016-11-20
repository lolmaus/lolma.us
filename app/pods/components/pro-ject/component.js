import Component from 'ember-component'
import conditional from "ember-cpm/macros/conditional"
import templateString from 'ember-computed-template-string'
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

  descriptionWithDash:          templateString(" &mdash; ${currentDescription}"),
  effectiveDescriptionWithDash: conditional('project.description', 'descriptionWithDash', 'emptyString'),

  statusTag: computed('project.status', function () {
    const status = this.get('project.status')

    const label =
      status === 2 ? 'WIP' :
      status === 3 ? 'PoC' :
      status === 4 ? 'stalled' :
                     ''

    return label ? `<span class="proJect-status - ${status}">${label}</span>` : ''
  }),

  descriptionWithName: templateString("<a href='${project.effectiveUrl}' target='_blank'>${project.effectiveName}</a>${effectiveDescriptionWithDash} ${statusTag}"),



  // ----- Overridden Methods -----



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
