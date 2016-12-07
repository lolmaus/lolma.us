import Component from 'ember-component'



export default Component.extend({

  // ----- Arguments -----
  post:    undefined,
  summary: false,




  // ----- Services -----



  // ----- Overridden properties -----
  classNameBindings: [':blogPost', 'summary:-summary:-full'],



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
