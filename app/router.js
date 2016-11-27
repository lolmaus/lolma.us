import Ember from 'ember'
import config from './config/environment'
import service from 'ember-service/inject'

const Router = Ember.Router.extend({
  location: config.locationType,
  rootURL:  config.rootURL,
  headData: service(),

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
