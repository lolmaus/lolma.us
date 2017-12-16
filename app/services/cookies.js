import CookiesService from 'ember-cookies/services/cookies'
import {A} from '@ember/array'



export default CookiesService.extend({

  // ----- Services -----



  // ----- Overridden properties -----



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----

  // https://github.com/simplabs/ember-cookies/pull/27
  _filterCachedFastBootCookies (fastBootCookiesCache) {
    let {path: requestPath, protocol} = this.get('_fastBoot.request')

    // cannot use deconstruct here
    let host = this.get('_fastBoot.request.host')

    return A(Object.keys(fastBootCookiesCache)).reduce((acc, name) => {
      let {value, options} = fastBootCookiesCache[name]
      options = options || {}

      let {path: optionsPath, domain, expires, secure} = options

      if (optionsPath && requestPath && requestPath.indexOf(optionsPath) !== 0) {
        return acc
      }

      if (domain && host.indexOf(domain) + domain.length !== host.length) {
        return acc
      }

      if (expires && expires < new Date()) {
        return acc
      }

      if (secure && protocol !== 'https') {
        return acc
      }

      acc[name] = value
      return acc
    }, {})
  },



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----

})
