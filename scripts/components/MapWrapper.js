import PropTypes from "prop-types";
import { memo } from "react";
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
  return (
    <div
      className="relative h-screen w-screen print:hidden"
      aria-busy={loading || undefined}
    >
      <MapMenu
        mode={mode}
        params={params}
        recordsData={recordsData}
        audioRecordsData={audioRecordsData}
        pictureRecordsData={pictureRecordsData}
        loading={loading}
      />

      {loading && (
        <div
          className="absolute inset-0 z-[1500] grid place-items-center gap-2 bg-black/10 backdrop-blur-[1px]"
          role="status"
          aria-live="polite"
        >
          <div className="h-10 w-10 rounded-full border-4 border-white border-t-transparent animate-spin" />
          <span className="sr-only">Laddar kartan...</span>
        </div>
      )}

      <MapView onMarkerClick={mapMarkerClick} mapData={mapData} />
    </div>
  );
}

MapWrapper.propTypes = {
  mapMarkerClick: PropTypes.func.isRequired,
  mode: PropTypes.string.isRequired,
  params: PropTypes.object.isRequired,
  mapData: PropTypes.object,
  loading: PropTypes.bool,
  recordsData: PropTypes.object.isRequired,
  audioRecordsData: PropTypes.object.isRequired,
  pictureRecordsData: PropTypes.object.isRequired,
};

export default memo(MapWrapper);
