import RESTAdapter from 'ember-data/adapters/rest'
import service from 'ember-service/inject'
import {reads} from 'ember-computed'


import Ember from 'ember'
const {
  Inflector: {inflector}
} = Ember


export default RESTAdapter.extend({

  // ----- Services -----
  config: service(),



  // ----- Overridden properties -----
  host:      reads('config.contentApiHost'),
  namespace: reads('config.namespace'),



  // ----- Overridden methods -----
  urlForQuery (query, modelName) {
    const {locale} = query
    if (!locale) throw new Error('locale required for queryRecord')
    delete query.locale
    return this._buildURL(modelName, null, locale)
  },

  urlForQueryRecord (query, modelName) {
    const {id, locale} = query
    if (!id)     throw new Error('id required for queryRecord')
    if (!locale) throw new Error('locale required for queryRecord')
    delete query.id
    delete query.locale
    return this._buildURL(modelName, id, locale)
  },

  _buildURL (modelName, id, locale) {
    const suffix = locale ? `-${locale}.json` : `.json`
    return this._super(modelName, id) + suffix
  },

  pathForType (modelName) {
    return inflector.pluralize(modelName)
  },
})
