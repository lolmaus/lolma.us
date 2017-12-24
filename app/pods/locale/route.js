import Route from '@ember/routing/route'
import {inject as service} from '@ember/service'
import RSVP from 'rsvp'
import $ from 'jquery'
// import _ from 'npm:lodash'


const linkedData = (locale) => ({
  '@context' : 'http://schema.org',
  '@type'    : 'WebSite',

  image : 'https://lolma.us/images/andrey-mikhaylov-lolmaus.jpg',

  author : {
    '@type'        : 'Person',
    name           : 'Andrey Mikhaylov',
    givenName      : 'Andrey',
    familyName     : 'Mikhaylov',
    additionalName : 'lolmaus',
    email          : 'mailto:lolmaus@gmail.com',
    image          : 'https://lolma.us/images/andrey-mikhaylov-lolmaus.jpg',

    address : {
      '@type'         : 'PostalAddress',
      addressCountry  : 'Russia',
      addressLocality : 'Moscow',

      availableLanguage : {
        '@type' : 'Language',
        name    : ['Russian'],
      },
    },

    brand : {
      '@type'     : 'Brand',
      name        : 'Helix TeamHub',
      logo        : 'https://lolma.us/images/linked-data/helix-teamhub-logo.png',
      url         : 'https://www.perforce.com/products/helix-teamhub',
      description : 'Code Hosting and Collaboration for Git+',
    },

    homeLocation : {
      '@type' : 'Place',

      address : {
        '@type'         : 'PostalAddress',
        addressCountry  : 'Russia',
        addressLocality : 'Moscow',

        availableLanguage : {
          '@type' : 'Language',
          name    : ['Russian'],
        },
      },
    },

    jobTitle : [
      'Frontend developer',
      'EmberJS developer',
    ],

    memberOf : {
      '@type' : 'Organization',
      logo    : 'https://lolma.us/images/linked-data/perforce-logo.png',
      url     : 'https://www.perforce.com/',
      name    : 'Perforce',

      brand : [
        {
          '@type'     : 'Brand',
          name        : 'Helix Core',
          logo        : 'https://lolma.us/images/linked-data/helix-core-logo.png',
          url         : 'https://www.perforce.com/products/helix-core',
          description : 'Version Control + Swarm Code Review & Collaboration',
        },

        {
          '@type'     : 'Brand',
          name        : 'Hansoft',
          logo        : 'https://lolma.us/images/linked-data/hansoft-logo.png',
          url         : 'https://hansoft.com/',
          description : 'Agile Project & Product Management Solution',
        },

        {
          '@type'     : 'Brand',
          name        : 'Helix TeamHub',
          logo        : 'https://lolma.us/images/linked-data/helix-teamhub-logo.png',
          url         : 'https://www.perforce.com/products/helix-teamhub',
          description : 'Code Hosting and Collaboration for Git+',
        },

        {
          '@type'     : 'Brand',
          name        : 'Helix ALM',
          logo        : 'https://lolma.us/images/linked-data/helix-alm-logo.png',
          url         : 'https://www.perforce.com/products/helix-alm',
          description : 'Flexible, End-to-End Application Lifecycle Management',
        },

      ],
    },

    nationality : {
      '@type'       : 'Country',
      name          : 'Russia',
      alternateName : 'Russian Federation',
    },
  },

  accessMode : 'textual',
  inLanguage : locale,

  audience : {
    '@type' : 'Audience',

    audienceType : [
      'developers',
      'web developers',
      'javascript developers',
      'js developers',
      'ember developers',
      'emberjs developers',
    ],
  },

  license : {
    '@type'       : 'CreativeWork',
    name          : 'Creative Commons Attribution 4.0 International',
    alternateName : 'CC BY 4.0',
    url           : 'https://creativecommons.org/licenses/by/4.0/',
    description   : 'You are free to: Share — copy and redistribute the material in any medium or format; Adapt — remix, transform, and build upon the material for any purpose, even commercially). This license is acceptable for Free Cultural Works. The licensor cannot revoke these freedoms as long as you follow the license terms. Under the following terms: Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use. No additional restrictions — You may not apply legal terms or technological measures that legally restrict others from doing anything the license permits.',
  },
})



export default Route.extend({

  // ----- Services -----
  config   : service(),
  i18n     : service(),
  moment   : service(),
  fastboot : service(),



  // ----- Overridden properties -----



  // ----- Static properties -----



  // ----- Computed properties -----



  // ----- Overridden Methods -----
  model ({locale}) {
    if (!['en', 'ru'].includes(locale)) locale = 'en'
    this.set('i18n.locale', locale)
    this.get('moment').changeLocale(locale)

    // const model = this.modelFor('application')
    const store      = this.get('store')
    const isFastBoot = this.get('fastboot.isFastBoot')

    return RSVP
      .hash({
        cacheBuster : store.findRecord('cache-buster', 'buster'),
        isFastBoot,
        // ...model,
        linkedData  : linkedData(locale),
        locale,
      })
  },

  afterModel () {
    this._checkCacheBuster()
  },



  // ----- Custom Methods -----
  _checkCacheBuster () {
    if (this.get('fastboot.isFastBoot')) return

    const store  = this.get('store')
    const buster = store.peekRecord('cache-buster', 'buster')

    if (!buster) return

    const oldString = buster.get('string')

    store
      .findRecord('cache-buster', 'buster', {reload : true})
      .then(buster => {
        if (oldString !== buster.get('string')) this._offerPageReload()
      })
  },

  _offerPageReload () {
    const i18n    = this.get('i18n')
    const message = i18n.t('refreshSuggestion')

    if (window.confirm(message)) window.location.reload(true)
  },

  _reloadPage () {
    // http://stackoverflow.com/a/27058362/901944
    $
      .ajax({
        url     : window.location.href,
        headers : {
          Pragma          : 'no-cache',
          Expires         : -1,
          'Cache-Control' : 'no-cache',
        },
      })
      .done(() => window.location.reload(true))
  },



  // ----- Events and observers -----



  // ----- Tasks -----



  // ----- Actions -----
  // actions: {
  // }
})
