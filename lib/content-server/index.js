const express = require('express')
const _       = require('lodash')

const writeFile = require('broccoli-file-creator')
const mergeTrees = require('broccoli-merge-trees')

const generateContent     = require('./generate-content')
const generateRss         = require('./generate-rss')
const generateCacheBuster = require('./generate-cache-buster')



/*jshint node:true*/
module.exports = {
  name: 'content-server',



  isDevelopingAddon () {
    return true
  },



  init () {
    this._super.init.apply(this, arguments)

    this._generateContent()
    this._startServer()
  },



  postBuild (/*result*/) {
    this._cleanup()
  },



  treeForPublic () {
    const tree = this._super.treeForPublic.apply(this, arguments)

    const newTrees =
      this
        ._content
        .map(({filename, content}) => writeFile(`/${filename}`, content))

    if (tree) newTrees.unshift(tree)

    return mergeTrees(newTrees)
  },



  _generateContent () {
    this._content = [
      ...generateContent(),
      ...generateRss(),
      ...generateCacheBuster(),
    ]

    this._contentByFileName = _.keyBy(this._content, 'filename')
  },



  _startServer (content) {

    this._expressServer = express()

    this._expressServer.get('/*', (req, res) => {
      const fileName = /^\/*(.+)/.exec(req.path)[1]
      const file     = this._contentByFileName[fileName]

      if (!file) throw new Error(`Content server: file does not exist: ${req.path}`)
      res.send(file.content)
    })

    this._expressServerListen = global._expressServerListen = this._expressServer.listen(8081)

    process.on('uncaughtException', () => this._expressServerListen.close())
    process.on('SIGTERM',           () => this._expressServerListen.close())
  },



  _cleanup () {
    this._expressServerListen.close()
  },
}

