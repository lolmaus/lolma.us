export function initialize (appInst) {
  const store      = appInst.lookup('service:store')
  const shoebox    = appInst.lookup('service:fastboot').get('shoebox')
  const modelNames = appInst.lookup('data-adapter:main').getModelTypes().mapBy('name')

  shoebox.put('ember-data-store', {
    get types () {
      return modelNames.reduce((hash, modelName) => {
        // const modelNamePlural = pluralize(modelName)

        try {
          hash[ modelName ] =
              store
                .peekAll(modelName)
                .toArray()
                .map(record => record.serialize({includeId : true}))
        } catch (e) {
          console.error(`ember-data-fastboot: serializer crashed when trying to serialize records of "${modelName}"`, e)
        }

        return hash
      }, {})
    },
  })
}

export default {
  name : 'ember-data-fastboot',
  initialize,
}

console.log('shoebox global')
