import Model from 'ember-data/model'
import attr from 'ember-data/attr'
import {belongsTo} from 'ember-data/relationships'
import computed from 'ember-computed'
import conditional from "ember-cpm/macros/conditional"
import templateString from 'ember-computed-template-string'
// import service from 'ember-service/inject'
// import _ from 'npm:lodash'



export default Model.extend({

  // ----- Attributes -----
  group:         attr('string'),
  status:        attr('number'),
  type:          attr('string'),
  owner:         attr('string', {defaultValue: 'lolmaus'}),
  url:           attr('string'),
  description:   attr(''),
  emberObserver: attr('boolean', {defaultValue: false}),



  // ----- Relationships -----
  website:     belongsTo('website'),
  projectInfo: belongsTo('project-info'),



  // ----- Services -----



  // ----- Computed properties -----
  gitHubUrl:     templateString("https://github.com/${owner}/${id}"),
  effectiveUrl:  conditional('url', 'url', 'gitHubUrl'),
  effectiveName: conditional('name', 'name', 'id'),

  // Return projectInfo without triggering a fetch
  projectInfoSync: computed(function () {
    return this.belongsTo('projectInfo').value()
  }).volatile(),
})
