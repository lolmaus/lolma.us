import CookieStore from 'ember-simple-auth/session-stores/cookie'
import computed from 'ember-computed'
// import RSVP from 'rsvp'
// import config from 'lolma-us/config/environment'



export default CookieStore.extend({

  // ----- Services -----
  _secureCookies: computed(function () {
    if (this.get('_fastboot.isFastBoot')) return this.get('_fastboot.request.protocol') === 'https'
    return window.location.protocol === 'https:'
  }).volatile(),
})
