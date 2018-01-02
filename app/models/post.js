import Model from 'ember-data/model'
import attr from 'ember-data/attr'
// import {belongsTo} from 'ember-data/relationships'
import {tag} from 'ember-awesome-macros'
// import {slice} from 'ember-awesome-macros/array'
import computed from 'ember-macro-helpers/computed'
import reads from 'ember-macro-helpers/reads'



export default Model.extend({

  // ----- Attributes -----
  title        : attr('string'),
  body         : attr('string'),
  summary      : attr('string'),
  image        : attr('string'),
  created      : attr('date'),
  updated      : attr('date'),
  hideSummary  : attr('boolean'),
  dependencies : attr('string'),
  proficiency  : attr('string'),
  keywords     : attr(),



  // ----- Relationships -----



  // ----- Computed properties -----
  idSegments : computed('id', id => id.split('-')),
  locale     : reads('idSegments.lastObject'),

  slug : computed('idSegments.[]', segments => {
    return segments.slice(0, -1).join('-')
  }),

  url      : tag`https://lolma.us/${'locale'}/blog/${'slug'}/`,
  disqusId : tag`blog-${'id'}`,
})
