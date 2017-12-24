import showdown from 'showdown'
import hljs from 'npm:highlight.js'

export function initialize () {
  showdown.setFlavor('github')

  showdown.extension('codehighlight', function () {
    function htmlunencode (text) {
      return (
        text
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
      )
    }

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
}

export default {
  name : 'showdown',
  initialize,
}
