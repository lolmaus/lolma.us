import _ from 'npm:lodash'



export function initialize (applicationInstance) {
  const shoebox = applicationInstance.lookup('service:fastboot').get('shoebox')
  if (!shoebox) return

  const data = shoebox.retrieve('ember-data-store')
  if (!data) return

  const store = applicationInstance.lookup('service:store')

  _.forOwn(data.types, (records, modelName) => {
    const payload = {[modelName]: records}
    store.pushPayload(modelName, payload)
  })
}

export default {
  name: 'ember-data-fastboot',
  initialize
}
