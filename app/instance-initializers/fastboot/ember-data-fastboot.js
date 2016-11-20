import _ from 'npm:lodash'
import Ember from 'ember'

const {
  Inflector: {inflector}
} = Ember



export function initialize (applicationInstance) {
  const store   = applicationInstance.lookup('service:store')
  const shoebox = applicationInstance.lookup('service:fastboot').get('shoebox')

  shoebox.put('ember-data-store', {
    get types () {
      return _(store.typeMaps)
        .values()

        // Get model names
        .map(typeMap => typeMap.type.modelName)

        // Get record arrays
        .reduce((hash, modelName) => {
          const modelNamePlural = inflector.pluralize(modelName)

          hash[modelNamePlural] =
            store
              .peekAll(modelName)
              .toArray()
              .map(record => record.serialize({includeId: true}))

          return hash
        }, {})
    }
  })
}

export default {
  name: 'ember-data-fastboot',
  initialize
}
