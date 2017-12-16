import DateTransform from 'ember-data/transforms/date'

export default DateTransform.extend({
  deserialize (input) {
    if (input instanceof Date) return input
    return this._super(...arguments)
  },
})
