import hljs from 'npm:highlight.js'

export function initialize () {
  showdown.setFlavor('github')
  showdown.setOption('ghCodeBlocks',   true)
  showdown.setOption('tablesHeaderId', true)
  showdown.setOption('tables',         true)
  showdown.setOption('strikethrough',  true)

  showdown.extension('codehighlight', function () {
    function htmlunencode (text) {
      return (
        text
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
      )
    }
    return [
      {
        type: 'output',
        filter: function (text, converter, options) {
          // use new shodown's regexp engine to conditionally parse codeblocks
          var left  = '<pre><code\\b[^>]*>',
              right = '</code></pre>',
              flags = 'g',
              replacement = function (wholeMatch, match, left, right) {
                // unescape match to prevent double escaping
                match = htmlunencode(match)
                const newLeft = left.replace(/class="(.+?)"/, 'class="$1 hljs"')
                return newLeft + hljs.highlightAuto(match).value + right
              }
          return showdown.helper.replaceRecursiveRegExp(text, replacement, left, right, flags)
        }
      }
    ]
  })

}

export default {
  name: 'showdown',
  initialize
}
