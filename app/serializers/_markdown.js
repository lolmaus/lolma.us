import JSONSerializer from 'ember-data/serializers/json'
import {isEmberArray} from 'ember-array/utils'


import frontMatter from 'npm:front-matter'
import jsyaml from 'npm:js-yaml'

export default JSONSerializer.extend({
  normalizeResponse (store, primaryModelClass, payload, id, requestType) {
    const {attributes, body} = frontMatter(payload)
    attributes.body = body
    id = id || attributes.id

    return this._super(store, primaryModelClass, attributes, id, requestType)
  },

  serialize (snapshot, options) {
    const attributes = {}

    if (options && options.includeId && snapshot.id) attributes.id = snapshot.id

    snapshot.eachAttribute((key, attribute) => {
      this.serializeAttribute(snapshot, attributes, key, attribute)
    })

    const body = attributes.body
    delete attributes.body

    const yaml = jsyaml.safeDump(attributes)

    return `---
${yaml}
---

${body}`
  },


  pushPayload (store, payload) {
    const modelName       = Object.keys(payload)[0]
    const payloadFragment = payload[modelName]
    // const modelName       = this.modelNameFromPayloadKey(key)
    const modelClass      = store.modelFor(modelName)
    const serializer      = store.serializerFor(modelClass.modelName)
    const documentHash    = {included: []}

    if (isEmberArray(payloadFragment)) {
      documentHash.data = []

      payloadFragment.forEach(payloadItem => {
        const { data, included } = serializer.normalizeResponse(store, modelClass, payloadItem, null, 'findRecord')
        documentHash.data.push(data)
        if (included) documentHash.included.push(...included)
      })
    } else {
      const { data, included } = serializer.normalize(modelClass, payloadFragment, modelName)
      documentHash.data = data
      if (included) documentHash.included.push(...included)
    }

    return store.push(documentHash)
  },
})
