import {helper} from '@ember/component/helper'



export function randomString (/*values, hash*/) {
  return Math.random().toString(36).substr(2, 5)
}

export default helper(randomString)
