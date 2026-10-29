import config from '../config';

export function isMatkultLocation(location) {
  return location.pathname === '/matkult'
    || new URLSearchParams(location.search).get('theme') === 'matkult';
}

// Choose defaults before merging user filters. In particular, media and accession
// defaults from Folke must not exclude Matkartan's text-only one_record posts.
export function buildCollectionApiParams(params = {}) {
  const { theme, ...input } = params;
  const filters = Object.fromEntries(Object.entries(input).filter(([, value]) => (
    value !== undefined && value !== null
  )));
  if (filters.record_ids) {
    return {
      publishstatus: 'published',
      record_ids: filters.record_ids,
    };
  }

  const defaults = { ...config.requiredParams };
  if (theme === 'matkult') {
    delete defaults.categorytypes;
    delete defaults.recordtype;
    delete defaults.has_media;
    delete defaults.transcriptionstatus;
    defaults.mark_metadata = 'sitevision_url,matkarta_edited';
  }

  return {
    ...defaults,
    ...filters,
    ...(theme === 'matkult' ? {
      type: 'matkarta',
      publishstatus: 'published',
      ...(String(filters.category || '').includes(',') ? { category_match: 'all' } : {}),
    } : {}),
  };
}

export function validateCollectionResponse(data, params) {
  if (buildCollectionApiParams(params).category_match === 'all'
    && data?.metadata?.category_match !== 'all') {
    const error = new Error('Det går inte att avgränsa receptkategorin just nu. Välj Alla recept eller försök igen senare.');
    error.code = 'CATEGORY_MATCH_UNSUPPORTED';
    throw error;
  }
  return data;
}
