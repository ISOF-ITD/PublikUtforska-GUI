/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import MapMenu from './MapMenu';
import MapView from './views/MapView';

export default function MapWrapper({
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
    <div className="map-wrapper">
      <MapMenu
        mode={mode}
        params={params}
        recordsData={recordsData}
        audioRecordsData={audioRecordsData}
        pictureRecordsData={pictureRecordsData}
        loading={loading}
      />

      {loading && (
        <div className="map-progress" aria-busy="true" aria-live="polite">
          <div className="indicator" />
        </div>
      )}

      <MapView
        onMarkerClick={mapMarkerClick}
        mode={mode}
        params={params}
        mapData={mapData}
        loading={loading}
      />
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

