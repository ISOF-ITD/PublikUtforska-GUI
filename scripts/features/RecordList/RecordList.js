import {
  lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
} from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { l } from "../../lang/Lang";
import Pagination from "./ui/Pagination";
import RecordCards from "./ui/RecordCards";
import RecordTable from "./ui/RecordTable";
import RecordViewToggle from "./ui/RecordViewToggle";
import RecordSortMenu from './ui/RecordSortMenu';
import {
  createParamsFromSearchRoute,
  createSearchRoute,
  mergeRouteSearch,
  removeViewParamsFromRoute,
} from '../../utils/routeHelper';
import useRecords from "./hooks/useRecords";
import useResultGrouping from './hooks/useResultGrouping';
import useParishMapPreview from './hooks/useParishMapPreview';
import classNames from "classnames";
import RecordListLoadingPlaceholder from '../../components/RecordListLoadingPlaceholder';
import {
  RESULT_TOOLBAR_CLASS,
  RESULT_VIEW_CONTROLS_CLASS,
} from './ui/resultListStyles';

const SCROLL_STORAGE_PREFIX = 'recordListScroll:';
const ACTIVE_RECORD_STORAGE_SUFFIX = ':activeRecord';
const VIEW_STORAGE_KEY = 'recordListView';
const VIEW_CHANGE_EVENT = 'recordListViewChange';
const WIDE_RESULTS_PANE_MIN_WIDTH = 760;
const Timeline = lazy(() => import("./ui/Timeline"));
const ParishList = lazy(() => import('./ui/ParishList'));
const NOOP = () => {};

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

  return 'cards';
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
    layoutContext = 'viewport',
    detailSearch = '',
    loading = false,
    showPaginationTotal = true,
    allowGrouping = false,
    parishData = null,
    parishLoading = false,
    listVisible = true,
    onParishPreview = NOOP,
  } = props;

  const navigate = useNavigate();
  const location = useLocation();
  const { grouped } = useResultGrouping(allowGrouping);
  const [parishListLoaded, setParishListLoaded] = useState(false);
  const showParishes = grouped && listVisible;
  const parishContextKey = useMemo(() => JSON.stringify([
    mode,
    Object.fromEntries(Object.entries(params).filter(
      ([key]) => !['page', 'sort', 'order'].includes(key),
    )),
  ]), [mode, params]);

  useEffect(() => {
    if (showParishes) setParishListLoaded(true);
  }, [showParishes]);
  // För att kunna återställa scrollpositionen på rätt sätt behöver vi veta
  // vilken container som scrollas. rootRef pekar på den översta nivån i RecordList
  const rootRef = useRef(null);
  const hasRestoredScrollRef = useRef(false);
  const scrollSnapshotRef = useRef(null);
  const restoreFrameRef = useRef(null);
  const [resultsPaneWidth, setResultsPaneWidth] = useState(0);
  const scrollStorageKey = grouped
    ? `${SCROLL_STORAGE_PREFIX}parish:${parishContextKey}`
    : createScrollStorageKey(mode, params);
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
  } = useRecords(params, mode, interval, !grouped);

  /* ------- desktop view mode (table|cards) ------- */
  const [view, setView] = useState(() => getInitialView(location.search));
  const [sortAnnouncement, setSortAnnouncement] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const isRecordViewOpen = /\/records\/[^/]+(?:\/|$)/.test(location.pathname);
  const accessionPreview = useParishMapPreview({
    active: allowGrouping && !grouped && listVisible,
    loading: loading || fetching,
    onPreview: onParishPreview,
    data: records,
    resetKey: `${currentPage}:${sort}:${order}:${view}`,
  });

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
    if (allowGrouping || !disableRouterPagination) {
      const query = new URLSearchParams(location.search);
      query.set('view', next);
      navigate({ ...location, search: `?${query}` }, {
        replace: true,
      });
    }
  };

  /* ------- UI helpers ------- */
  const shouldRenderColumn = useCallback(
    (name) => (columns ? columns.includes(name) : true),
    [columns]
  );
  // If the URL contains record_ids, we are in a starred record list and should not include record_ids in the navigation params to avoid losing the starred filter when navigating between records.
  const recordNavigationParams = useMemo(() => {
    const baseParams = useRouteParams
      ? createParamsFromSearchRoute(
        removeViewParamsFromRoute(location.pathname),
      )
      : params;
    if (!baseParams?.record_ids) return baseParams;

    const cleanParams = { ...baseParams };
    delete cleanParams.record_ids;
    return cleanParams;
  }, [location.pathname, params, useRouteParams]);

  const handleStepPage = (step) => {
    /* decide who owns page number */
    const newPage = Math.min(Math.max(currentPage + step, 1), maxPage);

    if (disableRouterPagination) {
      setCurrentPage(newPage);
    } else {
      const newParams = { ...params, page: newPage };
      navigate(mergeRouteSearch(
        `${location.pathname}${createSearchRoute(newParams)}`,
        location.search,
      ));
    }
  };

  const handleSort = ({ field, order: nextOrder, label }) => {
    setSorting({ field, order: nextOrder });
    setSortAnnouncement(`${l('Sortering ändrad till')} ${l(label)}.`);
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
      const searchSuffix = createSearchRoute(recordNavigationParams || {});
      const prefix = mode === 'transcribe' ? '/transcribe' : '';
      const recordPath = `${prefix}/records/${archiveidrow}${
        searchSuffix === '/' ? '' : searchSuffix
      }`;
      navigate(mergeRouteSearch(recordPath, detailSearch));
    }
  };

  const saveScrollPosition = useCallback(() => {
    const scrollableContainer = getScrollableContainer(rootRef.current);
    const snapshot = scrollSnapshotRef.current;
    const top = snapshot?.key === scrollStorageKey
      ? snapshot.top : getScrollTopValue(scrollableContainer);
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
    if (raw == null && !allowGrouping) return;
    const parsed = Number(raw ?? 0);
    if (!Number.isFinite(parsed) || parsed < 0) return;
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

    hasRestoredScrollRef.current = true;
    restoreFrameRef.current = window.requestAnimationFrame(() => {
      restoreFrameRef.current = window.requestAnimationFrame(restore);
    });
  }, [allowGrouping, scrollStorageKey]);

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

  useLayoutEffect(() => {
    if (!listVisible) return undefined;
    const scrollableContainer = getScrollableContainer(rootRef.current);
    const rememberScroll = () => {
      scrollSnapshotRef.current = {
        key: scrollStorageKey,
        top: getScrollTopValue(scrollableContainer),
      };
    };
    rememberScroll();
    scrollableContainer.addEventListener('scroll', rememberScroll, { passive: true });
    hasRestoredScrollRef.current = false;
    return () => {
      window.cancelAnimationFrame(restoreFrameRef.current);
      scrollableContainer.removeEventListener('scroll', rememberScroll);
      saveScrollPosition();
    };
  }, [listVisible, saveScrollPosition, scrollStorageKey]);

  useEffect(() => {
    if (!grouped && listVisible && !loading && !fetching
      && (records.length > 0 || allowGrouping)) {
      restoreScrollPosition();
    }
  }, [
    allowGrouping, fetching, grouped, listVisible, loading, records.length,
    restoreScrollPosition,
  ]);

  useEffect(() => {
    if (layoutContext !== 'results-pane') return undefined;
    const element = containerRef.current;
    if (!element) return undefined;

    const updateWidth = () => {
      if (element.clientWidth > 0) setResultsPaneWidth(element.clientWidth);
    };
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
  const viewControls = showWideViewToggle
    ? <RecordViewToggle value={view} onChange={handleViewChange} />
    : null;

  return (
    <div ref={rootRef} aria-busy={loading || (grouped && parishLoading) || undefined}>
      {/* {hasTimeline && (
        <Suspense fallback={<p className="text-center text-subtle">Laddar tidslinje...</p>}>
          <Timeline
            containerRef={containerRef}
            params={params}
            filter={filter}
            yearFilter={yearFilter}
            mode={mode}
            onYearFilter={(f, l) => setYearFilter([f, l])}
            resetOnYearFilter={() => setYearFilter(null)}
          />
        </Suspense>
      )} */}

      {allowGrouping && (showParishes || parishListLoaded) && (
        <Suspense fallback={showParishes
          ? <RecordListLoadingPlaceholder embedded /> : null}
        >
          <ParishList
            key={parishContextKey}
            data={parishData}
            active={showParishes}
            loading={parishLoading}
            view={resultsPaneIsWide ? view : 'cards'}
            cardLayout={resultsPaneIsWide ? 'desktop-grid' : 'pane-compact'}
            controls={viewControls}
            onPreview={onParishPreview}
            onReady={restoreScrollPosition}
          />
        </Suspense>
      )}

      {!loading && !grouped && (
        <div
          className={classNames(
            "mb-10 md:mb-2 rounded",
            records.length && "min-h-[200px]"
          )}
        >
          <p role="status" aria-atomic="true" className="sr-only">
            {`${l('Sida')} ${currentPage} ${l('av')} ${maxPage}`}
          </p>
          <div className={RESULT_TOOLBAR_CLASS}>
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
            <div className={RESULT_VIEW_CONTROLS_CLASS}>
              {viewControls}
              <RecordSortMenu
                sort={sort}
                order={order}
                onChange={handleSort}
                showRelevance={relevanceSortingAvailable}
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
              mode={mode}
              highlightRecordsWithMetadataField={
                highlightRecordsWithMetadataField
              }
              selectedRecordId={selectedRecordId}
              onRecordActivate={markRecordAsActive}
              parishPreview={accessionPreview}
              layout={compactCardLayout}
              detailSearch={detailSearch}
            />
          )}

          {/* Desktop: view toggle + chosen view */}
          <div className={wideLayoutClass}>
            {view === 'cards' ? (
              <RecordCards
                records={records}
                params={recordNavigationParams}
                mode={mode}
                highlightRecordsWithMetadataField={
                  highlightRecordsWithMetadataField
                }
                selectedRecordId={selectedRecordId}
                onRecordActivate={markRecordAsActive}
                parishPreview={accessionPreview}
                layout="desktop-grid"
                detailSearch={detailSearch}
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
                mode={mode}
                useRouteParams={useRouteParams}
                smallTitle={smallTitle}
                columns={columns}
                selectedRecordId={selectedRecordId}
                onRecordActivate={markRecordAsActive}
                parishPreview={accessionPreview}
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

      {loading && !grouped && (
        <RecordListLoadingPlaceholder embedded announce={false} />
      )}
      {!loading && !grouped && !fetching && records.length === 0 && (
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
  layoutContext: PropTypes.oneOf(['viewport', 'results-pane']),
  detailSearch: PropTypes.string,
  loading: PropTypes.bool,
  showPaginationTotal: PropTypes.bool,
  allowGrouping: PropTypes.bool,
  parishData: PropTypes.object,
  parishLoading: PropTypes.bool,
  listVisible: PropTypes.bool,
  onParishPreview: PropTypes.func,
};
