/*jshint node:true*/
/* global require, module */
const EmberApp = require('ember-cli/lib/broccoli/ember-app')
const fs       = require('fs')

const environment = process.env.EMBER_ENV || 'development'

const defaultTarget = environment === 'production' ? 'prod' : 'localhost-4200'
const target        = process.env.LMS_DEPLOY_TARGET || defaultTarget

const dotEnvFile = `./.env-${target}`
if (!fs.existsSync(dotEnvFile)) throw new Error(`ember-cli-build.js: dot-env file not found: ${dotEnvFile}`)

const listBlogPages   = require('./lib/list-blog-pages')
const generateContent = require('./lib/generate-content')
const generateRss     = require('./lib/generate-rss')



module.exports = function (defaults) {
  const app =
    new EmberApp(defaults, {
      'ember-cli-staticboot': {
        paths: [
          '/',
          '/en',
          '/ru',
          '/en/blog',
          '/ru/blog',
          ...listBlogPages()
        ],
      },

      dotEnv: {
        clientAllowedKeys: [
          'LMS_DEPLOY_TARGET',
          'LMS_GITHUB_CLIENT_ID',
          'LMS_HOST',
          'LMS_GATEKEEPER_URL',
        ],
        path: dotEnvFile
      },

      sassOptions: {
        includePaths: [
          'app/pods'
        ]
      },

      nodeModulesToVendor: [
        'node_modules/highlight.js'
      ],

      fileCreator: [
        ...generateContent(),
        ...generateRss(),
      ]
    })

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.
  app.import('vendor/styles/agate.css')

  return app.toTree()
}
