import computed from 'ember-macro-helpers/computed'

export default (key, ...args) => computed('i18n.locale', function () {
  return this.get('i18n').t(key, ...args)
})
