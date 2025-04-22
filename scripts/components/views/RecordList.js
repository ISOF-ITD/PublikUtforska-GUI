/* eslint-disable react/require-default-props */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { l } from "../../lang/Lang";
import RecordsCollection from "../collections/RecordsCollection";
import RecordListItem from "./RecordListItem";
import Timeline from "./Timeline";
import { createSearchRoute } from "../../utils/routeHelper";
import Filter from "./Filter";
import config from "../../config";
import { RecordCardItem } from "./RecordCardItem";

const {
  filterParameterName,
  filterParameterValues,
  hitsPerPage,
  maxTotal,
  siteOptions,
} = config;

/* ---------------- Pagination ---------------- */

function Pagination({ currentPage, total, onStep, maxPage }) {
  const from = (currentPage - 1) * hitsPerPage + 1;
  const to = Math.min(currentPage * hitsPerPage, total);

  if (total <= 2) return null;

  return (
    <nav
      className="my-4 flex items-center gap-4 text-sm"
      role="navigation"
      aria-label="paginering"
    >
      <p>
        <strong>
          {`${l("Visar")} ${from}-${to} ${l(total ? "av" : "")} ${total || ""}`}
        </strong>
      </p>

      {total > hitsPerPage && (
        <>
          <button
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 text-center"
            onClick={() => onStep(-1)}
            type="button"
          >
            {l("Föregående")}
          </button>
          <button
            disabled={currentPage >= maxPage}
            className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40"
            onClick={() => onStep(1)}
            type="button"
          >
            {l("Nästa")}
          </button>
        </>
      )}

      {total >= maxTotal && currentPage >= maxPage && (
        <span className="text-red-600">
          {l(
            `Du har nått det maximala antalet sidor (${maxTotal.toLocaleString(
              "sv-SE"
            )} poster).`
          )}
        </span>
      )}
    </nav>
  );
}

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onStep: PropTypes.func.isRequired,
  maxPage: PropTypes.number.isRequired,
};

/* ---------------- RecordList ---------------- */

export default function RecordList({
  columns = null,
  disableListPagination = false,
  disableRouterPagination = true,
  hasFilter = true,
  hasTimeline = false,
  highlightRecordsWithMetadataField = null,
  interval = null,
  openSwitcherHelptext = () => {},
  tableClass = "",
  params = {},
  mode = "material",
  containerRef = null,
  useRouteParams = false,
  smallTitle = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  /* ---------- state ---------- */
  const [records, setRecords] = useState([]);
  const [fetchingPage, setFetchingPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(params.page || 1);
  const [yearFilter, setYearFilter] = useState(null);
  const [sort, setSort] = useState("archive.archive_id_row.keyword");
  const [order, setOrder] = useState("asc");
  const [loadedMore, setLoadedMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");

  const uniqueId = useMemo(
    () => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    []
  );

  const maxPage = Math.ceil(Math.min(maxTotal, total) / hitsPerPage);

  /* ---------- URL‑param “showlist” ---------- */

  useEffect(() => {
    const hashParams = new URLSearchParams(location.hash.split("?")[1] || "");
    if (hashParams.has("showlist") && window.eventBus) {
      window.eventBus.dispatch("routePopup.show");
    }
  }, [location]);

  /* ---------- data collection ---------- */

  const collections = useMemo(
    () =>
      new RecordsCollection((json) => {
        setRecords(json.data);
        setTotal(json.metadata.total.value);
        setFetchingPage(false);

        window.eventBus?.dispatch(
          "recordList.totalRecords",
          json.metadata.total.value
        );
        window.eventBus?.dispatch("recordList.fetchingPage", false);
      }),
    []
  );

  const fetchData = useCallback(
    (fetchParams) => {
      setFetchingPage(true);
      collections.fetch(fetchParams);
    },
    [collections]
  );

  const getFetchParams = useCallback(() => {
    /* build params */
    return {
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
    };
  }, [
    currentPage,
    params,
    yearFilter,
    mode,
    filter,
    sort,
    order,
    filterParameterName,
    filterParameterValues,
  ]);

  useEffect(() => {
    fetchData(getFetchParams());
  }, [
    currentPage,
    params.person_id,
    params.sort,
    params.order,
    sort,
    order,
    filter,
    yearFilter,
    mode,
    getFetchParams,
    fetchData,
  ]);

  /* ---------- ui handlers ---------- */

  const loadMore = () => {
    setCurrentPage((p) => p + 1);
    setLoadedMore(true);
  };

  useEffect(() => {
    if (!interval) return;
    const id = setInterval(() => {
      if (loadedMore) {
        loadMore();
      } else {
        fetchData(getFetchParams());
      }
    }, interval);
    return () => clearInterval(id);
  }, [interval, loadedMore, getFetchParams, fetchData]);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStepPage = (step) => {
    if (disableRouterPagination) {
      setCurrentPage((prev) => Math.min(Math.max(prev + step, 1), maxPage));
    } else {
      const newPage = currentPage + step;
      if (newPage <= maxPage && newPage >= 1) {
        const newSearchParams = { ...params, page: newPage };
        navigate(`/places${createSearchRoute(newSearchParams)}`);
      }
    }
  };

  const handleSort = (field) => {
    const newOrder = sort === field && order === "asc" ? "desc" : "asc";
    setSort(field);
    setOrder(newOrder);
    setCurrentPage(1);
  };

  const handleYearFilter = (f, l) => setYearFilter([f, l]);
  const resetYearFilter = () => setYearFilter(null);

  const archiveIdClick = (e) => {
    const { archiveidrow, recordtype, search } = e.target.dataset;
    if (archiveidrow) {
      navigate(
        `/records/${archiveidrow}${createSearchRoute({ search, recordtype })}`
      );
    }
  };

  const shouldRenderColumn = (name) =>
    columns ? columns.includes(name) : true;

  /* ---------- rows ---------- */

  const items = records.map((item) => (
    <RecordListItem
      key={`${uniqueId}-${item._source.id}`}
      id={item._source.id}
      item={item}
      routeParams={createSearchRoute(params)}
      highlightRecordsWithMetadataField={highlightRecordsWithMetadataField}
      searchParams={params}
      archiveIdClick={archiveIdClick}
      shouldRenderColumn={shouldRenderColumn}
      columns={columns}
      mode={mode}
      useRouteParams={useRouteParams}
      smallTitle={smallTitle}
    />
  ));

  /* ---------- render ---------- */

  return (
    <>
      {hasFilter && (
        <Filter
          uniqueId={uniqueId}
          filter={filter}
          onChange={handleFilterChange}
          openHelp={openSwitcherHelptext}
        />
      )}

      {hasTimeline && (
        <Timeline
          containerRef={containerRef}
          params={params}
          filter={filter}
          mode={mode}
          onYearFilter={handleYearFilter}
          resetOnYearFilter={resetYearFilter}
        />
      )}

      {/* List wrapper */}
      {!fetchingPage && (
        <div
          className={`${tableClass} mb-10 md:mb-2 rounded ${
            fetchingPage ? "relative" : ""
          } ${records.length === 0 ? "min-h-[200px]" : ""}`}
        >
          {!disableListPagination && (
            <Pagination
              currentPage={currentPage}
              total={total}
              onStep={handleStepPage}
              maxPage={maxPage}
            />
          )}

          <div className="md:hidden space-y-4">
            {records.map((rec) => (
              <RecordCardItem
                key={rec._source.id}
                item={rec}
                searchParams={params}
                mode={mode}
              />
            ))}
          </div>

          <div className="hidden md:block">
            <table
              className="mobile-table w-full text-sm border-collapse"
              role="table"
            >
              <thead className="hidden md:table-header-group">
                <tr className="block md:table-row border-b border-gray-300 last:border-0">
                  {shouldRenderColumn("title") && (
                    <th className="text-left w-1/2">{l("Titel")}</th>
                  )}

                  {shouldRenderColumn("archive_id") &&
                    !siteOptions.recordList?.hideAccessionpage && (
                      <th scope="col" className="text-left">
                        <a
                          onClick={() =>
                            handleSort("archive.archive_id_row.keyword")
                          }
                          className="flex items-center gap-1 text-sky-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-isof-lighter"
                          aria-sort={
                            sort === "archive.archive_id_row.keyword"
                              ? order
                              : "none"
                          }
                        >
                          {l("Arkivnummer")}
                          {sort === "archive.archive_id_row.keyword" &&
                            (order === "asc" ? "▼" : "▲")}
                        </a>
                      </th>
                    )}

                  {shouldRenderColumn("place") && (
                    <th className="text-left" scope="col">
                      {l("Ort")}
                    </th>
                  )}

                  {shouldRenderColumn("collector") &&
                    siteOptions.recordList?.visibleCollecorPersons !==
                      false && (
                      <th className="text-left" scope="col">
                        {l("Insamlare")}
                      </th>
                    )}

                  {shouldRenderColumn("year") && (
                    <th className="text-left" scope="col">
                      <a
                        className="text-sky-900 hover:underline hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-isof-lighter"
                        onClick={() => handleSort("year")}
                      >
                        {sort === "year" && (order === "asc" ? "▼" : "▲")}{" "}
                        {l("År")}
                      </a>
                    </th>
                  )}

                  {shouldRenderColumn("material_type") &&
                    !siteOptions.recordList?.hideMaterialType && (
                      <th className="text-left" scope="col">
                        {l("Materialtyp")}
                      </th>
                    )}

                  {shouldRenderColumn("transcriptionstatus") &&
                    !siteOptions.recordList?.hideTranscriptionStatus && (
                      <th className="text-left" scope="col">
                        <a
                          className="text-sky-900 hover:underline hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-isof-lighter"
                          onClick={() => handleSort("transcriptionstatus")}
                        >
                          {sort === "transcriptionstatus" &&
                            (order === "asc" ? "▼" : "▲")}{" "}
                          {l("Klara")}
                        </a>
                      </th>
                    )}

                  {columns?.includes("transcribedby") && (
                    <th className="text-left" scope="col">
                      {l("Transkriberad av")}
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="[&>tr]:block md:[&>tr]:table-row [&>td]:flex [&>td]:justify-between [&>td]:gap-2">
                <tr className="sr-only md:hidden">
                  <th scope="col">{l("Titel")}</th>
                  <th scope="col">{l("Arkivnummer")}</th>
                  <th scope="col">{l("Ort")}</th>
                  <th scope="col">{l("Insamlare")}</th>
                  <th scope="col">{l("År")}</th>
                  <th scope="col">{l("Klara")}</th>
                </tr>
                {items}
              </tbody>
            </table>
          </div>

          {!disableListPagination && (
            <Pagination
              currentPage={currentPage}
              total={total}
              onStep={handleStepPage}
              maxPage={maxPage}
            />
          )}
        </div>
      )}

      {fetchingPage && (
        <p className="text-center">
          <strong>{l("Söker...")}</strong>
        </p>
      )}

      {!fetchingPage && records.length === 0 && (
        <div className="table-wrapper list-container text-center py-10">
          <h3>{l("Inga sökträffar.")}</h3>
        </div>
      )}
    </>
  );
}

RecordList.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.string),
  disableListPagination: PropTypes.bool,
  disableRouterPagination: PropTypes.bool,
  hasFilter: PropTypes.bool,
  hasTimeline: PropTypes.bool,
  highlightRecordsWithMetadataField: PropTypes.string,
  interval: PropTypes.number,
  openSwitcherHelptext: PropTypes.func,
  tableClass: PropTypes.string,
  params: PropTypes.objectOf(PropTypes.any),
  mode: PropTypes.string,
  useRouteParams: PropTypes.bool,
  containerRef: PropTypes.objectOf(PropTypes.any),
  smallTitle: PropTypes.bool,
};
