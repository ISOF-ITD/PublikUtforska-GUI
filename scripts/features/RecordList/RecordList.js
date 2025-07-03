import { useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { l } from "../../lang/Lang";
import Filter from "./ui/Filter";
import Timeline from "./ui/Timeline.js";
import Pagination from "./ui/Pagination";
import RecordCards from "./ui/RecordCards";
import RecordTable from "./ui/RecordTable";
import { createSearchRoute } from "../../utils/routeHelper";
import useRecords from "./hooks/useRecords";
import config from "../../config";

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
    tableClass,
    params,
    mode,
    containerRef,
    useRouteParams,
    smallTitle,
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
      navigate(`/places${createSearchRoute(newParams)}`);
    }
  };

  const handleSort = (field) => {
    const newOrder = sort === field && order === "asc" ? "desc" : "asc";
    setSort(field);
    setOrder(newOrder);
    setCurrentPage(1);
  };

  const archiveIdClick = (e) => {
    const { archiveidrow, recordtype, search } = e.target.dataset;
    if (archiveidrow) {
      navigate(
        `/records/${archiveidrow}${createSearchRoute({ search, recordtype })}`
      );
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
      {hasFilter && (
        <Filter
          uniqueId={uniqueId}
          filter={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
          openHelp={openSwitcherHelptext}
        />
      )}

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
          className={`${tableClass} mb-10 md:mb-2 rounded ${
            records.length === 0 ? "min-h-[200px]" : ""
          }`}
        >
          {!disableListPagination && (
            <Pagination
              currentPage={currentPage}
              total={total}
              onStep={handleStepPage}
              maxPage={maxPage}
            />
          )}

          <RecordCards
            records={records}
            params={params}
            mode={mode}
            highlightRecordsWithMetadataField={
              highlightRecordsWithMetadataField
            }
          />

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
            tableClass={tableClass}
          />

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
