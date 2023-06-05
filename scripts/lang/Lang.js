import langData from './langData';

const defaultLang = 'sv';

export default {
  collect: false,

  setCurrentLang(lang) {
    window.currentLang = lang;

    if (window.eventBus) {
      window.eventBus.dispatch('Lang.setCurrentLang');
    }
  },

  get(phrase) {
    if (window.traceLangGet) {
      console.log(`Lang.get: ${phrase}`);
    }

    if (!window.currentLang) {
      window.currentLang = defaultLang;
    }

    if (Lang.collect) {
      if (!Lang.notFound) {
        Lang.notFound = [];
      }

      if (!langData[window.currentLang][phrase]) {
        if (Lang.notFound.indexOf(phrase) == -1) {
          Lang.notFound.push(phrase);
          console.log(`Did not find translation for "${phrase}"`);
        }
      }
    }

    return !langData[window.currentLang] || !langData[window.currentLang][phrase] ? phrase : langData[window.currentLang][phrase];
  },
};
