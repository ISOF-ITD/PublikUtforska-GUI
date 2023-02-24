import L from 'leaflet';
import 'leaflet.markercluster';
import '../../../ISOF-React-modules/lib/leaflet-heat';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import MapBase from './MapBase';

import MapCollection from '../../../ISOF-React-modules/components/collections/MapCollection';
import mapHelper from '../../utils/mapHelper';
import config from '../../config';

import routeHelper from '../../utils/routeHelper';

export default function MapView({
  onMarkerClick,
  onMapUpdate,
  hideMapmodeMenu,
  highlightedMarkerIcon,
  disableHeatmapMode,
  disableCirclesMode,
  defaultMarkerIcon,
  layersControlPosition,
  zoomControlPosition,
  zoom,
  center,
  disableSwedenMap,
  children,
}) {
  MapView.propTypes = {
    onMarkerClick: PropTypes.func,
    onMapUpdate: PropTypes.func,
    hideMapmodeMenu: PropTypes.bool,
    highlightedMarkerIcon: PropTypes.string,
    disableHeatmapMode: PropTypes.bool,
    disableCirclesMode: PropTypes.bool,
    defaultMarkerIcon: PropTypes.string,
    layersControlPosition: PropTypes.string,
    zoomControlPosition: PropTypes.string,
    zoom: PropTypes.number,
    center: PropTypes.arrayOf(PropTypes.number),
    disableSwedenMap: PropTypes.bool,
    children: PropTypes.node,
  };

  MapView.defaultProps = {
    onMarkerClick: undefined,
    onMapUpdate: undefined,
    hideMapmodeMenu: false,
    highlightedMarkerIcon: undefined,
    disableHeatmapMode: false,
    disableCirclesMode: false,
    defaultMarkerIcon: undefined,
    layersControlPosition: undefined,
    zoomControlPosition: undefined,
    zoom: undefined,
    center: undefined,
    disableSwedenMap: false,
    children: undefined,
  };

  const [viewMode, setViewMode] = useState('clusters');
  const [loading, setLoading] = useState(false);
  const [mapData, setMapData] = useState([]);
  const [markers, setMarkers] = useState({});

  const routerParams = useParams();

  const mapView = useRef();

  const createLayers = () => {
    if (markers) {
      if (markers.clearLayers) {
        markers.clearLayers();
      }

      mapView.current.map.removeLayer(markers);
    }

    let newMarkers = {};
    switch (viewMode) {
      case 'markers':
        setMarkers(L.featureGroup());
        mapView.current.map.addLayer(L.featureGroup());
        break;
      case 'circles':
        setMarkers(L.featureGroup());
        mapView.current.map.addLayer(L.featureGroup());
        break;
      case 'clusters':
        newMarkers = new L.MarkerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 40,
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
        setMarkers(newMarkers);
        mapView.current.map.addLayer(newMarkers);
        break;
      case 'heatmap':
        setMarkers(L.heatLayer([], {
          minOpacity: 0.35,
          radius: 18,
          blur: 15,
        }));
        markers.addTo(mapView.current.map);
        break;
      case 'heatmap-count':
        setMarkers(L.heatLayer([], {
          minOpacity: 0.35,
          radius: 18,
          blur: 15,
          maxZoom: 4,
        }));
        markers.addTo(mapView.current.map);
        break;
      default:
        break;
    }
  };

  const updateMap = () => {
    // Om det finns mapFilter (som kan filtrera ut vissa relatontyper av platser),
    // då filterar vi state.mapData innan vi placerar data på kartan
    // console.log(this.state.mapFilter)
    // const mapData = this.state.mapFilter ? _.filter(
    // this.mapData, (item)=> item.relation_type.indexOf(this.state.mapFilter) > -1) : this.mapData;

    if (viewMode === 'markers' || viewMode === 'clusters') {
      if (markers?.clearLayers) {
        markers.clearLayers();
      } else {
        createLayers();
      }

      // Lägger till alla prickar på kartan
      if (mapData.length > 0) {
        // Hämtar current bounds (minus 20%) av synliga kartan
        const currentBounds = mapView.current.map.getBounds().pad(-0.2);

        // Samlar ihop latLng av alla prickar för att kunna senare zooma inn till dem
        const bounds = [];
        let markerWithinBounds = false;

        mapData.forEach((mapItem) => {
          // console.log(mapItem);
          if (mapItem.location.length > 0) {
            // Skalar L.marker objekt och lägger till rätt icon
            const marker = L.marker([Number(mapItem.location[0]), Number(mapItem.location[1])], {
              title: mapItem.name,
              // Om mapItem.has_metadata lägger vi till annan typ av ikon,
              // används mest av matkartan för att visa kurerade postar
              // split the above line into two lines to avoid eslint error
              icon: mapItem.has_metadata
                ? (highlightedMarkerIcon || mapHelper.markerIconHighlighted)
                : (defaultMarkerIcon || mapHelper.markerIcon),
            });

            // Lägger till click event listener
            marker.on('click', () => {
              // Om onMarkerClick finns som property för MapView kallar vi den funktionen
              if (onMarkerClick) {
                onMarkerClick(mapItem.id);
              }
            });

            // Lägger pricken till kartan
            markers.addLayer(marker);

            // Lägger latLng till bounds
            bounds.push(mapItem.location);

            // Checkar om punkten är synlig på visibella kartan på skärmen
            if (currentBounds.contains(mapItem.location)) {
              markerWithinBounds = true;
            }
          }
        });

        // Zooma in till alla nya punkena om ingen av dem finns inom synliga kartan
        if (!markerWithinBounds || config.siteOptions.mapView?.alwaysUpdateViewport) {
          mapView.current.map.fitBounds(bounds, {
            maxZoom: 10,
            padding: [50, 50],
          });
        }
      }
    }
    if (viewMode === 'circles') {
      if (markers?.clearLayers) {
        markers.clearLayers();
      } else {
        createLayers();
      }

      if (mapData.length > 0) {
        // const bounds = [];

        // const minValue=Math.min(...mapData.map((mapItem)=> Number(mapItem.doc_count))).doc_count;
        const maxValue = Math.max(...mapData.map((mapItem) => Number(mapItem.doc_count))).doc_count;

        mapData.forEach((mapItem) => {
          if (mapItem.location.length > 0) {
            const marker = L.circleMarker(mapItem.location, {
              radius: ((mapItem.doc_count / maxValue) * 20) + 2,
              fillColor: '#047bff',
              fillOpacity: 0.4,
              color: '#000',
              weight: 0.8,
            });

            marker.on('click', () => {
              if (onMarkerClick) {
                onMarkerClick(mapItem.id);
              }
            });

            markers.addLayer(marker);
          }
        });
      }
    }
    if (viewMode === 'heatmap') {
      const latLngs = mapData.map((mapItem) => [mapItem.location[0], mapItem.location[1], 0.5]);
      markers.setLatLngs(latLngs);
    }
    if (viewMode === 'heatmap-count') {
      mapView.current.map.removeLayer(markers);

      const maxCount = Math.max(...mapData.map((mapItem) => Number(mapItem.doc_count))).doc_count;

      setMarkers(L.heatLayer([], {
        minOpacity: 0.35,
        radius: 18,
        blur: 15,
        max: maxCount,
        maxZoom: 0,
      }));
      markers.addTo(mapView.current.map);

      const latLngs = mapData.map((mapItem) => [
        mapItem.location[0],
        mapItem.location[1],
        mapItem.doc_count,
      ]);
      markers.setLatLngs(latLngs);
    }

    if (onMapUpdate) {
      onMapUpdate();
    }
  };

  // Förberedar MapCollection som kommer ta hand om att hämta data från api
  const collections = new MapCollection((json) => {
    setMapData(json.data || []);
    updateMap();

    setLoading(false);
  });

  const fetchData = (params) => {
    setLoading(true);

    if (params) {
      const fetchParams = {
        search: params.search ? encodeURIComponent(params.search) : undefined,
        search_field: params.search_field || undefined,
        type: params.type,
        category: params.category && `${params.category}${params.subcategory ? `,${params.subcategory}` : ''}`, // subcategory for matkartan
        year_from: params.year_from || undefined,
        year_to: params.year_to || undefined,
        gender: params.gender && (
          params.person_relation
            ? `${params.person_relation}:${params.gender}`
            : params.gender
        ),
        birth_years: params.birth_years && (
          params.person_relation
            ? `${params.person_relation}:${params.gender ? `${params.gender}:` : ''}${params.birth_years}`
            : params.birth_years
        ),
        record_ids: params.record_ids || undefined,
        has_metadata: params.has_metadata || undefined,
        has_media: params.has_media || undefined,
        has_transcribed_records: params.has_transcribed_records || undefined,
        recordtype: params.recordtype || undefined,
        transcriptionstatus: params.transcriptionstatus || undefined,
      };

      // TODO Replace with "Application defined filter parameter" where it is used (Sägenkartan)
      if (!params.nordic) {
        fetchParams.country = config.country;
      }

      // Add Application defined filter parameter
      // if (config.filterParameterName && config.filterParameterValues) {
      //   if ('filter' in params) {
      //     if (params.filter === 'true' || params.filter === true) {
      //       fetchParams[config.filterParameterName] = config.filterParameterValues[1];
      //     } else {
      //       fetchParams[config.filterParameterName] = config.filterParameterValues[0];
      //     }
      //   }
      // }

      collections.fetch(fetchParams);
    }
  };

  useEffect(() => {
    fetchData(routeHelper.createParamsFromSearchRoute(routerParams['*']));
    // mapBase = mapView.current;
  }, []);

  useEffect(() => {
    const searchParams = routeHelper.createParamsFromSearchRoute(routerParams['*']);
    if (searchParams.place_id) {
      delete searchParams.place_id;
    }
    fetchData(searchParams);
  }, [routerParams['*']]);

  useEffect(() => {
    updateMap();
  }, [mapData]);

  const mapBaseLayerChangeHandler = () => {
    // Uppdaterar kartan om underlagret ändras
    updateMap();
  };

  const setViewmode = (viewModeParam) => {
    if (viewModeParam !== viewMode) {
      setViewMode(viewModeParam);

      if (mapData.length > 0) {
        setTimeout(() => {
          createLayers();

          updateMap();
        }, 50);
      }
    }
  };

  const changeViewMode = (e) => {
    setViewmode(e.target.dataset.viewmode);
  };

  return (
    <div className={`map-wrapper${loading ? ' map-loading' : ''}`}>
      {children}

      {
        !hideMapmodeMenu
        && (
          <div className="map-viewmode-menu">
            <button
              className={`icon-marker${viewMode === 'clusters' ? ' selected' : ''}`}
              data-viewmode="clusters"
              onClick={changeViewMode}
              type="button"
            >
              <span>Cluster</span>
            </button>
            {
              disableHeatmapMode
              && (
                <button
                  className={`icon-heatmap${viewMode === 'heatmap-count' ? ' selected' : ''}`}
                  data-viewmode="heatmap-count"
                  onClick={changeViewMode}
                  type="button"
                >
                  <span>Heatmap</span>
                </button>
              )
            }
            {
              disableCirclesMode
              && (
                <button
                  className={`icon-circles${viewMode === 'circles' ? ' selected' : ''}`}
                  data-viewmode="circles"
                  onClick={changeViewMode}
                  type="button"
                >
                  <span>Circles</span>
                </button>
              )
            }
          </div>
        )
      }

      <div className="map-progress">
        <div className="indicator" />
      </div>

      <MapBase
        ref={mapView}
        className="map-view"
        layersControlPosition={layersControlPosition || 'bottomright'}
        zoomControlPosition={zoomControlPosition || 'bottomright'}
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
