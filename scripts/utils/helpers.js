import _ from 'underscore';
import config from '../config';

export function pageFromTo({ _source: { archive: { page, total_pages: totalPages } } }) {
  let text = `${page}`;
  if (totalPages > 1) {
    const toPage = parseInt(page, 10) + (totalPages - 1);
    text += `-${toPage}`;
  }
  return text;
}

export function getTitle(title, contents) {
  switch (!!title) {
    case true:
      return title;
    default:
      if (contents) {
        if (contents.length > 300) {
          return `[${contents.substring(0, 284)} ${'(FÖRKORTAD TITEL)'}]`;
        }
        return `[${contents}]`;
      }
      return null;
  }
}

// Funktion för att splitta en sträng i två delar. e.g. "ifgh00010" blir "IFGH 10"
// OBS: kan inte hantera strängar som avviker fån mönstret "bokstäver + siffror"
export function makeArchiveIdHumanReadable(str) {
  // Matcha första delen av strängen som inte är en siffra (bokstäver)
  // och andra delen som är en siffra (0 eller flera siffror)
  const [letterPart, numberPart = ''] = str.match(/^(\D*)(\d+)?/).slice(1);

  // Stora bokstäver för den första delen och ta bort alla nollor i början av den andra delen
  const parts = [
    letterPart.toUpperCase(),
    numberPart.replace(/^0+/, ''),
  ];

  // Returnera en sträng med båda delarna separerade med ett mellanslag
  return parts.join(' ');
}

// används inte i nuläget, istället används getRecordsCountLocation
// i loaders på routen
export function getRecordsFetchLocation(params = {}) {
  const url = `${config.apiUrl}documents/`;
  const paramStrings = [];
  if (params.record_ids) { // Hämtar bara vissa sägner
    paramStrings.push(`documents=${params.record_ids}`);
  } else {
    const queryParams = _.defaults(params, config.requiredParams);

    // Anpassa params till ES Djangi api
    if (queryParams.search) {
      if (queryParams.search_field === 'person') {
        queryParams.person = queryParams.search;
        delete queryParams.search;
      }
      if (queryParams.search_field === 'place') {
        queryParams.place = queryParams.search;
        delete queryParams.search;
      }
      delete queryParams.search_field;
    }

    Object.keys(queryParams).forEach((key) => {
      if (queryParams[key]) {
        paramStrings.push(`${key}=${queryParams[key]}`);
      }
    });
  }

  const paramString = paramStrings.join('&');

  return `${url}?${paramString}`;
}

export function getRecordsCountLocation(params = {}) {
  const url = `${config.apiUrl}count/`;
  const paramStrings = [];
  if (params.record_ids) { // Hämtar bara vissa sägner
    paramStrings.push(`documents=${params.record_ids}`);
  } else {
    const queryParams = _.defaults(params, config.requiredParams);

    // Anpassa params till ES Djangi api
    if (queryParams.search) {
      if (queryParams.search_field === 'person') {
        queryParams.person = queryParams.search;
        delete queryParams.search;
      }
      if (queryParams.search_field === 'place') {
        queryParams.place = queryParams.search;
        delete queryParams.search;
      }
      delete queryParams.search_field;
      queryParams.search = queryParams.search ? encodeURIComponent(queryParams.search) : undefined;
    }

    Object.keys(queryParams).forEach((key) => {
      if (queryParams[key]) {
        paramStrings.push(`${key}=${queryParams[key]}`);
      }
    });
  }

    const paramString = paramStrings.join('&');

    return `${url}?${paramString}`;
}

export function getRecordFetchLocation(recordId) {
  return `${config.apiUrl}document/${recordId}/`;
}

export function getPersonFetchLocation(personId) {
  return `${config.restApiUrl}persons/${personId}/`;
}

export function getMapFetchLocation(params = {}) {
  const url = `${config.apiUrl}socken/`;
  const paramStrings = [];

  if (params.record_ids) { // Hämtar bara platser för vissa sägner
    paramStrings.push(`documents=${params.record_ids}`);
  } else {
    const newParams = _.defaults(cleanParams(params), config.requiredParams);
    // console.log(params);

    // Anpassa params till ES Djangi api
    if (newParams.search) {
      if (newParams.search_field === 'person') {
        newParams.person = newParams.search;
        delete newParams.search;
      }
      if (newParams.search_field === 'place') {
        newParams.place = newParams.search;
        delete newParams.search;
      }
      delete newParams.search_field;
      newParams.search = newParams.search ? encodeURIComponent(newParams.search) : undefined;
    }

    Object.keys(newParams).forEach((key) => {
      paramStrings.push(`${key}=${newParams[key]}`);
    });
  }

  const paramString = paramStrings.join('&');

  return `${url}?${paramString}`;
}

export function getPlaceFetchLocation(placeId) {
  return `${config.restApiUrl}locations/${placeId}`;
}

function cleanParams(params) {
  // Remove empty values
  const validEntries = Object
    .entries(params)
    .filter(([key, value]) => key && value !== null && value !== undefined);
  const validParams = Object.fromEntries(validEntries);
  return validParams;
}
