import RouteParser from 'route-parser';

const searchRoute = '(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/recordtype/:recordtype)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/has_media/:has_media)(/transcriptionstatus/:transcriptionstatus)';
const placesRoute = '/places(/:place_id)(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/recordtype/:recordtype)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/has_media/:has_media)(/transcriptionstatus/:transcriptionstatus)';
const placeRoute = '/places/:place_id(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/recordtype/:recordtype)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/has_media/:has_media)(/transcriptionstatus/:transcriptionstatus)';
const recordRoute = '/records/:record_id(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/recordtype/:recordtype)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/has_media/:has_media)(/transcriptionstatus/:transcriptionstatus)';

export default {
	createPlacePathFromPlaces(placeId, placesPath) {
		var router = new RouteParser(placesRoute);
		var routeParams = router.match(placesPath) || {};

		routeParams.place_id = placeId;
		router = new RouteParser(placeRoute);
		return router.reverse(routeParams) || '';
	},

	createPlacesPathFromPlace(placePath) {
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
		var router = new RouteParser(searchRoute);

		return router.reverse(params) || '';
	},

	createParamsFromPlacesRoute(path) {
		const router = new RouteParser(placesRoute);
		return router.match(path.replace(/\/$/, ""))
	},

	createParamsFromRecordRoute(path) {
		const router = new RouteParser(recordRoute);
		return router.match(path.replace(/\/$/, ""))
	},

	createParamsFromSearchRoute(path) {
		const router = new RouteParser(searchRoute);
		return router.match(path.replace(/\/$/, ""))
	},
}
