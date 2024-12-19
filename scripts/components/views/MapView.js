/* eslint-disable react/require-default-props */
import { useRef, useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import '../../lib/leaflet-heat';
import PropTypes from 'prop-types';
import iconMarkers from '../../../img/icon-markers.png';
import iconCircles from '../../../img/icon-circles.png';

import MapBase from './MapBase';

import mapHelper from '../../utils/mapHelper';

export default function MapView({
  onMarkerClick = undefined,
  highlightedMarkerIcon = undefined,
  defaultMarkerIcon = undefined,
  layersControlPosition = 'bottomright',
  zoomControlPosition = 'bottomright',
  zoom = undefined,
  center = undefined,
  disableSwedenMap = false,
  mapData,
}) {
  const [currentView, setCurrentView] = useState('clusters');
  const mapView = useRef();

  const updateMap = () => {
    // Ta bort alla befintliga lager på kartan
    mapView.current.map.eachLayer((layer) => {
      if (layer._url === undefined) {
        mapView.current.map.removeLayer(layer);
      }
    });

    if (currentView === 'clusters') {
      // Kluster-lagret
      const markers = [];
      const markerGroup = L.layerGroup();

      mapData?.data?.forEach((obj) => {
        const marker = L.marker([obj.location[0], obj.location[1]], {
          title: obj.name,
          icon: obj.has_metadata
            ? (highlightedMarkerIcon || mapHelper.markerIconHighlighted)
            : (defaultMarkerIcon || mapHelper.markerIcon),
        });
        marker.on('click', () => onMarkerClick(obj.id));
        markers.push(marker);
        markerGroup.addLayer(marker);
      });

      const clusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 45,
        iconCreateFunction(cluster) {
          const childCount = cluster.getChildCount();
          let c = ' marker-cluster-';
          if (childCount < 10) {
            c += 'small';
          } else if (childCount < 20) {
            c += 'medium';
          } else {
            c += 'large';
          }
          return new L.DivIcon({
            html: `<div><span><b>${childCount}</b></span></div>`,
            className: `marker-cluster${c}`,
            iconSize: new L.Point(28, 28),
          });
        },
      });

      clusterGroup.addLayers(markers.filter((marker) => marker.getLatLng().lat !== 0));

      if (clusterGroup.getLayers().length > 0) {
        mapView.current.map.addLayer(clusterGroup);
      }
    } else if (currentView === 'circles') {
      // Cirkel-lagret
      const circleGroup = L.layerGroup();

      mapData?.data?.forEach((obj) => {
        // debugger;
        // Kontrollera om `obj.count` är ett nummer, annars sätt ett standardvärde.
        const count = typeof obj.doc_count === 'number' && !Number.isNaN(obj.doc_count) ? obj.doc_count : 1;// Sätter standard till 1 om count inte finns.

        const circle = L.circleMarker([obj.location[0], obj.location[1]], {
          color: '#01666e',
          fillColor: 'black',
          fillOpacity: 0.1,
          title: `${obj.name}`,
          weight: 1,
          radius: Math.max(count / 14, 2), // Anpassa radien efter antal träffar och zoomnivå
          interactive: true,
        }).bindTooltip(`${obj.name.replace(/ sn$/, ' socken')}: ${obj.doc_count} träffar`, {
          permanent: false, // Tooltip visas när man hovrar
          direction: 'top', // Visar tooltip ovanför cirkeln
        });
        circle.on('click', () => onMarkerClick(obj.id));
        circleGroup.addLayer(circle);
      });

      if (circleGroup.getLayers().length > 0) {
        mapView.current.map.addLayer(circleGroup);
      }
    }
  };

  useEffect(() => {
    updateMap();
  }, [mapData, currentView]);

  useEffect(() => {
    if (mapView.current && mapView.current.map) {
      mapView.current.map.on('zoomend', () => {
        updateMap();
      });
    }
  }, [currentView]);

  const mapBaseLayerChangeHandler = () => {
    // Uppdaterar kartan om underlagret ändras
    updateMap();
  };

  return (
    <div>
      <button
        type="button"
        tabIndex={0}
        onClick={() => setCurrentView(currentView === 'clusters' ? 'circles' : 'clusters')}
        style={{
          position: 'fixed',
          bottom: 274,
          right: 26,
          zIndex: 401,
          background: '#fff',
          border: '2px solid rgba(0, 0, 0, 0.2)',
          padding: 5,
          height: 'auto',
          lineHeight: 'normal',
        }}
      >
        {/* Byt till {currentView === 'clusters' ? 'cirkel-vy' : 'kluster-vy'} */}
        <img
          alt={`Byt till ${currentView === 'clusters' ? 'cirkel-vy' : 'kluster-vy'}`}
          title={`Byt till ${currentView === 'clusters' ? 'cirkel-vy' : 'kluster-vy'}`}
          src={currentView === 'clusters' ? iconCircles : iconMarkers}
          height={37}
          width={43}
        />
      </button>
      <MapBase
        ref={mapView}
        className="map-view"
        layersControlPosition={layersControlPosition}
        zoomControlPosition={zoomControlPosition}
        // Inte visa locateControl knappen (som kan visa på kartan var användaren är)
        disableLocateControl
        scrollWheelZoom
        zoom={zoom}
        center={center}
        disableSwedenMap={disableSwedenMap}
        onBaseLayerChange={mapBaseLayerChangeHandler}
      />
    </div>
  );
}

MapView.propTypes = {
  onMarkerClick: PropTypes.func,
  highlightedMarkerIcon: PropTypes.string,
  defaultMarkerIcon: PropTypes.string,
  layersControlPosition: PropTypes.string,
  zoomControlPosition: PropTypes.string,
  zoom: PropTypes.number,
  center: PropTypes.arrayOf(PropTypes.number),
  disableSwedenMap: PropTypes.bool,
  mapData: PropTypes.object,
};
