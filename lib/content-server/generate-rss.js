const RSS         = require('rss')
const path        = require('path')
const fs          = require('fs')
// const _           = require('lodash')
const frontMatter = require('front-matter')
const Showdown    = require('showdown')
const showdown    = new Showdown.Converter()

showdown.setFlavor('github')
showdown.setOption('ghCodeBlocks',   true)
showdown.setOption('tablesHeaderId', true)
showdown.setOption('tables',         true)
showdown.setOption('strikethrough',  true)

const locales  = ['ru', 'en']
const rootPath = path.join(__dirname, '../../content/posts')



module.exports = function generateRss () {
  const files = readFiles()

  return locales
    .map(locale => ({locale, feed : generateFeed(locale), files : files.filter(file => file.locale === locale)}))
    .map(({locale, feed, files}) => ({locale, files, feed : populateFeed({feed, files})}))
    .map(({locale, feed}) => generateEmberFiles({locale, feed}))
}



function generateFeed (locale) {
  return new RSS({
    title       : 'lolmaus blog',
    description : 'Personal blog of Andrey Mikhaylov (lolmaus), a frontend developer and EmberJS enthusiast',
    feed_url    : `http://lolma.us/rss_${locale}.xml`,
    site_url    : `http://lolma.us/${locale}`,
    image_url   : "https://pbs.twimg.com/profile_images/458644904189501440/ANprYN38.jpeg",
    language    : locale,
    categories  : ['ember', 'emberjs', 'development', 'web development', 'html', 'css', 'javascript', 'js', 'es2015', 'programming'],
  })
}



function populateFeed ({feed, files}) {
  files.forEach(({title, description, url, categories, date}) => {
    feed.item({
      title,
      description,
      url,
      categories,
      date,
    })
  })

  return feed
}



function readFiles () {
  return fs
    .readdirSync(rootPath)
    .map(fileName => {

      const fileNameWithoutExt = fileName.split('.').slice(0, -1).join('.')
      const slug               = fileNameWithoutExt.split('-').slice(0, -1).join('-')
      const locale             = fileNameWithoutExt.split('-').slice(-1)[0]
      const fullName           = path.join(rootPath, fileName)
      const content            = fs.readFileSync(fullName, 'utf8')
      const {attributes, body} = frontMatter(content)
      const title              = attributes.title
      const description        = showdown.makeHtml(attributes.summary) + showdown.makeHtml(body)
      const url                = `http://lolma.us/${locale}/blog/${slug}`
      const categories         = attributes.tags && attributes.tags.split(' ')
      const date               = attributes.created

      return {
        fileName,
        fileNameWithoutExt,
        slug,
        locale,
        fullName,
        content,
        title,
        description,
        body,
        url,
        categories,
        date,
      }
    })
}



function generateEmberFiles ({locale, feed}) {
  return {
    filename : `rss_${locale}.xml`,
    content  : feed.xml(),
    tree     : 'public',
  }
}
