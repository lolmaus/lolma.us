import Ember from 'ember'
import config from './config/environment'

const Router = Ember.Router.extend({
  location: config.locationType,
  rootURL: config.rootURL,
})

Router.map(function () {
  this.route('locale', {path: ':locale'}, function () {
    this.route('foo', {path: ':fooZZ'}, function () {
      this.route('bar', {path: ':barZZ/:bazZZ'})
    })
  })

  this.route('oauth-accept')
})

export default Router
