const path        = require('path')
const fs          = require('fs')
const _           = require('lodash')
const frontMatter = require('front-matter')

const locales  = ['ru', 'en']
const rootPath = '../../content'



module.exports = function generateContent () {
  return [
    ...generateJsonApiFilesForMarkdown('experiences'),
    ...generateJsonApiFilesForMarkdown('markdown-blocks'),
    ...generateJsonApiFilesForMarkdown('posts', false),
    ...generateJsonApiFilesForJson('projects'),
  ]
}



function generateJsonApiFilesForMarkdown (type, shouldAddBodyToCollection = true) {
  const dirPath = path.join(__dirname, rootPath, type)

  const fileNames =
    fs
      .readdirSync(dirPath)
      .map(fileName => path.join(dirPath, fileName))

  return _(locales)
    .map(locale => generateJsonApiFilesForMarkdownLocale({fileNames, locale, type, shouldAddBodyToCollection}))
    .flatten()
    .value()
}



function generateJsonApiFilesForMarkdownLocale ({fileNames, locale, type, shouldAddBodyToCollection}) {
  const markdownFiles = readMarkdownFiles({fileNames, locale})
  return [
    jsonApiFilesForMarkdownCollection({markdownFiles, type, locale, shouldAddBodyToCollection}),
    ...jsonApiFilesForMarkdownIndividual({markdownFiles, type}),
  ]
}



function readMarkdownFiles ({fileNames, locale}) {
  return fileNames
    .filter(fileName => _.endsWith(fileName, `-${locale}.md`))
    .map(fileName => ({fileName, content : fs.readFileSync(fileName, 'utf8')}))
}



function jsonApiFilesForMarkdownCollection ({markdownFiles, type, locale, shouldAddBodyToCollection}) {
  const collectionData =
    markdownFiles
      .map(({fileName, content}) => jsonApiObjectFromFrontMatter({fileName, content, type, shouldAddBodyToCollection}))

  return {
    filename : `content/${type}-${locale}.json`,
    content  : JSON.stringify({data : collectionData}, null, 2),
    tree     : 'public',
  }
}



function jsonApiFilesForMarkdownIndividual ({markdownFiles, type}) {
  return markdownFiles
    .map(({fileName, content}) => jsonApiObjectFromFrontMatter({fileName, content, type, shouldAddBodyToCollection : true}))
    .map(jsonapiFile => ({
      filename : `content/${type}/${jsonapiFile.id}.json`,
      content  : JSON.stringify({data : jsonapiFile}, null, 2),
      tree     : 'public',
    }))
}



function jsonApiObjectFromFrontMatter ({fileName, content, type, shouldAddBodyToCollection}) {
  const {attributes, body} = frontMatter(content)

  if (shouldAddBodyToCollection) {
    attributes.body = body
  }

  return {
    id : fileName.split(path.sep).slice(-1)[0].split('.')[0],
    type,
    attributes,
  }
}



function generateJsonApiFilesForJson (type) {

  const files = readJsonFiles(type)

  return [
    // findAll
    {
      filename : `content/${type}.json`,
      content  : JSON.stringify({data : files.map(d => d.data)}, null, 2),
      tree     : 'public',
    },

    // findRecord
    ...files.map(({fileName, data}) => ({
      filename : `content/${type}/${fileName}`,
      content  : JSON.stringify({data}, null, 2),
      tree     : 'public',
    })),
  ]
}



function readJsonFiles (type) {
  const dirPath = path.join(__dirname, rootPath, type)

  return fs
    .readdirSync(dirPath)
    .map(fileName => {
      const id            = fileName.split('.').slice(0, -1).join('.')
      const attributes    = JSON.parse(fs.readFileSync(path.join(dirPath, fileName), 'utf8'))
      const relationships = attributes.relationships || {}
      const owner         = attributes.owner || 'lolmaus'
      const projectInfoId = `${owner}/${id}`

      delete attributes.relationships

      if (type === 'projects') {
        relationships['project-info'] = {
          data : {
            id   : projectInfoId,
            type : 'project-infos',
          },
        }
      }

      return {
        fileName,
        data : {
          id,
          type,
          attributes,
          relationships,
        },
      }
    })
}

// fs.writeFileSync(path.join(__dirname, 'a.json'), JSON.stringify(module.exports(), null, 2))
