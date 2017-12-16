import Component from '@ember/component'
import {sum} from 'ember-awesome-macros'
import {mapBy} from 'ember-awesome-macros/array'
import raw from 'ember-macro-helpers/raw'



export default Component.extend({

  // ----- Arguments -----
  projectInfos      : undefined,
  stackoverflowUser : undefined,



  // ----- Services -----



  // ----- Overridden properties -----
  classNames : ['onlinePresence'],



  // ----- Static properties -----



  // ----- Computed properties -----
  starsCount : sum(mapBy('projectInfos', raw('stargazersCount'))),



  // ----- Overridden Methods -----



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
