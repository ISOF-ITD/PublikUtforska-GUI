export default {
	// Namn på localStorage som lagrar sparade sägner
	localLibraryName: 'publikutforska_library',

	// Parametrar som alltid skulle skickas till API:et, här passar vi på att sägenkartan alltid hämtar textar av typ arkiv eller tryckt och som finns i en kategori
	requiredParams: {
		transcriptionstatus: 'readytotranscribe,undertranscription,transcribed,reviewing,approved,published',
		mark_metadata: 'transcriptionstatus',
		//type: 'arkiv,tryckt',
		categorytypes: 'tradark'
	},

	// Speciella inställningar för projektet, används nu mest för Matkarta-GUI, siteOptions som property av config måste dock finnas
	siteOptions: {
	/*
		recordList: {
			// Döljd materialtyp i RecordList, används för matkartan
			hideMaterialType: true,

			// Döljd kategorier kolumn i RecordList, används för folkmusiken
			hideCategories: true

			// Vilka kategorier vi vill visa i listan, här vill vi bara visa matkarta kategorier men dölja frågolista-kategorier
			visibleCategories: ['matkarta']
		},

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
	},

	// Vilket land vi hämtar data från
	country: 'sweden',

	// Webbsida som ska visas i OverlayWindow när användaren först kommer till kartan
	startPageUrl: 'https://www.isof.se/om-oss/kartor/sagenkartan/om-sagenkartan---kort.html',

	imageUrl: 'https://www4.isof.se/Folkminnen/Svenska_sagor_filer/',
	personImageUrl: 'https://frigg.isof.se/media/',
	audioUrl: 'https://www4.isof.se/Folkminnen/Svenska_sagor_filer/inspelningar/',

	appUrl: 'https://frigg.isof.se/static/js-apps/publikutforska/',
	siteUrl: 'https://www.isof.se/om-oss/kartor/publikutforska.html',

	// Url till Django/Elasticsearch API
	apiUrl: 'https://frigg-test.isof.se/sagendatabas/api/es/',

	// Url till Django Rest API
	restApiUrl: 'https://frigg-test.isof.se/sagendatabas/api/'
};