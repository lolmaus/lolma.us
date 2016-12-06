import _ from 'npm:lodash'



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
          // const modelNamePlural = inflector.pluralize(modelName)

          try {
            hash[ modelName ] =
              store
                .peekAll(modelName)
                .toArray()
                .map(record => record.serialize({ includeId: true }))
          } catch (e) {
            console.error(`ember-data-fastboot: serializer crashed when trying to serialize records of "${modelName}"`, e)
          }

          return hash
        }, {})
    }
  })
}

export default {
  name: 'ember-data-fastboot',
  initialize
}
