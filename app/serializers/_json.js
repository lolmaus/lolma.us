import JSONSerializer from 'ember-data/serializers/json'
import {isArray as isEmberArray} from '@ember/array'
import {dasherize} from '@ember/string'
import {singularize} from 'ember-inflector'


export default JSONSerializer.extend({
  // serialize (snapshot, options) {
  //   return {
  //     [snapshot.modelName]: this._super(snapshot, options)
  //   }
  // }


  pushPayload (store, payload) {
    const modelName       = Object.keys(payload)[0]
    const payloadFragment = payload[modelName]
    // const modelName       = this.modelNameFromPayloadKey(key)
    const type            = store.modelFor(modelName)
    const typeSerializer  = store.serializerFor(type.modelName)
    const documentHash    = {included : []}

    if (isEmberArray(payloadFragment)) {
      documentHash.data = []

      payloadFragment.forEach(payloadItem => {
        const {data, included} = typeSerializer.normalize(type, payloadItem, modelName)
        documentHash.data.push(data)
        if (included) documentHash.included.push(...included)
      })
    } else {
      const {data, included} = typeSerializer.normalize(type, payloadFragment, modelName)
      documentHash.data = data
      if (included) documentHash.included.push(...included)
    }

    return store.push(documentHash)
  },

  modelNameFromPayloadKey (key) {
    return singularize(dasherize(key))
  },
})
