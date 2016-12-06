import Model from 'ember-data/model'
import attr from 'ember-data/attr'
import {belongsTo} from 'ember-data/relationships'
import computed from 'ember-computed'

export default Model.extend({

  // ----- Attributes -----
  title:       attr('string'),
  body:        attr('string'),
  summary:     attr('string'),
  date:        attr('date'),
  hideSummary: attr('boolean'),



  // ----- Relationships -----
  website: belongsTo('markdown-block'),



  // ----- Computed properties -----
  slug: computed('id', function () {
    // Removes locale from the id
    return this
      .get('id')
      .split('-')
      .slice(0, -1)
      .join('-')
  }),
})
