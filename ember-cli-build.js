'use strict'

const EmberApp      = require('ember-cli/lib/broccoli/ember-app')
const listBlogPages = require('./lib/list-blog-pages')

module.exports = function (defaults) {
  const app =
    new EmberApp(defaults, {
      babel : {
        plugins : [
          'transform-object-rest-spread',
        ],
      },

      favicons : {
        imagePath : 'favicon.jpg',
        // faviconsConfig : {
        //   // these options are passed directly to the favicons module
        // },
      },

      fingerprint : {
        exclude : ['apple-touch-icon', 'favicon', 'mstile'],
      },

      nodeModulesToVendor : [
        'node_modules/highlight.js',
      ],

      prember : {
        urls : [
          '/',
          '/en/',
          '/ru/',
          '/en/blog/',
          '/ru/blog/',
          ...listBlogPages(),
        ],
      },

      sassOptions : {
        includePaths : [
          'app/pods',
        ],
      },

      sitemap : {
        options : {
          hostname : 'https://lolma.us',

          urls : [
            {url : '/',        changefreq : 'daily'},
            {url : '/en/',      changefreq : 'daily'},
            {url : '/ru/',      changefreq : 'daily'},
            {url : '/en/blog/', changefreq : 'daily'},
            {url : '/ru/blog/', changefreq : 'daily'},
            ...listBlogPages().map(url => ({url, changefreq : 'weekly'})),
          ],
        },
      },
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
