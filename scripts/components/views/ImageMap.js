/* eslint-disable react/require-default-props */
import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Map, imageOverlay, CRS } from 'leaflet'; // Only import the necessary parts of Leaflet

export default function ImageMap({ maxZoom = 3, image = null }) {
  const containerRef = useRef();
  const mapRef = useRef();
  const mapInstance = useRef();
  const imageOverlayRef = useRef();
  const imageEl = useRef();

  const imageLoadedHandler = () => {
    const containerWidth = containerRef.current.clientWidth;
    const imageWidth = imageEl.current.width;
    const imageHeight = imageEl.current.height;

    const factor = containerWidth / imageWidth;
    const bounds = [[0, 0], [imageHeight * factor, imageWidth * factor]];

    if (imageOverlayRef.current) {
      mapInstance.current.removeLayer(imageOverlayRef.current);
    }

    imageOverlayRef.current = imageOverlay(imageEl.current.src, bounds);
    imageOverlayRef.current.addTo(mapInstance.current);

    /*
    Testing with leaflet geojson rectangle overlay on image
    Note: No rectangle is shown! May be due to layer config, coordinates, layer order, or z-index
    */

    mapInstance.current.setMaxBounds(bounds);
    mapInstance.current.setView([imageHeight, 0], 0);
  };

  const loadImage = (url) => {
    if (imageOverlayRef.current) {
      mapInstance.current.removeLayer(imageOverlayRef.current);
    }

    imageEl.current = new Image();
    imageEl.current.onload = imageLoadedHandler;
    imageEl.current.src = url;
  };

  useEffect(() => {
    mapInstance.current = new Map(mapRef.current, {
      minZoom: -5, // Allow zooming out further to see the whole image
      maxZoom: maxZoom || 3,
      zoom: 0,
      crs: CRS.Simple,
    });

    if (image) {
      loadImage(image);
    }
  }, []);

  useEffect(() => {
    if (image) {
      loadImage(image);
    }
  }, [image]);

  return (
    <div ref={containerRef} className="image-map-container">
      <div className="map-container" ref={mapRef} />
    </div>
  );
}

ImageMap.propTypes = {
  maxZoom: PropTypes.number,
  image: PropTypes.string,
};
