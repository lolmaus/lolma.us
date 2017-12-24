import Helper from '@ember/component/helper'
import {inject as service} from '@ember/service'



export default Helper.extend({
  config : service(),

  compute ([obj]) {
    return this.get('config.isProd')
      ? JSON.stringify(obj)
      : JSON.stringify(obj, null, 2)
  },
})
