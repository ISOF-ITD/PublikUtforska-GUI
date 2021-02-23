export default {
	// Namn på localStorage som lagrar sparade sägner
	localLibraryName: 'publikutforska_library',

	// Parametrar som alltid skulle skickas till API:et, här passar vi på att sägenkartan alltid hämtar textar av typ arkiv eller tryckt och som finns i en kategori
	requiredParams: {
		// transcriptionstatus: 'readytotranscribe,transcribed,reviewing,approved,published',
		mark_metadata: 'transcriptionstatus',
		//type: 'arkiv,tryckt',
		categorytypes: 'tradark'
		//For test with ortnamn data in index only use:
		//Also add ISOF-React-modules/utils/orLokaltypCategories.js in CategoryMenu.js and CategoryList.js
		//type: 'ortnamn',
		////categorytypes: 'ortnamn'
	},

	// Speciella inställningar för projektet, används nu mest för Matkarta-GUI, siteOptions som property av config måste dock finnas
	siteOptions: {
		recordList: {
			// Döljd materialtyp i RecordList, används för matkartan
			hideMaterialType: true,
			// Döljd Accession:page i RecordList, används för vissa kartor
			//hideAccessionpage: true,

			/*
			// Dölj kategorier kolumn i RecordList, används för folkmusiken
			hideCategories: true

			// Dölj TranscriptionStatus kolumn i RecordList, används bara för crowdsource?
			hideTranscriptionStatus: true
			*/

			// Vilka kategorier vi vill visa i listan, här vill vi bara visa matkarta kategorier men dölja frågolista-kategorier
			visibleCategories: ['tradark']
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
		disablePersonLinks: true
	*/
		feedbackText: 'Har du frågor eller synpunkter på hur applikationen fungerar? Har du hittat fel, till exempel i avskrifterna? Kontakta oss gärna!',
		contributeInfoText: 'Känner du till någon av personerna som nämns: en upptecknare, någon som intervjuats eller som nämns i en berättelse? Vid 1900-talets början var arkiven framför allt intresserade av berättelserna, inte berättarna. Därför vet vi idag ganska lite om människorna i arkiven. Kontakta oss gärna nedan om du har information om eller fotografier på någon av personerna som nämns på uppteckningen! 					Vill du vara med och bevara minnen och berättelser från vår tid till framtiden? På Institutets webbplats publiceras regelbundet frågelistor om olika ämnen. ',
		helpText: 'Här kan du läsa mer om hur du använder applikationen: Här kan du läsa mer om hur du bidrar genom att t.ex. skriva av uppteckningar: ',
	},

	// Application specific filter parameter First value (0) is false
	// Probably not needed anymore
	filterParameterName: 'transcriptionstatus',
	filterParameterValues: ['untranscribed,readytotranscribe,transcribed,reviewing,approved,published', 'readytotranscribe'],

	// Vilket land vi hämtar data från
	country: 'sweden',

	// Webbsida som ska visas i OverlayWindow när användaren först kommer till kartan
	startPageUrl: 'https://www.isof.se/om-oss/kartor/sagenkartan/om-sagenkartan---kort.html',

	imageUrl: 'https://www4.isof.se/Folkminnen/Svenska_sagor_filer/',
	//For test with ortnamn data in index:
	//imageUrl: 'https://www4.isof.se/NAU/bilder/',
	personImageUrl: 'https://frigg.isof.se/media/',
	audioUrl: 'https://www4.isof.se/Folkminnen/Svenska_sagor_filer/inspelningar/',

	appUrl: 'https://frigg.isof.se/static/js-apps/publikutforska/',
	siteUrl: 'https://www.isof.se/om-oss/kartor/publikutforska.html',

	// Url till Django/Elasticsearch API
	apiUrl: 'https://frigg-test.isof.se/sagendatabas/api/es/',
	//For test with ortnamn data in index:
	//apiUrl: 'https://frigg-test.isof.se/TradarkSearchService/api/es/',

	// Url till Django Rest API
	restApiUrl: 'https://frigg-test.isof.se/sagendatabas/api/'
};