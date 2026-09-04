import PropTypes from 'prop-types';
import classNames from 'classnames';
import {
  lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SearchControls from './SearchControls';
import MapLoadingPlaceholder from './MapLoadingPlaceholder';
import RecordListLoadingPlaceholder from './RecordListLoadingPlaceholder';
import { l } from '../lang/Lang';
import { createParamsFromSearchRoute } from '../utils/routeHelper';

const MapView = lazy(() => import('./views/MapView'));
const RecordListWrapper = lazy(() => import('../features/RecordList/RecordListWrapper'));
const MOBILE_MAP_MEDIA_QUERY = '(max-width: 1023px)';
const WIDE_RESULTS_MEDIA_QUERY = '(min-width: 1440px)';
const SEARCH_FIELD_LABELS = {
  archive_id: 'Arkivsignum',
  person: 'Person',
  place: 'Ort',
};
const PLACE_NAME_FIELDS = ['name', 'harad', 'landskap', 'lan'];

function hasSearchValue(value) {
  if (Array.isArray(value)) return value.some(hasSearchValue);
  if (value && typeof value === 'object') {
    return Object.values(value).some(hasSearchValue);
  }
  return value !== null && value !== undefined && value !== '';
}

// Show only places that match a place search. The API otherwise returns every place
// linked to a matching record, which can add unrelated locations to the map.
function filterMapDataByPlaceSearch(data, searchTerm) {
  if (!Array.isArray(data?.data) || !searchTerm) return data;

  const trimmedSearchTerm = searchTerm.trim();
  const normalizedSearchTerm = trimmedSearchTerm.toLocaleLowerCase('sv');
  if (!normalizedSearchTerm) return data;

  return {
    ...data,
    data: data.data.filter((point) => (
      String(point?.id ?? '') === trimmedSearchTerm
      || PLACE_NAME_FIELDS.some((field) => (
        typeof point?.[field] === 'string'
        && point[field].trim().toLocaleLowerCase('sv').startsWith(normalizedSearchTerm)
      ))
    )),
  };
}

function MapWrapper({
  active,
  mapMarkerClick,
  mode,
  params,
  mapData,
  loading = true,
  recordsData,
  audioRecordsData,
  pictureRecordsData,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const getMediaQueryMatch = (query) => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  };
  const locationParams = new URLSearchParams(location.search);
  const routeSearchParams = createParamsFromSearchRoute(params['*']);
  const hasRouteSearchContext = Object.entries(routeSearchParams)
    .some(([key, value]) => key !== 'page' && hasSearchValue(value));
  const hasSubmittedSearch = hasRouteSearchContext
    || locationParams.has('showmap')
    || locationParams.has('record_ids');
  const narrowResultView = locationParams.has('showmap') ? 'map' : 'list';
  const searchTerm = routeSearchParams.search?.trim();
  const placeTerm = routeSearchParams.place?.trim();
  const searchLabel = l(
    SEARCH_FIELD_LABELS[routeSearchParams.search_field] || 'Sökning',
  );
  const searchSummary = [
    searchTerm ? `${searchLabel}: ${searchTerm}` : null,
    routeSearchParams.person
      ? `${l('Person')}: ${routeSearchParams.person}`
      : null,
    placeTerm ? `${l('Ort')}: ${placeTerm}` : null,
    routeSearchParams.archive_id
      ? `${l('Arkivsignum')}: ${routeSearchParams.archive_id}`
      : null,
  ].filter(Boolean).join('. ');
  const resultTotal = recordsData?.metadata?.total;
  const resultCountText = resultTotal
    ? `${resultTotal.value}${resultTotal.relation === 'gte' ? '+' : ''} sökträffar.`
    : '';
  const [uiLoading, setUiLoading] = useState(Boolean(loading));
  const [mapUiLoading, setMapUiLoading] = useState(Boolean(loading));
  const [recordListFetching, setRecordListFetching] = useState(false);
  const [isMobileMapViewport, setIsMobileMapViewport] = useState(
    () => getMediaQueryMatch(MOBILE_MAP_MEDIA_QUERY),
  );
  const [isWideResultsViewport, setIsWideResultsViewport] = useState(
    () => getMediaQueryMatch(WIDE_RESULTS_MEDIA_QUERY),
  );
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const mapPanelRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mobileQuery = window.matchMedia(MOBILE_MAP_MEDIA_QUERY);
    const wideQuery = window.matchMedia(WIDE_RESULTS_MEDIA_QUERY);
    const onMobileChange = (event) => setIsMobileMapViewport(event.matches);
    const onWideChange = (event) => setIsWideResultsViewport(event.matches);

    setIsMobileMapViewport(mobileQuery.matches);
    setIsWideResultsViewport(wideQuery.matches);
    if (typeof mobileQuery.addEventListener === 'function') {
      mobileQuery.addEventListener('change', onMobileChange);
      wideQuery.addEventListener('change', onWideChange);
    } else {
      mobileQuery.addListener(onMobileChange);
      wideQuery.addListener(onWideChange);
    }

    return () => {
      if (typeof mobileQuery.removeEventListener === 'function') {
        mobileQuery.removeEventListener('change', onMobileChange);
        wideQuery.removeEventListener('change', onWideChange);
      } else {
        mobileQuery.removeListener(onMobileChange);
        wideQuery.removeListener(onWideChange);
      }
    };
  }, []);

  const searchLoading = Boolean(loading || recordListFetching);

  useEffect(() => {
    let timeoutId;
    if (searchLoading) timeoutId = setTimeout(() => setUiLoading(true), 150);
    else setUiLoading(false);
    return () => clearTimeout(timeoutId);
  }, [searchLoading]);

  useEffect(() => {
    let timeoutId;
    if (loading) timeoutId = setTimeout(() => setMapUiLoading(true), 150);
    else setMapUiLoading(false);
    return () => clearTimeout(timeoutId);
  }, [loading]);

  useEffect(() => {
    const handleRecordListFetching = (event) => {
      setRecordListFetching(Boolean(event?.target));
    };

    window.eventBus?.addEventListener(
      'recordList.fetchingPage',
      handleRecordListFetching,
    );
    return () => window.eventBus?.removeEventListener(
      'recordList.fetchingPage',
      handleRecordListFetching,
    );
  }, []);

  const lastMapDataRef = useRef(mapData);
  useEffect(() => {
    if (mapData && Object.keys(mapData).length > 0) {
      lastMapDataRef.current = mapData;
    }
  }, [mapData]);

  const hasMapData = mapData && Object.keys(mapData).length > 0;
  const stableMapData = hasMapData ? mapData : lastMapDataRef.current;
  const visibleMapData = useMemo(() => (
    placeTerm
      ? filterMapDataByPlaceSearch(stableMapData, placeTerm)
      : stableMapData
  ), [placeTerm, stableMapData]);
  const mapResultCount = Array.isArray(visibleMapData?.data)
    ? visibleMapData.data.length
    : 0;
  const mapSummaryText = mapResultCount > 0
    ? `Kartan visar ${mapResultCount} platser i nuvarande urval.`
    : 'Kartan visar inga platser i nuvarande urval.';
  const showWideMap = active && isWideResultsViewport;
  const listIsVisible = active
    && (isWideResultsViewport || narrowResultView === 'list');
  const mapIsVisible = active
    && (showWideMap || narrowResultView === 'map');
  const showContainedNarrowMap = mapIsVisible && !isWideResultsViewport;

  useEffect(() => {
    if (!mapIsVisible || shouldLoadMap) return undefined;
    const mapPanel = mapPanelRef.current;
    if (!mapPanel) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoadMap(true);
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      setShouldLoadMap(true);
      observer.disconnect();
    }, { threshold: 0.01 });
    observer.observe(mapPanel);

    return () => observer.disconnect();
  }, [mapIsVisible, shouldLoadMap]);

  const modeAnnouncement = mode === 'transcribe'
    ? l('Arbetsläge: Skriv av.')
    : l('Arbetsläge: Utforska arkivmaterial.');
  let viewAnnouncement = isWideResultsViewport
    ? `${modeAnnouncement} ${l('Visar sökträffar som lista med karta.')}`
    : `${modeAnnouncement} ${l(
      narrowResultView === 'list'
        ? 'Visar sökträffar som lista.'
        : 'Visar sökträffar på karta.',
    )}`;
  viewAnnouncement = `${viewAnnouncement} ${resultCountText}`;
  if (hasSubmittedSearch && searchSummary) {
    viewAnnouncement = `${viewAnnouncement} ${searchSummary}.`;
  }

  const changeResultView = useCallback((nextView) => {
    const nextParams = new URLSearchParams(location.search);
    nextParams.delete('showlist');
    nextParams.delete('showmap');
    if (nextView === 'map') nextParams.set('showmap', '1');
    const query = nextParams.toString();
    navigate(`${location.pathname}${query ? `?${query}` : ''}${location.hash}`, {
      replace: true,
    });
  }, [location.hash, location.pathname, location.search, navigate]);

  return (
    <div
      id="results-viewport"
      className={classNames(
        'relative w-screen bg-isof print:hidden',
        isWideResultsViewport && 'grid h-screen overflow-hidden',
        !isWideResultsViewport && (
          showContainedNarrowMap
            ? 'flex h-screen flex-col overflow-hidden'
            : 'h-screen overflow-x-hidden overflow-y-auto'
        ),
      )}
      style={{
        '--desktop-map-pane-width': 'clamp(340px, 28vw, 480px)',
        height: showContainedNarrowMap ? '100dvh' : undefined,
        gridTemplateColumns: isWideResultsViewport
          ? 'minmax(0, 1fr) var(--desktop-map-pane-width)'
          : undefined,
      }}
      role="region"
      aria-label={l('Sökresultat')}
      aria-busy={uiLoading || undefined}
      data-record-list-scroll={!isWideResultsViewport && listIsVisible ? 'true' : undefined}
      tabIndex={-1}
    >
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {uiLoading ? '' : viewAnnouncement}
      </span>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {uiLoading ? l('Söker efter arkivmaterial') : ''}
      </span>

      <div
        className={classNames(
          'min-w-0',
          isWideResultsViewport ? 'h-screen overflow-x-hidden overflow-y-auto' : '',
          showContainedNarrowMap
            ? 'min-h-0 shrink overflow-x-hidden overflow-y-auto overscroll-contain focus-within:overflow-visible'
            : '',
        )}
        data-record-list-scroll={isWideResultsViewport && listIsVisible ? 'true' : undefined}
      >
        <SearchControls
          mode={mode}
          params={params}
          recordsData={recordsData}
          audioRecordsData={audioRecordsData}
          pictureRecordsData={pictureRecordsData}
          loading={uiLoading}
          hasSubmittedSearch={hasSubmittedSearch}
          activeResultView={narrowResultView}
          onResultViewChange={changeResultView}
          showResultViewControl={!isWideResultsViewport}
        />

        <section
          id="record-list-panel"
          className="min-h-screen overflow-x-hidden bg-surface text-body"
          hidden={!listIsVisible}
          inert={!listIsVisible || undefined}
          aria-hidden={!listIsVisible || undefined}
          aria-labelledby="record-list-heading"
          aria-busy={uiLoading || undefined}
          tabIndex={-1}
        >
          <Suspense fallback={<RecordListLoadingPlaceholder announce={false} />}>
            <RecordListWrapper
              disableRouterPagination
              mode={mode}
              layoutContext="results-pane"
              resultTotal={resultTotal}
              loading={uiLoading}
            />
          </Suspense>
        </section>
      </div>

      <div
        id="map-result-panel"
        ref={mapPanelRef}
        hidden={!mapIsVisible}
        inert={!mapIsVisible || undefined}
        aria-hidden={!mapIsVisible || undefined}
        role="region"
        aria-label={l('Sökträffar på karta')}
        aria-busy={mapUiLoading || undefined}
        tabIndex={-1}
        className={classNames(
          'relative w-full overflow-hidden bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-[-2px]',
          isWideResultsViewport
            ? 'results-map-panel--split h-screen border-l border-border'
            : '',
          showContainedNarrowMap
            ? 'min-h-[clamp(16rem,40dvh,28rem)] flex-1'
            : !isWideResultsViewport && 'min-h-screen h-screen',
        )}
      >
        <span className="sr-only">{mapSummaryText}</span>
        {mapUiLoading && (
          <MapLoadingPlaceholder overlay announce={false} />
        )}
        {shouldLoadMap ? (
          <Suspense fallback={<MapLoadingPlaceholder announce={false} />}>
            <MapView
              onMarkerClick={mapMarkerClick}
              mapData={visibleMapData}
              isMobileViewport={isMobileMapViewport}
              active={mapIsVisible}
              layout={isWideResultsViewport ? 'desktop-split' : 'full'}
            />
          </Suspense>
        ) : (
          <MapLoadingPlaceholder announce={false} />
        )}
      </div>
    </div>
  );
}

MapWrapper.propTypes = {
  active: PropTypes.bool.isRequired,
  mapMarkerClick: PropTypes.func.isRequired,
  mode: PropTypes.string.isRequired,
  params: PropTypes.object.isRequired,
  mapData: PropTypes.object,
  loading: PropTypes.bool,
  recordsData: PropTypes.object,
  audioRecordsData: PropTypes.object,
  pictureRecordsData: PropTypes.object,
};

export default memo(MapWrapper);
