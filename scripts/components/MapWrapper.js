import PropTypes from 'prop-types';
import {
  lazy, memo, Suspense, useEffect, useRef, useState,
} from 'react';
import MapMenu from './MapMenu';
import MapLoadingPlaceholder from './MapLoadingPlaceholder';

const MapView = lazy(() => import('./views/MapView'));

function MapWrapper({
  mapMarkerClick,
  mode,
  params,
  mapData,
  loading = true,
  recordsData,
  audioRecordsData,
  pictureRecordsData,
}) {
  const getIsMobileViewport = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  };

  // Debounce "loading" to avoid flicker on quick transitions
  const [uiLoading, setUiLoading] = useState(!!loading);
  const [isMobileViewport, setIsMobileViewport] = useState(getIsMobileViewport);
  const [mobileView, setMobileView] = useState('search');

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mql = window.matchMedia('(max-width: 767px)');
    const onViewportChange = (event) => setIsMobileViewport(event.matches);

    setIsMobileViewport(mql.matches);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onViewportChange);
    } else {
      mql.addListener(onViewportChange);
    }

    return () => {
      if (typeof mql.removeEventListener === 'function') {
        mql.removeEventListener('change', onViewportChange);
      } else {
        mql.removeListener(onViewportChange);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMobileViewport) {
      setMobileView('search');
    }
  }, [isMobileViewport]);

  useEffect(() => {
    let t;
    if (loading) t = setTimeout(() => setUiLoading(true), 150);
    else setUiLoading(false);
    return () => clearTimeout(t);
  }, [loading]);

  // Preserve last non-empty mapData across mode switches
  const lastMapDataRef = useRef(mapData);
  useEffect(() => {
    if (mapData && Object.keys(mapData).length > 0) {
      lastMapDataRef.current = mapData;
    }
  }, [mapData]);

  const hasMapData = mapData && Object.keys(mapData).length > 0;
  const stableMapData = hasMapData ? mapData : lastMapDataRef.current;
  const mapResultCount = Array.isArray(stableMapData?.data)
    ? stableMapData.data.length
    : 0;
  const mapSummaryText = mapResultCount > 0
    ? `Kartan visar ${mapResultCount} platser i nuvarande urval.`
    : 'Kartan visar inga platser i nuvarande urval.';

  return (
    <div
      className="relative h-screen w-screen print:hidden"
      role="region"
      aria-label="Kartvy för sökresultat"
      aria-busy={uiLoading || undefined}
    >
      <span className="sr-only" aria-live="polite">
        {mapSummaryText}
      </span>
      <MapMenu
        mode={mode}
        params={params}
        recordsData={recordsData}
        audioRecordsData={audioRecordsData}
        pictureRecordsData={pictureRecordsData}
        loading={uiLoading}
        isMobileViewport={isMobileViewport}
        mobileView={mobileView}
        onMobileViewChange={setMobileView}
      />

      {uiLoading && (
        <div
          className="absolute inset-0 z-[1500] grid place-items-center gap-2 bg-black/10 backdrop-blur-[1px]"
          role="status"
          aria-live="polite"
        >
          <div className="h-10 w-10 rounded-full border-4 border-white border-t-transparent animate-spin" />
          <span className="sr-only">Laddar kartan...</span>
        </div>
      )}

      <Suspense fallback={<MapLoadingPlaceholder />}>
        <MapView
          onMarkerClick={mapMarkerClick}
          mapData={stableMapData}
          isMobileViewport={isMobileViewport}
          mobileView={mobileView}
        />
      </Suspense>
    </div>
  );
}

MapWrapper.propTypes = {
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
