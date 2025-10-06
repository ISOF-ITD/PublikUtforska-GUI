import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { map as createLeafletMap, latLngBounds, control, CRS } from "leaflet";
import "leaflet.markercluster";
import "leaflet.locatecontrol";
import "../../lib/leaflet.active-layers";

import mapHelper from "../../utils/mapHelper";

const MapBase = forwardRef(function MapBase(props, ref) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersControlRef = useRef(null);
  const initializedRef = useRef(false); // guard against React 18 StrictMode double effects in dev

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
    []
  );

  // Build once on mount
  useEffect(() => {
    if (initializedRef.current) return; // StrictMode guard (dev only)
    if (!containerRef.current || typeof window === "undefined") return;
    initializedRef.current = true;

    const layers = mapHelper.createLayers();
    const overlayLayers = props.ignoreOverlayLayers
      ? undefined
      : mapHelper.createOverlayLayers();

    if (props.disableSwedenMap) {
      delete layers[mapHelper.tileLayers[0].label];
    }

    // Add first baselayer to map
    const visibleLayers = [layers[Object.keys(layers)[0]]];

    // Add first overlay layer if it’s explicitly not hidden
    if (overlayLayers) {
      const firstOverlay = overlayLayers[Object.keys(overlayLayers)[0]];
      if (firstOverlay?.wmsParams?.hidden === false) {
        visibleLayers.push(firstOverlay);
      }
    }

    const SWEDEN = latLngBounds(
      [55.34267812700013, 11.108164910000113],
      [69.03635569300009, 24.163413534000114]
    );

    const mapOptions = {
      center: props.center || SWEDEN.getCenter(),
      zoom: parseInt(props.zoom, 10) || 5,
      minZoom: parseInt(props.minZoom, 10) || 5,
      maxZoom: parseInt(props.maxZoom, 10) || 17,
      layers: visibleLayers,
      scrollWheelZoom: false,
      zoomControl: false,
      dragging: !props.disableInteraction,
      touchZoom: !props.disableInteraction,
      doubleClickZoom: !props.disableInteraction,
      boxZoom: !props.disableInteraction,
      keyboard: !props.disableInteraction,
    };

    if (
      !props.disableSwedenMap &&
      Object.keys(layers)[0].includes("(SWEREF99)")
    ) {
      mapOptions.crs = mapHelper.getSweref99crs();
      mapOptions.zoom = 1;
      mapOptions.minZoom = 1;
    }

    const map = createLeafletMap(containerRef.current, mapOptions);
    mapRef.current = map;

    // Force initial view so Leaflet flips _loaded = true
    map.setView(
      props.center || SWEDEN.getCenter(),
      parseInt(props.zoom, 10) || 5,
      { animate: false }
    );

    const handleBaseLayerChange = (event) => {
      // Keep exact behavior
      if (
        event.name.includes("(SWEREF99)") &&
        map.options.crs.code !== "EPSG:3006"
      ) {
        const c = map.getCenter();
        const z = map.getZoom();
        map.options.crs = mapHelper.getSweref99crs();
        map.options.minZoom = 1;
        map.options.maxZoom = 13;
        map.setView(c, z - 4, { animate: false });
      }
      if (
        !event.name.includes("(SWEREF99)") &&
        map.options.crs.code === "EPSG:3006"
      ) {
        const c = map.getCenter();
        const z = map.getZoom();
        map.options.crs = CRS.EPSG3857;
        map.options.minZoom = 4;
        map.options.maxZoom = 16;
        map.setView(c, z + 4, { animate: false });
      }
      if (props.onBaseLayerChange) props.onBaseLayerChange(event);
    };

    map.whenReady(() => {
      map.fitBounds(SWEDEN, {
        paddingTopLeft: window.innerWidth >= 550 ? [400, 0] : [0, 100],
      });

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
              locateOptions: { maxZoom: 9 },
              markerStyle: { weight: 2, fillColor: "#ffffff", fillOpacity: 1 },
              circleStyle: { weight: 1, color: "#a6192e" },
            })
            .addTo(map);
        }

        layersControlRef.current = control
          .activeLayers(layers, overlayLayers, {
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
      if (toggleBtn && listEl) {
        toggleBtn.style.display = "block";
        toggleBtn.style.opacity = 1;
        listEl.style.display = "none";
        toggleBtn.addEventListener("click", () => {
          listEl.style.display = "block";
          toggleBtn.style.display = "none";
        });
        listEl.addEventListener("mouseleave", () => {
          listEl.style.display = "none";
          toggleBtn.style.display = "block";
        });
      }

      map.on("baselayerchange", handleBaseLayerChange);

      if (typeof window !== "undefined" && window.eventBus) {
        const handler = (event, data) => {
          if (
            !props.disableSwedenMap &&
            data?.includeNordic &&
            layersControlRef.current &&
            layersControlRef.current
              .getActiveBaseLayer?.()
              .name?.indexOf("Lantmäteriet") > -1
          ) {
            const targetName = "Open Street Map Mapnik";
            const entry = Object.values(
              layersControlRef.current._layers || {}
            ).find((l) => !l.overlay && l.name === targetName);
            if (entry) {
              entry.layer.addTo(map);
              if (
                typeof layersControlRef.current._onInputClick === "function"
              ) {
                layersControlRef.current._onInputClick();
              }
            }
          }
        };
        window.eventBus.addEventListener("nordicLegendsUpdate", handler);
        // Store so we can remove on cleanup
        window.__mapbase_nordic_handler__ = handler;
      }
    });

    // Cleanup on unmount
    return () => {
      try {
        if (
          typeof window !== "undefined" &&
          window.eventBus &&
          window.__mapbase_nordic_handler__
        ) {
          window.eventBus.removeEventListener(
            "nordicLegendsUpdate",
            window.__mapbase_nordic_handler__
          );
          delete window.__mapbase_nordic_handler__;
        }
        if (mapRef.current) {
          mapRef.current.off();
          mapRef.current.remove();
        }
      } finally {
        mapRef.current = null;
        layersControlRef.current = null;
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

  return (
    <div
      className={props.className || "map-container small"}
      ref={containerRef}
      style={style}
    />
  );
});

export default MapBase;
