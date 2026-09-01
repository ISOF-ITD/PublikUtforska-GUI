import {
  useRef, useEffect, useState, useCallback, useMemo, useId,
} from 'react';
import {
  circleMarker,
  layerGroup,
} from 'leaflet';
// import L, {
//   marker,
//   DivIcon,
//   Point,
//   latLngBounds,
// } from 'leaflet';
// import 'leaflet.markercluster';
import '../../lib/leaflet-heat';
import PropTypes from 'prop-types';

import MapBase from './MapBase';

/* Inaktiv kluster- och landskapsvy.
const LANDSCAPE_MAX_ZOOM = 6;
const SOCKEN_MARKER_MIN_ZOOM = 9;
const FALLBACK_REGION_NAME = '';
*/
const MARKER_NAVIGATION_ROW_HEIGHT = 44;
const MARKER_NAVIGATION_SELECTOR = [
  '.leaflet-marker-pane .leaflet-marker-icon',
  '.leaflet-overlay-pane [data-map-marker-kind]',
].join(', ');
const NEXT_MARKER_KEYS = new Set(['ArrowDown', 'ArrowRight']);
const PREVIOUS_MARKER_KEYS = new Set(['ArrowUp', 'ArrowLeft']);
const COUNT_FORMATTER = new Intl.NumberFormat('sv-SE');
/* Inaktiva hjälpfunktioner för kluster- och landskapsvyn.
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => HTML_ENTITIES[character]);
}

function getLandscapeName(point) {
  const landscape = typeof point.landskap === 'string' ? point.landskap.trim() : '';
  return landscape.toLocaleLowerCase('sv') === 'ingen' ? '' : landscape;
}

function hasPlaceholderLandscape(point) {
  return typeof point.landskap === 'string'
    && point.landskap.trim().toLocaleLowerCase('sv') === 'ingen';
}

function getRegionDescriptor(point, assignedLandscape = '') {
  const landscape = assignedLandscape || getLandscapeName(point);
  if (landscape) {
    return {
      key: `landskap:${landscape}`,
      name: landscape,
    };
  }

  const fallbackRegion = [point.fylke, point.lan]
    .find((value) => typeof value === 'string' && value.trim())
    ?.trim();
  if (fallbackRegion) {
    return {
      key: `reservregion:${fallbackRegion}`,
      name: `${fallbackRegion}`,
    };
  }

  const pointIdentifier = point.id || `${point.name}:${point.location.join(',')}`;
  const pointName = point.name?.replace?.(/ sn$/, ' socken') || FALLBACK_REGION_NAME;
  return {
    key: `plats:${pointIdentifier}`,
    name: `${pointName}`,
  };
}

function getCoordinateDistanceSquared(firstPoint, secondPoint) {
  const latitudeDelta = firstPoint.location[0] - secondPoint.location[0];
  const averageLatitude = (
    (firstPoint.location[0] + secondPoint.location[0]) / 2
  ) * (Math.PI / 180);
  const longitudeDelta = (
    firstPoint.location[1] - secondPoint.location[1]
  ) * Math.cos(averageLatitude);
  return latitudeDelta ** 2 + longitudeDelta ** 2;
}

function findNearestLandscape(point, landscapePoints) {
  const nearestPoint = landscapePoints.reduce((nearest, candidate) => {
    const distance = getCoordinateDistanceSquared(point, candidate.point);
    if (!nearest || distance < nearest.distance) {
      return { ...candidate, distance };
    }
    return nearest;
  }, null);
  return nearestPoint?.landscape || '';
}
*/

function getElementCenter(element, containerBounds) {
  const bounds = element.getBoundingClientRect();
  return {
    element,
    x: bounds.left - containerBounds.left + bounds.width / 2,
    y: bounds.top - containerBounds.top + bounds.height / 2,
  };
}

function getSortedMarkerElements(map) {
  const container = map.getContainer();
  const containerBounds = container.getBoundingClientRect();
  const positionedMarkers = Array.from(
    container.querySelectorAll(MARKER_NAVIGATION_SELECTOR),
  )
    .filter((element) => {
      const bounds = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return bounds.width > 0
        && bounds.height > 0
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number.parseFloat(style.opacity || '1') > 0
        && bounds.right >= containerBounds.left
        && bounds.left <= containerBounds.right
        && bounds.bottom >= containerBounds.top
        && bounds.top <= containerBounds.bottom;
    })
    .map((element) => getElementCenter(element, containerBounds))
    .sort((firstMarker, secondMarker) => (
      firstMarker.y - secondMarker.y || firstMarker.x - secondMarker.x
    ));
  const rows = [];

  positionedMarkers.forEach((markerPosition) => {
    const currentRow = rows[rows.length - 1];
    if (
      !currentRow
      || markerPosition.y - currentRow.northernEdge > MARKER_NAVIGATION_ROW_HEIGHT
    ) {
      rows.push({
        markers: [markerPosition],
        northernEdge: markerPosition.y,
      });
    } else {
      currentRow.markers.push(markerPosition);
    }
  });

  return rows.flatMap((row) => row.markers
    .sort((firstMarker, secondMarker) => firstMarker.x - secondMarker.x)
    .map(({ element }) => element));
}

function prepareMarkerElement(element, activeElement) {
  const labelledChild = element.querySelector('[aria-label]');
  const label = element.dataset.mapMarkerLabel
    || labelledChild?.getAttribute('aria-label')
    || element.getAttribute('aria-label')
    || element.getAttribute('title')
    || 'Kartmarkör';
  const markerKind = element.dataset.mapMarkerKind
    || labelledChild?.dataset.mapMarkerKind
    || 'socken';

  element.setAttribute('data-map-marker-kind', markerKind);
  element.setAttribute('data-map-marker-label', label);
  element.setAttribute('aria-label', label);
  element.setAttribute('title', label);
  element.setAttribute('aria-keyshortcuts', 'ArrowUp ArrowDown ArrowLeft ArrowRight Enter Space Escape Home End');
  element.setAttribute('role', 'button');
  element.setAttribute('tabindex', element === activeElement ? '0' : '-1');
  if (labelledChild && labelledChild !== element) {
    labelledChild.setAttribute('aria-hidden', 'true');
  }
}

/* Inaktiva hjälpfunktioner för kluster- och landskapsvyn.
function sortPointsById(firstPoint, secondPoint) {
  return String(firstPoint.id).localeCompare(String(secondPoint.id), 'sv');
}
*/

function formatHitCount(count) {
  return `${COUNT_FORMATTER.format(count)} ${count === 1 ? 'träff' : 'träffar'}`;
}

/* Inaktiva formatterare och ikoner för kluster- och landskapsvyn.
function formatPlaceCount(count) {
  return `${COUNT_FORMATTER.format(count)} ${count === 1 ? 'socken' : 'socknar'}`;
}

function formatRegionNames(regionNames) {
  const sortedNames = [...new Set(regionNames)].sort((firstName, secondName) => (
    firstName.localeCompare(secondName, 'sv')
  ));
  if (sortedNames.length < 2) return sortedNames[0] || FALLBACK_REGION_NAME;
  return `${sortedNames.slice(0, -1).join(', ')} och ${sortedNames[sortedNames.length - 1]}`;
}

function getLandscapeClusterDetails(childMarkers) {
  const regionData = childMarkers
    .map((childMarker) => childMarker.regionData)
    .filter(Boolean);
  const documentCount = regionData.reduce(
    (total, region) => total + region.documentCount,
    0,
  );
  const placeCount = regionData.reduce(
    (total, region) => total + region.placeCount,
    0,
  );
  const regionNames = formatRegionNames(regionData.map((region) => region.name));
  const summary = [
    `${regionNames}: ${formatHitCount(documentCount)}`,
    `i ${formatPlaceCount(placeCount)}`,
  ].join(' ');

  return {
    documentCount,
    summary,
  };
}

function createCountIcon(count, { accessibleLabel = '', large = false } = {}) {
  const countText = COUNT_FORMATTER.format(count);
  const iconSize = large ? 36 : 32;
  const sizeClasses = large ? 'h-9 w-9 border-2' : 'h-8 w-8 border';
  const textSizeClass = countText.length > 4 ? 'text-[10px]' : 'text-xs';
  const backgroundClass = count < 100 ? 'bg-primary' : 'bg-primary-hover';
  const escapedLabel = escapeHtml(accessibleLabel);
  const accessibilityAttributes = accessibleLabel
    ? [
      'role="img"',
      `aria-label="${escapedLabel}"`,
      `title="${escapedLabel}"`,
      `data-map-marker-label="${escapedLabel}"`,
    ].join(' ')
    : 'aria-hidden="true"';

  return new DivIcon({
    html: `
      <div ${accessibilityAttributes} data-map-marker-kind="cluster"
        class="flex items-center justify-center rounded-full border-solid
          border-primary-hover ${sizeClasses} ${backgroundClass} ${textSizeClass}
          font-bold text-white shadow-sm">
        ${countText}
      </div>
    `,
    className: '',
    iconSize: new Point(iconSize, iconSize),
    iconAnchor: new Point(iconSize / 2, iconSize / 2),
  });
}

function createSockenCountIcon(count, { accessibleLabel, highlighted = false }) {
  const countText = COUNT_FORMATTER.format(count);
  const escapedLabel = escapeHtml(accessibleLabel);
  const textSizeClass = countText.length > 6 ? 'text-[9px]' : 'text-xs';
  const backgroundClass = highlighted ? 'bg-accent' : 'bg-surface';
  const highlightClass = highlighted ? 'ring-2 ring-focus' : '';
  const textColorClass = highlighted ? 'text-primary' : 'text-body';

  return new DivIcon({
    html: `
      <div role="img" aria-label="${escapedLabel}" title="${escapedLabel}"
        data-map-marker-kind="socken" data-map-marker-label="${escapedLabel}"
        class="relative h-11 w-11">
        <div aria-hidden="true"
          class="absolute left-1/2 top-1 flex h-8 w-8 -translate-x-1/2
            -rotate-45 items-center justify-center rounded-[50%_50%_50%_0]
            border-2 border-solid border-focus ${backgroundClass} ${highlightClass}
            shadow-md">
          <span class="rotate-45 ${textSizeClass} ${textColorClass} font-bold">${countText}</span>
        </div>
      </div>
    `,
    className: '',
    iconSize: new Point(44, 44),
    iconAnchor: new Point(22, 43),
    popupAnchor: new Point(0, -44),
  });
}
*/

export default function MapView({
  onMarkerClick = undefined,
  // highlightedMarkerIcon = undefined,
  // defaultMarkerIcon = undefined,
  layersControlPosition = 'bottomright',
  zoomControlPosition = 'bottomright',
  zoom = undefined,
  center = undefined,
  disableSwedenMap = false,
  mapData,
  isMobileViewport = false,
  active = true,
  layout = 'full',
}) {
  const [keyboardAnnouncement, setKeyboardAnnouncement] = useState('');
  const mapView = useRef();

  // Keep references to overlays so we can remove them cleanly
  const clusterGroupRef = useRef(null);
  // const clusterPreviewGroupRef = useRef(null);
  const renderedOverlayModeRef = useRef(null);
  const pendingMarkerFocusRef = useRef(null);

  // Compute valid points once per mapData change
  const points = useMemo(() => {
    const raw = Array.isArray(mapData?.data) ? mapData.data : [];
    return raw.filter((obj) => {
      const loc = obj?.location;
      return (
        Array.isArray(loc)
        && loc.length === 2
        && Number.isFinite(loc[0])
        && Number.isFinite(loc[1])
        && !(loc[0] === 0 && loc[1] === 0)
      );
    });
  }, [mapData]);
  /* Inaktiv gruppering för kluster- och landskapsvyn.
  const regions = useMemo(() => {
    const groupedPoints = new Map();
    const landscapePoints = points
      .map((point) => ({
        landscape: getLandscapeName(point),
        point,
      }))
      .filter(({ landscape }) => landscape)
      .sort((firstItem, secondItem) => (
        sortPointsById(firstItem.point, secondItem.point)
      ));

    points.forEach((point) => {
      const assignedLandscape = hasPlaceholderLandscape(point)
        ? findNearestLandscape(point, landscapePoints)
        : '';
      const region = getRegionDescriptor(point, assignedLandscape);
      if (!groupedPoints.has(region.key)) {
        groupedPoints.set(region.key, {
          name: region.name,
          points: [],
        });
      }
      groupedPoints.get(region.key).points.push(point);
    });

    return Array.from(groupedPoints.values(), (region) => ({
      name: region.name,
      points: region.points.sort(sortPointsById),
    })).sort((firstRegion, secondRegion) => (
      firstRegion.name.localeCompare(secondRegion.name, 'sv')
    ));
  }, [points]);
  */
  const mapSummaryId = useId();
  const mapKeyboardInstructionsId = useId();
  const mapSummaryText = useMemo(() => {
    if (!points.length) {
      return 'Kartan visar inga platser för nuvarande urval.';
    }
    return `Kartan visar ${points.length} platser i cirkelvy. Välj en cirkel för att visa relaterade sökresultat.`;
  }, [points.length]);

  /* Inaktiv förhandsvisning för kluster- och landskapsvyn.
  const clearClusterPreview = useCallback((map = mapView.current?.map) => {
    if (map && clusterPreviewGroupRef.current) {
      map.removeLayer(clusterPreviewGroupRef.current);
      clusterPreviewGroupRef.current = null;
    }
  }, []);
  */

  const removeOverlays = useCallback((map) => {
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    renderedOverlayModeRef.current = null;
  }, []);

  const getDocumentCount = useCallback((obj) => (
    typeof obj.doc_count === 'number' && !Number.isNaN(obj.doc_count)
      ? obj.doc_count
      : 1
  ), []);

  const getSockenName = useCallback((obj) => (
    (obj.name?.replace?.(/ sn$/, ' socken') || '')
    // add landskap if available and is not "ingen"
    + (obj.landskap && obj.landskap.trim().toLocaleLowerCase('sv') !== 'ingen'
      ? `, ${obj.landskap}`
      : ''
    )
  ), []);

  /* Inaktiva markörer och förhandsvisningar för kluster- och landskapsvyn.
  const createPointMarker = useCallback((obj) => {
    const count = getDocumentCount(obj);
    const sockenName = getSockenName(obj);
    const label = `${sockenName}: ${formatHitCount(count)}`;
    const providedIcon = obj.has_metadata
      ? highlightedMarkerIcon
      : defaultMarkerIcon;
    const icon = providedIcon || createSockenCountIcon(count, {
      accessibleLabel: label,
      highlighted: Boolean(obj.has_metadata),
    });
    const pointMarker = marker([obj.location[0], obj.location[1]], {
      alt: label,
      title: label,
      icon,
    });
    pointMarker.pointData = obj;
    pointMarker.on('add', () => {
      const element = pointMarker.getElement();
      if (!element) return;
      element.dataset.mapMarkerKind = 'socken';
      element.dataset.mapMarkerLabel = label;
    });

    if (onMarkerClick) pointMarker.on('click', () => onMarkerClick(obj.id));
    return pointMarker;
  }, [
    defaultMarkerIcon,
    getDocumentCount,
    getSockenName,
    highlightedMarkerIcon,
    onMarkerClick,
  ]);

  const getMarkerTotals = useCallback((childMarkers) => ({
    documentCount: childMarkers.reduce(
      (total, childMarker) => total + getDocumentCount(childMarker.pointData),
      0,
    ),
    placeCount: childMarkers.length,
  }), [getDocumentCount]);

  const createLandscapeMarker = useCallback((region, map) => {
    let latitudeTotal = 0;
    let longitudeTotal = 0;
    let documentCount = 0;
    const locations = [];

    region.points.forEach((point) => {
      const count = getDocumentCount(point);
      latitudeTotal += point.location[0];
      longitudeTotal += point.location[1];
      documentCount += count;
      locations.push([point.location[0], point.location[1]]);
    });

    const placeCount = region.points.length;
    const summary = [
      `${region.name}: ${formatHitCount(documentCount)}`,
      `i ${formatPlaceCount(placeCount)}`,
    ].join(' ');
    const regionMarker = marker(
      [latitudeTotal / placeCount, longitudeTotal / placeCount],
      {
        alt: summary,
        title: summary,
        icon: createCountIcon(documentCount, {
          accessibleLabel: summary,
          large: true,
        }),
      },
    );
    const regionBounds = latLngBounds(locations);
    regionMarker.regionData = {
      documentCount,
      name: region.name,
      placeCount,
      points: region.points,
    };

    regionMarker.on('click', () => {
      map.fitBounds(regionBounds, {
        maxZoom: LANDSCAPE_MAX_ZOOM + 1,
        padding: [40, 40],
      });
    });

    return regionMarker;
  }, [getDocumentCount]);

  const createPreviewCircle = useCallback((obj) => {
    const count = getDocumentCount(obj);
    return circleMarker([obj.location[0], obj.location[1]], {
      color: '#01666e',
      fillColor: '#01666e',
      fillOpacity: 0.35,
      title: `${obj.name}`,
      weight: 2,
      radius: Math.max(Math.min(count / 18, 9), 4),
      interactive: false,
    });
  }, [getDocumentCount]);
  */

  const createSockenCircle = useCallback((obj) => {
    const count = getDocumentCount(obj);
    const currentZoom = mapView.current?.map?.getZoom() ?? 0;
    const circleTooltip = `${getSockenName(obj)}: ${formatHitCount(count)}`;

    // Adjust circle radius based on document count and zoom level:
    // The radius increases with the number of documents and the zoom level
    // but is capped to avoid overly large circles at high zoom levels.
    // and has a minimum size to ensure visibility at low zoom levels and low document counts.
    // == fler träffar ger större cirklar, men cirklarna får aldrig bli mindre än den zoomanpassade minimistorleken. ==
    const circleRadius = Math.max(
      (count / 14) * (currentZoom / 5),
      currentZoom / 1.5,
    );

    const sockenCircle = circleMarker([obj.location[0], obj.location[1]], {
      color: 'white',
      fillColor: '#01666e',

      // Adjust fill opacity based on zoom level:
      // The map is more detailed at higher zoom levels,
      // so we can use a higher fill opacity to make the circles more visible.
      fillOpacity: currentZoom < 8 ? 0.65 : 0.9,

      title: `${obj.name}`,
      weight: 1,
      radius: circleRadius,
      interactive: true,
    }).bindTooltip(
      circleTooltip,
      { permanent: false, direction: 'top' },
    );

    if (onMarkerClick) {
      sockenCircle.on('click', () => onMarkerClick(obj.id));
    }

    return sockenCircle;
  }, [getDocumentCount, getSockenName, onMarkerClick]);

  /* Inaktiva förhandsvisningar för kluster- och landskapsvyn.
  const showClusterPreview = useCallback((cluster) => {
    const map = mapView.current?.map;
    if (!map) return;

    clearClusterPreview(map);

    const childMarkers = cluster.getAllChildMarkers();
    const previewCircles = childMarkers
      .map((childMarker) => childMarker.pointData)
      .filter(Boolean)
      .map(createPreviewCircle);

    if (!previewCircles.length) return;

    const previewGroup = layerGroup(previewCircles);
    map.addLayer(previewGroup);
    previewCircles.forEach((circle) => circle.bringToFront());
    clusterPreviewGroupRef.current = previewGroup;
  }, [clearClusterPreview, createPreviewCircle]);

  const showLandscapePreview = useCallback((sourceLayer, regionMarkers) => {
    const map = mapView.current?.map;
    if (!map) return;

    clearClusterPreview(map);
    const landscapeMarkers = regionMarkers || [sourceLayer];
    const previewCircles = landscapeMarkers
      .flatMap((landscapeMarker) => landscapeMarker.regionData?.points || [])
      .map(createPreviewCircle);

    if (previewCircles.length) {
      const previewGroup = layerGroup(previewCircles);
      map.addLayer(previewGroup);
      previewCircles.forEach((circle) => circle.bringToFront());
      clusterPreviewGroupRef.current = previewGroup;
    }
  }, [clearClusterPreview, createPreviewCircle]);
  */

  const updateMap = useCallback(({ force = false } = {}) => {
    const map = mapView.current?.map;
    if (!map) return;

    const doUpdate = () => {
      const overlayMode = 'circles';
      // const overlayMode = map.getZoom() <= LANDSCAPE_MAX_ZOOM
      //   ? 'landscapes'
      //   : 'clusters';

      if (!force && renderedOverlayModeRef.current === overlayMode) return;
      removeOverlays(map);

      if (overlayMode === 'circles') {
        const circleGroup = layerGroup(points.map(createSockenCircle));
        if (circleGroup.getLayers().length > 0) {
          map.addLayer(circleGroup);
          clusterGroupRef.current = circleGroup;
        }
      }

      /* Inaktiv kluster- och landskapsvy.
      else if (overlayMode === 'landscapes') {
        const landscapeMarkers = regions.map(
          (region) => createLandscapeMarker(region, map),
        );
        const landscapeGroup = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 45,
          disableClusteringAtZoom: LANDSCAPE_MAX_ZOOM + 1,
          iconCreateFunction(cluster) {
            const { documentCount, summary } = getLandscapeClusterDetails(
              cluster.getAllChildMarkers(),
            );
            return createCountIcon(documentCount, {
              accessibleLabel: summary,
              large: true,
            });
          },
        });
        landscapeMarkers.forEach((landscapeMarker) => {
          landscapeMarker.on('mouseover', () => (
            showLandscapePreview(landscapeMarker)
          ));
          landscapeMarker.on('mouseout', () => clearClusterPreview(map));
        });

        landscapeGroup.on('clustermouseover', (event) => (
          showLandscapePreview(event.layer, event.layer.getAllChildMarkers())
        ));
        landscapeGroup.on('clustermouseout', () => clearClusterPreview(map));
        landscapeGroup.on('clusterclick', (event) => (
          showLandscapePreview(event.layer, event.layer.getAllChildMarkers())
        ));
        landscapeGroup.addLayers(landscapeMarkers);
        if (landscapeGroup.getLayers().length > 0) {
          map.addLayer(landscapeGroup);
          clusterGroupRef.current = landscapeGroup;
        }
      } else {
        const regionClusterGroups = regions.map((region) => {
          const clusterGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 45,
            disableClusteringAtZoom: SOCKEN_MARKER_MIN_ZOOM,
            iconCreateFunction(cluster) {
              const childMarkers = cluster.getAllChildMarkers();
              const { documentCount, placeCount } = getMarkerTotals(childMarkers);
              const summary = [
                `${region.name}: ${formatHitCount(documentCount)}`,
                `i ${formatPlaceCount(placeCount)}`,
              ].join(' ');
              return createCountIcon(documentCount, {
                accessibleLabel: summary,
              });
            },
          });
          const showPreview = (event) => showClusterPreview(event.layer);

          clusterGroup.on('clustermouseover', showPreview);
          clusterGroup.on('clustermouseout', () => clearClusterPreview(map));
          clusterGroup.on('clusterclick', showPreview);
          clusterGroup.addLayers(region.points.map(createPointMarker));
          return clusterGroup;
        });
        const clusterContainer = layerGroup(regionClusterGroups);

        if (clusterContainer.getLayers().length > 0) {
          map.addLayer(clusterContainer);
          clusterGroupRef.current = clusterContainer;
        }
      }
      */
      renderedOverlayModeRef.current = overlayMode;
    };

    // Public API – safe in all cases (fires immediately if ready)
    map.whenReady(doUpdate);
  }, [
    points,
    removeOverlays,
    createSockenCircle,
  ]);

  // Rebuild overlays when data or view changes
  useEffect(() => {
    updateMap({ force: true });
  }, [updateMap]);

  const handleZoomEnd = useCallback(() => {
    updateMap({ force: true });
  }, [updateMap]);

  // Keep overlays in sync on zoom changes
  useEffect(() => {
    if (!active) return undefined;
    const map = mapView.current?.map;
    if (!map) return undefined;

    map.whenReady(() => {
      map.on('zoomend', handleZoomEnd);
    });

    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [active, handleZoomEnd]);

  useEffect(() => {
    if (!active) return undefined;
    const map = mapView.current?.map;
    if (!map) return undefined;

    const container = map.getContainer();
    const markerPane = map.getPane('markerPane');
    const overlayPane = map.getPane('overlayPane');
    let firstAnimationFrameId;
    let secondAnimationFrameId;
    let shouldRestorePendingFocus = false;

    const focusMarker = (targetMarker, markers) => {
      markers.forEach((markerElement) => {
        markerElement.setAttribute(
          'tabindex',
          markerElement === targetMarker ? '0' : '-1',
        );
      });
      targetMarker.focus({ preventScroll: true });
    };

    const synchronizeMarkers = (restorePendingFocus = false) => {
      const markers = getSortedMarkerElements(map);
      const { activeElement } = document;
      markers.forEach((markerElement) => (
        prepareMarkerElement(markerElement, activeElement)
      ));

      if (!restorePendingFocus || !pendingMarkerFocusRef.current) return;

      const { latLng } = pendingMarkerFocusRef.current;
      pendingMarkerFocusRef.current = null;
      if (!markers.length) {
        container.focus({ preventScroll: true });
        setKeyboardAnnouncement('Kartan har uppdaterats. Inga synliga markörer finns.');
        return;
      }

      const containerBounds = container.getBoundingClientRect();
      const targetPoint = map.latLngToContainerPoint(latLng);
      const nearestMarker = markers.reduce((nearest, markerElement) => {
        const markerPosition = getElementCenter(markerElement, containerBounds);
        const distance = (markerPosition.x - targetPoint.x) ** 2
          + (markerPosition.y - targetPoint.y) ** 2;
        if (!nearest || distance < nearest.distance) {
          return { distance, element: markerElement };
        }
        return nearest;
      }, null)?.element;

      if (nearestMarker) {
        focusMarker(nearestMarker, markers);
        setKeyboardAnnouncement(
          `Kartan har zoomats. ${markers.length} synliga markörer.`,
        );
      }
    };

    const scheduleMarkerSynchronization = ({ restorePendingFocus = false } = {}) => {
      shouldRestorePendingFocus = shouldRestorePendingFocus || restorePendingFocus;
      window.cancelAnimationFrame(firstAnimationFrameId);
      window.cancelAnimationFrame(secondAnimationFrameId);
      firstAnimationFrameId = window.requestAnimationFrame(() => {
        secondAnimationFrameId = window.requestAnimationFrame(() => {
          const shouldRestore = shouldRestorePendingFocus;
          shouldRestorePendingFocus = false;
          synchronizeMarkers(shouldRestore);
        });
      });
    };

    const getEventMarker = (event) => {
      if (!(event.target instanceof Element)) return null;
      const markerElement = event.target.closest(MARKER_NAVIGATION_SELECTOR);
      return markerElement && container.contains(markerElement) ? markerElement : null;
    };

    const handleMarkerNavigation = (event, markerElement) => {
      if (event.key === 'Tab') {
        pendingMarkerFocusRef.current = null;
        markerElement.setAttribute('tabindex', '-1');
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        pendingMarkerFocusRef.current = null;
        markerElement.setAttribute('tabindex', '-1');
        container.focus({ preventScroll: true });
        setKeyboardAnnouncement('Markörnavigeringen avslutades.');
        return;
      }

      const markers = getSortedMarkerElements(map);
      markers.forEach((visibleMarker) => prepareMarkerElement(
        visibleMarker,
        markerElement,
      ));
      const currentIndex = markers.indexOf(markerElement);
      let targetIndex = currentIndex;

      if (NEXT_MARKER_KEYS.has(event.key)) {
        targetIndex = Math.min(currentIndex + 1, markers.length - 1);
      } else if (PREVIOUS_MARKER_KEYS.has(event.key)) {
        targetIndex = Math.max(currentIndex - 1, 0);
      } else if (event.key === 'Home') {
        targetIndex = 0;
      } else if (event.key === 'End') {
        targetIndex = markers.length - 1;
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        if (markerElement.dataset.mapMarkerKind === 'cluster') {
          const containerBounds = container.getBoundingClientRect();
          const markerPosition = getElementCenter(markerElement, containerBounds);
          pendingMarkerFocusRef.current = {
            latLng: map.containerPointToLatLng([markerPosition.x, markerPosition.y]),
          };
        } else {
          pendingMarkerFocusRef.current = null;
        }
        markerElement.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
        }));
        return;
      } else {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      if (targetIndex !== currentIndex && markers[targetIndex]) {
        focusMarker(markers[targetIndex], markers);
      } else if (targetIndex === 0) {
        setKeyboardAnnouncement('Första synliga markören.');
      } else if (targetIndex === markers.length - 1) {
        setKeyboardAnnouncement('Sista synliga markören.');
      }
    };

    const handleContainerKeyDown = (event) => {
      const markerElement = getEventMarker(event);
      if (markerElement) {
        handleMarkerNavigation(event, markerElement);
        return;
      }

      if (event.target !== container || event.key !== 'Enter') return;
      const markers = getSortedMarkerElements(map);
      markers.forEach((visibleMarker) => prepareMarkerElement(visibleMarker, null));
      event.preventDefault();
      event.stopPropagation();
      if (!markers.length) {
        setKeyboardAnnouncement('Kartan har inga synliga markörer.');
        return;
      }
      focusMarker(markers[0], markers);
      setKeyboardAnnouncement(
        `Markörnavigering aktiverad. ${markers.length} synliga markörer.`,
      );
    };

    const handleMarkerFocus = (event) => {
      const markerElement = getEventMarker(event);
      if (!markerElement) return;
      markerElement.dispatchEvent(new MouseEvent('mouseover', {
        bubbles: true,
        view: window,
      }));
    };

    const handleMarkerBlur = (event) => {
      const markerElement = getEventMarker(event);
      if (!markerElement) return;
      markerElement.dispatchEvent(new MouseEvent('mouseout', {
        bubbles: true,
        view: window,
      }));
    };

    const handleMapSettled = () => scheduleMarkerSynchronization({
      restorePendingFocus: true,
    });
    const observer = typeof MutationObserver === 'undefined'
      ? null
      : new MutationObserver(() => scheduleMarkerSynchronization());

    container.setAttribute('aria-keyshortcuts', 'Enter');
    container.addEventListener('keydown', handleContainerKeyDown);
    container.addEventListener('focusin', handleMarkerFocus);
    container.addEventListener('focusout', handleMarkerBlur);
    if (markerPane) observer?.observe(markerPane, { childList: true, subtree: true });
    if (overlayPane) observer?.observe(overlayPane, { childList: true, subtree: true });
    map.on('zoomend', handleMapSettled);
    map.on('moveend', handleMapSettled);
    scheduleMarkerSynchronization();

    return () => {
      window.cancelAnimationFrame(firstAnimationFrameId);
      window.cancelAnimationFrame(secondAnimationFrameId);
      observer?.disconnect();
      container.removeAttribute('aria-keyshortcuts');
      container.removeEventListener('keydown', handleContainerKeyDown);
      container.removeEventListener('focusin', handleMarkerFocus);
      container.removeEventListener('focusout', handleMarkerBlur);
      map.off('zoomend', handleMapSettled);
      map.off('moveend', handleMapSettled);
      pendingMarkerFocusRef.current = null;
    };
  }, [active]);

  // Cleanup overlays on unmount
  useEffect(() => () => {
    const map = mapView.current?.map;
    if (map) removeOverlays(map);
  }, [removeOverlays]);

  useEffect(() => {
    if (!active) return;
    const map = mapView.current?.map;
    if (!map) return;

    map.whenReady(() => {
      map.invalidateSize({ animate: false });
      mapView.current?.fitInitialBounds();
    });
  }, [active, isMobileViewport, layout]);

  const mapBaseLayerChangeHandler = useCallback(() => {
    // If the base layer changes, re-render overlays (icons/zoom scaling/etc.)
    updateMap({ force: true });
  }, [updateMap]);

  const attributionControlPosition = isMobileViewport
    ? 'bottomleft'
    : 'bottomright';
  return (
    <div>
      <p id={mapSummaryId} className="sr-only">
        {mapSummaryText}
      </p>
      <p id={mapKeyboardInstructionsId} className="sr-only">
        Använd piltangenterna för att panorera kartan och plus eller minus för att
        zooma. Tryck Enter för att gå till markörerna. Där går höger eller nedåt
        till nästa markör och vänster eller uppåt till föregående, i ordning från
        norr till söder och väster till öster. Tryck Enter eller blanksteg för att
        välja, Escape för att återgå till kartan och Tab för att gå vidare.
      </p>
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {keyboardAnnouncement}
      </p>
      <MapBase
        ref={mapView}
        className="map-wrapper absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300 ease-in-out [.app-initialized_&]:opacity-100"
        ariaLabel="Interaktiv sökkarta"
        ariaDescribedBy={`${mapSummaryId} ${mapKeyboardInstructionsId}`}
        attributionControlPosition={attributionControlPosition}
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
  // highlightedMarkerIcon: PropTypes.oneOfType([PropTypes.object]),
  // defaultMarkerIcon: PropTypes.oneOfType([PropTypes.object]),
  layersControlPosition: PropTypes.string,
  zoomControlPosition: PropTypes.string,
  zoom: PropTypes.number,
  center: PropTypes.arrayOf(PropTypes.number),
  disableSwedenMap: PropTypes.bool,
  mapData: PropTypes.object,
  isMobileViewport: PropTypes.bool,
  active: PropTypes.bool,
  layout: PropTypes.oneOf(['full', 'desktop-split']),
};
