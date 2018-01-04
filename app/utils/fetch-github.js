import fetch from 'fetch'
import RSVP from 'rsvp'

export default function fetchGitHub (url, sessionServiceOrToken, {mode = 'json', method = 'GET'} = {}) {
  let sessionService, token

  if (typeof sessionServiceOrToken === 'string') {
    token = sessionServiceOrToken
  } else {
    sessionService = sessionServiceOrToken
    token          = sessionService.get('data.authenticated.token')
  }

  const fullUrl = `https://api.github.com/${url}`

  return fetch(fullUrl, {
    method,
    headers : {
      Accept : 'application/vnd.github.v3+json',
      ...token ? {Authorization : `token ${token}`} : {},
    },
  })
    .then(response => {
      if (method && response.status >= 400) return RSVP.reject(response)
      return response
    })
    .then(response =>
      mode === 'json' ? response.json() :
        mode === 'text' ? response.text() :
          response
    )
    .catch(response => {
      if (
        response.status === 401
        && sessionService
        && sessionService.get('isAuthenticated')
      ) {
        sessionService.invalidate()
        return null
      }

      return RSVP.reject(response)
    })
}
