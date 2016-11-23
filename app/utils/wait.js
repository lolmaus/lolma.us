import RSVP from 'rsvp'



export default function wait (ms = 1000) {
  return new RSVP.Promise(resolve => setTimeout(resolve, ms))
}
