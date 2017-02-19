import RSVP from 'rsvp'
import fetch from "ember-network/fetch"



export function fetchRsvpRaw (...args) {
  const promise = fetch(...args)

  return new RSVP.Promise((resolve, reject) => {
    promise.then(resolve, reject)
  })
}



export function fetchRsvpText (...args) {
  return fetchRsvpRaw(...args)
    .then(response => {
      if (response.status < 400) return response
      return RSVP.reject(response)
    })
    .then(response => response.text())
}



export default function fetchRsvpJson (...args) {
  return fetchRsvpRaw(...args)
    .then(response => {
      if (response.status < 400) return response
      return RSVP.reject(response)
    })
    .then(response => response.json())
}
