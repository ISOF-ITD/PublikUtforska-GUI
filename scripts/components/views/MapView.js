/* eslint-disable react/require-default-props */
import React, { useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import '../../lib/leaflet-heat';

import PropTypes from 'prop-types';
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
  const mapView = useRef();

  const updateMap = () => {
    // Remove any existing markers from the map:
    // remove layer if it is not the tile layer.
    mapView.current.map.eachLayer((layer) => {
      if (layer._url === undefined) {
        mapView.current.map.removeLayer(layer);
      }
    });

    // Create a Leaflet LayerGroup to hold your markers and add it to your map:
    const markerGroup = L.layerGroup();// .addTo(mapView.current.map);

    // // Loop through your list of objects and
    // create a marker for each one, adding it to the markerGroup:
    const markers = [];
    mapData?.data?.forEach((obj) => {
      const marker = L.marker([obj.location[0], obj.location[1]], {
        title: obj.name,
        // om obj.has_metadata lägger vi till en annan typ av ikon,
        // används mest av matkartan för att visa kurerade poster
        icon: obj.has_metadata
          ? (highlightedMarkerIcon || mapHelper.markerIconHighlighted)
          : (defaultMarkerIcon || mapHelper.markerIcon),
      });
      marker.on('click', () => {
        onMarkerClick(obj.id);
      });
      markers.push(marker);
      markerGroup.addLayer(marker);
    });

    // Use the Leaflet.markercluster plugin to group your markers into clusters:
    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false, // visa området som täcks av cluster
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
          html: '<div><span>'
            + `<b>${childCount}</b>`
            + '</span></div>',
          className: `marker-cluster${c}`,
          iconSize: new L.Point(28, 28),
        });
      },
    });
    clusterGroup.addLayers(markers.filter((marker) => marker.getLatLng().lat !== 0));

    // Add the cluster group to the map only if it has markers:
    if (clusterGroup.getLayers().length > 0) {
      mapView.current.map.addLayer(clusterGroup);
    }
  };

  useEffect(() => {
    updateMap();
  }, [mapData]);

  const mapBaseLayerChangeHandler = () => {
    // Uppdaterar kartan om underlagret ändras
    updateMap();
  };

  return (
    <div>
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
