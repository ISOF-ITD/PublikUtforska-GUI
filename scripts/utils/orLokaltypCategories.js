import _ from 'underscore';

export default {
	getCategoryName(categoryLetter, advancedCategories) {
		if (categoryLetter) {
			var lookupObject = advancedCategories ? this.categories_advanced : this.categories;
			var categoryObj = _.find(lookupObject, function(item) {
				return item.letter.toLowerCase() == categoryLetter.toLowerCase();
			}.bind(this));

			return categoryObj ? categoryObj.label : categoryLetter.indexOf(';') > -1 ? 'Flera kategorier' : '(Ingen kategori)';
		}
		else {
			return null;
		}
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
        }
	]
}
