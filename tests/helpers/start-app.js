import {run} from '@ember/runloop'
import Application from '../../app'
import config from '../../config/environment'

export default function startApp (attrs) {
  let application

  const attributes = {...config.APP, ...attrs}

  run(() => {
    application = Application.create(attributes)
    application.setupForTesting()
    application.injectTestHelpers()
  })

  return application
}
