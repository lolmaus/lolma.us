import Ember from 'ember'
import computed from 'ember-computed'
import config from './config/environment'
import service from 'ember-service/inject'
import {scheduleOnce} from 'ember-runloop'
import nprogress from 'ember-cli-nprogress'

const Router = Ember.Router.extend({

  // ----- Services -----
  headData:  service(),
  metrics:   service(),
  i18n:      service(),
  htmlState: service(),
  fastboot:  service(),



  // ----- Overridden properties -----
  location: config.locationType,
  rootURL:  config.rootURL,



  // ----- Custom properties -----
  initialLoadingComplete: false,



  // ----- Computed properties -----
  oppositeLocaleURLParams: computed(function () {
    const oppositeLocale      = this.get('i18n.oppositeLocale')
    const currentRouteName    = this.get('currentRouteName')
    const currentHandlerInfos = this.get('router.currentHandlerInfos')

    const segments =
      currentHandlerInfos
        .slice(2)
        .map(info => info._names.map(name => info.params[ name ]))
        .reduce((result, item) => result.concat(item), []) //flatten

    return [currentRouteName, oppositeLocale, ...segments]
  }).volatile(),



  // ----- Overridden methods -----
  setTitle (title) {
    this.get('headData').setProperties({title})
  },

  willTransition () {
    this._super(...arguments)
    this.propertyWillChange('oppositeLocaleURLParams')
    if (this.get('initialLoadingComplete') && !this.get('fastboot.isFastBoot')) nprogress.start()
  },

  didTransition () {
    this._super(...arguments)
    this._trackPage()
    this.get('htmlState').restoreHtmlState()
    this.propertyDidChange('oppositeLocaleURLParams')
    nprogress.done()
    if (this.get('initialLoadingComplete') && !this.get('fastboot.isFastBoot')) nprogress.done()
    else this.set('initialLoadingComplete', true)
  },



  // ----- Custom methods -----
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


})



Router.map(function () {
  this.route('locale', {path: ':locale'}, function () {
    this.route('blog', function () {
      this.route('post', {path: ':slug'})
    })
  })
})

export default Router
