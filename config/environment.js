'use strict'

const _ = require('lodash')

const envVars = _.pick(process.env, [
  'LMS_DEPLOY_TARGET',
  'LMS_GITHUB_CLIENT_ID',
  'LMS_HOST',
  'LMS_GATEKEEPER_URL',
])



module.exports = function (environment) {
  const ENV = {
    modulePrefix    : 'lolma-us',
    podModulePrefix : 'lolma-us/pods',
    environment,
    rootURL         : '/',
    locationType    : 'auto',
    envVars,

    EmberENV : {
      FEATURES : {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
        // 'ds-pushpayload-return': true
      },
      EXTEND_PROTOTYPES : {
        // Prevent Ember Data from overriding Date.parse.
        Date : false,
      },
    },

    APP : {
      // Here you can pass flags/options to your application instance
      // when it is created
    },

    i18n : {
      defaultLocale : 'en',
    },

    fastboot : {
      hostWhitelist : [
        '/',
        'http://127.0.0.1:8081',
      ],
    },

    torii : {
      providers : {
        'github-oauth2' : {
          apiKey : envVars.LMS_GITHUB_CLIENT_ID,
          // redirectUri: overridden in provider's `redirectUri` property
          scope  : 'public_repo',
        },
      },
    },

    moment : {
      // To cherry-pick specific locale support into your application.
      // Full list of locales: https://github.com/moment/moment/tree/2.10.3/locale
      includeLocales : ['ru'],
    },

    // webFontConfig: {
    //   google: {
    //     families: ['Open Sans:300:latin,cyrillic', 'Open Sans Condensed:300:latin,cyrillic']
    //   },
    // },

    metricsAdapters : [
      {
        name         : 'GoogleAnalytics',
        environments : ['development', 'production'],
        config       : {
          id : 'UA-77566978-1',

          // Use `analytics_debug.js` in development
          debug : environment === 'development',

          // Use verbose tracing of GA events
          trace : environment === 'development',

          // Ensure development env hits aren't sent to GA
          sendHitTask : environment !== 'development',
        },
      },
    ],

    disqus : {
      shortname : 'lolmaus',
    },
  }

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true
    // ENV.APP.LOG_ACTIVE_GENERATION = true
    // ENV.APP.LOG_TRANSITIONS = true
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true
    // ENV.APP.LOG_VIEW_LOOKUPS = true
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none'

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false
    ENV.APP.LOG_VIEW_LOOKUPS = false

    ENV.APP.rootElement = '#ember-testing'
  }

  // if (env === 'production') {
  //
  // }

  return ENV
}
