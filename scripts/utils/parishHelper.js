export function hasMapPosition(point) {
  const location = point?.location;
  return Array.isArray(location)
    && location.length === 2
    && Number.isFinite(location[0])
    && Number.isFinite(location[1])
    && !(location[0] === 0 && location[1] === 0);
}

export function getParishIdsFromPlaces(places) {
  if (!Array.isArray(places)) return [];
  return [...new Set(places
    .map((place) => place?.id)
    .filter((id) => id !== null && id !== undefined && id !== '')
    .map(String))];
}

export function getParishMetadata(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.toLocaleLowerCase('sv') === 'ingen' ? '' : text;
}

export function getParishName(point) {
  return getParishMetadata(point.name).replace(/ sn$/, ' socken')
    || `Socken ${point.id}`;
}

export function getParishHitCount(point) {
  return typeof point.doc_count === 'number' && !Number.isNaN(point.doc_count)
    ? point.doc_count
    : 1;
}

const collator = new Intl.Collator('sv', { numeric: true, sensitivity: 'base' });

export function compareParishes(first, second, field) {
  let comparison = 0;
  if (field === 'doc_count') {
    comparison = getParishHitCount(second) - getParishHitCount(first);
  } else if (field === 'landskap') {
    const firstLandscape = getParishMetadata(first.landskap);
    const secondLandscape = getParishMetadata(second.landskap);
    comparison = Number(!firstLandscape) - Number(!secondLandscape)
      || collator.compare(firstLandscape, secondLandscape);
  }
  return comparison
    || collator.compare(getParishName(first), getParishName(second))
    || collator.compare(getParishMetadata(first.landskap), getParishMetadata(second.landskap))
    || collator.compare(String(first.id), String(second.id));
}
