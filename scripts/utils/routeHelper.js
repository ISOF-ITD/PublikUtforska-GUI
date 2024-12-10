import RouteParser from 'route-parser';

const searchRoute = '(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/recordtype/:recordtype)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/has_media/:has_media)(/has_transcribed_records/:has_transcribed_records)(/transcriptionstatus/:transcriptionstatus)(/page/:page)';
const placesRoute = '/places(/:place_id)(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/recordtype/:recordtype)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/has_media/:has_media)(/has_transcribed_records/:has_transcribed_records)(/transcriptionstatus/:transcriptionstatus)(/page/:page)';
const placeRoute = '(/transcribe)/places/:place_id(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/recordtype/:recordtype)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/has_media/:has_media)(/has_transcribed_records/:has_transcribed_records)(/transcriptionstatus/:transcriptionstatus)(/page/:page)';
const recordRoute = '(/transcribe)/records/:record_id(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/recordtype/:recordtype)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/has_media/:has_media)(/has_transcribed_records/:has_transcribed_records)(/transcriptionstatus/:transcriptionstatus)(/page/:page)';
const personRoute = '(/transcribe)/persons/:person_id(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/recordtype/:recordtype)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/has_media/:has_media)(/has_transcribed_records/:has_transcribed_records)(/transcriptionstatus/:transcriptionstatus)(/page/:page)';

// export default {
export function createPlacePathFromPlaces(placeId, placesPath) {
  const [newPlacesPath] = placesPath.split('?');
  const router = new RouteParser(placesRoute);
  const routeParams = router.match(newPlacesPath) || {};

  routeParams.place_id = placeId;
  // decode and re-encode the search param to make sure it's encoded properly
  routeParams.search = routeParams.search
    ? encodeURIComponent(decodeURIComponent(routeParams.search)) : undefined;
  return router.reverse(routeParams) || '';
}

export function createPlacesPathFromPlace(placePath) {
  let newPlacePath = placePath.startsWith('/') ? placePath : `/${placePath}`;
  [newPlacePath] = placePath.split('?');
  let router = new RouteParser(placeRoute);
  const routeParams = router.match(newPlacePath) || {
  };

  if (routeParams.place_id) {
    delete routeParams.place_id;
  }

  router = new RouteParser(placesRoute);

  return router.reverse(routeParams) || '';
}

export function createPlacePathFromPlace(placeId) {
  const router = new RouteParser(placeRoute);
  const routeParams = {
    place_id: placeId,
  };
  return router.reverse(routeParams) || '';
}

export function createPlacesPathFromRecord(recordId) {
  let router = new RouteParser(recordRoute);
  const routeParams = router.match(recordId) || {
  };

  if (routeParams.record_id) {
    delete routeParams.record_id;
  }

  router = new RouteParser(placesRoute);

  return router.reverse(routeParams) || '';
}

export function createSearchRoute(params) {
  const newParams = { ...params };
  const router = new RouteParser(searchRoute);
  // const newParams = {...params};
  // on the search parameter, decode and re-encode to make sure it's encoded properly
  newParams.search = newParams.search ? encodeURIComponent(decodeURIComponent(newParams.search)) : undefined;

  return router.reverse(newParams) || '/';
}

export function removeViewParamsFromRoute(path) {
  let newPath = path.startsWith('/') ? path : `/${path}`;
  [newPath] = newPath.split('?');
  // Handle placeview
  const placesRouter = new RouteParser(placeRoute);
  let newParams = placesRouter.match(newPath.replace(/\/$/, ''));
  if (newParams) { delete newParams.place_id; }
  // Handle personview
  const personRouter = new RouteParser(personRoute);
  newParams = personRouter.match(newPath.replace(/\/$/, ''));
  if (newParams) { delete newParams.person_id; }
  // Handle recordview
  const recordRouter = new RouteParser(recordRoute);
  newParams = recordRouter.match(newPath.replace(/\/$/, ''));
  if (newParams) { delete newParams.record_id; }

  const searchRoutePath = createSearchRoute(newParams);
  return searchRoutePath;
}

export function createParamsFromPlacesRoute(path) {
  let newPath = path.startsWith('/') ? path : `/${path}`;
  [newPath] = newPath.split('?');
  const router = new RouteParser(placesRoute);
  return router.match(newPath.replace(/\/$/, ''));
}

export function createParamsFromRecordRoute(path) {
  let newPath = path.startsWith('/') ? path : `/${path}`;
  [newPath] = newPath.split('?');
  const router = new RouteParser(recordRoute);
  return router.match(newPath.replace(/\/$/, ''));
}

export function createParamsFromSearchRoute(path) {
  let newPath = path?.startsWith('/') ? path : `/${path}`;
  [newPath] = newPath.split('?');
  const router = new RouteParser(searchRoute);
  return router.match(newPath.replace(/\/$/, ''));
}
// };

export default {
  createPlacePathFromPlaces,
  createPlacesPathFromPlace,
  createPlacePathFromPlace,
  createPlacesPathFromRecord,
  createSearchRoute,
  createParamsFromPlacesRoute,
  createParamsFromRecordRoute,
  createParamsFromSearchRoute,
};
