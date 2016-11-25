import Adapter from 'ember-data/adapter'
import fetch   from 'lolma-us/utils/fetch-rsvp'


export default Adapter.extend({

  // ----- Overridden methods -----
  findRecord (store, type, id, snapshot) {
    const url = `https://api.stackexchange.com/2.2/users/${id}?site=stackoverflow`
    return fetch(url)
  },
})
