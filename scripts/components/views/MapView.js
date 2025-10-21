import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import L, { marker, circleMarker, DivIcon, Point, layerGroup } from "leaflet";
import "leaflet.markercluster";
import "../../lib/leaflet-heat";
import PropTypes from "prop-types";
import iconMarkers from "../../../img/icon-markers.png";
import iconCircles from "../../../img/icon-circles.png";

import MapBase from "./MapBase";
import mapHelper from "../../utils/mapHelper";

export default function MapView({
  onMarkerClick = undefined,
  highlightedMarkerIcon = undefined,
  defaultMarkerIcon = undefined,
  layersControlPosition = "bottomright",
  zoomControlPosition = "bottomright",
  zoom = undefined,
  center = undefined,
  disableSwedenMap = false,
  mapData,
}) {
  const [currentView, setCurrentView] = useState("clusters");
  const mapView = useRef();

  // Keep references to overlays so we can remove them cleanly
  const clusterGroupRef = useRef(null);
  const circleGroupRef = useRef(null);

  // Compute valid points once per mapData change
  const points = useMemo(() => {
    const raw = Array.isArray(mapData?.data) ? mapData.data : [];
    return raw.filter((obj) => {
      const loc = obj?.location;
      return (
        Array.isArray(loc) &&
        loc.length === 2 &&
        Number.isFinite(loc[0]) &&
        Number.isFinite(loc[1]) &&
        !(loc[0] === 0 && loc[1] === 0)
      );
    });
  }, [mapData]);

  const removeOverlays = useCallback((map) => {
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    if (circleGroupRef.current) {
      map.removeLayer(circleGroupRef.current);
      circleGroupRef.current = null;
    }
  }, []);

  const updateMap = useCallback(() => {
    const map = mapView.current?.map;
    if (!map) return;

    const doUpdate = () => {
      removeOverlays(map);

      if (currentView === "clusters") {
        // Build markers once
        const markers = points.map((obj) => {
          const icon = obj.has_metadata
            ? highlightedMarkerIcon || mapHelper.markerIconHighlighted
            : defaultMarkerIcon || mapHelper.markerIcon;

          const m = marker([obj.location[0], obj.location[1]], {
            title: obj.name,
            icon,
          });

          if (onMarkerClick) m.on("click", () => onMarkerClick(obj.id));
          return m;
        });

        const clusterGroup = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 45,
          iconCreateFunction(cluster) {
            const childCount = cluster.getChildCount();

            // Choose inner circle color by size bucket 
            const innerBg = childCount < 20 ? "bg-isof" : "bg-darker-isof";

            // Outer dark translucent ring + subtle shadow, inner solid teal circle with centered count
            const html = `
              <div class="w-8 h-8 rounded-full  bg-clip-padding">
                <div class="m-px w-6 h-6 rounded-full ${innerBg} text-white shadow-sm border-1 border-solid border-darker-isof text-xs font-bold flex items-center justify-center">
                  ${childCount}
                </div>
              </div>
            `;

            return new DivIcon({
              html,
              // No legacy classes; keep Leaflet's default container class
              className: "",
              iconSize: new Point(28, 28),
            });
          },
        });

        clusterGroup.addLayers(markers);
        if (clusterGroup.getLayers().length > 0) {
          map.addLayer(clusterGroup);
          clusterGroupRef.current = clusterGroup;
        }
      } else {
        // Circles view
        const circles = points.map((obj) => {
          const count =
            typeof obj.doc_count === "number" && !Number.isNaN(obj.doc_count)
              ? obj.doc_count
              : 1;

          const circle = circleMarker([obj.location[0], obj.location[1]], {
            color: "#01666e",
            fillColor: "black",
            fillOpacity: 0.1,
            title: `${obj.name}`,
            weight: 1,
            radius: Math.max(count / 14, 2),
            interactive: true,
          }).bindTooltip(
            `${obj.name?.replace?.(/ sn$/, " socken") || ""}: ${count} träffar`,
            { permanent: false, direction: "top" }
          );

          if (onMarkerClick) circle.on("click", () => onMarkerClick(obj.id));
          return circle;
        });

        const group = layerGroup(circles);
        if (group.getLayers().length > 0) {
          map.addLayer(group);
          circleGroupRef.current = group;
        }
      }
    };

    // Public API – safe in all cases (fires immediately if ready)
    map.whenReady(doUpdate);
  }, [
    currentView,
    points,
    onMarkerClick,
    highlightedMarkerIcon,
    defaultMarkerIcon,
    removeOverlays,
  ]);

  // Rebuild overlays when data or view changes
  useEffect(() => {
    updateMap();
  }, [updateMap]);

  const handleZoomEnd = useCallback(() => {
    updateMap();
  }, [updateMap]);

  // Keep overlays in sync on zoom changes
  useEffect(() => {
    const map = mapView.current?.map;
    if (!map) return undefined;

    map.whenReady(() => {
      map.on("zoomend", handleZoomEnd);
    });

    return () => {
      map.off("zoomend", handleZoomEnd);
    };
  }, [handleZoomEnd]);

  // Cleanup overlays on unmount
  useEffect(() => {
    return () => {
      const map = mapView.current?.map;
      if (map) removeOverlays(map);
    };
  }, [removeOverlays]);

  const mapBaseLayerChangeHandler = useCallback(() => {
    // If the base layer changes, re-render overlays (icons/zoom scaling/etc.)
    updateMap();
  }, [updateMap]);

  return (
    <div>
      <button
        type="button"
        tabIndex={0}
        onClick={() =>
          setCurrentView((v) => (v === "clusters" ? "circles" : "clusters"))
        }
        aria-pressed={currentView === "circles"}
        aria-label={`Byt till ${
          currentView === "clusters" ? "cirkel-vy" : "kluster-vy"
        }`}
        className="!fixed !bottom-72 right-7 z-[500] bg-white border-2 border-solid border-black/20 p-1.5 h-auto leading-normal"
      >
        <img
          alt={`Byt till ${
            currentView === "clusters" ? "cirkel-vy" : "kluster-vy"
          }`}
          title={`Byt till ${
            currentView === "clusters" ? "cirkel-vy" : "kluster-vy"
          }`}
          src={currentView === "clusters" ? iconCircles : iconMarkers}
          height={37}
          width={43}
        />
      </button>

      <MapBase
        ref={mapView}
        className="map-view"
        layersControlPosition={layersControlPosition}
        zoomControlPosition={zoomControlPosition}
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
  highlightedMarkerIcon: PropTypes.oneOfType([PropTypes.object]),
  defaultMarkerIcon: PropTypes.oneOfType([PropTypes.object]),
  layersControlPosition: PropTypes.string,
  zoomControlPosition: PropTypes.string,
  zoom: PropTypes.number,
  center: PropTypes.arrayOf(PropTypes.number),
  disableSwedenMap: PropTypes.bool,
  mapData: PropTypes.object,
};
