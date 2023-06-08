const hostname = window.location.hostname
const is_dev = ['127.0.0.1', 'localhost', '0.0.0.0'].some(element => hostname.includes(element))
const is_test = ['-test.'].some(element => hostname.includes(element))
export const ENV =  is_dev ? 'dev' : (is_test ? 'test' : 'prod')

if (ENV !== 'prod') {
	console.log(`ENV=${ENV}`)
}

const api_url = {
	'dev': 'https://frigg.isof.se/sagendatabas/api/es/', //feel free to change according to your local environment
	'test': 'https://frigg-test.isof.se/sagendatabas/api/es/',
	'prod': 'https://frigg.isof.se/sagendatabas/api/es/',
}

const rest_api_url = {
	'dev': 'https://frigg.isof.se/sagendatabas/api/', //feel free to change according to your local environment
	'test': 'https://frigg-test.isof.se/sagendatabas/api/',
	'prod': 'https://frigg.isof.se/sagendatabas/api/',
}

const app_url = {
	'dev': window.location.origin + '/',
	'test': 'https://sok.folke-test.isof.se/',
	'prod': 'https://sok.folke.isof.se/',
}

const site_url = {
	'dev': window.location.origin,
	'test': 'https://sok.folke-test.isof.se',
	'prod': 'https://sok.folke.isof.se',
}

const pdf_url = {
	'dev': 'https://sok.folke.isof.se/arkivfiler/publik/',
	'test': 'https://sok.folke-test.isof.se/arkivfiler/publik/',
	'prod': 'https://sok.folke.isof.se/arkivfiler/publik/',
}

const matomo_api_url = {
	'dev': 'https://djangoproxy.isof.se/matomo_api/',
	// 'dev': 'http://127.0.0.1:5002/matomo_api', //feel free to change according to your local environment
	'test':'https://djangoproxy-test.isof.se/matomo_api',
	'prod': 'https://djangoproxy.isof.se/matomo_api/',
}

export default {
	siteTitle: 'Folke sök - Institutet för språk och folkminnen',

	hitsPerPage: 100,

	// Namn på localStorage som lagrar sparade accessioner/uppteckningar
	localLibraryName: 'publikutforska_library',

	// Parametrar som alltid skulle skickas till API:et, här passar vi på att sägenkartan alltid hämtar textar av typ arkiv eller tryckt och som finns i en kategori
	requiredParams: {
		// transcriptionstatus: 'readytotranscribe,undertranscription,transcribed,reviewing,needsimprovement,approved,published',
		mark_metadata: 'transcriptionstatus',
		type: 'arkiv',
		categorytypes: 'tradark',
		publishstatus: 'published',
		has_media: 'true', // TODO: Bekräfta att vi ska använda detta
		//For test with ortnamn data in index only use:
		//Also add utils/orLokaltypCategories.js in CategoryMenu.js and CategoryList.js
		//type: 'ortnamn',
		////categorytypes: 'ortnamn'
	},

	// Speciella inställningar för projektet, används nu mest för Matkarta-GUI, siteOptions som property av config måste dock finnas
	siteOptions: {
		//placeView: false,
		placeView: {
			// TODO: Visa strukturerade informanter från kvalitetskälla, men inte ostrukturerade informanter (som informanter från crowdsource) i personlista
			// Dölj personlista med informanter:
			hideInformantPersonList: true,
		},
		recordList: {
			// Döljd materialtyp i RecordList, används för matkartan
			hideMaterialType: true,
			// Döljd Accession:page i RecordList, används för vissa kartor
			//hideAccessionpage: true,

			
			// Dölj kategorier kolumn i RecordList, används för folkmusiken
			// hideCategories: true,

			// Dölj TranscriptionStatus kolumn i RecordList, används bara för crowdsource?
			// hideTranscriptionStatus: true
			

			// Vilka kategorier vi vill visa i listan, här vill vi bara visa matkarta kategorier men dölja frågolista-kategorier
			visibleCategories: ['tradark'],

			// Visa insamlare:
			visibleCollecorPersons: true,
		},

		/*
		recordView: {
			// Vilka metadata fälts skulle visas i RecordView, används för folkmusiken
			visible_metadata_fields: [
				'folkmusik_instrument',
				'folkmusik_recorded_by',
				'folkmusik_musician_name',
				'folkmusik_genre',
				'folkmusik_proveniens'
			],

			// Skulle ljudspelare vara full-size
			full_audio_player: true
		},

		mapView: {
			// Skulle MapView alltid uppdatera viewPort så att nya prickar på kartan syns alla
			alwaysUpdateViewport: true
		}

		// Namn på metadata labels, används i koppling med visible_metadata_fields
		metadataLabels: {
			folkmusik_instrument: 'Sång/instrument',
			folkmusik_recorded_by: 'Inspelat eller inlämnat av',
			folkmusik_musician_name: 'Sångare/instrumentalist',
			folkmusik_genre: 'Låttyp eller visgenre',
			folkmusik_proveniens: 'Proveniens'
		},

		// Inaktivera länker till personer, visa bara namnet
		disablePersonLinks: true,
	*/
		// Inaktivera länker till informanter, visa bara namnet
		//disableInformantLinks: true,

		feedbackText: 'Har du frågor eller synpunkter på hur applikationen fungerar? Har du hittat fel, till exempel i avskrifterna? Kontakta oss gärna!',
		contributeInfoText: 'Känner du till någon av personerna som nämns: en upptecknare, någon som intervjuats eller som nämns i en berättelse? Vid 1900-talets början var arkiven framför allt intresserade av berättelserna, inte berättarna. Därför vet vi idag ganska lite om människorna i arkiven. Kontakta oss gärna nedan om du har information om eller fotografier på någon av personerna som nämns på uppteckningen! 					Vill du vara med och bevara minnen och berättelser från vår tid till framtiden? På Institutets webbplats publiceras regelbundet frågelistor om olika ämnen. ',
		helpText: 'Här kan du läsa mer om hur du använder applikationen: Här kan du läsa mer om hur du bidrar genom att t.ex. skriva av uppteckningar: ',

		copyrightContent: {
			'https://creativecommons.org/licenses/by-nd/2.5/se/': '<a rel="license" target="_blank" href="https://creativecommons.org/licenses/by-nd/2.5/se/"><img alt="Creative Commons-licens" style="border-width:0" src="https://i.creativecommons.org/l/by-nd/2.5/se/88x31.png" /></a><br />Detta verk är licensierat under en <a rel="license" target="_blank" href="https://creativecommons.org/licenses/by-nd/2.5/se/">Creative Commons Erkännande-IngaBearbetningar 2.5 Sverige Licens</a>.',
			'https://creativecommons.org/licenses/by/2.5/se/': '<a rel="license" target="_blank" href="https://creativecommons.org/licenses/by/2.5/se/"><img alt="Creative Commons-licens" style="border-width:0" src="https://i.creativecommons.org/l/by/2.5/se/88x31.png" /></a><br />Detta verk är licensierat under en <a rel="license" target="_blank" href="https://creativecommons.org/licenses/by/2.5/se/">Creative Commons Erkännande 2.5 Sverige Licens</a>.',
		}
	},

	// Application specific filter parameter First value (0) is false
	// Probably not needed anymore
	// filterParameterName: 'transcriptionstatus',
	// filterParameterValues: ['untranscribed,readytotranscribe,transcribed,reviewing,approved,published', 'readytotranscribe'],

	// Vilket land vi hämtar data från
	country: 'sweden',

	// Webbsida som ska visas i OverlayWindow när användaren först kommer till kartan
	startPageUrl: 'https://www.isof.se/arkiv-och-insamling/digitala-arkivtjanster/folke',

	imageUrl: 'https://www4.isof.se/Folkminnen/Svenska_sagor_filer/',
	pdfUrl: pdf_url[ENV],
	//For test with ortnamn data in index:
	//imageUrl: 'https://www4.isof.se/NAU/bilder/',
	personImageUrl: 'https://frigg.isof.se/media/',
	audioUrl: 'https://www4.isof.se/Folkminnen/Svenska_sagor_filer/inspelningar/',

	appUrl: app_url[ENV],
	siteUrl: site_url[ENV],

	// Url till Django/Elasticsearch API
	apiUrl: api_url[ENV],
	// apiUrl: 'https://frigg-test.isof.se/sagendatabas/api/es/',
	//For test with ortnamn data in index:
	//apiUrl: 'https://frigg-test.isof.se/TradarkSearchService/api/es/',

	// Url till Django Rest API
	restApiUrl: rest_api_url[ENV],

	// Url till Matomo API
	matomoApiUrl: matomo_api_url[ENV],
	// link to matomo api docs: https://developer.matomo.org/api-reference/reporting-api
	searchSuggestionsParams: {
		module: "API",
		method: "Actions.getSiteSearchKeywords",
		idSite: "17",
		period: "range",
		date: "2022-01-01,today",
		format: "JSON",
		// filter_limit: "100", // default 100
	},
	// här går det att begränsa antalet sökförslag för varje typ av sökförslag
	// sätt till null för att inte begränsa
	numberOfSearchSuggestions: 6,
	numberOfPlaceSuggestions: null,
	numberOfPersonSuggestions: null,
	numberOfProvinceSuggestions: null,
};