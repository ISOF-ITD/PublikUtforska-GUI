/* eslint-disable react/require-default-props */
import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Map, imageOverlay, CRS, latLngBounds, DomEvent } from "leaflet";

export default function ImageMap({
  image = null,
  maxZoom = 3,
  minZoom = -5,
  fitOnImageChange = true, // fit-to-image whenever the `image` prop changes
  refitOnResize = false,
  wheelZoomOnHover = true, // enable wheel-zoom only while hovering/focused
  height = 600, // allow easy height override
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const overlayRef = useRef(null);
  const [loading, setLoading] = useState(!!image);
  const [error, setError] = useState(null);
  const lastBoundsRef = useRef(null);

  const applyImageToMap = (img) => {
    const bounds = latLngBounds([
      [0, 0],
      [img.height, img.width],
    ]); // native pixels
    lastBoundsRef.current = bounds;

    if (overlayRef.current) {
      overlayRef.current.setUrl(img.src);
      overlayRef.current.setBounds(bounds);
    } else {
      overlayRef.current = imageOverlay(img.src, bounds).addTo(
        mapInstance.current
      );
    }

    // Keep users inside the image and fit it nicely
    mapInstance.current.setMaxBounds(bounds.pad(0.1));
    if (fitOnImageChange || !mapInstance.current._loadedOnce) {
      mapInstance.current.fitBounds(bounds, { animate: false });
      mapInstance.current._loadedOnce = true;
    }
  };

  const loadImage = (url) => {
    if (!url) return;
    setLoading(true);
    setError(null);

    const img = new Image();
    img.onload = () => {
      applyImageToMap(img);
      setLoading(false);
    };
    img.onerror = () => {
      setError("Kunde inte ladda bilden.");
      setLoading(false);
    };
    img.src = url;
  };

  useEffect(() => {
    if (!mapRef.current) return;

    mapInstance.current = new Map(mapRef.current, {
      crs: CRS.Simple,
      minZoom,
      maxZoom,
      zoom: 0,
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true,
      maxBoundsViscosity: 1.0,
      wheelDebounceTime: 40,
      wheelPxPerZoomLevel: 120,
      scrollWheelZoom: true,
    });

    // Wheel-zoom only while hovering/focused
    if (wheelZoomOnHover) {
      mapInstance.current.scrollWheelZoom.disable();
      const el = mapInstance.current.getContainer();
      const enable = () => mapInstance.current.scrollWheelZoom.enable();
      const disable = () => mapInstance.current.scrollWheelZoom.disable();
      el.addEventListener("mouseenter", enable);
      el.addEventListener("mouseleave", disable);
      el.addEventListener("focusin", enable);
      el.addEventListener("focusout", disable);

      // Cleanup those listeners
      mapInstance.current._wheelTogglesCleanup = () => {
        el.removeEventListener("mouseenter", enable);
        el.removeEventListener("mouseleave", disable);
        el.removeEventListener("focusin", enable);
        el.removeEventListener("focusout", disable);
      };
    }

    // Keep sizing correct
    let ro;
    if (typeof window !== "undefined" && "ResizeObserver" in window) {
      ro = new ResizeObserver(() => {
        mapInstance.current?.invalidateSize();
        // Optional: re-fit after big layout shifts
        if (lastBoundsRef.current && refitOnResize) {
          mapInstance.current.fitBounds(lastBoundsRef.current, {
            animate: false,
          });
        }
      });
    }
    if (containerRef.current) ro.observe(containerRef.current);

    // Initial load
    if (image) loadImage(image);

    return () => {
      if (ro) ro.disconnect();
      if (mapInstance.current?._wheelTogglesCleanup) {
        mapInstance.current._wheelTogglesCleanup();
      }
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []); // init once

  // Reload image when prop changes
  useEffect(() => {
    if (image && mapInstance.current) loadImage(image);
  }, [image]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={containerRef} className="mb-5 relative">
      {/* Map container */}
      <div
        ref={mapRef}
        className="border border-solid border-gray-700/10 rounded bg-gray-200"
        style={{ height }}
        role="region"
        aria-label="Bildvisare"
        aria-busy={loading}
      />

      {/* Loader overlay */}
      {loading && (
        <div className="absolute inset-0 grid place-items-center bg-black/10 backdrop-blur-[1px]">
          <div className="h-10 w-10 rounded-full border-4 border-white border-t-transparent animate-spin" />
          <span className="sr-only">Laddar bild…</span>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg bg-white/90 shadow p-4 flex items-center gap-3">
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
  fitOnImageChange: PropTypes.bool,
  wheelZoomOnHover: PropTypes.bool,
  height: PropTypes.number,
};
