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
  MapWrapper.propTypes = {
    mapMarkerClick: PropTypes.func.isRequired,
    mode: PropTypes.string.isRequired,
    params: PropTypes.object.isRequired,
    mapData: PropTypes.object.isRequired,
    loading: PropTypes.bool,
    recordsData: PropTypes.object.isRequired,
    audioRecordsData: PropTypes.object.isRequired,
    pictureRecordsData: PropTypes.object.isRequired,
  };

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

      <div className="map-progress">
        <div className="indicator" />
      </div>

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
