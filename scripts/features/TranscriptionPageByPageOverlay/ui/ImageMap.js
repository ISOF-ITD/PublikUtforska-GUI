import {
  useCallback, useEffect, useId, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';
import {
  Map, imageOverlay, CRS, latLngBounds,
} from 'leaflet';

export default function ImageMap({
  image = null,
  description = '',
  maxZoom = 3,
  minZoom = -5,
  fitOnImageChange = true,
  refitOnResize = false,
  wheelZoomOnHover = true,
  height = 600,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const overlayRef = useRef(null);
  const loadedOnceRef = useRef(false);
  const [loading, setLoading] = useState(!!image);
  const [error, setError] = useState(null);
  const lastBoundsRef = useRef(null);
  const descriptionId = useId();
  const imageDescriptionText = description?.trim()
    || 'Skannad arkivbild. Zooma för att granska detaljer i bilden.';

  const applyImageToMap = useCallback((loadedImage) => {
    const map = mapInstance.current;
    if (!map) return;

    const bounds = latLngBounds([
      [0, 0],
      [loadedImage.height, loadedImage.width],
    ]);
    lastBoundsRef.current = bounds;

    if (overlayRef.current) {
      overlayRef.current.setUrl(loadedImage.src);
      overlayRef.current.setBounds(bounds);
    } else {
      overlayRef.current = imageOverlay(loadedImage.src, bounds).addTo(map);
    }

    map.setMaxBounds(bounds.pad(0.1));
    if (fitOnImageChange || !loadedOnceRef.current) {
      map.fitBounds(bounds, { animate: false });
      loadedOnceRef.current = true;
    }
  }, [fitOnImageChange]);

  const loadImage = useCallback((url) => {
    if (!url) return;
    setLoading(true);
    setError(null);

    const loadedImage = new Image();
    loadedImage.onload = () => {
      applyImageToMap(loadedImage);
      setLoading(false);
    };
    loadedImage.onerror = () => {
      setError('Kunde inte ladda bilden.');
      setLoading(false);
    };
    loadedImage.src = url;
  }, [applyImageToMap]);

  useEffect(() => {
    if (!mapRef.current) return undefined;

    const map = new Map(mapRef.current, {
      crs: CRS.Simple,
      minZoom,
      maxZoom,
      zoom: 0,
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true,
      maxBoundsViscosity: 1.0,
      wheelDebounceTime: 40,
      wheelPxPerZoomLevel: 100,
      scrollWheelZoom: true,
      zoomSnap: 0.25,
      zoomDelta: 0.25,
    });
    mapInstance.current = map;

    let removeWheelListeners = () => {};
    if (wheelZoomOnHover) {
      map.scrollWheelZoom.disable();
      const element = map.getContainer();
      const enable = () => map.scrollWheelZoom.enable();
      const disable = () => map.scrollWheelZoom.disable();
      element.addEventListener('mouseenter', enable);
      element.addEventListener('mouseleave', disable);
      element.addEventListener('focusin', enable);
      element.addEventListener('focusout', disable);
      removeWheelListeners = () => {
        element.removeEventListener('mouseenter', enable);
        element.removeEventListener('mouseleave', disable);
        element.removeEventListener('focusin', enable);
        element.removeEventListener('focusout', disable);
      };
    }

    const resizeObserver = typeof window !== 'undefined'
      && 'ResizeObserver' in window
      ? new ResizeObserver(() => {
        map.invalidateSize();
        if (lastBoundsRef.current && refitOnResize) {
          map.fitBounds(lastBoundsRef.current, { animate: false });
        }
      })
      : null;
    if (containerRef.current) resizeObserver?.observe(containerRef.current);

    return () => {
      resizeObserver?.disconnect();
      removeWheelListeners();
      map.remove();
      if (mapInstance.current === map) mapInstance.current = null;
    };
  }, [maxZoom, minZoom, refitOnResize, wheelZoomOnHover]);

  useEffect(() => {
    if (image && mapInstance.current) loadImage(image);
  }, [image, loadImage]);

  return (
    <div ref={containerRef} className="mb-5 relative">
      <div
        ref={mapRef}
        className="rounded border border-solid border-border bg-surface-muted"
        style={{ height }}
        role="region"
        aria-label="Bildvisare"
        aria-describedby={descriptionId}
        aria-busy={loading}
      />
      <p id={descriptionId} className="sr-only">
        {imageDescriptionText}
      </p>

      {loading && (
        <div className="absolute inset-0 grid place-items-center bg-[var(--color-overlay)] backdrop-blur-[1px]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-body border-t-transparent" />
          <span className="sr-only">Laddar bild…</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-body">
            <span>{error}</span>
            <button
              type="button"
              className="button button-primary"
              onClick={() => loadImage(image)}
            >
              Försök igen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

ImageMap.propTypes = {
  maxZoom: PropTypes.number,
  minZoom: PropTypes.number,
  image: PropTypes.string,
  description: PropTypes.string,
  fitOnImageChange: PropTypes.bool,
  refitOnResize: PropTypes.bool,
  wheelZoomOnHover: PropTypes.bool,
  height: PropTypes.number,
};
