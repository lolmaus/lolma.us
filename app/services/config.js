import Service from 'ember-service'
import service from 'ember-service/inject'
import computed from 'ember-computed'



export default Service.extend({

  // ----- Services -----
  fastboot: service(),



  // ----- Overridden properties -----



  // ----- Static properties -----
  namespace: '/content',



  // ----- Computed properties -----
  host: computed('fastboot.isFastBoot', function () {
    return this.get('fastboot.isFastBoot')
      ? 'http://127.0.0.1:8081'
      : ''
  }),



  // ----- Overridden Methods -----



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----

})
