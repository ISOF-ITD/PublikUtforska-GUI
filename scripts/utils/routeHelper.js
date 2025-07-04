import RouteParser from 'route-parser';

const searchRoute = '(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/recordtype/:recordtype)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/has_media/:has_media)(/has_transcribed_records/:has_transcribed_records)(/transcriptionstatus/:transcriptionstatus)(/page/:page)';
const placesRoute = '/places(/:place_id)(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/recordtype/:recordtype)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/has_media/:has_media)(/has_transcribed_records/:has_transcribed_records)(/transcriptionstatus/:transcriptionstatus)(/page/:page)';
const placeRoute = '(/transcribe)/places/:place_id(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/recordtype/:recordtype)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/has_media/:has_media)(/has_transcribed_records/:has_transcribed_records)(/transcriptionstatus/:transcriptionstatus)(/page/:page)';
const recordRoute = '(/transcribe)/records/:record_id(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/recordtype/:recordtype)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/has_media/:has_media)(/has_transcribed_records/:has_transcribed_records)(/transcriptionstatus/:transcriptionstatus)(/page/:page)';
const personRoute = '(/transcribe)/persons/:person_id(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/recordtype/:recordtype)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/has_media/:has_media)(/has_transcribed_records/:has_transcribed_records)(/transcriptionstatus/:transcriptionstatus)(/page/:page)';

export function createPlacePathFromPlaces(placeId, placesPath) {
  const [newPlacesPath] = placesPath.split('?');
  const router = new RouteParser(placesRoute);
  const routeParams = router.match(newPlacesPath) || {};

  routeParams.place_id = placeId;
  // decode and re-encode the search param to make sure it's encoded properly
  routeParams.search = routeParams.search
    ? routeParams.search : undefined;
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
  const router = new RouteParser(searchRoute);

  // shallow-copy så vi inte muterar original-objektet
  const newParams = { ...params };
  newParams.search = newParams.search ? newParams.search : undefined;

  try {
    const url = router.reverse(newParams);
    return url || '/'; // fallback om router.reverse() ger null
  } catch (err) {
    /*  👇  Logga och låt appen leva vidare  */
    console.error('[routeHelper] Kunde inte bygga search-route', {
      message: err.message,
      params: newParams,
    });

    return '/'; // sista utvägen – skicka hem användaren
  }
}

export function removeViewParamsFromRoute(path) {
  let newPath = path.startsWith('/') ? path : `/${path}`;
  [newPath] = newPath.split('?');

  /* If we’re inside the nested ASR editor “…/records/:id/audio/:source/transcribe”
   * we have to cut that part away **before** the normal place / record / person logic starts.
   */
  newPath = newPath.replace(/\/audio\/[^/]+\/transcribe\/?$/, '');

  // Handle placeview
  const placesRouter = new RouteParser(placeRoute);
  let newParams = placesRouter.match(newPath.replace(/\/$/, ''));
  if (newParams) {
    delete newParams.place_id;
    const searchRoutePath = createSearchRoute(newParams);
    return searchRoutePath;
  }
  // Handle personview
  const personRouter = new RouteParser(personRoute);
  newParams = personRouter.match(newPath.replace(/\/$/, ''));
  if (newParams) {
    delete newParams.person_id;
    const searchRoutePath = createSearchRoute(newParams);
    return searchRoutePath;
  }
  // Handle recordview
  const recordRouter = new RouteParser(recordRoute);
  newParams = recordRouter.match(newPath.replace(/\/$/, ''));
  if (newParams) {
    delete newParams.record_id;
    const searchRoutePath = createSearchRoute(newParams);
    return searchRoutePath;
  }
  return path;
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
  // router.match() is null when the path doesn’t fit the search-route pattern
  return router.match(newPath.replace(/\/$/, '')) || {};
}


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
