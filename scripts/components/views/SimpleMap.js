/* eslint-disable react/prop-types */
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import MapBase from './MapBase';
import mapHelper from '../../utils/mapHelper';

function SimpleMap({ marker, markers, animate }) {
  const mapView = useRef(null);
  const markersRef = useRef([]);

  // Funktion för att ta bort alla markeringsikoner
  const removeMarkers = () => {
    if (markersRef.current.length > 0) {
      markersRef.current.forEach((m) => {
        mapView.current.map.removeLayer(m);
      });
      markersRef.current = [];
    }
  };

  // Funktion för att lägga till en enskild markering
  const addMarker = (markerData, allowMultiple = false) => {
    if (!allowMultiple) removeMarkers();

    const location = markerData.lat && markerData.lng
      ? [Number(markerData.lat), Number(markerData.lng)]
      : markerData.location?.lat && markerData.location?.lon
        ? [Number(markerData.location.lat), Number(markerData.location.lon)]
        : null;

    if (mapView.current && location) {
      const marker = L.marker(location, {
        title: markerData.label || markerData.name || null,
        icon: mapHelper.markerIcon,
      });

      if (allowMultiple) {
        markersRef.current.push(marker);
      } else {
        markersRef.current = [marker];
      }

      mapView.current.map.addLayer(marker);
      mapView.current.map.panTo(location, { animate });
    }
  };

  // Funktion för att lägga till flera markeringar
  const addMarkers = (markers) => {
    removeMarkers();
    markers.forEach((marker) => addMarker(marker, true));
  };

  // Effekt som körs när markeringar ändras
  useEffect(() => {
    if (marker) {
      addMarker(marker);
    }
    if (markers) {
      addMarkers(markers);
    }
  }, [marker, markers]);

  return <MapBase ref={mapView} />;
}

export default SimpleMap;
