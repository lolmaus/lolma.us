import LocalStorageStore from 'ember-simple-auth/session-stores/local-storage'
import RSVP from 'rsvp'
// import config from 'lolma-us/config/environment'



export default LocalStorageStore.extend({

  // ----- Services -----
  restore () {
    if (!this.get('_isFastBoot')) return this._super(...arguments)

    return RSVP.resolve()
  }
})
