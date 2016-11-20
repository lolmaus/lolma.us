import RSVP from 'rsvp'
import fetch from "ember-network/fetch"

export default function fetchRsvp (...args) {
  const promise = fetch(...args)
  return new RSVP.Promise((resolve, reject) => {
    promise.then(resolve).catch(reject)
  })
}
