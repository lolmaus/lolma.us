import $ from 'jquery'
import _ from 'npm:lodash'

const items = {
  '#route-locale-menuToggler': {
    type: 'checkbox',
  },
  '.timeLine-showDetails': {
    type: 'checkbox',
  },
  '.proJects-stalledInput': {
    type: 'checkbox',
  },
  '.route-locale-content': {
    type: 'vertical-scroll',
  },
  '.route-blog-sidebar': {
    type: 'vertical-scroll',
  },
  '.route-blog-content': {
    type: 'vertical-scroll',
  },
}

export function initialize (/*applicationInstance*/) {
  _.forOwn(items, (data, selector) => {
    const $el = $(selector)

    switch (data.type) {
      case 'checkbox':
        data.value = $el.is(':checked')
        break
      case 'vertical-scroll':
        data.value = $el.scrollTop()
        break
    }
  })

  window.lolmausHtmlState = items
}

export default {
  name: 'save-html-state',
  initialize
}
