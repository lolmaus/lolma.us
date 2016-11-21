import Model from 'ember-data/model'
import attr from 'ember-data/attr'
import {belongsTo} from 'ember-data/relationships'
import computed from 'ember-computed'
import conditional from "ember-cpm/macros/conditional"
import templateString from 'ember-computed-template-string'
import fetchGitHub from "lolma-us/utils/fetch-github"
// import service from 'ember-service/inject'
// import _ from 'npm:lodash'



export default Model.extend({

  // ----- Attributes -----
  name:          attr('string'),
  group:         attr('string'),
  status:        attr('number'),
  type:          attr('string'),
  owner:         attr('string', {defaultValue: 'lolmaus'}),
  url:           attr('string'),
  description:   attr(''),
  emberObserver: attr('boolean', {defaultValue: false}),



  // ----- Relationships -----
  website: belongsTo('website'),



  // ----- Services -----
  // session: service(),



  // ----- Computed properties -----
  gitHubUrl:     templateString("https://github.com/${owner}/${id}"),
  effectiveUrl:  conditional('url', 'url', 'gitHubUrl'),
  effectiveName: conditional('name', 'name', 'id'),
  starsUrl:      templateString("repos/${owner}/${id}"),

  gitHubProjectInfoPromise: computed('starsUrl', function () {
    const starsUrl = this.get('starsUrl')
    // const session  = this.get('session')

    return fetchGitHub(starsUrl/*, session*/)
  }),

  starsPromise: computed('gitHubProjectInfoPromise', function () {
    return this
      .get('gitHubProjectInfoPromise')
      .then(response => response.stargazers_count)
  }),
})
