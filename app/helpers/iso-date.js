import {helper} from '@ember/component/helper'



export function isoDate ([date]/*, hash*/) {
  return date && date.toISOString()
}

export default helper(isoDate)
