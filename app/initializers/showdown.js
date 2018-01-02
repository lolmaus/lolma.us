import showdown from 'showdown'
import hljs from 'npm:highlight.js'



function htmlunencode (text) {
  return (
    text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
  )
}



export function initialize () {
  showdown.setFlavor('github')

  showdown.extension('codehighlight', function () {
    function replacement (wholeMatch, match, left, right) {
      const classesRegex = /class="(.+?)"/
      const hasClasses = classesRegex.test(left)

      // unescape match to prevent double escaping
      match = htmlunencode(match)

      const newLeft =
        hasClasses
          ? left.replace(classesRegex, 'class="$1 hljs"')
          : left.replace(/>$/,  ' class="hljs">')

      const lang = hasClasses && left.match(classesRegex)[1].split(' ')[0]
      const code = lang ? hljs.highlight(lang, match).value : match

      return '<div class="code-block">'
        + newLeft
        + code
        + right
        + '</div>'
    }

    return {
      type   : 'output',
      filter : function (text, converter, options) {
        // use new showdown's regexp engine to conditionally parse code blocks
        const left  = '<pre.*?><code.*?>'
        const right = '</code></pre>'
        const flags = 'g'
        return showdown.helper.replaceRecursiveRegExp(text, replacement, left, right, flags)
      },
    }
  })

  showdown.extension('linkable-headers', function () {
    return {
      type    : 'output',
      regex   : /<h(\d?) id="(.+?)">(.+?)<\/h\d?>/g,
      replace : '<h$1 id="$2" class="headingWithLink"><a href="#$2" class="headingWithLink-link">#</a>$3</h$1>',
    }
  })
}

export default {
  name : 'showdown',
  initialize,
}
