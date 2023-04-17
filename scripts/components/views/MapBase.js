import React from 'react';

import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.locatecontrol';
import '../../../ISOF-React-modules/lib/leaflet.active-layers';

import mapHelper from '../../utils/mapHelper';

// Main CSS: ui-components/map.less
//           ui-components/map-ui.less

// Leaflet CSS: leaflet.less
//              MarkerCluster.Default.less

export default class MapBase extends React.Component {
  constructor(props) {
    super(props);
    this.mapView = React.createRef();

    this.nordicLegendsUpdateHandler = this.nordicLegendsUpdateHandler.bind(this);

    this.state = {};
  }

  componentWillUnmount() {
    // remove map container
    this.map.remove();
  }

  componentDidMount() {
    const layers = mapHelper.createLayers();
    let overlayLayers;
    // If ignoreOverlayLayers then do not add overlayLayers
    if (!this.props.ignoreOverlayLayers) {
      overlayLayers = mapHelper.createOverlayLayers();
    }

    if (this.props.disableSwedenMap) {
      delete layers[mapHelper.tileLayers[0].label];
    }

    // Add first baselayer to map
    const visibleLayers = [layers[Object.keys(layers)[0]]];

    // Add first overlay layer if param hidden false to map
    if (overlayLayers) {
      if (!layers[Object.keys(overlayLayers)[0]]) {
        const visibleOverlayLayer = overlayLayers[Object.keys(overlayLayers)[0]];
        if (visibleOverlayLayer.wmsParams.hidden == false) {
          visibleLayers.push(visibleOverlayLayer);
        }
      }
    }

    const mapOptions = {
      center: this.props.center || [63.5, 16.7211],
      // For epsg3857 webmercator:
      zoom: parseInt(this.props.zoom) || 5,
      minZoom: parseInt(this.props.minZoom) || 5,
      maxZoom: parseInt(this.props.maxZoom) || 17,
      // For SWEREF 99:
      // zoom: parseInt(this.props.zoom) || 4,
      // minZoom: parseInt(this.props.minZoom) || 4,
      // maxZoom: parseInt(this.props.maxZoom) || 13,
      layers: visibleLayers,
      // layers: [layers[Object.keys(layers)[0]]],
      scrollWheelZoom: this.props.scrollWheelZoom || false,
      zoomControl: false,
    };

    // this.map.options.crs = L.CRS.EPSG3857;

    if (!this.props.disableSwedenMap) {
      if (Object.keys(layers)[0].indexOf('(SWEREF99)') > -1) {
        mapOptions.crs = mapHelper.getSweref99crs();
        mapOptions.zoom = 1;
        mapOptions.minZoom = 1;
      }
    }

    this.map = L.map(this.mapView.current, mapOptions);

    L.control.zoom({
      position: this.props.zoomControlPosition || 'topright',
    }).addTo(this.map);

    // Dölja locateControl knappen (som visar var användaren är på kartan)
    if (!this.props.disableLocateControl) {
      L.control.locate({
        showPopup: false,
        icon: 'map-location-icon',
        position: this.props.zoomControlPosition || 'topright',
        locateOptions: {
          maxZoom: 9,
        },
        markerStyle: {
          weight: 2,
          fillColor: '#ffffff',
          fillOpacity: 1,
        },
        circleStyle: {
          weight: 1,
          color: '#a6192e',
        },
      }).addTo(this.map);
    }

    this.layersControl = L.control.activeLayers(layers, overlayLayers, {
      position: this.props.layersControlPosition || 'topright',
      collapsed: !this.props.layersControlStayOpen,
    }).addTo(this.map);

    this.map.on('baselayerchange', this.mapBaseLayerChangeHandler.bind(this));

    if (window.eventBus) {
      // Om kartan inkluderar nordiskt material, byt kartan till OpenStreetMap för Lantmäteriets karta visar bara Sverige
      window.eventBus.addEventListener('nordicLegendsUpdate', this.nordicLegendsUpdateHandler);
    }
  }

  nordicLegendsUpdateHandler(event, data) {
    // Byt karta till OpenStreetMap (index=2)
    if (!this.props.disableSwedenMap && data.includeNordic && this.layersControl.getActiveBaseLayer().name.indexOf('Lantmäteriet') > -1) {
      mapView.mapBase.layersControl._layers[2].layer.addTo(mapView.mapBase.map);
      mapView.mapBase.layersControl._onInputClick();
    }
  }

  mapBaseLayerChangeHandler(event) {
    // Change to Spatial reference system to SWEREF99 if SWEREF99
    if (event.name.indexOf('(SWEREF99)') > -1 && this.map.options.crs.code != 'EPSG:3006') {
      var mapCenter = this.map.getCenter();
      var mapZoom = this.map.getZoom();

      this.map.options.crs = mapHelper.getSweref99crs();

      this.map.options.minZoom = 1;
      this.map.options.maxZoom = 13;

      this.map.setView(mapCenter, mapZoom - 4, {
        animate: false,
      });
    }

    // Change Spatial reference system to EPSG3857 if not SWEREF99
    if (event.name.indexOf('(SWEREF99)') == -1 && this.map.options.crs.code == 'EPSG:3006') {
      var mapCenter = this.map.getCenter();
      var mapZoom = this.map.getZoom();

      this.map.options.crs = L.CRS.EPSG3857;

      this.map.options.minZoom = 4;
      this.map.options.maxZoom = 16;

      this.map.setView(mapCenter, mapZoom + 4, {
        animate: false,
      });
    }

    if (this.props.onBaseLayerChange) {
      this.props.onBaseLayerChange(event);
    }
  }

  invalidateSize() {
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  UNSAFE_componentWillReceiveProps(props) {
    if (props.marker) {
      this.addMarker(props.marker);
    }
  }

  render() {
    return (
      <div className={this.props.className || 'map-container small'} ref={this.mapView} style={this.props.mapHeight ? { height: (this.props.mapHeight.indexOf('px') == -1 ? `${this.props.mapHeight}px` : this.props.mapHeight) } : null} />
    );
  }
}
