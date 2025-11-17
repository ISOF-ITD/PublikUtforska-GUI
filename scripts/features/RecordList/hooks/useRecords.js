/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useMemo } from "react";
import RecordsCollection from "../../../components/collections/RecordsCollection";
import config from "../../../config";

const { hitsPerPage, maxTotal, filterParameterName, filterParameterValues } =
  config;

/**
 * Handles all data-layer concerns for <RecordList/>.
 * Returns data *and* all UI handlers so the component that
 * calls this hook is almost stateless.
 */
export default function useRecords(params, mode) {
  /* ---------------- state ---------------- */
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);

  const [currentPage, setCurrentPage] = useState(params.page || 1);
  const [filter, setFilter] = useState("");
  const [yearFilter, setYearFilter] = useState(null);
  const [sort, setSort] = useState("archive.archive_id_row.keyword");
  const [order, setOrder] = useState("asc");
  const [fetching, setFetching] = useState(false);

  /* ---------------- helpers ---------------- */
  const uniqueId = useMemo(
    () => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    []
  );

  const maxPage = Math.ceil(Math.min(maxTotal, total) / hitsPerPage);

  const collections = useMemo(
    () =>
      new RecordsCollection((json) => {
        setRecords(json.data);
        setTotal(json.metadata.total.value);
        setFetching(false);
        window.eventBus?.dispatch(
          "recordList.totalRecords",
          json.metadata.total.value
        );
        window.eventBus?.dispatch("recordList.fetchingPage", false);
      }),
    []
  );

  // Abort any in-flight fetch if this hook unmounts (or if RecordsCollection ever re-memoizes)
  useEffect(() => {
    return () => collections.abort();
  }, [collections]);

  const getFetchParams = useCallback(
    () => ({
      from: Math.min((currentPage - 1) * hitsPerPage, maxTotal - hitsPerPage),
      size: params.size || hitsPerPage,
      search: params.search ? encodeURIComponent(params.search) : undefined,
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
      has_untranscribed_records: params.has_untranscribed_records || undefined,
      recordtype:
        params.recordtype ||
        (mode === "transcribe" ? "one_accession_row" : filter || null),
      person_id: params.person_id || undefined,
      socken_id: params.place_id || undefined,
      transcriptionstatus: params.transcriptionstatus || undefined,
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
  const fetchData = useCallback(() => {
    setFetching(true);
    collections.fetch(getFetchParams());
  }, [collections, getFetchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
