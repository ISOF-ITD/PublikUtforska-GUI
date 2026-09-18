const RESULT_PARAM_SCHEMA = [
  { key: 'record_ids', type: 'csv' },
  { key: 'search', urlKey: 'q' },
  { key: 'search_field' },
  { key: 'person' },
  { key: 'place' },
  { key: 'archive_id' },
  { key: 'type' },
  { key: 'category', type: 'csv' },
  { key: 'recordtype' },
  { key: 'year_from', type: 'int' },
  { key: 'year_to', type: 'int' },
  { key: 'person_relation' },
  { key: 'gender' },
  { key: 'person_landskap' },
  { key: 'person_county' },
  { key: 'person_harad' },
  { key: 'person_socken' },
  { key: 'filter' },
  { key: 'has_media', type: 'bool' },
  { key: 'has_transcribed_records', type: 'bool' },
  { key: 'transcriptionstatus', type: 'csv' },
  { key: 'transcribe', type: 'bool' },
];

const RESULT_URL_KEYS = RESULT_PARAM_SCHEMA.map(({ key, urlKey = key }) => urlKey);
const DEPRECATED_QUERY_KEYS = ['search', 'showlist', 'page', 'nordic'];

function isNil(value) {
  return value === undefined || value === null || value === '';
}

function normalizeLegacySelection(params = {}) {
  const out = { ...params };
  const { search_field: searchField, search } = out;
  const selectionFields = ['person', 'place', 'archive_id'];

  if (selectionFields.includes(searchField)) {
    if (!isNil(search) && isNil(out[searchField])) {
      out[searchField] = search;
      delete out.search;
    }
    delete out.search_field;
  }

  return out;
}

function parseParamValue(type, value) {
  if (isNil(value)) return undefined;

  if (type === 'csv') {
    return String(value) || undefined;
  }
  if (type === 'bool') {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  }
  if (type === 'int') {
    if (typeof value === 'number') {
      return Number.isSafeInteger(value) ? value : undefined;
    }
    if (!/^-?\d+$/.test(String(value))) return undefined;
    const number = Number(value);
    return Number.isSafeInteger(number) ? number : undefined;
  }
  return String(value);
}

function serializeParamValue(type, value) {
  if (isNil(value)) return undefined;

  if (type === 'csv') {
    if (Array.isArray(value)) return value.length ? value.join(',') : undefined;
    return String(value) || undefined;
  }
  if (type === 'bool') {
    const parsed = parseParamValue(type, value);
    return parsed === undefined ? undefined : String(parsed);
  }
  if (type === 'int') {
    const parsed = parseParamValue(type, value);
    return parsed === undefined ? undefined : String(parsed);
  }
  return String(value);
}

export function parseResultSearch(search = '') {
  const query = new URLSearchParams(search);
  const params = {};

  RESULT_PARAM_SCHEMA.forEach(({ key, urlKey = key, type }) => {
    let value = query.get(urlKey);
    if (key === 'search' && isNil(value)) value = query.get('search');
    const normalized = parseParamValue(type, value);
    if (!isNil(normalized)) params[key] = normalized;
  });

  return normalizeLegacySelection(params);
}

export function createResultSearch(params = {}, existingSearch = '') {
  const query = new URLSearchParams(existingSearch);
  [...RESULT_URL_KEYS, ...DEPRECATED_QUERY_KEYS].forEach((key) => query.delete(key));

  const normalizedParams = normalizeLegacySelection(params);
  RESULT_PARAM_SCHEMA.forEach(({ key, urlKey = key, type }) => {
    const value = serializeParamValue(type, normalizedParams[key]);
    const isDefaultValue = key === 'transcribe' && value !== 'true';
    if (!isNil(value) && !isDefaultValue) {
      query.set(urlKey, value);
    }
  });

  const result = query.toString();
  return result ? `?${result}` : '';
}

export function createSearchLocation(params = {}, existingSearch = '') {
  const resultParams = {
    ...parseResultSearch(existingSearch),
    ...params,
  };
  const existingQuery = new URLSearchParams(existingSearch);
  existingQuery.delete('s');
  const query = new URLSearchParams(
    createResultSearch(resultParams, existingQuery.toString()),
  );
  const trackingSearch = resultParams.search;

  if (trackingSearch) query.set('s', trackingSearch);
  else query.delete('s');

  const resultSearch = query.toString();
  return `/search${resultSearch ? `?${resultSearch}` : ''}`;
}

export function hasResultSearchContext(search = '') {
  return Object.entries(parseResultSearch(search)).some(
    ([key, value]) => !isNil(value) && !(key === 'transcribe' && value === false),
  );
}

export function getResultSearchSignature(search = '') {
  return createResultSearch(parseResultSearch(search));
}

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

function createPersistentSearchParams(search = '') {
  const query = new URLSearchParams(
    createResultSearch(parseResultSearch(search), search),
  );
  query.delete('media');
  query.delete('s');
  query.delete('showlist');
  return query;
}

export function createResultLocation(search = '') {
  const query = createPersistentSearchParams(search);
  const resultSearch = query.toString();
  const hasContext = hasResultSearchContext(`?${resultSearch}`)
    || query.has('showmap');
  const resultPath = hasContext ? '/search' : '/';
  return `${resultPath}${resultSearch ? `?${resultSearch}` : ''}`;
}

export function createStatisticsLocation(search = '') {
  const resultSearch = createPersistentSearchParams(search).toString();
  return `/statistik${resultSearch ? `?${resultSearch}` : ''}`;
}

export function createDetailLocation({ resource, id, search = '' }) {
  const resultSearch = createPersistentSearchParams(search).toString();
  return `/${resource}/${encodeURIComponent(id)}${
    resultSearch ? `?${resultSearch}` : ''
  }`;
}

export function createRecordTaskLocation({
  recordId,
  taskPath,
  search = '',
  media = null,
}) {
  const query = createPersistentSearchParams(search);

  if (!isNil(media)) query.set('media', String(media));
  else query.delete('media');

  const resultSearch = query.toString();
  return `/records/${encodeURIComponent(recordId)}/${
    taskPath.replace(/^\/+|\/+$/g, '')
  }${resultSearch ? `?${resultSearch}` : ''}`;
}
