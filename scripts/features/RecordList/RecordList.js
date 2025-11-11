import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { l } from "../../lang/Lang";
import Filter from "./ui/Filter";
import Timeline from "./ui/Timeline.js";
import Pagination from "./ui/Pagination";
import RecordCards from "./ui/RecordCards";
import RecordTable from "./ui/RecordTable";
import RecordViewToggle from "./ui/RecordViewToggle";
import { createSearchRoute } from "../../utils/routeHelper";
import useRecords from "./hooks/useRecords";
import config from "../../config";
import classNames from "classnames";

const { hitsPerPage, siteOptions } = config;

export default function RecordList(props) {
  const {
    columns,
    disableListPagination,
    disableRouterPagination,
    hasFilter,
    hasTimeline,
    highlightRecordsWithMetadataField,
    interval,
    openSwitcherHelptext,
    params,
    mode,
    containerRef,
    useRouteParams,
    smallTitle,
    showViewToggle,
  } = props;

  const navigate = useNavigate();
  const location = useLocation();

  /* ------- business logic extracted to hook ------- */
  const {
    records,
    total,
    fetching,
    maxPage,
    currentPage,
    setCurrentPage,
    filter,
    setFilter,
    uniqueId,
    sort,
    order,
    setSort,
    setOrder,
    setYearFilter,
  } = useRecords(params, mode);

  /* ------- desktop view mode (table|cards) ------- */
  const [view, setView] = useState("table"); // desktop default remains table

  // initialize from URL or localStorage on mount
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const v = sp.get("view");
    if (v === "table" || v === "cards") {
      setView(v);
      return;
    }
    try {
      const saved = localStorage.getItem("recordListView");
      if (saved === "table" || saved === "cards") setView(saved);
    } catch {
      /* ignore */
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep state in sync if user navigates to a URL with ?view=
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const v = sp.get("view");
    if (v === "table" || v === "cards") setView(v);
  }, [location.search]);

  const handleViewChange = (next) => {
    setView(next);
    try {
      localStorage.setItem("recordListView", next);
    } catch {}
    if (!disableRouterPagination) {
      const newParams = { ...params, view: next };
      // stay on same path; replace history entry to avoid back-button noise
      navigate(`${location.pathname}${createSearchRoute(newParams)}`, {
        replace: true,
      });
    }
  };

  /* ------- UI helpers ------- */
  const shouldRenderColumn = useCallback(
    (name) => (columns ? columns.includes(name) : true),
    [columns]
  );

  const handleStepPage = (step) => {
    /* decide who owns page number */
    const newPage = Math.min(Math.max(currentPage + step, 1), maxPage);

    if (disableRouterPagination) {
      setCurrentPage(newPage);
    } else {
      const newParams = { ...params, page: newPage };
      navigate(`${location.pathname}${createSearchRoute(newParams)}`);
    }
  };

  const handleSort = (field) => {
    const newOrder = sort === field && order === "asc" ? "desc" : "asc";
    setSort(field);
    setOrder(newOrder);
    setCurrentPage(1);
  };

  const archiveIdClick = (e) => {
    const { archiveidrow } = e.target.dataset;
    if (archiveidrow) {
      navigate(`/records/${archiveidrow}`);
    }
  };

  /* ------- side-effect: url hash “showlist” ------- */
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.has("showlist")) {
      window.eventBus?.dispatch("routePopup.show");
    }
  }, [location]);

  /* ------- render ------- */
  return (
    <>
      {/*
      No longer used after removal of one_record,
      left here as temporary reference
      hasFilter && (
        <Filter
          uniqueId={uniqueId}
          filter={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
          openHelp={openSwitcherHelptext}
        />
        )*/}

      {hasTimeline && (
        <Timeline
          containerRef={containerRef}
          params={params}
          filter={filter}
          mode={mode}
          onYearFilter={(f, l) => setYearFilter([f, l])}
          resetOnYearFilter={() => setYearFilter(null)}
        />
      )}

      {!fetching && (
        <div
          className={classNames(
            "mb-10 md:mb-2 rounded",
            records.length && "min-h-[200px]"
          )}
        >
          <div aria-live="polite" className="sr-only">
            {l("Sida")} {currentPage} {l("av")} {maxPage}
          </div>
          {!disableListPagination && (
            <Pagination
              currentPage={currentPage}
              total={total}
              onStep={handleStepPage}
              maxPage={maxPage}
            />
          )}

          {/* Mobile: always cards */}
          <RecordCards
            records={records}
            params={params}
            mode={mode}
            highlightRecordsWithMetadataField={
              highlightRecordsWithMetadataField
            }
            layout="mobile-only"
          />

          {/* Desktop: view toggle + chosen view */}
          <div className="hidden md:block">
            {showViewToggle && (
              <div className="flex justify-end mb-3">
                <RecordViewToggle value={view} onChange={handleViewChange} />
              </div>
            )}

            {showViewToggle && view === "cards" ? (
              <RecordCards
                records={records}
                params={params}
                mode={mode}
                highlightRecordsWithMetadataField={
                  highlightRecordsWithMetadataField
                }
                layout="desktop-grid"
              />
            ) : (
              <RecordTable
                records={records}
                uniqueId={uniqueId}
                params={params}
                highlightRecordsWithMetadataField={
                  highlightRecordsWithMetadataField
                }
                shouldRenderColumn={shouldRenderColumn}
                archiveIdClick={archiveIdClick}
                sort={sort}
                order={order}
                handleSort={handleSort}
                mode={mode}
                useRouteParams={useRouteParams}
                smallTitle={smallTitle}
                columns={columns}
              />
            )}
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

      {fetching && (
        <p className="text-center">
          <strong>{l("Söker...")}</strong>
        </p>
      )}
      {!fetching && records.length === 0 && (
        <div className="block h-64 text-center py-10">
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
  params: PropTypes.objectOf(PropTypes.any),
  mode: PropTypes.string,
  useRouteParams: PropTypes.bool,
  containerRef: PropTypes.objectOf(PropTypes.any),
  smallTitle: PropTypes.bool,
};
