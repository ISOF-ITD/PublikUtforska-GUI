import "whatwg-fetch";
import config from "../../../config";

/**
 * Small wrapper around the documents endpoint.
 * - cancels in-flight requests
 * - guards against out-of-order responses
 * - builds a properly encoded query string
 */
export default class RecordsApiClient {
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

  /**
   * Fire a documents request.
   * Previous in-flight request is aborted.
   */
  async fetch(params = {}) {
    // cancel any in-flight request to avoid races
    this.abort();

    const requestId = ++this._requestId;
    this._controller = new AbortController();

    const qs = buildQueryString(params, config.requiredParams);
    const url = qs ? `${this.url}?${qs}` : this.url;

    try {
      const res = await fetch(url, { signal: this._controller.signal });

      if (!res.ok) {
        const err = new Error(`HTTP ${res.status} ${res.statusText}`);
        err.status = res.status;
        throw err;
      }

      const json = await res.json();

      // Only commit if this is still the newest request
      if (
        requestId === this._requestId &&
        typeof this.onComplete === "function"
      ) {
        this.onComplete(json);
      }

      return json;
    } catch (err) {
      // Swallow aborts, report real errors
      if (err?.name === "AbortError") return;

      console.error("RecordsApiClient.fetch failed", err);
      if (typeof this.onError === "function") {
        this.onError(err);
      }
      // Keep behaviour similar to old version: don't rethrow.
      return;
    }
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

  // --- Special case: record_ids uses ?documents=... ---
  if (params.record_ids != null && params.record_ids !== "") {
    const searchParams = new URLSearchParams();

    // If for some reason required params must be omitted here,
    // you can remove this block.
    Object.entries(requiredParams || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        searchParams.set(String(key), String(value));
      }
    });

    const ids = Array.isArray(params.record_ids)
      ? params.record_ids.join(",")
      : params.record_ids;

    searchParams.set("documents", String(ids));
    return searchParams.toString();
  }

  // --- Merge required + cleaned params (no null/undefined) ---
  const merged = { ...requiredParams };

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    merged[key] = value;
  });

  // --- Map search_field to ES Django API ---
  if (merged.search != null && merged.search !== "") {
    const value = merged.search;

    switch (merged.search_field) {
      case "person":
        merged.person = value;
        delete merged.search; // we’ve moved it to person
        break;

      case "place":
        merged.place = value;
        delete merged.search; // we’ve moved it to place
        break;

      default:
        // For “any”, “text”, or unknown search_field:
        // keep merged.search so the backend can do a normal full-text search
        break;
    }

    delete merged.search_field;
  }

  // --- Build encoded query string ---
  const searchParams = new URLSearchParams();

  Object.entries(merged).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      // arrays → comma-separated
      searchParams.set(key, value.join(","));
    } else if (typeof value === "boolean") {
      searchParams.set(key, value ? "true" : "false");
    } else {
      // NOTE: 0 is preserved here
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
}
