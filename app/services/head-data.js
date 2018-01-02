import HeadDataService from 'ember-cli-head/services/head-data'
import computed from 'ember-macro-helpers/computed'
import _ from 'lodash'


export default HeadDataService.extend({
  model : null,

  linkedData : computed('model.linkedData', linkedData => {
    return {
      '@context' : 'http://schema.org',
      '@graph'   : _.values(linkedData || {}),
    }
  }),
})
