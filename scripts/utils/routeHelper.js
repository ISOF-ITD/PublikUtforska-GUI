import RouteParser from "route-parser";

/**
 * CENTRAL SCHEMA
 * Keys listed here are the "first-class" params that get their own path segments.
 * Anything NOT in this list will be packed into the existing `/filter/:filter` segment
 * as a base64url-encoded JSON payload (forward-compatible envelope).
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
 * Remove view-specific params and return a search route.
 * Handles nested ASR editor trimming.
 */
export function removeViewParamsFromRoute(path) {
  let newPath = path?.startsWith("/") ? path : `/${path || ""}`;
  [newPath] = newPath.split("?");

  // drop trailing ASR audio editor
  newPath = newPath.replace(/\/audio\/[^/]+\/transcribe\/?$/, "");

  // Try place
  const placeParams = getParser("place").match(newPath.replace(/\/$/, ""));
  if (placeParams) {
    delete placeParams.place_id;
    return createSearchRoute(placeParams);
  }
  // Try person
  const personParams = getParser("person").match(newPath.replace(/\/$/, ""));
  if (personParams) {
    delete personParams.person_id;
    return createSearchRoute(personParams);
  }
  // Try record
  const recordParams = getParser("record").match(newPath.replace(/\/$/, ""));
  if (recordParams) {
    delete recordParams.record_id;
    return createSearchRoute(recordParams);
  }

  return path;
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
