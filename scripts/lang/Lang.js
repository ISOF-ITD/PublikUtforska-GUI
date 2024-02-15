import langData from './langData';

const defaultLang = 'sv';

const Lang = {
  currentLang: defaultLang,

  get(phrase) {
    const langPhrases = langData[this.currentLang];
    if (!langPhrases) {
      return phrase;
    }

    const value = langPhrases[phrase];
    if (value || value === '') {
      return value;
    }

    return phrase;
  },

  // Exempel för att ändra språk i en komponent:
  // import Lang from './lang/Lang';
  // Lang.setCurrentLang('no');
  setCurrentLang(language) {
    // Kontrollerar om det nya språket finns i langData
    if (langData[language]) {
      this.currentLang = language; // Uppdaterar det aktuella språket om det finns
    } else {
      console.warn(`Språket '${language}' finns inte i datan, kvarstår vid '${this.currentLang}'.`);
    }
  },
};
export default Lang;
export const l = (key) => Lang.get(key);
