import JSONAPISerializer from 'ember-data/serializers/json-api'



export default JSONAPISerializer.extend({
  pushPayload (store, payload) {
    const modelName              = Object.keys(payload)[0]
    const payloadFragmentArray   = payload[modelName]
    const normalizedPayloadArray = payloadFragmentArray.map(payloadFragment => this._normalizeDocumentHelper(payloadFragment))

    return normalizedPayloadArray.map(normalizedPayload => store.push(normalizedPayload))
  },
})
