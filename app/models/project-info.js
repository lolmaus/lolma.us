import Model from 'ember-data/model'
import attr from 'ember-data/attr'
import {belongsTo} from 'ember-data/relationships'
import computed, {alias, or} from 'ember-computed'
import service from 'ember-service/inject'
import fetchGitHub from 'lolma-us/utils/fetch-github'
// import wait from 'lolma-us/utils/wait'
import RSVP from 'rsvp'

import {default as EObject} from 'ember-object'
import Ember from 'ember'
const {PromiseProxyMixin} = Ember
const PromiseProxy = EObject.extend(PromiseProxyMixin)



export default Model.extend({

  // ----- Attributes -----
  stargazersCount: attr('number'),



  // ----- Relationships -----
  project: belongsTo('project', {async: false}),



  // ----- Services -----
  session: service(),



  // ----- Static properties -----



  // ----- Computed properties -----
  starUrl: computed(
    'id',
    function () {
      const id    = this.get('id')

      return `user/starred/${id}`
    }
  ),

  isStarredPromise: computed('starUrl', 'session.isAuthenticated', function () {
    return this._requestIsStarred()
  }),
  isStarredProxy: computed('isStarredPromise', function () {
    const promise = this.get('isStarredPromise')
    return PromiseProxy.create({promise})
  }),

  toggleStarPromise: undefined,
  toggleStarProxy: computed('toggleStarPromise', function () {
    const promise = this.get('toggleStarPromise')
    if (!promise) return
    return PromiseProxy.create({promise})
  }),

  starPromisePending: or('isStarredProxy.isPending',  'toggleStarProxy.isPending'),
  starPromiseFailed:  or('isStarredProxy.isRejected', 'toggleStarProxy.isRejected'),

  originalIsStarred: alias('isStarredProxy.content'),
  newIsStarred:      alias('toggleStarProxy.content'),

  effectiveIsStarred: computed('newIsStarred', 'originalIsStarred', function () {
    const newIsStarred = this.get('newIsStarred')
    if (newIsStarred != null) return newIsStarred
    return this.get('originalIsStarred')
  }),

  effectiveStargazersCount: computed(
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

    return fetchGitHub(starUrl, session, {mode: false})
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

    return fetchGitHub(starUrl, session, {mode: false, method: 'PUT'})
      .then(() => true)
  },

  _unstar () {
    const starUrl = this.get('starUrl')
    const session = this.get('session')

    return fetchGitHub(starUrl, session, {mode: false, method: 'DELETE'})
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
  }

})
