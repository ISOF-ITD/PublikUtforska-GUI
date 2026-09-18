import RouteParser from 'route-parser';
import {
  createResultSearch,
  createSearchLocation,
  parseResultSearch,
} from './routeHelper';

const LEGACY_PATH_KEYS = [
  'record_ids',
  'search',
  'search_field',
  'person',
  'place',
  'archive_id',
  'type',
  'category',
  'recordtype',
  'year_from',
  'year_to',
  'person_relation',
  'gender',
  'person_landskap',
  'person_county',
  'person_harad',
  'person_socken',
  'filter',
  'has_media',
  'has_transcribed_records',
  'transcriptionstatus',
  'page',
];
const LEGACY_OPTIONAL_PATH = LEGACY_PATH_KEYS
  .map((key) => `(/${key}/:${key})`)
  .join('');
const legacySearchRoute = new RouteParser(LEGACY_OPTIONAL_PATH);

function isNil(value) {
  return value === undefined || value === null || value === '';
}

function decodeLegacyFilter(value) {
  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    let json;
    if (typeof Buffer !== 'undefined') {
      json = Buffer.from(base64, 'base64').toString('utf8');
    } else {
      const binary = atob(base64);
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      json = new TextDecoder().decode(bytes);
    }
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function expandLegacyFilter(params) {
  if (isNil(params.filter)) return params;
  const decoded = decodeLegacyFilter(String(params.filter));
  if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) return params;
  return { ...params, ...decoded };
}

function parseLegacySearchPath(path) {
  const normalizedPath = path?.startsWith('/') ? path : `/${path || ''}`;
  const matched = legacySearchRoute.match(normalizedPath.replace(/\/$/, ''));
  if (!matched) return null;

  const query = new URLSearchParams();
  Object.entries(expandLegacyFilter(matched)).forEach(([key, value]) => {
    if (!isNil(value)) query.set(key, value);
  });
  return parseResultSearch(query.toString());
}

function getLegacyLocationParts(pathname) {
  let path = pathname || '/';
  let transcribe = false;

  if (path === '/transcribe' || path.startsWith('/transcribe/')) {
    transcribe = true;
    path = path.replace(/^\/transcribe(?=\/|$)/, '') || '/';
  }

  const audioTask = path.match(
    /^\/records\/([^/]+)\/audio\/([^/]+)\/transcribe(?:\/(.*))?$/,
  );
  if (audioTask) {
    return {
      canonicalPath: `/records/${audioTask[1]}/audio/${audioTask[2]}/transcribe`,
      legacyTail: audioTask[3] || '',
      transcribe,
    };
  }

  const transcriptionTask = path.match(
    /^\/records\/([^/]+)\/transcribe(?:\/(.*))?$/,
  );
  if (transcriptionTask) {
    return {
      canonicalPath: `/records/${transcriptionTask[1]}/transcribe`,
      legacyTail: transcriptionTask[2] || '',
      transcribe,
    };
  }

  const detailPatterns = [
    /^\/(records)\/([^/]+)(?:\/(.*))?$/,
    /^\/(places)\/([^/]+)(?:\/(.*))?$/,
    /^\/(persons)\/([^/]+)(?:\/(.*))?$/,
  ];
  const detailMatch = detailPatterns
    .map((pattern) => path.match(pattern))
    .find(Boolean);
  if (detailMatch) {
    return {
      canonicalPath: `/${detailMatch[1]}/${detailMatch[2]}`,
      legacyTail: detailMatch[3] || '',
      transcribe,
    };
  }

  const statistics = path.match(/^\/statistik(?:\/(.*))?$/);
  if (statistics) {
    return {
      canonicalPath: '/statistik',
      legacyTail: statistics[1] || '',
      transcribe,
    };
  }

  if (path === '/search') {
    return { canonicalPath: '/search', legacyTail: '', transcribe };
  }
  if (path.startsWith('/search/')) {
    return {
      canonicalPath: '/search',
      legacyTail: path,
      transcribe,
    };
  }
  if (path === '/') {
    return { canonicalPath: '/', legacyTail: '', transcribe };
  }

  const firstSegment = path.split('/').filter(Boolean)[0];
  if (LEGACY_PATH_KEYS.includes(firstSegment)) {
    return { canonicalPath: '/search', legacyTail: path, transcribe };
  }

  return null;
}

export default function canonicalizeLegacyLocation(pathname, search = '') {
  const parts = getLegacyLocationParts(pathname);
  if (!parts) return null;

  const legacyParams = parts.legacyTail
    ? parseLegacySearchPath(parts.legacyTail)
    : {};
  if (parts.legacyTail && !legacyParams) return null;

  const queryParams = parseResultSearch(search);
  const resultParams = {
    ...(legacyParams || {}),
    ...(parts.transcribe ? { transcribe: true } : {}),
    ...queryParams,
  };
  let { canonicalPath } = parts;
  const hasResultContext = Object.entries(resultParams).some(
    ([key, value]) => !isNil(value) && !(key === 'transcribe' && value === false),
  );
  if (canonicalPath === '/' && hasResultContext) {
    canonicalPath = '/search';
  }

  const existingQuery = new URLSearchParams(search);
  existingQuery.delete('s');
  const canonical = canonicalPath === '/search'
    ? createSearchLocation(resultParams, existingQuery.toString())
    : `${canonicalPath}${createResultSearch(
      resultParams,
      existingQuery.toString(),
    )}`;
  const current = `${pathname || '/'}${search || ''}`;
  return canonical === current ? null : canonical;
}
