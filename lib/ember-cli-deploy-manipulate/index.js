const BasePlugin       = require('ember-cli-deploy-plugin')
const path             = require('path')
const fs               = require('fs-extra')
const Promise          = require("bluebird")
const recursiveReaddir = require('recursive-readdir')
const _                = require('lodash')

const Pipeline = require('ember-cli-deploy/lib/models/pipeline')



Pipeline.prototype._mergePluginHookResultIntoContext = function (context, result = {}) {
  const dontMerge = result._dontMerge || []
  delete result._dontMerge

  return _.mergeWith(context, result, function (a, b, key) {
    if (_.isArray(a) && !dontMerge.includes(key)) {
      return a.concat(b)
    }
  })
}



const indexHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="refresh" content="0; url=/en/blog/">
  </head>
</html>`



const promisify = (method, ...args) => {
  return new Promise((resolve, reject) => {
    method(...args, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
}



module.exports = {
  name: 'ember-cli-deploy-manipulate',

  isDevelopingAddon () {
    return true
  },

  createDeployPlugin (options) {
    const DeployPlugin = BasePlugin.extend({
      name:      options.name,
      runAfter:  'build',
      runBefore: 'ghpages',

      didBuild: function (context) {
        const distDir       = path.join(context.project.root, context.distDir)
        const staticBootDir = path.join(distDir, 'staticboot')
        const indexFilename = path.join(distDir, 'index.html')

        this.log('Moving staticboot folder to dist root')

        return promisify(fs.readdir, distDir)

          // Delete everything but staticboot
          .then(filenames => filenames.filter(filename => filename !== 'staticboot'))
          .then(filenames => filenames.map(filename => path.join(distDir, filename)))
          .then(filenames => Promise.all(filenames.map(filename => promisify(fs.remove, filename))))

          // Moving staticboot to root
          .then(() => promisify(fs.readdir, staticBootDir))
          .then(filenames => filenames.map(filename => ({
            src:  path.join(staticBootDir, filename),
            dest: path.join(distDir,       filename),
          })))
          .then(filenames => Promise.all(filenames.map(({src, dest}) => promisify(fs.rename, src, dest))))
          .then(() => promisify(fs.remove, staticBootDir))

          // Writing index.html
          .then(() => promisify(fs.writeFile, indexFilename, indexHtml))

          // Setting new `distFiles` on deploy context
          .then(() => promisify(recursiveReaddir, distDir))
          .then(filenames => filenames.map(filename => filename.slice(distDir.length + 1)))
          .then(distFiles => ({distFiles, _dontMerge: ['distFiles']}))
      }
    })

    return new DeployPlugin()
  },
}
