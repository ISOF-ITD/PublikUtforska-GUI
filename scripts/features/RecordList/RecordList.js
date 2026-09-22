import {
  lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { faSort } from '@fortawesome/free-solid-svg-icons';
import { l } from "../../lang/Lang";
import Pagination from "./ui/Pagination";
import RecordCards from "./ui/RecordCards";
import RecordTable from "./ui/RecordTable";
import RecordListMenu from './ui/RecordListMenu';
import { SORT_OPTIONS, VIEW_OPTIONS } from './ui/recordListMenuOptions';
import {
  createDetailLocation,
  createResultSearch,
  parseResultSearch,
} from '../../utils/routeHelper';
import useRecords from "./hooks/useRecords";
import classNames from "classnames";
import RecordListLoadingPlaceholder from '../../components/RecordListLoadingPlaceholder';

const SCROLL_STORAGE_PREFIX = 'recordListScroll:';
const ACTIVE_RECORD_STORAGE_SUFFIX = ':activeRecord';
const VIEW_STORAGE_KEY = 'recordListView';
const VIEW_CHANGE_EVENT = 'recordListViewChange';
const WIDE_RESULTS_PANE_MIN_WIDTH = 760;
const Timeline = lazy(() => import("./ui/Timeline"));

function isRecordListView(value) {
  return value === 'table' || value === 'cards';
}

function getInitialView(search) {
  const routeView = new URLSearchParams(search).get('view');
  if (isRecordListView(routeView)) return routeView;

  try {
    const storedView = localStorage.getItem(VIEW_STORAGE_KEY);
    if (isRecordListView(storedView)) return storedView;
  } catch {
    // Ignore storage failures (private mode / disabled storage).
  }

  return 'table';
}

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
    const resultsPane = rootElement.closest('[data-record-list-scroll="true"]');
    if (resultsPane) return resultsPane;
  }

  return window;
}

// Skapa en unik nyckel för att lagra scrollpositionen i sessionStorage.
function createScrollStorageKey(params = {}) {
  return `${SCROLL_STORAGE_PREFIX}${JSON.stringify(params)}`;
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
    hasTimeline,
    highlightRecordsWithMetadataField,
    interval,
    params,
    containerRef,
    useRouteParams,
    smallTitle,
    layoutContext = 'viewport',
    detailSearch = '',
    loading = false,
    showPaginationTotal = true,
    cardHeadingLevel,
  } = props;

  const navigate = useNavigate();
  const location = useLocation();
  // För att kunna återställa scrollpositionen på rätt sätt behöver vi veta
  // vilken container som scrollas. rootRef pekar på den översta nivån i RecordList
  const rootRef = useRef(null);
  const hasRestoredScrollRef = useRef(false);
  const [resultsPaneWidth, setResultsPaneWidth] = useState(0);
  const scrollStorageKey = createScrollStorageKey(params);
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
    yearFilter,
    uniqueId,
    sort,
    order,
    setSorting,
    relevanceSortingAvailable,
    setYearFilter,
  } = useRecords(params, interval);

  /* ------- desktop view mode (table|cards) ------- */
  const [view, setView] = useState(() => getInitialView(location.search));
  const [viewAnnouncement, setViewAnnouncement] = useState('');
  const [sortAnnouncement, setSortAnnouncement] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const isRecordViewOpen = /\/records\/[^/]+(?:\/|$)/.test(location.pathname);

  // keep state in sync if user navigates to a URL with ?view=
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const v = sp.get("view");
    if (isRecordListView(v)) setView(v);
  }, [location.search]);

  // Keep all record lists on the page, as well as other tabs, in sync.
  useEffect(() => {
    const handleViewChange = (event) => {
      if (isRecordListView(event.detail)) setView(event.detail);
    };
    const handleStorageChange = (event) => {
      if (event.key === VIEW_STORAGE_KEY && isRecordListView(event.newValue)) {
        setView(event.newValue);
      }
    };

    window.addEventListener(VIEW_CHANGE_EVENT, handleViewChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(VIEW_CHANGE_EVENT, handleViewChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleViewChange = (next) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures (private mode / disabled storage).
    }
    window.dispatchEvent(new CustomEvent(VIEW_CHANGE_EVENT, { detail: next }));
  };

  const handleViewMenuSelect = (option) => {
    handleViewChange(option.value);
    setViewAnnouncement(
      `${l('Visningsläge ändrat till')} ${l(option.label)}.`,
    );
  };

  /* ------- UI helpers ------- */
  const shouldRenderColumn = useCallback(
    (name) => (columns ? columns.includes(name) : true),
    [columns]
  );
  // If the URL contains record_ids, we are in a bookmarked record list and should not include record_ids in the navigation params to avoid losing the bookmarked filter when navigating between records.
  const recordNavigationParams = useMemo(() => {
    const baseParams = useRouteParams
      ? parseResultSearch(location.search)
      : params;
    if (!baseParams?.record_ids) return baseParams;

    const cleanParams = { ...baseParams };
    delete cleanParams.record_ids;
    return cleanParams;
  }, [location.search, params, useRouteParams]);

  const handleStepPage = (step) => {
    const newPage = Math.min(Math.max(currentPage + step, 1), maxPage);
    setCurrentPage(newPage);
  };

  const handleSort = ({ field, order: nextOrder, label }) => {
    setSorting({ field, order: nextOrder });
    setSortAnnouncement(`${l('Sortering ändrad till')} ${l(label)}.`);
  };

  const currentViewOption = VIEW_OPTIONS.find((option) => option.value === view)
    || VIEW_OPTIONS[0];
  const visibleSortOptions = relevanceSortingAvailable
    ? SORT_OPTIONS
    : SORT_OPTIONS.filter((option) => option.field !== '_score');
  const currentSortOption = visibleSortOptions.find(
    (option) => option.field === sort && option.order === order,
  ) || visibleSortOptions[0];

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
      navigate(createDetailLocation({
        resource: 'records',
        id: archiveidrow,
        search: createResultSearch(recordNavigationParams, detailSearch),
      }));
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

  useEffect(() => {
    if (layoutContext !== 'results-pane') return undefined;
    const element = containerRef.current;
    if (!element) return undefined;

    const updateWidth = () => setResultsPaneWidth(element.clientWidth);
    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef, layoutContext]);

  /* ------- render ------- */
  const resultsPaneIsWide = resultsPaneWidth >= WIDE_RESULTS_PANE_MIN_WIDTH;
  const showCompactCards = layoutContext !== 'results-pane' || !resultsPaneIsWide;
  const compactCardLayout = layoutContext === 'results-pane'
    ? 'pane-compact'
    : 'mobile-only';
  let wideLayoutClass = 'hidden md:block';
  if (layoutContext === 'results-pane') {
    wideLayoutClass = resultsPaneIsWide ? 'block' : 'hidden';
  }
  const showWideViewToggle = layoutContext !== 'results-pane'
    || resultsPaneIsWide;
  const resolvedCardHeadingLevel = cardHeadingLevel
    || (layoutContext === 'results-pane' ? 'h3' : 'h2');

  return (
    <div ref={rootRef} aria-busy={loading || undefined}>
      {/* {hasTimeline && (
        <Suspense fallback={<p className="text-center text-subtle">Laddar tidslinje...</p>}>
          <Timeline
            containerRef={containerRef}
            params={params}
            filter={filter}
            yearFilter={yearFilter}
            onYearFilter={(f, l) => setYearFilter([f, l])}
            resetOnYearFilter={() => setYearFilter(null)}
          />
        </Suspense>
      )} */}

      {!loading && (
        <div
          className={classNames(
            "mb-10 md:mb-2 rounded",
            records.length && "min-h-[200px]"
          )}
        >
          <p role="status" aria-atomic="true" className="sr-only">
            {`${l('Sida')} ${currentPage} ${l('av')} ${maxPage}`}
          </p>
          <div className="mb-3 flex flex-wrap items-end gap-3">
            {!disableListPagination && (
              <Pagination
                currentPage={currentPage}
                total={total}
                onStep={handleStepPage}
                maxPage={maxPage}
                showRange
                showTotal={showPaginationTotal}
                className="!m-0"
              />
            )}
            <span className="min-w-0 flex-1" aria-hidden="true" />
            <div className="flex flex-wrap items-center justify-start gap-3">
              {showWideViewToggle && (
                <>
                  <RecordListMenu
                    buttonIcon={currentViewOption.icon}
                    buttonLabel={`${l('Visa som')}: ${l(currentViewOption.label)}`}
                    className="relative hidden md:block"
                    onSelect={handleViewMenuSelect}
                    options={VIEW_OPTIONS.map((option) => ({
                      ...option,
                      displayLabel: l(option.label),
                      key: option.value,
                      selected: option.value === view,
                    }))}
                  />
                  <p className="sr-only" aria-live="polite" aria-atomic="true">
                    {viewAnnouncement}
                  </p>
                </>
              )}
              <RecordListMenu
                buttonIcon={faSort}
                buttonLabel={`${l('Sortera')}: ${l(currentSortOption.label)}`}
                className="relative"
                onSelect={handleSort}
                options={visibleSortOptions.map((option) => ({
                  ...option,
                  displayLabel: l(option.label),
                  key: `${option.field}-${option.order}`,
                  selected: option.field === sort && option.order === order,
                }))}
              />
              <p className="sr-only" aria-live="polite" aria-atomic="true">
                {sortAnnouncement}
              </p>
            </div>
          </div>

          {/* Mobile: always cards */}
          {showCompactCards && (
            <RecordCards
              records={records}
              params={recordNavigationParams}
              highlightRecordsWithMetadataField={
                highlightRecordsWithMetadataField
              }
              selectedRecordId={selectedRecordId}
              onRecordActivate={markRecordAsActive}
              layout={compactCardLayout}
              detailSearch={detailSearch}
              headingLevel={resolvedCardHeadingLevel}
            />
          )}

          {/* Desktop: view toggle + chosen view */}
          <div className={wideLayoutClass}>
            {view === 'cards' ? (
              <RecordCards
                records={records}
                params={recordNavigationParams}
                highlightRecordsWithMetadataField={
                  highlightRecordsWithMetadataField
                }
                selectedRecordId={selectedRecordId}
                onRecordActivate={markRecordAsActive}
                layout="desktop-grid"
                detailSearch={detailSearch}
                headingLevel={resolvedCardHeadingLevel}
              />
            ) : (
              <RecordTable
                records={records}
                uniqueId={uniqueId}
                params={recordNavigationParams}
                highlightRecordsWithMetadataField={
                  highlightRecordsWithMetadataField
                }
                shouldRenderColumn={shouldRenderColumn}
                archiveIdClick={archiveIdClick}
                useRouteParams={useRouteParams}
                smallTitle={smallTitle}
                columns={columns}
                selectedRecordId={selectedRecordId}
                onRecordActivate={markRecordAsActive}
                detailSearch={detailSearch}
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

      {loading && (
        <RecordListLoadingPlaceholder embedded announce={false} />
      )}
      {!loading && !fetching && records.length === 0 && (
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
  hasTimeline: PropTypes.bool,
  highlightRecordsWithMetadataField: PropTypes.string,
  interval: PropTypes.number,
  params: PropTypes.objectOf(PropTypes.any),
  useRouteParams: PropTypes.bool,
  containerRef: PropTypes.objectOf(PropTypes.any),
  smallTitle: PropTypes.bool,
  layoutContext: PropTypes.oneOf(['viewport', 'results-pane']),
  detailSearch: PropTypes.string,
  loading: PropTypes.bool,
  showPaginationTotal: PropTypes.bool,
  cardHeadingLevel: PropTypes.oneOf(['h2', 'h3', 'h4']),
};
