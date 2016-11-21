import LocalStorageStore from 'ember-simple-auth/session-stores/local-storage'
import RSVP from 'rsvp'



export default LocalStorageStore.extend({

  // ----- Services -----
  restore () {
    // Let it stay unauthorized in FastBoot
    if (this.get('_isFastBoot')) return RSVP.reject()

    return this._super(...arguments)
  }
})
