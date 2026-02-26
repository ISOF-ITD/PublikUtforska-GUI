import {
  useState, useEffect, useCallback, useMemo, useRef,
} from 'react';
import RecordsApiClient from "../api/RecordsApiClient";
import config from "../../../config";

const { hitsPerPage, maxTotal, filterParameterName, filterParameterValues } =
  config;
const RECORDS_CACHE_TTL_MS = 5 * 60 * 1000;
const RECORDS_CACHE_MAX_ENTRIES = 100;
const recordsCache = new Map();

function createCacheKey(fetchParams) {
  return JSON.stringify(fetchParams || {});
}

function pruneExpiredCacheEntries() {
  const now = Date.now();
  recordsCache.forEach((entry, key) => {
    if (now - entry.timestamp > RECORDS_CACHE_TTL_MS) {
      recordsCache.delete(key);
    }
  });
}

function trimCacheSize() {
  while (recordsCache.size > RECORDS_CACHE_MAX_ENTRIES) {
    const oldestKey = recordsCache.keys().next().value;
    if (oldestKey === undefined) return;
    recordsCache.delete(oldestKey);
  }
}

function readCached(fetchParams) {
  pruneExpiredCacheEntries();
  const cacheKey = createCacheKey(fetchParams);
  const cached = recordsCache.get(cacheKey);
  if (!cached) return null;

  return {
    cacheKey,
    ...cached,
  };
}

function writeCached(cacheKey, records, total) {
  if (!cacheKey) return;
  pruneExpiredCacheEntries();
  recordsCache.set(cacheKey, {
    records,
    total,
    timestamp: Date.now(),
  });
  trimCacheSize();
}

/**
 * Handles all data-layer concerns for <RecordList/>.
 * Returns data *and* all UI handlers so the component that
 * calls this hook is almost stateless.
 */
export default function useRecords(params, mode, interval) {
  /* ---------------- state ---------------- */
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);

  const [currentPage, setCurrentPage] = useState(params.page || 1);
  const [filter, setFilter] = useState("");
  const [yearFilter, setYearFilter] = useState(null);
  const [sort, setSort] = useState("archive.archive_id_row.keyword");
  const [order, setOrder] = useState("asc");
  const [fetching, setFetching] = useState(false);
  const activeCacheKeyRef = useRef(null);

  /* ---------------- helpers ---------------- */
  const uniqueId = useMemo(
    () => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    []
  );

  const maxPage = Math.ceil(Math.min(maxTotal, total) / hitsPerPage);

  const collections = useMemo(
    () =>
      new RecordsApiClient(
        (json) => {
          setRecords(json.data);
          setTotal(json.metadata.total.value);
          setFetching(false);
          writeCached(
            activeCacheKeyRef.current,
            json.data,
            json.metadata.total.value,
          );
          activeCacheKeyRef.current = null;

          window.eventBus?.dispatch(
            "recordList.totalRecords",
            json.metadata.total.value
          );
          window.eventBus?.dispatch("recordList.fetchingPage", false);
        },
        (err) => {
          // Optional: log, show toast, etc.
          console.error("Failed to fetch records", err);
          setFetching(false);
          activeCacheKeyRef.current = null;
          window.eventBus?.dispatch("recordList.fetchingPage", false);
        }
      ),
    []
  );

  // Abort any in-flight fetch if this hook unmounts (or if RecordsApiClient ever re-memoizes)
  useEffect(() => {
    return () => collections.abort();
  }, [collections]);

  useEffect(() => {
    setCurrentPage(params.page || 1);
  }, [params.page]);

  const getFetchParams = useCallback(
    () => ({
      from: Math.max(
        0,
        Math.min((currentPage - 1) * hitsPerPage, maxTotal - hitsPerPage)
      ),
      size: params.size || hitsPerPage,
      search: params.search || undefined,
      search_field: params.search_field || undefined,
      type: params.type,
      category: params.category
        ? `${params.category}${
            params.subcategory ? `,${params.subcategory}` : ""
          }`
        : undefined,
      collection_years: yearFilter?.join(",") || undefined,
      gender: params.gender
        ? params.person_relation
          ? `${params.person_relation}:${params.gender}`
          : params.gender
        : undefined,
      birth_years: params.birth_years
        ? params.person_relation
          ? `${params.person_relation}:${
              params.gender ? `${params.gender}:` : ""
            }${params.birth_years}`
          : params.birth_years
        : undefined,
      record_ids: params.record_ids || undefined,
      has_metadata: params.has_metadata || undefined,
      has_media: params.has_media || undefined,
      has_transcribed_records: params.has_transcribed_records || undefined,
      // has_untranscribed_records not used anymore
      //has_untranscribed_records: params.has_untranscribed_records || undefined,
      transcriptionstatus: params.transcriptionstatus || "readytotranscribe",
      // Fanns:
      //transcriptionstatus: params.transcriptionstatus || undefined,
      recordtype:
        params.recordtype ||
        (mode === "transcribe" ? "one_accession_row" : filter || null),
      person_id: params.person_id || undefined,
      socken_id: params.place_id || undefined,
      sort: params.sort || sort || undefined,
      order: params.order || order || undefined,
      ...(filterParameterName && filterParameterValues && "filter" in params
        ? {
            [filterParameterName]:
              params.filter === "true" || params.filter === true
                ? filterParameterValues[1]
                : filterParameterValues[0],
          }
        : {}),
    }),
    [currentPage, params, yearFilter, mode, filter, sort, order]
  );

  /* ---------------- fetch ---------------- */
  const fetchData = useCallback(
    ({ force = false } = {}) => {
      collections.abort();
      activeCacheKeyRef.current = null;

      const fetchParams = getFetchParams();
      const cached = force ? null : readCached(fetchParams);
      if (cached) {
        setRecords(cached.records);
        setTotal(cached.total);
        setFetching(false);
        window.eventBus?.dispatch('recordList.totalRecords', cached.total);
        window.eventBus?.dispatch('recordList.fetchingPage', false);
        return;
      }

      const cacheKey = createCacheKey(fetchParams);
      activeCacheKeyRef.current = cacheKey;
      setFetching(true);
      window.eventBus?.dispatch('recordList.fetchingPage', true);
      collections.fetch(fetchParams);
    },
    [collections, getFetchParams],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update "Latest transcribed" list every minute
  useEffect(() => {
    if (!interval) return;
    const id = setInterval(() => {
      fetchData({ force: true });
    }, interval);

    return () => clearInterval(id);
  }, [interval, fetchData]);

  /* ---------------- outward API ---------------- */
  return {
    /* data */
    records,
    total,
    fetching,
    maxPage,
    uniqueId,

    /* state setters / handlers */
    setFilter,
    setYearFilter,
    setCurrentPage,
    setSort,
    setOrder,

    /* values the UI layer needs to know about */
    currentPage,
    filter,
    sort,
    order,
  };
}
