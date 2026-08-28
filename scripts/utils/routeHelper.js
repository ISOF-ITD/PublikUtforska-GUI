import RouteParser from "route-parser";

/**
 * CENTRAL SCHEMA
 * Keys listed here are the "first-class" params that get their own path segments.
 * Anything NOT in this list will be packed into the existing `/filter/:filter` segment
 * as a base64url-encoded JSON payload (forward-compatible envelope).
 * route-parser: https://www.npmjs.com/package/route-parser
 * the utility has not been updated for over 10 years but it works for the functionality that we have now,
 * so we keep it for now
 */
const SCHEMA = {
  // order matters for reverse() determinism
  keys: [
    "record_ids",
    "search",
    "search_field",
    "type",
    "category",
    "recordtype",
    "year_from",
    "year_to",
    "person_relation",
    "gender",
    "person_landskap",
    "person_county",
    "person_harad",
    "person_socken",
    "filter", // reserved: also holds the "advanced" envelope
    "has_media",
    "has_transcribed_records",
    "transcriptionstatus",
    "page",
  ],

  // per-key transforms & defaults
  transforms: {
    // normalize arrays -comma-joined strings, booleans, - 'true'/'false'
    record_ids: { type: "csv" },
    category: { type: "csv" },
    transcriptionstatus: { type: "csv" },
    has_media: { type: "bool" },
    has_transcribed_records: { type: "bool" },
    year_from: { type: "int" },
    year_to: { type: "int" },
    page: { type: "int" },
  },
};

// helpers

const b64url = {
  encode(obj) {
    try {
      const json = JSON.stringify(obj);
      let b64;
      if (typeof Buffer !== "undefined") {
        b64 = Buffer.from(json, "utf8").toString("base64");
      } else {
        const bytes = new TextEncoder().encode(json);
        b64 = btoa(String.fromCharCode(...bytes));
      }
      return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    } catch {
      return null;
    }
  },
  decode(str) {
    try {
      const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
      let json;
      if (typeof Buffer !== "undefined") {
        json = Buffer.from(b64, "base64").toString("utf8");
      } else {
        const bin = atob(b64);
        const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
        json = new TextDecoder().decode(bytes);
      }
      return JSON.parse(json);
    } catch {
      return null;
    }
  },
};

function isNil(x) {
  return x === undefined || x === null || x === "";
}

function toStringValue(key, val) {
  if (isNil(val)) return undefined;

  const t = SCHEMA.transforms[key]?.type;

  if (t === "csv") {
    if (Array.isArray(val)) return val.length ? val.join(",") : undefined; // omit when empty
    const s = String(val);
    return s ? s : undefined;
  }

  if (t === "bool") {
    if (typeof val === "boolean") return val ? "true" : "false";
    if (val === "true" || val === "false") return val;
    return String(!!val);
  }
  if (t === "int") {
    const n = parseInt(val, 10);
    return Number.isFinite(n) ? String(n) : undefined;
  }

  return String(val);
}

function fromStringValue(key, val) {
  if (isNil(val)) return undefined;

  const t = SCHEMA.transforms[key]?.type;

  if (t === "csv") {
    return String(val);
  }
  if (t === "bool") {
    return String(val);
  }
  if (t === "int") {
    return String(val);
  }

  return String(val);
}

// Build the long "(/key/:key)" chain from SCHEMA.
function optionalSegments(keys) {
  return keys.map((k) => `(/${k}/:${k})`).join("");
}

// Single source of truth for patterns
const OPTIONAL = optionalSegments(SCHEMA.keys);

const routes = {
  search: OPTIONAL,
  places: `/places(/:place_id)${OPTIONAL}`,
  place: `(/transcribe)/places/:place_id${OPTIONAL}`,
  record: `(/transcribe)/records/:record_id${OPTIONAL}`,
  person: `(/transcribe)/persons/:person_id${OPTIONAL}`,
};

// Utility to create a parser per route type
function getParser(name) {
  return new RouteParser(routes[name]);
}

// Split params into first-class (schema) vs extra (advanced envelope)
function splitParams(allParams = {}) {
  const known = {};
  const extra = {};

  Object.entries(allParams).forEach(([k, v]) => {
    if (SCHEMA.keys.includes(k)) {
      known[k] = v;
    } else if (!isNil(v)) {
      extra[k] = v;
    }
  });

  return { known, extra };
}

// builder (opt-in via params._advanced)
function applyAdvancedEnvelopeForBuild(known, extra, optIn) {
  const { _advanced, ...payload } = extra || {};
  if (!optIn || Object.keys(payload).length === 0) return known;
  const encoded = b64url.encode(payload);
  const out = { ...known };
  if (!isNil(encoded)) out.filter = encoded;
  return out;
}

// parser
function extractAdvancedEnvelopeFromParse(parsed = {}) {
  const out = { ...parsed };
  const advanced = {};
  if (!isNil(parsed.filter)) {
    const decoded = b64url.decode(String(parsed.filter));
    if (decoded && typeof decoded === "object")
      Object.assign(advanced, decoded);
  }
  // Don’t merge to top level for compat:
  if (Object.keys(advanced).length) out._advanced = advanced;
  return { params: out, advanced };
}

// --- public API ---------------------------------------

// Routes -> paths

export function createPlacePathFromPlaces(placeId, placesPath) {
  const [newPlacesPath] = (placesPath || "").split("?");
  const router = getParser("places");
  const routeParams = router.match(newPlacesPath) || {};
  routeParams.place_id = placeId;
  routeParams.search = routeParams.search ? routeParams.search : undefined;
  return router.reverse(routeParams) || "";
}

export function createPlacesPathFromPlace(placePath) {
  let newPlacePath = placePath?.startsWith("/")
    ? placePath
    : `/${placePath || ""}`;
  [newPlacePath] = newPlacePath.split("?");

  let router = getParser("place");
  const routeParams = router.match(newPlacePath) || {};

  if (routeParams.place_id) delete routeParams.place_id;

  router = getParser("places");
  return router.reverse(routeParams) || "";
}

export function createPlacePathFromPlace(placeId) {
  const router = getParser("place");
  return router.reverse({ place_id: placeId }) || "";
}

export function createPlacesPathFromRecord(recordArg) {
  const arg = String(recordArg || "");
  const head = arg.split("?")[0];
  const recordPath = head.includes("/") ? head : `/records/${head}`;
  let router = getParser("record");
  const routeParams = router.match(recordPath) || {};
  if (routeParams.record_id) delete routeParams.record_id;
  router = getParser("places");
  return router.reverse(routeParams) || "";
}

// Build a search segment string from params.
export function createSearchRoute(params) {
  const router = getParser("search");

  const raw = { ...(params || {}) };
  // normalize + stringify per schema
  const normalized = Object.fromEntries(
    SCHEMA.keys.map((k) => [k, toStringValue(k, raw[k])])
  );

  const { known, extra } = splitParams({ ...raw, ...normalized });
  const routeParams = applyAdvancedEnvelopeForBuild(
    known,
    extra,
    !!raw._advanced
  );

  try {
    const url = router.reverse(routeParams);
    return url || "/";
  } catch (err) {
    console.error("[routeHelper] Could not build search-route", {
      message: err.message,
      params: routeParams,
    });
    return "/";
  }
}

/**
 * Merge query parameters into a route without losing an existing query or hash.
 * Parameters from `search` replace parameters with the same name in `path`.
 */
export function mergeRouteSearch(path, search = '') {
  if (!search) return path;

  const hashIndex = path.indexOf('#');
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : '';
  const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const queryIndex = pathWithoutHash.indexOf('?');
  const pathname = queryIndex >= 0
    ? pathWithoutHash.slice(0, queryIndex)
    : pathWithoutHash;
  const existingSearch = queryIndex >= 0
    ? pathWithoutHash.slice(queryIndex + 1)
    : '';
  const mergedParams = new URLSearchParams(existingSearch);

  new URLSearchParams(search).forEach((value, key) => {
    mergedParams.set(key, value);
  });

  const query = mergedParams.toString();
  return `${pathname}${query ? `?${query}` : ''}${hash}`;
}

/**
 * Return the persistent search surface represented by a detail/task route.
 * Detail-only media state is discarded while list and starred-result context
 * remain shareable through the query string.
 */
export function createResultLocation(pathname, search = '') {
  const pathSegments = String(pathname || '/')
    .split('/')
    .filter(Boolean);
  const hasTranscribePrefix = pathSegments[0] === 'transcribe';
  const segments = hasTranscribePrefix ? pathSegments.slice(1) : pathSegments;
  let contextSegments = segments;

  if (segments[0] === 'statistik') {
    contextSegments = segments.slice(1);
  } else if (['places', 'persons'].includes(segments[0]) && segments[1]) {
    contextSegments = segments.slice(2);
  } else if (segments[0] === 'records' && segments[1]) {
    const recordSegments = segments.slice(2);
    if (
      recordSegments[0] === 'audio'
      && recordSegments[1]
      && recordSegments[2] === 'transcribe'
    ) {
      contextSegments = recordSegments.slice(3);
    } else if (recordSegments[0] === 'transcribe') {
      contextSegments = recordSegments.slice(1);
    } else {
      contextSegments = recordSegments;
    }
  }

  const prefix = hasTranscribePrefix ? '/transcribe' : '';
  const resultPath = contextSegments.length
    ? `${prefix}/${contextSegments.join('/')}`
    : `${prefix}/`;
  const queryParams = new URLSearchParams(search);
  queryParams.delete('media');
  const query = queryParams.toString();

  return `${resultPath}${query ? `?${query}` : ''}`;
}

/**
 * Build the statistics page URL while retaining the current search context.
 */
export function createStatisticsLocation(pathname, search = '') {
  const resultLocation = createResultLocation(pathname, search);
  const queryIndex = resultLocation.indexOf('?');
  const resultPath = queryIndex >= 0
    ? resultLocation.slice(0, queryIndex)
    : resultLocation;
  const resultQuery = new URLSearchParams(
    queryIndex >= 0 ? resultLocation.slice(queryIndex + 1) : '',
  );
  resultQuery.delete('showlist');
  const resultSearch = resultQuery.toString();
  const hasTranscribePrefix = resultPath === '/transcribe/'
    || resultPath.startsWith('/transcribe/');
  const prefix = hasTranscribePrefix ? '/transcribe' : '';
  const searchContext = resultPath
    .replace(/^\/transcribe(?=\/|$)/, '')
    .replace(/^\/+|\/+$/g, '');

  return `${prefix}/statistik${searchContext ? `/${searchContext}` : ''}${
    resultSearch ? `?${resultSearch}` : ''
  }`;
}

/**
 * Build a detail URL while retaining the current result route and query.
 */
export function createDetailLocation({
  resource,
  id,
  pathname,
  search = '',
}) {
  const resultLocation = createResultLocation(pathname, search);
  const queryIndex = resultLocation.indexOf('?');
  const resultPath = queryIndex >= 0
    ? resultLocation.slice(0, queryIndex)
    : resultLocation;
  const resultSearch = queryIndex >= 0
    ? resultLocation.slice(queryIndex + 1)
    : '';
  const hasTranscribePrefix = resultPath === '/transcribe/'
    || resultPath.startsWith('/transcribe/');
  const prefix = hasTranscribePrefix ? '/transcribe' : '';
  const searchContext = resultPath
    .replace(/^\/transcribe(?=\/|$)/, '')
    .replace(/^\/+|\/+$/g, '');
  const detailPath = `${prefix}/${resource}/${encodeURIComponent(id)}${
    searchContext ? `/${searchContext}` : ''
  }`;

  return `${detailPath}${resultSearch ? `?${resultSearch}` : ''}`;
}

/**
 * Build a record task URL while retaining the current result route and query.
 */
export function createRecordTaskLocation({
  recordId,
  taskPath,
  pathname,
  search = '',
  media = null,
}) {
  const resultLocation = createResultLocation(pathname, search);
  const queryIndex = resultLocation.indexOf('?');
  const resultPath = queryIndex >= 0
    ? resultLocation.slice(0, queryIndex)
    : resultLocation;
  const resultSearch = queryIndex >= 0
    ? resultLocation.slice(queryIndex + 1)
    : '';
  const hasTranscribePrefix = resultPath === '/transcribe/'
    || resultPath.startsWith('/transcribe/');
  const prefix = hasTranscribePrefix ? '/transcribe' : '';
  const searchContext = resultPath
    .replace(/^\/transcribe(?=\/|$)/, '')
    .replace(/^\/+|\/+$/g, '');
  const taskLocation = `${prefix}/records/${encodeURIComponent(recordId)}/${
    taskPath.replace(/^\/+|\/+$/g, '')
  }${searchContext ? `/${searchContext}` : ''}`;
  const queryParams = new URLSearchParams(resultSearch);

  if (media !== null && media !== undefined && media !== '') {
    queryParams.set('media', String(media));
  } else {
    queryParams.delete('media');
  }

  const query = queryParams.toString();
  return `${taskLocation}${query ? `?${query}` : ''}`;
}

/**
 * Remove view-specific params and return a search route.
 * Handles nested ASR editor trimming.
 */
export function removeViewParamsFromRoute(path) {
  const normalizedPath = path?.startsWith('/') ? path : `/${path || ''}`;
  const resultLocation = createResultLocation(normalizedPath);
  const [resultPath] = resultLocation.split('?');
  return resultPath.replace(/^\/transcribe(?=\/|$)/, '') || '/';
}

// Paths -> params

export function createParamsFromPlacesRoute(path) {
  let newPath = path?.startsWith("/") ? path : `/${path || ""}`;
  [newPath] = newPath.split("?");
  const router = getParser("places");
  const matched = router.match(newPath.replace(/\/$/, ""));
  if (!matched) return null;
  // coerce types & expand advanced filter payload
  const typed = Object.fromEntries(
    Object.entries(matched).map(([k, v]) => [k, fromStringValue(k, v)])
  );
  const { params } = extractAdvancedEnvelopeFromParse(typed);
  return params;
}

export function createParamsFromRecordRoute(path) {
  let newPath = path?.startsWith("/") ? path : `/${path || ""}`;
  [newPath] = newPath.split("?");
  const router = getParser("record");
  const matched = router.match(newPath.replace(/\/$/, ""));
  if (!matched) return null;
  const typed = Object.fromEntries(
    Object.entries(matched).map(([k, v]) => [k, fromStringValue(k, v)])
  );
  const { params } = extractAdvancedEnvelopeFromParse(typed);
  return params;
}

export function createParamsFromSearchRoute(path) {
  let newPath = path?.startsWith("/") ? path : `/${path || ""}`;
  [newPath] = newPath.split("?");
  const router = getParser("search");

  const matched = router.match(newPath.replace(/\/$/, "")) || {};
  const typed = Object.fromEntries(
    Object.entries(matched).map(([k, v]) => [k, fromStringValue(k, v)])
  );

  const { params } = extractAdvancedEnvelopeFromParse(typed);
  // Ensure we always return an object (compat)
  return params || {};
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
