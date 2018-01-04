import RSVP from 'rsvp'



export function initialize (appInstance) {
  const rollbar = appInstance.lookup('service:rollbar')

  RSVP.on('error', function (reason) {
    rollbar.error(reason)
  })
}

export default {
  name : 'rsvp-error-handler',
  initialize,
}
