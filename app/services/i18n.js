import I18NService from 'ember-i18n/services/i18n'
import {computed} from '@ember/object'



export default I18NService.extend({

  // ----- Services -----



  // ----- Overridden properties -----



  // ----- Static properties -----



  // ----- Computed properties -----
  oppositeLocale : computed('locale', function () {
    return this.get('locale') === 'en'
      ? 'ru'
      : 'en'
  }),



  // ----- Overridden Methods -----



  // ----- Custom Methods -----



  // ----- Events and observers -----



  // ----- Tasks -----

})
