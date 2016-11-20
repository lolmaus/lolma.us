import RESTSerializer from 'ember-data/serializers/rest'
import {isEmberArray} from 'ember-array/utils'

export default RESTSerializer.extend({
  // serialize (snapshot, options) {
  //   return {
  //     [snapshot.modelName]: this._super(snapshot, options)
  //   }
  // }


  pushPayload (store, payload) {
    const key             = Object.keys(payload)[0]
    const payloadFragment = payload[key]
    const modelName       = this.modelNameFromPayloadKey(key)
    const type            = store.modelFor(modelName)
    const typeSerializer  = store.serializerFor(type.modelName)
    const documentHash    = {included: []}

    if (isEmberArray(payloadFragment)) {
      documentHash.data = []

      payloadFragment.forEach(payloadItem => {
        const { data, included } = typeSerializer.normalize(type, payloadItem, key)
        documentHash.data.push(data)
        if (included) documentHash.included.push(...included)
      })
    } else {
      const { data, included } = typeSerializer.normalize(type, payloadFragment, key)
      documentHash.data = data
      if (included) documentHash.included.push(...included)
    }

    return store.push(documentHash)
  },
})
