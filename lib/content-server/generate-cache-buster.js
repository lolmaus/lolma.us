const crypto = require('crypto')

const data = {
  id         : 'buster',
  type       : 'cache-busters',
  attributes : {
    string : crypto.randomBytes(32).toString('hex'),
  },
}



module.exports = function generateCacheBuster () {
  return [
    {
      filename : 'content/cache-busters/buster.json',
      content  : JSON.stringify({data}, null, 2),
      tree     : 'public',
    },
  ]
}
