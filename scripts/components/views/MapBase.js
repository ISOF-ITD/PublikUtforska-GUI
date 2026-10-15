import {
  forwardRef, useCallback, useEffect, useImperativeHandle, useRef,
} from 'react';
import { map as createLeafletMap, latLngBounds, control } from "leaflet";
import "leaflet.markercluster";
import "leaflet.locatecontrol";

import mapHelper, {
  fitLocations, fitProjectedBounds, SWEDEN_PROJECTED_BOUNDS, SWEREF_MIN_ZOOM, SWEREF_MAX_ZOOM,
} from '../../utils/mapHelper';

export const SWEDEN_BOUNDS = latLngBounds(
  [55.34267812700013, 11.108164910000113],
  [69.1, 24.163413534000114],
);
const MapBase = forwardRef(function MapBase(props, ref) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const initialBoundsFitRef = useRef(props.center != null || props.zoom != null);
  const pendingLocationsFitRef = useRef(null);

  const fitPendingLocations = useCallback(() => {
    const map = mapRef.current;
    const pending = pendingLocationsFitRef.current;
    if (!map || !pending) return false;
    map.invalidateSize({ animate: false });
    if (!fitLocations(map, pending.locations, pending.options)) return false;
    pendingLocationsFitRef.current = null;
    initialBoundsFitRef.current = true;
    return true;
  }, []);

  const fitInitialBounds = useCallback(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (
      !map
      || !container
      || container.clientWidth === 0
      || container.clientHeight === 0
    ) {
      return false;
    }

    if (pendingLocationsFitRef.current) return fitPendingLocations();
    if (initialBoundsFitRef.current) return false;

    map.invalidateSize({ animate: false });
    if (!fitProjectedBounds(map, SWEDEN_PROJECTED_BOUNDS)) return false;
    initialBoundsFitRef.current = true;
    return true;
  }, [fitPendingLocations]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return undefined;

    let animationFrameId;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(() => {
        mapRef.current?.invalidateSize({ animate: false });
        fitInitialBounds();
      });
    });
    observer.observe(container);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [fitInitialBounds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.attributionControl) return;
    map.attributionControl.setPosition(
      props.attributionControlPosition || "bottomright"
    );
  }, [props.attributionControlPosition]);

  // Expose the instance methods to the parent via ref
  useImperativeHandle(
    ref,
    () => ({
      get map() {
        return mapRef.current;
      },
      invalidateSize: () => {
        if (mapRef.current) mapRef.current.invalidateSize();
      },
      fitInitialBounds,
      fitLocations: (locations, options) => {
        pendingLocationsFitRef.current = { locations, options };
        return fitPendingLocations();
      },
      addMarker: (markerData) => {
        // Keep parity with the API used by SimpleMap
        if (!markerData || !mapRef.current) return;
        const location =
          markerData.lat && markerData.lng
            ? [Number(markerData.lat), Number(markerData.lng)]
            : markerData.location?.lat && markerData.location?.lon
            ? [Number(markerData.location.lat), Number(markerData.location.lon)]
            : null;
        if (!location) return;
        const L = require("leaflet");
        const m = L.marker(location, {
          title: markerData.label || markerData.name || null,
          icon: mapHelper.markerIcon,
        });
        m.addTo(mapRef.current);
        mapRef.current.panTo(location, { animate: true });
      },
    }),
    [fitInitialBounds, fitPendingLocations]
  );

  // Build once on mount
  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;

    const layers = mapHelper.createLayers();
    const overlayLayers = props.ignoreOverlayLayers
      ? undefined
      : mapHelper.createOverlayLayers();

    const backgroundConfig = mapHelper.tileLayers[0];
    const backgroundLayer = layers[backgroundConfig.label];
    const colorSchemeQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    // Force a tile reload while preserving the map view and overlays.
    const handleColorSchemeChange = ({ matches = false } = {}) => {
      backgroundLayer.setUrl(matches ? backgroundConfig.darkModeUrl : backgroundConfig.url, false);
    };
    handleColorSchemeChange(colorSchemeQuery);
    const visibleLayers = [backgroundLayer];

    // Add first overlay layer if it’s explicitly not hidden
    if (overlayLayers) {
      const firstOverlay = overlayLayers[Object.keys(overlayLayers)[0]];
      if (firstOverlay?.wmsParams?.hidden === false) {
        visibleLayers.push(firstOverlay);
      }
    }

    const clampZoom = (value, fallback) => {
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? fallback : Math.max(
        SWEREF_MIN_ZOOM,
        Math.min(SWEREF_MAX_ZOOM, parsed),
      );
    };
    const minZoom = clampZoom(props.minZoom, SWEREF_MIN_ZOOM);
    const maxZoom = Math.max(minZoom, clampZoom(props.maxZoom, SWEREF_MAX_ZOOM));
    const mapOptions = {
      crs: mapHelper.getSweref99crs(),
      center: props.center || SWEDEN_BOUNDS.getCenter(),
      zoom: Math.max(minZoom, Math.min(maxZoom, clampZoom(props.zoom, 0))),
      minZoom,
      maxZoom,
      zoomSnap: 0.25,
      layers: visibleLayers,
      scrollWheelZoom: false,
      zoomControl: false,
      dragging: !props.disableInteraction,
      touchZoom: !props.disableInteraction,
      doubleClickZoom: !props.disableInteraction,
      boxZoom: !props.disableInteraction,
      keyboard: !props.disableInteraction,
    };

    const map = createLeafletMap(containerRef.current, mapOptions);
    mapRef.current = map;
    colorSchemeQuery?.addEventListener('change', handleColorSchemeChange);
    if (map.attributionControl) {
      map.attributionControl.setPosition(
        props.attributionControlPosition || "bottomright"
      );
    }

    let removeLayerOverlayListeners = () => {};

    map.whenReady(() => {
      fitInitialBounds();

      if (props.disableInteraction && map.tap) {
        map.tap.disable();
      }

      if (!props.disableInteraction) {
        if (props.scrollWheelZoom) map.scrollWheelZoom.enable();

        control
          .zoom({ position: props.zoomControlPosition || "topright" })
          .addTo(map);

        if (!props.disableLocateControl) {
          control
            .locate({
              showPopup: false,
              icon: "map-location-icon",
              position: props.zoomControlPosition || "topright",
              locateOptions: { maxZoom: 5 },
              markerStyle: { weight: 2, fillColor: "#ffffff", fillOpacity: 1 },
              circleStyle: { weight: 1, color: "#a6192e" },
            })
            .addTo(map);
        }

        control
          .layers({}, overlayLayers, {
            position: props.layersControlPosition || "topright",
          })
          .addTo(map);
      }

      // Replace d3-selection with tiny DOM toggling to keep behavior
      const toggleBtn = containerRef.current?.querySelector(
        ".leaflet-control-layers-toggle"
      );
      const listEl = containerRef.current?.querySelector(
        ".leaflet-control-layers-list"
      );
      const layersControlEl = containerRef.current?.querySelector(
        ".leaflet-control-layers"
      );
      if (toggleBtn && listEl && layersControlEl) {
        const showLayerList = () => {
          listEl.style.display = "block";
          toggleBtn.style.display = "none";
        };
        const hideLayerList = () => {
          listEl.style.display = "none";
          toggleBtn.style.display = "block";
        };
        const isLayerListOpen = () => listEl.style.display !== "none";
        const onToggleClick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (isLayerListOpen()) hideLayerList();
          else showLayerList();
        };
        const onPointerDownOutside = (event) => {
          if (!isLayerListOpen()) return;
          if (!(event.target instanceof Element)) return;
          if (layersControlEl.contains(event.target)) return;
          hideLayerList();
        };
        const onKeyDown = (event) => {
          if (event.key === "Escape") hideLayerList();
        };

        toggleBtn.style.opacity = 1;
        hideLayerList();

        toggleBtn.addEventListener("click", onToggleClick);
        document.addEventListener("pointerdown", onPointerDownOutside);
        document.addEventListener("keydown", onKeyDown);

        removeLayerOverlayListeners = () => {
          toggleBtn.removeEventListener("click", onToggleClick);
          document.removeEventListener("pointerdown", onPointerDownOutside);
          document.removeEventListener("keydown", onKeyDown);
        };
      }
    });

    // Cleanup on unmount
    return () => {
      try {
        colorSchemeQuery?.removeEventListener('change', handleColorSchemeChange);
        removeLayerOverlayListeners();
        if (mapRef.current) {
          mapRef.current.off();
          mapRef.current.remove();
        }
      } finally {
        mapRef.current = null;
        initialBoundsFitRef.current = props.center != null || props.zoom != null;
        pendingLocationsFitRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If a `marker` prop is passed (some subclasses/parents use it)
  useEffect(() => {
    if (!props.marker) return;
    if (!mapRef.current) return;
    // Prefer subclass hook if host passed onAddMarker
    if (typeof props.onAddMarker === "function") {
      props.onAddMarker(props.marker, mapRef.current);
    } else {
      // fall back to our exposed method
      ref?.current?.addMarker?.(props.marker);
    }
  }, [props.marker, props.onAddMarker, ref]);

  // Height passthrough
  const style = props.mapHeight
    ? {
        height: props.mapHeight.includes("px")
          ? props.mapHeight
          : `${props.mapHeight}px`,
      }
    : undefined;
  const mapAriaLabel = props.ariaLabel
    || (props.disableInteraction
      ? 'Karta över vald plats'
      : 'Interaktiv karta med sökresultat');

  return (
    <div
      className={props.className || "mb-5 h-52"}
      ref={containerRef}
      style={style}
      role="region"
      aria-label={mapAriaLabel}
      aria-describedby={props.ariaDescribedBy}
    />
  );
});

export default MapBase;
