const fs       = require('fs')
const path     = require('path')



module.exports = function listBlogPages () {
  const dir = path.join(__dirname, '../content/posts')

  return fs
    .readdirSync(dir)
    .map(filename => {
      const slug   = filename.split('-').slice(0, -1).join('-')
      const locale = filename.split('-').pop().split('.')[0]

      return `/${locale}/blog/${slug}/`
    })
}
