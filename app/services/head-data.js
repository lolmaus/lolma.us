import HeadDataService from 'ember-cli-head/services/head-data'
import computed from 'ember-macro-helpers/computed'
import _ from 'lodash'


export default HeadDataService.extend({
  linkedDataRaw : computed(() => ({})),

  linkedData : computed('linkedDataRaw', linkedData => {
    return {
      '@context' : 'http://schema.org',
      '@graph'   : _.values(linkedData),
    }
  }),
})
