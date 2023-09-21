import 'whatwg-fetch';

import config from '../../config';

export default class RecordsCollection {
  constructor(onComplete) {
    this.url = `${config.apiUrl}documents/`;
    this.onComplete = onComplete;
  }

  fetch(params) {
    const paramStrings = [];

    if (params.record_ids) { // Hämtar bara vissa sägner
      paramStrings.push(`documents=${params.record_ids}`);
    } else {
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== null && value !== undefined),
      );
      const queryParams = { ...config.requiredParams, ...filteredParams };

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

      Object.entries(queryParams).forEach(([key, value]) => {
        if (value) {
          paramStrings.push(`${key}=${value}`);
        }
      });
    }

    const paramString = paramStrings.join('&');

    fetch(`${this.url}?${paramString}`)
      .then((response) => response.json())
      .then((json) => {
        if (this.onComplete) {
          this.onComplete(json);
        }
      })
      .catch((ex) => {
        console.log('parsing failed', ex);
      });
  }
}
