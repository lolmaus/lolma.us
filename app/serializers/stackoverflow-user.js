import CustomJSONSerializer from './_json'
// import _ from 'npm:lodash'
import {underscore} from '@ember/string'



export default CustomJSONSerializer.extend({

  // ----- Overridden properties -----
  primaryKey : 'user_id',



  // ----- Overridden methods -----
  keyForAttribute (key, method) {
    return underscore(key)
  },

  normalize (primaryModelClass, payload)  {
    const user = payload.items[0]
    const newPayload = {
      user_id    : user.user_id,
      reputation : user.reputation,
      ...user.badge_counts,
    }
    return this._super(primaryModelClass, newPayload)
  },

  serialize (snapshot, options) {
    const {
      user_id,
      reputation,
      bronze,
      silver,
      gold,
    } = this._super(snapshot, options)

    return {
      items : [
        {
          user_id      : parseInt(user_id, 10),
          reputation,
          badge_counts : {bronze, silver, gold},
        },
      ],
    }
  },
})
