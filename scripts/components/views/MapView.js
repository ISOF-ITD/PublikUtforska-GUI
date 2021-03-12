import React from 'react';

import L from 'leaflet';
import 'leaflet.markercluster';
import './../../../ISOF-React-modules/lib/leaflet-heat';
//import 'leaflet.vectorgrid';
import _ from 'underscore';

import MapBase from './../../../ISOF-React-modules/components/views/MapBase';

import MapCollection from './../../../ISOF-React-modules/components/collections/MapCollection';
import mapHelper from './../../../ISOF-React-modules/utils/mapHelper';
import config from './../../config.js';

// Main CSS: ui-components/map.less
//           ui-components/map-ui.less

// Leaflet CSS: leaflet.less
//              MarkerCluster.Default.less

export default class MapView extends React.Component {

	constructor(props) {
		super(props);

		window.mapView = this;

		this.state = {
			viewMode: 'clusters',
			loading: false
		};

		this.mapData = [];

		this.changeViewMode = this.changeViewMode.bind(this);
		this.mapBaseLayerChangeHandler = this.mapBaseLayerChangeHandler.bind(this);

		// Förberedar MapCollection som kommer ta hand om att hämta data från api
		this.collections = new MapCollection(function(json) {
			this.mapData = json.data || [];
			this.updateMap();

			this.setState({
				loading: false
			});
		}.bind(this));
	}

	componentDidMount() {
		this.fetchData(this.props.searchParams);

		this.mapBase = this.refs.mapView;
	}

	componentDidUpdate(prevProps) {
		const currentSearchParams = {...prevProps.searchParams};

		if (currentSearchParams.place_id) {
			delete currentSearchParams.place_id;
		}

		const searchParams = {...this.props.searchParams};
		if (searchParams.place_id) {
			delete searchParams.place_id;
		}

		if (JSON.stringify(currentSearchParams) !== JSON.stringify(searchParams)) {
			this.fetchData(searchParams);
		}
	}

	mapBaseLayerChangeHandler(event) {
		// Uppdaterar kartan om underlagret ändras
		this.updateMap();
	}

	fetchData(params) {
		this.setState({
			loading: true
		});

		if (params) {
			var fetchParams = {
				search: params.search || undefined,
				search_field: params.search_field || undefined,
				type: params.type,
				category: params.category && params.category + `${params.subcategory ? ',' + params.subcategory : ''}`, // subcategory for matkartan
				year_from: params.year_from || undefined,
				year_to: params.year_to || undefined,
				gender: params.gender ? (params.person_relation ? params.person_relation+':'+params.gender : params.gender) : undefined,
				// gender: params.gender && params.person_relation ? params.person_relation+':'+params.gender : undefined,
				birth_years: params.birth_years ? (params.person_relation ? params.person_relation+':'+(params.gender ? params.gender+':' : '')+params.birth_years : params.birth_years) : undefined,
				record_ids: params.record_ids || undefined,
				has_metadata: params.has_metadata || undefined,
				has_media: params.has_media || undefined,
				recordtype: params.recordtype || undefined,
				transcriptionstatus: params.transcriptionstatus || undefined,
			};

			//TODO Replace with "Application defined filter parameter" where it is used (Sägenkartan)
			if (!params.nordic) {
				fetchParams.country = config.country;
			}

			// Add Application defined filter parameter
			if (config.filterParameterName && config.filterParameterValues) {
				if ('filter' in params) {
					if (params['filter'] == 'true' || params['filter'] == true) {
						fetchParams[config.filterParameterName] = config.filterParameterValues[1];
					} else {
						fetchParams[config.filterParameterName] = config.filterParameterValues[0];
					}
				}
			}

			this.collections.fetch(fetchParams);
		}
	}

	changeViewMode(event) {
		this.setViewmode(event.target.dataset.viewmode);
	}

	setViewmode(viewMode) {
		if (viewMode != this.state.viewMode) {
			this.setState({
				viewMode: viewMode
			});

			if (this.mapData.length > 0) {
				setTimeout(function() {
					this.createLayers();

					this.updateMap();
				}.bind(this), 50);
			}
		}
	}

	// Lägger till filter till kartan, filter gör att bara viss "type" av socken relation syns på kartan
	// Typ kan vara place_collected, dispatch_place, destination_place, related_person_place eller något annat
	// Används för folkmusikkartan för att byta mellan visning av alla socknar eller bara related_person_place socknar (socken som kan vara födelsesocken av personer)
	setMapFilter(filter) {
		this.setState({
			mapFilter: filter
		}, function() {
			this.updateMap();
		}.bind(this));
	}

	createLayers() {
		if (this.markers) {
			if (this.markers.clearLayers) {
				this.markers.clearLayers();
			}

			this.refs.mapView.map.removeLayer(this.markers);
		}

		switch (this.state.viewMode) {
			case 'markers':
				this.markers = L.featureGroup();
				this.refs.mapView.map.addLayer(this.markers);
				break;
			case 'circles':
				this.markers = L.featureGroup();
				this.refs.mapView.map.addLayer(this.markers);
				break;
			case 'clusters':
				this.markers = new L.MarkerClusterGroup({
					showCoverageOnHover: false,
					maxClusterRadius: 40,
					iconCreateFunction: function (cluster) {
						var childCount = cluster.getChildCount();
						var c = ' marker-cluster-';
						if (childCount < 10) {
							c += 'small';
						} else if (childCount < 20) {
							c += 'medium';
						} else {
							c += 'large';
						}
						return new L.DivIcon({
							html: '<div><span>'+
								'<b>'+childCount+'</b>'+
								'</span></div>',
							className: 'marker-cluster'+c,
							iconSize: new L.Point(28, 28)
						});
					}
				});
				this.refs.mapView.map.addLayer(this.markers);
				break;
			case 'heatmap':
				this.markers = L.heatLayer([], {
					minOpacity: 0.35,
					radius: 18,
					blur: 15
				});
				this.markers.addTo(this.refs.mapView.map);
			case 'heatmap-count':
				this.markers = L.heatLayer([], {
					minOpacity: 0.35,
					radius: 18,
					blur: 15,
					maxZoom: 4
				});
				this.markers.addTo(this.refs.mapView.map);
		}
	}

	updateMap() {
		// Om det finns mapFilter (som kan filtrera ut vissa relatontyper av platser), då filterar vi state.mapData innan vi placerar data på kartan
		//console.log(this.state.mapFilter)
		var mapData = this.state.mapFilter ? _.filter(this.mapData, function(item) {
			return item.relation_type.indexOf(this.state.mapFilter) > -1;
		}.bind(this)) : this.mapData;

		//console.log(mapData);

		if (this.state.viewMode == 'markers' || this.state.viewMode == 'clusters') {
			if (this.markers) {
				this.markers.clearLayers();
			}
			else {
				this.createLayers();
			}

			// Lägger till alla prickar på kartan
			if (mapData.length > 0) {
				// Hämtar current bounds (minus 20%) av synliga kartan
				var currentBounds = this.refs.mapView.map.getBounds().pad(-0.2);

				// Samlar ihop latLng av alla prickar för att kunna senare zooma inn till dem
				var bounds = [];
				var markerWithinBounds = false;

				_.each(mapData, function(mapItem) {
					// console.log(mapItem);
					if (mapItem.location.length > 0) {
						// Skalar L.marker objekt och lägger till rätt icon
						var marker = L.marker([Number(mapItem.location[0]), Number(mapItem.location[1])], {
							title: mapItem.name,
							// Om mapItem.has_metadata lägger vi till annan typ av ikon, används mest av matkartan för att visa kurerade postar
							icon: mapItem.has_metadata == true ? (this.props.highlightedMarkerIcon || mapHelper.markerIconHighlighted) : (this.props.defaultMarkerIcon || mapHelper.markerIcon)
						});

						// Lägger till click event listener
						marker.on('click', function(event) {
							// Om onMarkerClick finns som property för MapView kallar vi den funktionen
							if (this.props.onMarkerClick) {
								this.props.onMarkerClick(mapItem.id);
							}
						}.bind(this));

						// Lägger pricken till kartan
						this.markers.addLayer(marker);

						// Lägger latLng till bounds
						bounds.push(mapItem.location);

						// Checkar om punkten är synlig på visibella kartan på skärmen
						if (currentBounds.contains(mapItem.location)) {
							markerWithinBounds = true;
						}
					}
				}.bind(this));

				// Zooma in till alla nya punkena om ingen av dem finns inom synliga kartan
				if (!markerWithinBounds || (config.siteOptions.mapView && config.siteOptions.mapView.alwaysUpdateViewport == true)) {
					this.refs.mapView.map.fitBounds(bounds, {
						maxZoom: 10,
						padding: [50, 50]
					});
				}
			}
		}
		if (this.state.viewMode == 'circles') {
			if (this.markers) {
				this.markers.clearLayers();
			}
			else {
				this.createLayers();
			}

			if (mapData.length > 0) {
				var bounds = [];

				var minValue = _.min(mapData, function(mapItem) {
					return Number(mapItem.doc_count);
				}).doc_count;

				var maxValue = _.max(mapData, function(mapItem) {
					return Number(mapItem.doc_count);
				}).doc_count;

				_.each(mapData, function(mapItem) {
					if (mapItem.location.length > 0) {
						var marker = L.circleMarker(mapItem.location, {
							radius: ((mapItem.doc_count/maxValue)*20)+2,
							fillColor: "#047bff",
							fillOpacity: 0.4,
							color: '#000',
							weight: 0.8
						});

						marker.on('click', function(event) {
							if (this.props.onMarkerClick) {
								this.props.onMarkerClick(mapItem.id);
							}
						}.bind(this));

						this.markers.addLayer(marker);
					}
				}.bind(this));
/*
				if (this.legendsEl) {
					var template = _.template($("#mapLegendsTemplate").html());
					this.legendsEl.html(template({
						minValue: Number(minValue),
						maxValue: Number(maxValue)
					}));
					this.legendsEl.addClass('visible');
				}
*/
			}
		}
		if (this.state.viewMode == 'heatmap') {
			var latLngs = _.map(mapData, function(mapItem) {
				return [mapItem.location[0], mapItem.location[1], 0.5];
			}.bind(this));
			this.markers.setLatLngs(latLngs);
		}
		if (this.state.viewMode == 'heatmap-count') {
			this.refs.mapView.map.removeLayer(this.markers);

			var maxCount = _.max(mapData, function(mapItem) {
				return Number(mapItem.doc_count);
			}).doc_count;

			this.markers = L.heatLayer([], {
				minOpacity: 0.35,
				radius: 18,
				blur: 15,
				max: maxCount,
				maxZoom: 0
			});
			this.markers.addTo(this.refs.mapView.map);

			var latLngs = _.map(mapData, function(mapItem) {
				return [mapItem.location[0], mapItem.location[1], mapItem.doc_count];
			}.bind(this));
			this.markers.setLatLngs(latLngs);
		}

		if (this.props.onMapUpdate) {
			this.props.onMapUpdate();
		}
	}

	render() {
		return (
			<div className={'map-wrapper'+(this.state.loading ? ' map-loading' : '')}>
				{this.props.children}

				{
					!this.props.hideMapmodeMenu &&
					<div className="map-viewmode-menu">
						<a className={'icon-marker'+(this.state.viewMode == 'clusters' ? ' selected' : '')}
							data-viewmode="clusters"
							onClick={this.changeViewMode}>
							<span>Cluster</span>
						</a>
						{
							!this.props.disableHeatmapMode &&
							<a className={'icon-heatmap'+(this.state.viewMode == 'heatmap-count' ? ' selected' : '')}
								data-viewmode="heatmap-count"
								onClick={this.changeViewMode}>
								<span>Heatmap</span>
							</a>
						}
						{
							!this.props.disableCirclesMode &&
							<a className={'icon-circles'+(this.state.viewMode == 'circles' ? ' selected' : '')}
								data-viewmode="circles"
								onClick={this.changeViewMode}>
								<span>Circles</span>
							</a>
						}
					</div>
				}

				<div className="map-progress">
					<div className="indicator"></div>
				</div>

				<MapBase ref="mapView"
					className="map-view"
					layersControlPosition={this.props.layersControlPosition || 'topleft'}
					zoomControlPosition={this.props.zoomControlPosition || 'topleft'} 
					disableLocateControl={true} // Inte visa locateControl knappen (som kan visa på kartan var användaren är)
					scrollWheelZoom={true}
					zoom={this.props.zoom}
					center={this.props.center}
					disableSwedenMap={this.props.disableSwedenMap}
					onBaseLayerChange={this.mapBaseLayerChangeHandler} />
			</div>
		);
	}
}
