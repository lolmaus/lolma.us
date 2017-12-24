const fs = require('fs')

function getDeployTarget () {
  return process.env.DEPLOY_TARGET || getDefaultDeployTarget()
}

function getDefaultDeployTarget () {
  const environment =
    process.env.EMBER_ENV
    || deployEnv()
    || 'development'

  return environment === 'production' ? 'production' : 'localhost-4200'
}


function deployEnv () {
  if (process.argv[2] === 'deploy' && process.argv[3] === 'prod') {
    throw new Error('Command `ember deploy prod` is not supported. Please use `ember deploy production`.')
  } else if (process.argv[2] === 'deploy' && process.argv[3] === 'production') {
    return 'production'
  }
}



const dotEnvFile   = `./.env-${getDeployTarget()}`

if (fs.existsSync(dotEnvFile)) console.info(`Using dotenv file: ${dotEnvFile}`)
else console.warn(`dot-env file not found: ${dotEnvFile}, assuming env vars are passed manually`)



module.exports = function (env) {
  return {
    clientAllowedKeys : [
      'DEPLOY_TARGET',
      'LMS_GITHUB_CLIENT_ID',
      'LMS_HOST',
      'LMS_GATEKEEPER_URL',
    ],
    path : dotEnvFile,
  }
}
