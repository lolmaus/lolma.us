import Service from 'ember-service'
import service from 'ember-service/inject'
import computed, {alias} from 'ember-computed'
import config from 'lolma-us/config/environment'
import templateString from 'ember-computed-template-string'



export default Service.extend({

  // ----- Services -----
  fastboot: service(),
  i18n:     service(),



  // ----- Overridden properties -----



  // ----- Static properties -----
  envVars:       config.envVars,
  host:          alias('envVars.LMS_HOST'),
  gatekeeperUrl: alias('envVars.LMS_GATEKEEPER_URL'),
  namespace:     '/content',



  // ----- Computed properties -----
  contentApiHost: computed('fastboot.isFastBoot', 'host', function () {
    return this.get('fastboot.isFastBoot')
      ? 'http://127.0.0.1:8081'
      : this.get('host')
  }),

  redirectUri: templateString("${host}/${i18n.locale}")



  // ----- Overridden Methods -----



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----

})
