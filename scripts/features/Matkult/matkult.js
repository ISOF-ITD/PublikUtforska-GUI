import {
  createResultSearch, createSearchLocation, parseResultSearch,
} from '../../utils/routeHelper';

export const MATKULT_CATEGORIES = [
  { id: 'MK-10', name: 'Kokboken' },
  { id: 'MK-6', name: 'Baljväxter' },
  { id: 'MK-3', name: 'Bröd' },
  { id: 'MK-2', name: 'Bär och frukt' },
  { id: 'MK-14', name: 'Fisk' },
  { id: 'MK-9', name: 'Grödor och spannmål' },
  { id: 'MK-5', name: 'Honung' },
  { id: 'MK-7', name: 'Kål' },
  { id: 'MK-12', name: 'Kött' },
  { id: 'MK-1', name: 'Mjölk' },
  { id: 'MK-11', name: 'Mjölrätter' },
  { id: 'MK-8', name: 'Potatis' },
  { id: 'MK-4', name: 'Öl och svagdricka' },
  { id: 'MK-13', name: 'Maten som kulturarv' },
];

// The cookbook's existing subcategories, in the order used in Matkartan.
export const MATKULT_RECIPE_CATEGORIES = [
  'MK-6', 'MK-3', 'MK-2', 'MK-5', 'MK-7', 'MK-1', 'MK-8', 'MK-4', 'MK-12',
].map((id) => MATKULT_CATEGORIES.find((item) => item.id === id));

// Editorial selection: stable source IDs, with the content read from Folkeservice.
const FEATURED_RECIPE_IDS = ['mk-kb875', 'mk-kb896', 'mk-kb888', 'mk-kb884'];

export function getDailyRecipeId(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const value = (type) => Number(parts.find((part) => part.type === type).value);
  const day = Math.floor(Date.UTC(value('year'), value('month') - 1, value('day')) / 86400000);
  return FEATURED_RECIPE_IDS[day % FEATURED_RECIPE_IDS.length];
}

export function createMatkultSearch(params = {}, search = '') {
  const query = new URLSearchParams(search);
  query.delete('k');
  if (!query.has('view')) query.set('view', 'cards');
  return createSearchLocation({
    ...parseResultSearch(search), ...params, theme: 'matkult', transcribe: undefined,
  }, query.toString());
}

export function createWholeFolkeSearch(search = '') {
  const {
    search: query, person, place, archive_id: archiveId,
  } = parseResultSearch(search);
  return createSearchLocation({
    search: query, person, place, archive_id: archiveId,
  });
}

export function matkultDetailSearch(search = '') {
  return createResultSearch({ ...parseResultSearch(search), theme: 'matkult' }, search);
}

export function getMatkultText(data) {
  const indexed = data.metadata?.find((item) => item.type === 'matkarta_content')?.value;
  return String(indexed || data.text || data.contents || '').trim();
}

export function getMatkultSourceUrl(data) {
  const value = data.metadata?.find((item) => item.type === 'sitevision_url')?.value;
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ['www.matkult.se', 'matkult.se'].includes(url.hostname)
      ? url.href : null;
  } catch {
    return null;
  }
}

export function isMatkultRecord(data) {
  return data?.materialtype === 'matkarta';
}
