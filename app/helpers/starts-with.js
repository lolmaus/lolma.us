import {helper} from 'ember-helper'
import _ from 'npm:lodash'



export function startsWith ([str, substr]/*, hash*/) {
  return _.startsWith(str, substr)
}

export default helper(startsWith)
