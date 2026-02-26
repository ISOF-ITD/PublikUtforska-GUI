import {
  lazy, Suspense, useCallback, useEffect, useRef, useState,
} from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { l } from "../../lang/Lang";
import Pagination from "./ui/Pagination";
import RecordCards from "./ui/RecordCards";
import RecordTable from "./ui/RecordTable";
import RecordViewToggle from "./ui/RecordViewToggle";
import { createSearchRoute } from "../../utils/routeHelper";
import useRecords from "./hooks/useRecords";
import classNames from "classnames";

const SCROLL_STORAGE_PREFIX = 'recordListScroll:';
const ACTIVE_RECORD_STORAGE_SUFFIX = ':activeRecord';
const Timeline = lazy(() => import("./ui/Timeline"));

function getScrollTopValue(container) {
  if (container === window) {
    return (
      window.scrollY
      || window.pageYOffset
      || document.documentElement?.scrollTop
      || 0
    );
  }

  return container?.scrollTop || 0;
}

// För att kunna återställa scrollpositionen på rätt sätt behöver vi veta 
// vilken container som scrollas.
function getScrollableContainer(rootElement) {
  if (rootElement?.closest) {
    const popupContainer = rootElement.closest(".popup-content-wrapper");
    if (popupContainer) return popupContainer;
  }

  return window;
}

// Skapa en unik nyckel för att lagra scrollpositionen i sessionStorage, baserat på mode och params.
function createScrollStorageKey(mode, params = {}) {
  return `${SCROLL_STORAGE_PREFIX}${mode}:${JSON.stringify(params)}`;
}

// En enkel wrapper runt sessionStorage som tyst fångar eventuella fel
function readSessionItem(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

// En enkel wrapper runt sessionStorage som tyst fångar eventuella fel
function writeSessionItem(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage failures (private mode / disabled storage).
  }
}

// En enkel wrapper runt sessionStorage som tyst fångar eventuella fel
function removeSessionItem(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore storage failures (private mode / disabled storage).
  }
}

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
  // För att kunna återställa scrollpositionen på rätt sätt behöver vi veta
  // vilken container som scrollas. rootRef pekar på den översta nivån i RecordList
  const rootRef = useRef(null);
  const hasRestoredScrollRef = useRef(false);
  const scrollStorageKey = createScrollStorageKey(mode, params);
  const activeRecordStorageKey = `${scrollStorageKey}${ACTIVE_RECORD_STORAGE_SUFFIX}`;

  /* ------- business logic extracted to hook ------- */
  // RecordList.jsx
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
  } = useRecords(params, mode, interval);

  /* ------- desktop view mode (table|cards) ------- */
  const [view, setView] = useState("table"); // desktop default remains table
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const isRecordViewOpen = /\/records\/[^/]+(?:\/|$)/.test(location.pathname);

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

  const markRecordAsActive = useCallback(
    (recordId) => {
      if (!recordId) return;
      const normalized = String(recordId);
      setSelectedRecordId(normalized);
      writeSessionItem(activeRecordStorageKey, normalized);
    },
    [activeRecordStorageKey],
  );

  const clearActiveRecord = useCallback(() => {
    setSelectedRecordId(null);
    removeSessionItem(activeRecordStorageKey);
  }, [activeRecordStorageKey]);

  const archiveIdClick = (e) => {
    const { archiveidrow } = e.target.dataset;
    if (archiveidrow) {
      navigate(`/records/${archiveidrow}`);
    }
  };

  const saveScrollPosition = useCallback(() => {
    const scrollableContainer = getScrollableContainer(rootRef.current);
    const top = getScrollTopValue(scrollableContainer);
    if (top > 0) {
      writeSessionItem(scrollStorageKey, String(top));
    } else {
      removeSessionItem(scrollStorageKey);
    }
  }, [scrollStorageKey]);

  const restoreScrollPosition = useCallback(() => {
    if (hasRestoredScrollRef.current) return;

    let savedTop = null;
    const raw = readSessionItem(scrollStorageKey);
    if (raw == null) return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    savedTop = parsed;

    const scrollableContainer = getScrollableContainer(rootRef.current);

    const restore = () => {
      if (scrollableContainer === window) {
        window.scrollTo(0, savedTop);
      } else {
        scrollableContainer.scrollTop = savedTop;
      }
      hasRestoredScrollRef.current = true;
      removeSessionItem(scrollStorageKey);
    };

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(restore);
    });
  }, [scrollStorageKey]);

  useEffect(() => {
    hasRestoredScrollRef.current = false;
  }, [scrollStorageKey]);

  useEffect(() => {
    const saved = readSessionItem(activeRecordStorageKey);
    setSelectedRecordId(saved ? String(saved) : null);
  }, [activeRecordStorageKey]);

  useEffect(() => {
    if (!selectedRecordId || isRecordViewOpen) return undefined;

    const handleDocumentClick = () => {
      clearActiveRecord();
    };

    const handleDocumentKeyDown = (event) => {
      if (event.key === "Tab") {
        clearActiveRecord();
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    document.addEventListener("keydown", handleDocumentKeyDown, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      document.removeEventListener("keydown", handleDocumentKeyDown, true);
    };
  }, [selectedRecordId, isRecordViewOpen, clearActiveRecord]);

  useEffect(
    () => () => {
      saveScrollPosition();
    },
    [saveScrollPosition]
  );

  useEffect(() => {
    if (!fetching && records.length > 0) {
      restoreScrollPosition();
    }
  }, [fetching, records.length, restoreScrollPosition]);

  /* ------- side-effect: url hash “showlist” ------- */
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.has("showlist")) {
      window.eventBus?.dispatch("routePopup.show");
    }
  }, [location]);

  /* ------- render ------- */
  const hasVisibleRecords = records.length > 0;

  return (
    <div ref={rootRef}>
      {hasTimeline && (
        <Suspense fallback={<p className="text-center text-gray-500">Laddar tidslinje...</p>}>
          <Timeline
            containerRef={containerRef}
            params={params}
            filter={filter}
            mode={mode}
            onYearFilter={(f, l) => setYearFilter([f, l])}
            resetOnYearFilter={() => setYearFilter(null)}
          />
        </Suspense>
      )}

      {(!fetching || hasVisibleRecords) && (
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
            selectedRecordId={selectedRecordId}
            onRecordActivate={markRecordAsActive}
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
                selectedRecordId={selectedRecordId}
                onRecordActivate={markRecordAsActive}
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
                selectedRecordId={selectedRecordId}
                onRecordActivate={markRecordAsActive}
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

      {fetching && !hasVisibleRecords && (
        <p className="text-center">
          <strong>{l("Söker...")}</strong>
        </p>
      )}
      {!fetching && records.length === 0 && (
        <div className="block h-64 text-center py-10">
          <h3>{l("Inga sökträffar.")}</h3>
        </div>
      )}
    </div>
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
  showViewToggle: PropTypes.bool,
};
