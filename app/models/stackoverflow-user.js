import Model from 'ember-data/model'
import attr from 'ember-data/attr'
// import {hasMany} from 'ember-data/relationships'



export default Model.extend({

  // ----- Attributes -----
  reputation : attr('number'),
  bronze     : attr('number'),
  silver     : attr('number'),
  gold       : attr('number'),
})
