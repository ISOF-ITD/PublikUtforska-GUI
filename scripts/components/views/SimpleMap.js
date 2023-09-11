import React from 'react';

import L from 'leaflet';
import 'leaflet.markercluster';

import MapBase from './MapBase';

import mapHelper from './../../utils/mapHelper';

// Main CSS: ui-components/map.less
//           ui-components/map-ui.less

// Leaflet CSS: leaflet.less
//              MarkerCluster.Default.less

export default class SimpleMap extends React.Component {

	constructor(props) {
		super(props);
		this.mapView = React.createRef();
	}

	componentDidMount() {
		if (this.props.marker) {
			this.addMarker(this.props.marker);
		}
		if (this.props.markers) {
			this.addMarkers(this.props.markers);
		}
	}

	UNSAFE_componentWillReceiveProps(props) {
		if (props.marker) {
			this.addMarker(props.marker);
		}
		if (props.markers) {
			this.addMarkers(props.markers);
		}
	}

	removeMarkers() {
		if (this.markers) {
			this.markers.forEach((marker) => {
				this.mapView.current.map.removeLayer(marker);
			});
		}
	}

	addMarkers(markers) {
		this.removeMarkers();

		this.markers = [];

		markers.forEach((marker) => {
			this.addMarker(marker, true);
		});
	}

	addMarker(markerData, allowMultiple) {
		if (!allowMultiple) {
			this.removeMarkers();
		}

		if (this.mapView.current && markerData && ((markerData.lat && markerData.lng) || (markerData.location && markerData.location.lat && markerData.location.lon))) {
			var animateMap = this.props.animate;

			if (this.marker && !allowMultiple) {
				animateMap = true;
				this.mapView.current.map.removeLayer(this.marker);
			}

			var location = Number(markerData.lat) && Number(markerData.lng) ? [Number(markerData.lat), Number(markerData.lng)] :
				(markerData.location && Number(markerData.location.lat) && Number(markerData.location.lon) ? [Number(markerData.location.lat), Number(markerData.location.lon)] : null);

			if (location) {
				var marker = L.marker(location, {
					title: markerData.label || markerData.name || null,
					icon: mapHelper.markerIcon
				});

				if (allowMultiple) {
					this.markers.push(marker);
				}
				else {
					this.marker = marker;
				}

				this.mapView.current.map.addLayer(marker);

				this.mapView.current.map.panTo(location, {
					animate: animateMap
				});
			}
		}
	}

	render() {
		return (
			<MapBase ref={this.mapView} />
		);
	}
}