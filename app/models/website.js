import Model from 'ember-data/model'
// import attr from 'ember-data/attr'
import {hasMany} from 'ember-data/relationships'



export default Model.extend({

  // ----- Relationships -----
  markdownBlocks: hasMany('markdown-block'),
  projects:       hasMany('project'),
})
