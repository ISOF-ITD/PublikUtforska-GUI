/* eslint-disable react/require-default-props */
import { useRef, useEffect, useState } from 'react';
import L, { marker, circleMarker, DivIcon, Point, layerGroup } from 'leaflet';
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

  // Refs för att hålla överlagrar
  const clusterGroupRef = useRef(null);
  const circleGroupRef = useRef(null);

  const updateMap = () => {
    if (!mapView.current || !mapView.current.map) return;
  const { map } = mapView.current;
  // Wait until Leaflet has an initial view
  if (!map._loaded) {
    map.once('load', updateMap);
    return;
  }

    // Ta bort de tidigare överlagrarna
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    if (circleGroupRef.current) {
      map.removeLayer(circleGroupRef.current);
      circleGroupRef.current = null;
    }

    if (currentView === 'clusters') {
      // Kluster-lagret
      const markers = [];

      mapData?.data?.forEach((obj) => {
        const newMarker = marker([obj.location[0], obj.location[1]], {
          title: obj.name,
          icon: obj.has_metadata
            ? (highlightedMarkerIcon || mapHelper.markerIconHighlighted)
            : (defaultMarkerIcon || mapHelper.markerIcon),
        });
        if (onMarkerClick) newMarker.on('click', () => onMarkerClick(obj.id));
        markers.push(newMarker);
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
          return new DivIcon({
            html: `<div><span><b>${childCount}</b></span></div>`,
            className: `marker-cluster${c}`,
            iconSize: new Point(28, 28),
          });
        },
      });

      clusterGroup.addLayers(markers.filter((m) => m.getLatLng().lat !== 0));

      if (clusterGroup.getLayers().length > 0) {
        map.addLayer(clusterGroup);
        clusterGroupRef.current = clusterGroup; // Spara referensen
      }
    } else if (currentView === 'circles') {
      // Cirkel-lagret
      const circleGroup = layerGroup();

      mapData?.data?.forEach((obj) => {
        const count = typeof obj.doc_count === 'number' && !Number.isNaN(obj.doc_count) ? obj.doc_count : 1; // Sätter standard till 1 om count inte finns.

        const circle = circleMarker([obj.location[0], obj.location[1]], {
          color: '#01666e',
          fillColor: 'black',
          fillOpacity: 0.1,
          title: `${obj.name}`,
          weight: 1,
          radius: Math.max(count / 14, 2), // Anpassa radien efter antal träffar och zoomnivå
          interactive: true,
        }).bindTooltip(`${obj.name?.replace?.(/ sn$/, ' socken') || ''}: ${count} träffar`, {
          permanent: false, // Tooltip visas när man hovrar
          direction: 'top', // Visar tooltip ovanför cirkeln
        });

        if (onMarkerClick) circle.on('click', () => onMarkerClick(obj.id));
        circleGroup.addLayer(circle);
      });

      if (circleGroup.getLayers().length > 0) {
        map.addLayer(circleGroup);
        circleGroupRef.current = circleGroup; // Spara referensen
      }
    }
  };

  // Bind zoomend när map är tillgänglig och när currentView ändras
  useEffect(() => {
    if (mapView.current && mapView.current.map && mapView.current.map._loaded) {
      const handleZoomEnd = () => {
        updateMap();
      };
      mapView.current.map.on('zoomend', handleZoomEnd);

      // Rensa upp eventlistener när komponenten avmonteras eller map ändras
      return () => {
        mapView.current.map.off('zoomend', handleZoomEnd);
      };
    }
    return undefined;
  }, [mapView.current?.map, currentView, mapData]);

  // Uppdatera kartan när mapData eller currentView ändras
  useEffect(() => {
    updateMap();
  }, [mapData, currentView]);

  const mapBaseLayerChangeHandler = () => {
    // Uppdaterar kartan om underlagret ändras
    updateMap();
  };

  return (
    <div>
      <button
        type="button"
        tabIndex={0}
        onClick={() => setCurrentView(v => (v === 'clusters' ? 'circles' : 'clusters'))}
        aria-pressed={currentView === 'circles'}
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
  // Leaflet Icon or plain object
  highlightedMarkerIcon: PropTypes.oneOfType([PropTypes.object]),
  defaultMarkerIcon: PropTypes.oneOfType([PropTypes.object]),
  layersControlPosition: PropTypes.string,
  zoomControlPosition: PropTypes.string,
  zoom: PropTypes.number,
  center: PropTypes.arrayOf(PropTypes.number),
  disableSwedenMap: PropTypes.bool,
  mapData: PropTypes.object,
};
