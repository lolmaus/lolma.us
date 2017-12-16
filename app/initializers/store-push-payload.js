import Store from 'ember-data/store'
import {assert, inspect} from '@ember/debug'

export function initialize (/* application */) {
  Store.reopen({
    pushPayload (modelName, inputPayload) {
      let serializer
      let payload

      if (!inputPayload) {
        payload    = modelName
        serializer = this.serializerFor('application')
        assert("You cannot use `store#pushPayload` without a modelName unless your default serializer defines `pushPayload`", typeof serializer.pushPayload === 'function')
      } else {
        payload = inputPayload
        assert(`Passing classes to store methods has been removed. Please pass a dasherized string instead of ${inspect(modelName)}`, typeof modelName === 'string')
        serializer = this.serializerFor(modelName)
      }

      return this._adapterRun(() => serializer.pushPayload(this, payload))
    },
  })
}

export default {
  name : 'store-push-payload',
  initialize,
}
