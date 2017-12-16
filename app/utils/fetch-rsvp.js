import RSVP from 'rsvp'
import fetch from 'fetch'



export function fetchRsvpText (...args) {
  return fetch(...args)
    .then(response => {
      if (response.status < 400) return response
      return RSVP.reject(response)
    })
    .then(response => response.text())
}



export default function fetchRsvpJson (...args) {
  return fetch(...args)
    .then(response => {
      if (response.status >= 400) return RSVP.reject(response) // fetch treats errors as non-errors
      return response
    })
    .then(response => response.json())
}
