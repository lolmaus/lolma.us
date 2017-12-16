const fs       = require('fs')

const environment = process.env.EMBER_ENV || 'development'

const defaultTarget = environment === 'production' ? 'prod' : 'localhost-4200'
const target        = process.env.LMS_DEPLOY_TARGET || defaultTarget

const dotEnvFile = `./.env-${target}`
if (!fs.existsSync(dotEnvFile)) throw new Error(`ember-cli-build.js: dot-env file not found: ${dotEnvFile}`)



module.exports = function (env) {
  return {
    clientAllowedKeys : [
      'LMS_DEPLOY_TARGET',
      'LMS_GITHUB_CLIENT_ID',
      'LMS_HOST',
      'LMS_GATEKEEPER_URL',
    ],
    path : dotEnvFile,
  }
}
