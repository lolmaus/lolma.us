import Component from 'ember-component'
import { sumBy } from 'ember-array-computed-macros'



export default Component.extend({

  // ----- Arguments -----
  projectInfos:      undefined,
  stackoverflowUser: undefined,



  // ----- Services -----



  // ----- Overridden properties -----
  classNames: ['onlinePresence'],



  // ----- Static properties -----



  // ----- Computed properties -----
  starsCount: sumBy('projectInfos', 'stargazersCount'),



  // ----- Overridden Methods -----



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
