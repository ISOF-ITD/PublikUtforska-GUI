import { Component, createRef } from 'react';
import {
  map, latLngBounds, control, CRS,
} from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.locatecontrol';
import '../../lib/leaflet.active-layers';
import { select } from 'd3-selection'; // Endast d3.select istället för hela d3

import mapHelper from '../../utils/mapHelper';

export default class MapBase extends Component {
  constructor(props) {
    super(props);
    this.mapView = createRef();

    this.nordicLegendsUpdateHandler = this.nordicLegendsUpdateHandler.bind(this);
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
      const firstOverlayLayer = overlayLayers[Object.keys(overlayLayers)[0]];
      if (firstOverlayLayer?.wmsParams?.hidden === false) {
        visibleLayers.push(firstOverlayLayer);
      }
    }

    const SWEDEN = latLngBounds(
      [55.34267812700013, 11.108164910000113],
      [69.03635569300009, 24.163413534000114],
    );

    const mapOptions = {
      center: this.props.center || SWEDEN.getCenter(),
      // [63.5, 16.7211],
      // For epsg3857 webmercator:
      zoom: parseInt(this.props.zoom, 10) || 5,
      minZoom: parseInt(this.props.minZoom, 10) || 5,
      maxZoom: parseInt(this.props.maxZoom, 10) || 17,
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

    if (!this.props.disableSwedenMap && Object.keys(layers)[0].includes('(SWEREF99)')) {
      mapOptions.crs = mapHelper.getSweref99crs();
      mapOptions.zoom = 1;
      mapOptions.minZoom = 1;
    }
    // when initializing the map, set zoom and center, so that the bounds of the constant SWEDEN are visible. use fitTobounds or similar
    // use an offset of 360px to the left, so that the bounds are not hidden by the sidebar
    this.map = map(this.mapView.current, mapOptions).fitBounds(SWEDEN, {
      // if in desktop mode, use a padding of 400px to the left, so that the bounds are not hidden by the sidebar,
      // but when in mobile mode, use a top padding of 60px, so that the bounds are not hidden by the top bar
      paddingTopLeft: window.innerWidth >= 550 ? [400, 0] : [0, 100],
    });

    control.zoom({
      position: this.props.zoomControlPosition || 'topright',
    }).addTo(this.map);

    // Dölja locateControl knappen (som visar var användaren är på kartan)
    if (!this.props.disableLocateControl) {
      control.locate({
        showPopup: false,
        icon: 'map-location-icon',
        position: this.props.zoomControlPosition || 'topright',
        locateOptions: { maxZoom: 9 },
        markerStyle: { weight: 2, fillColor: '#ffffff', fillOpacity: 1 },
        circleStyle: { weight: 1, color: '#a6192e' },
      }).addTo(this.map);
    }

    this.layersControl = control.activeLayers(layers, overlayLayers, {
      position: this.props.layersControlPosition || 'topright',
    }).addTo(this.map);

    // make sure that the layers control is
    //  -not opened on mouse over (only on click)
    //  -not closed on mouse out
    // - not visible on mount
    select('.leaflet-control-layers-toggle').style('display', 'block').style('opacity', 1);
    select('.leaflet-control-layers-list').style('display', 'none');
    select('.leaflet-control-layers-toggle').on('click', () => {
      select('.leaflet-control-layers-list').style('display', 'block');
      select('.leaflet-control-layers-toggle').style('display', 'none');
    });
    select('.leaflet-control-layers-list').on('mouseleave', () => {
      select('.leaflet-control-layers-list').style('display', 'none');
      select('.leaflet-control-layers-toggle').style('display', 'block');
    });

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
    if (event.name.includes('(SWEREF99)') && this.map.options.crs.code !== 'EPSG:3006') {
      const mapCenter = this.map.getCenter();
      const mapZoom = this.map.getZoom();

      this.map.options.crs = mapHelper.getSweref99crs();
      this.map.options.minZoom = 1;
      this.map.options.maxZoom = 13;

      this.map.setView(mapCenter, mapZoom - 4, { animate: false });
    }

    // Change Spatial reference system to EPSG3857 if not SWEREF99
    if (!event.name.includes('(SWEREF99)') && this.map.options.crs.code === 'EPSG:3006') {
      const mapCenter = this.map.getCenter();
      const mapZoom = this.map.getZoom();

      this.map.options.crs = CRS.EPSG3857;
      this.map.options.minZoom = 4;
      this.map.options.maxZoom = 16;

      this.map.setView(mapCenter, mapZoom + 4, { animate: false });
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
      <div
        className={this.props.className || 'map-container small'}
        ref={this.mapView}
        style={this.props.mapHeight ? { height: this.props.mapHeight.includes('px') ? this.props.mapHeight : `${this.props.mapHeight}px` } : null}
      />
    );
  }
}
