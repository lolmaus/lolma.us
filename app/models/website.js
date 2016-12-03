import Model from 'ember-data/model'
// import attr from 'ember-data/attr'
import {hasMany} from 'ember-data/relationships'
import RSVP from 'rsvp'
import {camelize} from 'ember-string'
import _ from 'npm:lodash'

import Ember from 'ember'
const {
  Inflector: {inflector}
} = Ember



export default Model.extend({

  // ----- Relationships -----
  markdownBlocks: hasMany('markdown-block'),
  projects:       hasMany('project'),
  experiences:    hasMany('experience'),



  // ----- Custom methods -----
  fetchChildRecords ({
    modelName,
    website,
    locale,
    relationshipName = camelize(inflector.pluralize(modelName))
  }) {
    const store       = this.get('store')
    const ids         = this.hasMany(relationshipName).ids()
    const filteredIds = locale ? ids.filter(id => _.endsWith(id, `-${locale}`)) : ids
    const promises    = filteredIds.map(id => store.findRecord(modelName, id))

    return RSVP.all(promises)
  },
})
