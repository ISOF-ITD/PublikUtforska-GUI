import PropTypes from "prop-types";
import { memo, useEffect, useRef, useState } from "react";
import MapMenu from "./MapMenu";
import MapView from "./views/MapView";

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
  // Debounce "loading" to avoid flicker on quick transitions
  const [uiLoading, setUiLoading] = useState(!!loading);
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

  return (
    <div
      className="relative h-screen w-screen print:hidden"
      aria-busy={uiLoading || undefined}
    >
      <MapMenu
        mode={mode}
        params={params}
        recordsData={recordsData}
        audioRecordsData={audioRecordsData}
        pictureRecordsData={pictureRecordsData}
        loading={uiLoading}
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

      <MapView onMarkerClick={mapMarkerClick} mapData={stableMapData} />
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
