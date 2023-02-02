import RouteParser from 'route-parser';

const searchRoute = '(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/recordtype/:recordtype)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/has_media/:has_media)(/has_transcribed_records/:has_transcribed_records)(/transcriptionstatus/:transcriptionstatus)(/page/:page)';
const placesRoute = '/places(/:place_id)(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/recordtype/:recordtype)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/has_media/:has_media)(/has_transcribed_records/:has_transcribed_records)(/transcriptionstatus/:transcriptionstatus)(/page/:page)';
const placeRoute = '/places/:place_id(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/recordtype/:recordtype)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/has_media/:has_media)(/has_transcribed_records/:has_transcribed_records)(/transcriptionstatus/:transcriptionstatus)(/page/:page)';
const recordRoute = '/records/:record_id(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/recordtype/:recordtype)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/has_media/:has_media)(/has_transcribed_records/:has_transcribed_records)(/transcriptionstatus/:transcriptionstatus)(/page/:page)';
// const statisticsRoute = '/statistics(/:place_id)(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/recordtype/:recordtype)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/has_media/:has_media)(/has_transcribed_records/:has_transcribed_records)(/transcriptionstatus/:transcriptionstatus)(/page/:page)';

export default {
	createPlacePathFromPlaces(placeId, placesPath) {
		placesPath = placesPath.split('?')[0];
		const router = new RouteParser(placesRoute);
		const routeParams = router.match(placesPath) || {};

		routeParams.place_id = placeId;
		// decode and re-encode the search param to make sure it's encoded properly
		routeParams.search = routeParams.search ? encodeURIComponent(decodeURIComponent(routeParams.search)) : undefined;
		return router.reverse(routeParams) || '';
	},

	createPlacesPathFromPlace(placePath) {
		placePath = placePath.split('?')[0];
		var router = new RouteParser(placeRoute);
		var routeParams = router.match(placePath) || {
		};

		if (routeParams.place_id) {
			delete routeParams.place_id;
		}

		router = new RouteParser(placesRoute);

		return router.reverse(routeParams) || '';
	},

	createPlacesPathFromRecord(recordId) {
		var router = new RouteParser(recordRoute);
		var routeParams = router.match(recordId) || {
		};

		if (routeParams.record_id) {
			delete routeParams.record_id;
		}

		router = new RouteParser(placesRoute);

		return router.reverse(routeParams) || '';
	},

	createSearchRoute(params) {
		const newParams = {...params};
		var router = new RouteParser(searchRoute);
		// const newParams = {...params};
		// on the search parameter, decode and re-encode to make sure it's encoded properly
		newParams.search = newParams.search ? encodeURIComponent(decodeURIComponent(newParams.search)) : undefined;

		return router.reverse(newParams) || '';
	},

	createParamsFromPlacesRoute(path) {
		path = path.split('?')[0];
		const router = new RouteParser(placesRoute);
		return router.match(path.replace(/\/$/, ""))
	},

	createParamsFromRecordRoute(path) {
		path = path.split('?')[0];
		const router = new RouteParser(recordRoute);
		return router.match(path.replace(/\/$/, ""))
	},

	createParamsFromSearchRoute(path) {
		path = path.split('?')[0];
		const router = new RouteParser(searchRoute);
		return router.match(path.replace(/\/$/, ""))
	},
}
