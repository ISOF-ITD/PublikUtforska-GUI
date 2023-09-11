export default {
  // Function to get category name
  getCategoryName(categoryLetter, advancedCategories) {
    // If no categoryLetter is provided, return null
    if (!categoryLetter) return null;

    // Depending on advancedCategories flag, select the appropriate categories object
    const lookupObject = advancedCategories ? this.categories_advanced : this.categories;

    // Find the category that matches the provided categoryLetter (case insensitive)
    const categoryObj = lookupObject.find(
      (item) => item.letter.toLowerCase() === categoryLetter.toLowerCase(),
    );

    /* Return the label of the found category if exists, else check if categoryLetter contains ';'
       * If it does, return 'Flera kategorier'. If not, return '(Ingen kategori)'
       * Optional chaining is used to safely access categoryObj.label and
       * nullish coalescing operator provides fallback value when left operand is null or undefined
       */
    return categoryObj?.label
        ?? (categoryLetter.includes(';') ? 'Flera kategorier' : '(Ingen kategori)');
  },

  // Categories with type lokaltyp
  categories: [
    {
      letter: 'anläggning',
      label: 'anläggning',
    },
    {
	        letter: 'bebyggelse',
	        label: 'bebyggelse',
    },
    {
      letter: 'förteckning',
      label: 'förteckning',
    },
    {
      letter: 'lokal saknas',
      label: 'lokal saknas',
    },
    {
      letter: 'område',
      label: 'område',
    },
    {
      letter: 'ortnamnselement',
      label: 'ortnamnselement',
    },
    {
      letter: 'personer',
      label: 'personer',
    },
    {
      letter: 'terräng',
      label: 'terräng',
    },
    {
      letter: 'vatten',
      label: 'vatten',
    },
    {
      letter: 'vattendrag',
      label: 'vattendrag',
    },
    {
      letter: 'ägomark',
      label: 'ägomark',
    },
    {
      letter: 'N',
      label: 'Naturnamn odef',
    },
    {
      letter: 'B',
      label: 'Bebyggelse odef',
    },
  ],
};
