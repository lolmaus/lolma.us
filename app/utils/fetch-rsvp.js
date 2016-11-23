import RSVP from 'rsvp'
import fetch from "ember-network/fetch"

export function fetchRsvpRaw (...args) {
  const promise = fetch(...args)

  return new RSVP.Promise((resolve, reject) => {
    promise
      .then(response => {
        if (response.status < 400) resolve(response) // treat 4xx and 5xx as errors
        else reject(response)
      })
      .catch(reject)
  })
}

export function fetchRsvpText (...args) {
  return fetchRsvpRaw(...args)
    .then(response => response.text())
}

export default function fetchRsvpJson (...args) {
  return fetchRsvpRaw(...args)
    .then(response => response.json())
    // .then(response => (console.log('response', response), response))
}

