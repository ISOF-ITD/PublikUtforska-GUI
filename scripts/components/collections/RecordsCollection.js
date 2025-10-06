import "whatwg-fetch";
import config from "../../config";

export default class RecordsCollection {
  /**
   * @param {(json: any) => void} onComplete
   * @param {(err: Error) => void} [onError]
   */
  constructor(onComplete, onError) {
    this.url = `${config.apiUrl}documents/`;
    this.onComplete = onComplete;
    this.onError = onError;
    this._controller = null;
    this._requestId = 0; // guards out-of-order responses
  }

  fetch(params = {}) {
    // cancel any in-flight request to avoid races
    this.abort();

    const requestId = ++this._requestId;
    this._controller = new AbortController();

    const qs = buildQueryString(params, config.requiredParams);
    const url = `${this.url}?${qs}`;

    return fetch(url, { signal: this._controller.signal })
      .then((res) => {
        if (!res.ok) {
          const err = new Error(`HTTP ${res.status} ${res.statusText}`);
          err.status = res.status;
          throw err;
        }
        return res.json();
      })
      .then((json) => {
        // Only commit if this is still the newest request
        if (requestId === this._requestId && this.onComplete) {
          this.onComplete(json);
        }
      })
      .catch((err) => {
        // Swallow aborts, report real errors
        if (err?.name === "AbortError") return;
        console.error("RecordsCollection.fetch failed", err);
        if (this.onError) this.onError(err);
      });
  }

  abort() {
    if (this._controller) {
      this._controller.abort();
      this._controller = null;
    }
  }
}

function buildQueryString(inputParams = {}, requiredParams = {}) {
  const params = { ...inputParams };

  // 1) Special case: record_ids uses ?documents=...
  if (params.record_ids) {
    return `documents=${params.record_ids}`;
  }

  // 2) Remove null/undefined values first
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined)
  );

  // 3) Merge global required params
  const queryParams = { ...requiredParams, ...cleaned };

  // 4) Map search_field to ES Django API
  if (queryParams.search) {
    if (queryParams.search_field === "person") {
      queryParams.person = queryParams.search;
      delete queryParams.search;
    }
    if (queryParams.search_field === "place") {
      queryParams.place = queryParams.search;
      delete queryParams.search;
    }
    delete queryParams.search_field;
  }

  // 5) Build query string
  const parts = [];
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value) {
      // If caller already encoded (search), we do NOT re-encode to avoid double-encoding.
      parts.push(`${key}=${value}`);
    }
  });

  return parts.join("&");
}
