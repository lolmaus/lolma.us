import Adapter from 'ember-data/adapter'
import service from 'ember-service/inject'
import {reads} from 'ember-computed'
import fetch from "lolma-us/utils/fetch-rsvp"

import Ember from 'ember'
const {
  Inflector: {inflector}
} = Ember



export default Adapter.extend({

  // ----- Services -----
  config: service(),



  // ----- Overridden properties -----
  defaultSerializer: '_markdown',



  // ----- Custom properties -----
  host:      reads('config.host'),
  namespace: reads('config.namespace'),



  // ----- Overridden methods -----
  findRecord (store, type, id, snapshot) {
    const host      = this.get('host')
    const modelName = inflector.pluralize(type.modelName)
    const url       = `${host}/content/${modelName}/${id}.md`

    return fetch(url)
      .then(response => response.text())
  },
})
