import Service, {inject as service} from '@ember/service'
import config from 'lolma-us/config/environment'

import {conditional, equal} from "ember-awesome-macros"
import raw from "ember-macro-helpers/raw"
import reads from "ember-macro-helpers/reads"



export default Service.extend({

  // ----- Services -----
  fastboot : service(),
  i18n     : service(),



  // ----- Overridden properties -----



  // ----- Static properties -----
  environment   : config.environment,
  envVars       : config.envVars,
  host          : reads('envVars.LMS_HOST'),
  gatekeeperUrl : reads('envVars.LMS_GATEKEEPER_URL'),
  namespace     : '/content',



  // ----- Computed properties -----
  contentApiHost : conditional('fastboot.isFastBoot', raw('http://127.0.0.1:8081'), 'host'),
  isDev          : equal('environment', raw('development')),
  isTest         : equal('environment', raw('test')),
  isProd         : equal('environment', raw('production')),



  // ----- Overridden Methods -----



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----

})
