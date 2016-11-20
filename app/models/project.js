import Model from 'ember-data/model'
import attr from 'ember-data/attr'
import {belongsTo} from 'ember-data/relationships'
import computed from 'ember-computed'
import conditional from "ember-cpm/macros/conditional"
import templateString from 'ember-computed-template-string'
import fetch from "ember-network/fetch"



export default Model.extend({

  // ----- Attributes -----
  name:        attr('string'),
  group:       attr('string'),
  status:      attr('number'),
  type:        attr('string'),
  owner:       attr('string', {defaultValue: 'lolmaus'}),
  url:         attr('string'),
  description: attr(''),



  // ----- Relationships -----
  website: belongsTo('website'),



  // ----- Computed properties -----
  gitHubUrl:     templateString("https://github.com/${owner}/${id}"),
  effectiveUrl:  conditional('url', 'url', 'gitHubUrl'),
  effectiveName: conditional('name', 'name', 'id'),
  starsUrl:      templateString("https://api.github.com/repos/${owner}/${id}"),

  gitHubProjectInfoPromise: computed('starsUrl', function () {
    const starsUrl = this.get('starsUrl')
    return fetch(starsUrl)
      .then(response => response.json())
  })
})
