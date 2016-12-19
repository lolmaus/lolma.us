const fs       = require('fs')



module.exports = function listBlogPages () {
  return fs
    .readdirSync('./public/content/posts')
    .map(filename => {
      const slug   = filename.split('-').slice(0, -1).join('-')
      const locale = filename.split('-').pop().split('.')[0]

      return `/${locale}/blog/${slug}`
    })
}
