import PropTypes from 'prop-types';
import MapMenu from './MapMenu';
import MapView from './views/MapView';
import MapBottomWrapper from './MapBottomWrapper';

export default function MapWrapper({
  mapMarkerClick, mode, params, mapData, loading, recordsData, audioRecordsData, pictureRecordsData,
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

  MapWrapper.defaultProps = {
    loading: true,
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

      {/* <MapBottomWrapper /> */}

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
