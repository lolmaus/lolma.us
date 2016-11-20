import fetch from "./fetch-rsvp"
import RSVP from "rsvp"

export default function fetchGitHub (url, sessionService) {
  const fullUrl = `https://api.github.com/${url}`
  const token   = sessionService.get('data.authenticated.token')

  return fetch(fullUrl, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      ...token ? {Authorization: `token ${token}`} : {},
    },
  })
    .catch(response => {
      if (response.status === 401) sessionService.invalidate()
      else return RSVP.reject(response)
    })
}
