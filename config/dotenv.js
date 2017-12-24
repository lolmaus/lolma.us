const fs = require('fs')

function deployEnv () {
  if (
    process.argv[2] === 'deploy'
    && (process.argv[3] === 'prod' || process.argv[3] === 'production')
  ) {
    return 'production'
  }
}



const environment =
  process.env.EMBER_ENV
  || deployEnv()
  || 'development'

const defaultTarget = environment === 'production' ? 'prod' : 'localhost-4200'
const target        = process.env.LMS_DEPLOY_TARGET || defaultTarget

const dotEnvFile = `./.env-${target}`

if (fs.existsSync(dotEnvFile)) console.info(`using dotenv file: ${dotEnvFile}`)
else console.warn(`dot-env file not found: ${dotEnvFile}, assuming env vars are passed manually`)



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
