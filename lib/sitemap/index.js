/* eslint-env node */
'use strict'

const mergeTrees = require('broccoli-merge-trees')
const writeFile  = require('broccoli-file-creator')
const SiteMap    = require('sitemap')



module.exports = {
  name : 'sitemap',

  isDevelopingAddon () {
    return true
  },

  treeForPublic : function (tree) {
    const options = this._getOptions()

    if (!options.options || !options.options.urls) {
      throw new Error('You must provide `{sitemap: {options: urls: []}}}` in ember-cli-build.js, in npm sitemap package format')
    }

    const sitemapObj  = SiteMap.createSitemap(options.options)
    const sitemapStr  = sitemapObj.toString()
    const sitemapTree = writeFile('sitemap.xml', sitemapStr)

    return tree
      ? mergeTrees([tree, sitemapTree], {overwrite : true})
      : sitemapTree
  },



  _getOptions () {
    const app = this._findHost(this)
    return app && app.options && app.options.sitemap || {}
  },

  // https://github.com/ember-engines/ember-asset-loader/blob/v0.4.1/lib/utils/find-host.js
  _findHost (context) {
    let current = context
    let app

    // Keep iterating upward until we don't have a grandparent.
    // Has to do this grandparent check because at some point we hit the project.
    do {
      app = current.app || app
    } while (current.parent && current.parent.parent && (current = current.parent))

    return app
  },
}
