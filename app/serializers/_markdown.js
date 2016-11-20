import RESTSerializer from 'ember-data/serializers/rest'
import {isEmberArray} from 'ember-array/utils'


import frontMatter from 'npm:front-matter'
import jsyaml from 'npm:js-yaml'

export default RESTSerializer.extend({
  normalizeResponse (store, primaryModelClass, payload, id, requestType) {
    const {attributes, body} = frontMatter(payload)
    // const relationships = attributes.relationships || {}

    if (attributes.id) {
      id = attributes.id
      delete attributes.id
    }
    // delete attributes.relationships
    attributes.body = body

    return {
      data: {
        id,
        type: primaryModelClass.modelName,
        attributes,
        // relationships
      }
    }
  },

  normalize (modelClass, resourceHash) {
    return this.normalizeResponse(null, modelClass, resourceHash)
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
