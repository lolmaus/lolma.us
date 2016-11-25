import {helper} from 'ember-helper'



export function isNully ([value]/*, hash*/) {
  return value == null
}

export default helper(isNully)
