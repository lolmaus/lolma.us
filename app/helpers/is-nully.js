import {helper} from '@ember/component/helper'



export function isNully ([value]/*, hash*/) {
  return value == null
}

export default helper(isNully)
