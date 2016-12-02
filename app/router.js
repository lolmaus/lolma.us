import Ember from 'ember'
import config from './config/environment'
import service from 'ember-service/inject'
import {scheduleOnce} from 'ember-runloop'

const Router = Ember.Router.extend({
  location: config.locationType,
  rootURL:  config.rootURL,
  headData: service(),
  metrics:  service(),

  didTransition () {
    this._super(...arguments)
    this._trackPage()
  },

  _trackPage () {
    scheduleOnce('afterRender', this, () => {
      this
        .get('metrics')
        .trackPage({
          page:  this.get('url'),
          title: this.get('currentRouteName') || 'unknown'
        })
    })
  },

  setTitle (title) {
    this.get('headData').setProperties({title})
  }
})

Router.map(function () {
  this.route('locale', {path: ':locale'}, function () {
    this.route('foo', {path: ':fooZZ'}, function () {
      this.route('bar', {path: ':barZZ/:bazZZ'})
    })
  })
})

export default Router
