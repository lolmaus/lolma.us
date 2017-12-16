import Model from 'ember-data/model'
import attr from 'ember-data/attr'
// import {belongsTo} from 'ember-data/relationships'
import EObject, {computed} from '@ember/object'
import {alias} from '@ember/object/computed'
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin'
import {inject as service} from '@ember/service'
import fetchGitHub from 'lolma-us/utils/fetch-github'
// import wait from 'lolma-us/utils/wait'
import RSVP from 'rsvp'
import {tag} from 'ember-awesome-macros'

const PromiseProxy = EObject.extend(PromiseProxyMixin)



export default Model.extend({

  // ----- Attributes -----
  stargazersCount : attr('number'),



  // ----- Relationships -----
  // project: belongsTo('project'),



  // ----- Services -----
  session : service(),



  // ----- Static properties -----



  // ----- Computed properties -----
  starUrl : tag`user/starred/${"id"}`,

  isStarredPromise : computed('starUrl', 'session.isAuthenticated', function () {
    return this._requestIsStarred()
  }),
  isStarredProxy : computed('isStarredPromise', function () {
    const promise = this.get('isStarredPromise')
    return PromiseProxy.create({promise})
  }),

  toggleStarPromise : undefined,
  toggleStarProxy   : computed('toggleStarPromise', function () {
    const promise = this.get('toggleStarPromise')
    if (!promise) return
    return PromiseProxy.create({promise})
  }),

  starPromisePending : computed(
    'session.isAuthenticated',
    'isStarredProxy.isPending',
    'toggleStarProxy.isPending',
    function () {
      if (!this.get('session.isAuthenticated')) return false
      return this.get('isStarredProxy.isPending') || this.get('toggleStarProxy.isPending')
    }
  ),

  starPromiseFailed : computed(
    'session.isAuthenticated',
    'isStarredProxy.isRejected',
    'toggleStarProxy.isRejected',
    function () {
      if (!this.get('session.isAuthenticated')) return false
      return this.get('isStarredProxy.isRejected') || this.get('toggleStarProxy.isRejected')
    }
  ),

  originalIsStarred : alias('isStarredProxy.content'),
  newIsStarred      : alias('toggleStarProxy.content'),

  effectiveIsStarred : computed('newIsStarred', 'originalIsStarred', function () {
    const newIsStarred = this.get('newIsStarred')
    if (newIsStarred != null) return newIsStarred
    return this.get('originalIsStarred')
  }),

  effectiveStargazersCount : computed(
    'stargazersCount',
    'originalIsStarred',
    'newIsStarred',
    function () {
      const stargazersCount   = this.get('stargazersCount')
      const originalIsStarred = this.get('originalIsStarred')
      const newIsStarred      = this.get('newIsStarred')

      if (
        originalIsStarred == null
        || newIsStarred == null
        || originalIsStarred === newIsStarred
      ) return stargazersCount

      if (originalIsStarred && !newIsStarred) return stargazersCount - 1

      return stargazersCount + 1
    }
  ),



  // ----- Custom Methods -----
  _requestIsStarred () {
    const starUrl = this.get('starUrl')
    const session = this.get('session')

    return fetchGitHub(starUrl, session, {mode : false})
      .then(() => true)
      .catch(response => {
        if (response.status === 404) return false
        return RSVP.reject(response)
      })
      .then(status => this.set('originalIsStarred', status))
  },

  _star () {
    const starUrl = this.get('starUrl')
    const session = this.get('session')

    return fetchGitHub(starUrl, session, {mode : false, method : 'PUT'})
      .then(() => true)
  },

  _unstar () {
    const starUrl = this.get('starUrl')
    const session = this.get('session')

    return fetchGitHub(starUrl, session, {mode : false, method : 'DELETE'})
      .then(() => false)
  },

  toggleStar () {
    if (this.get('isStarredProxy.isPending'))  return
    if (this.get('toggleStarProxy.isPending')) return

    if (this.get('isStarredProxy.isRejected')) {
      const isStarredPromise = this._requestIsStarred()
      this.setProperties({isStarredPromise})
    }

    const toggleStarPromise = this.get('effectiveIsStarred') ? this._unstar() : this._star()
    this.setProperties({toggleStarPromise})
  },

})
