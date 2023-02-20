import turfInside from '@turf/boolean-point-in-polygon';

import L from 'leaflet';
import Proj from 'proj4leaflet';

import config from './../scripts/config';

import mapMarkerBlueLocation from './../img/map-marker-blue-location.png';
import mapMarkerBlueHighlighted from './../img/map-marker-blue-highlighted.png';
import mapMarkerShadow from './../img/map-marker-shadow.png';
import mapMarkerOrange from './../img/map-marker-orange.png';
import markerBlue from './../img/marker-blue.png';
import markerRed from './../img/marker-red.png';

export default {
	markerIcon: L.icon({
		iconUrl: mapMarkerBlueLocation,
		shadowUrl: mapMarkerShadow,

		iconSize:     [28, 36],	// size of the icon
		shadowSize:   [41, 41],	// size of the shadow
		iconAnchor:   [14, 35],	// point of the icon which will correspond to marker's location
		shadowAnchor: [12, 40],  // the same for the shadow
		popupAnchor:  [-1, -15] // point from which the popup should open relative to the iconAnchor
	}),

	markerIconHighlighted: L.icon({
		iconUrl: mapMarkerBlueHighlighted,
		shadowUrl: mapMarkerShadow,

		iconSize:     [28, 36],	// size of the icon
		shadowSize:   [41, 41],	// size of the shadow
		iconAnchor:   [14, 35],	// point of the icon which will correspond to marker's location
		shadowAnchor: [12, 40],  // the same for the shadow
		popupAnchor:  [-1, -15] // point from which the popup should open relative to the iconAnchor
	}),

	orangeIcon: L.icon({
		iconUrl: mapMarkerOrange,
		iconSize: [27, 27],
		iconAnchor: [15, 15],
		popupAnchor: [0, 0]
	}),

	blueIcon: L.icon({
		iconUrl: markerBlue,
		iconSize: [27, 27],
		iconAnchor: [15, 15],
		popupAnchor: [0, 0]
	}),

	redIcon: L.icon({
		iconUrl: markerRed,
		iconSize: [27, 27],
		iconAnchor: [15, 15],
		popupAnchor: [0, 0]
	}),

	tileLayers: [
		/*
		// Lantmäteriet topografisk karta SWEREF99
		{
			label: 'Lantmäteriet topografisk karta (SWEREF99)',
			url: 'https://frigg.isof.se/sagendatabas/api/lm_proxy/{z}/{y}/{x}.png',
			options: {
				attribution: '&copy; <a href="https://www.lantmateriet.se/en/">Lantmäteriet</a> Topografisk Webbkarta Visning',
				crossOrigin: true,
			}
		},
		*/
		// Lantmäteriet topografisk karta epsg3857 WGS 84 
		// It seems maxZoom="17": Can be set as prop to MapBase component
		{
			label: 'Lantmäteriet topografisk karta',
			url: 'https://frigg.isof.se/sagendatabas/api/lm_epsg3857_proxy/{z}/{y}/{x}.png',
			options: {
				attribution: '&copy; <a href="https://www.lantmateriet.se/en/">Lantmäteriet</a> Topografisk Webbkarta Visning',
				crossOrigin: true,
			}
		},
		{
			label: 'Lantmäteriet topografisk karta nedtonad',
			url: 'https://frigg.isof.se/sagendatabas/api/lm_nedtonad_epsg3857_proxy/{z}/{y}/{x}.png',
			options: {
				attribution: '&copy; <a href="https://www.lantmateriet.se/en/">Lantmäteriet</a> Topografisk Webbkarta Visning',
				crossOrigin: true,
			}
		},
		{
			label: 'Open Street Map Mapnik',
			url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			options: {
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
			}
		},
		/*
		{
			label: 'Lantmäteriet', // Lantmäteriet open
			url: 'https://api.lantmateriet.se/open/topowebb-ccby/v1/wmts/token/36c696a2a831dcf8aa64c192b55d4d/1.0.0/topowebb/default/3006/{z}/{y}/{x}.png',
			options: {
				maxZoom: 9,
				minZoom: 0,
				attribution: '&copy; <a href="https://www.lantmateriet.se/en/">Lantmäteriet</a> Topografisk Webbkarta Visning'
			}
		},
		*/
		/*
			Token now needed for API:
			https://wiki.openstreetmap.org/wiki/OpenMapSurfer
		{
			label: 'Open Map Surfer',
			url: 'https://korona.geog.uni-heidelberg.de/tiles/roads/x={x}&y={y}&z={z}',
			options: {
				attribution: 'Imagery from <a href="https://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
			}
		},
		{
			label: 'Lantmäteriet ortofoto karta',
			url: 'https://frigg-test.isof.se/sagendatabas/api/lm_orto_proxy/',
			//url: 'http://ifsf0001:h52w0OaX5eW@maps.lantmateriet.se/ortofoto/wms/v1.3',
			options: {
				attribution: '&copy; <a href="https://www.lantmateriet.se/en/">Lantmäteriet</a> Topografisk Ortofoto Visning',
				crossOrigin: true,
			}
		},
		*/
		{
			label: 'ESRI World Imagery',
			url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
			options: {
				attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
			}
		},
		{
			label: 'ESRI Gray',
			url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
			options: {
				attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
			}
		},
/*
		{
			label: 'Göteborgs og Bohus län',
			url: 'http://localhost/ISOF/Sagenkarta-GUI/www/tiles/gbl/{z}/{x}/{y}.png',
			options: {
				attribution: 'Data &copy; Lantmäteriet'
			}
		}
*/
	],

	overlayTileLayers: [
		// Historiska Ortofoto LM
		{
			isWms: true,
			label: 'Lantmäteriet Ortofoto 1960',
			url: 'https://frigg.isof.se/sagendatabas/api/lm_historto_proxy',
			layers: "OI.Histortho_60",
			TILED: true,
			TILESORIGIN: "-2238400, 5287200",
			ISBASELAYER: true,
			hidden: true,
			maxZoom: 17,
			minZoom: 6,
			options: {
				attribution: '&copy; <a href="https://www.lantmateriet.se/sv/Kartor-och-geografisk-information/geodataprodukter/produktlista/historiska-ortofoton-visning/">Lantmäteriverket</a> Ortofoto 1960',
				crossOrigin: true,
			}
		},
		// Ortofoto LM
		{
			isWms: true,
			label: 'Lantmäteriet Ortofoto',
			url: 'https://frigg.isof.se/sagendatabas/api/lm_orto_proxy',
			layers: "Ortofoto_0.5,Ortofoto_0.4,Ortofoto_0.25,Ortofoto_0.16",
			//layers: "Ortofoto_0.5%2COrtofoto_0.4%2COrtofoto_0.25%2COrtofoto_0.16",
			TILED: true,
			TILESORIGIN: "-2238400, 5287200",
			ISBASELAYER: true,
			hidden: true,
			maxZoom: 17,
			minZoom: 6,
			options: {
				attribution: '&copy; <a href="https://www.lantmateriet.se/sv/Kartor-och-geografisk-information/geodataprodukter/produktlista/ortofoto-visning/">Lantmäteriverket</a> Ortofoto',
				crossOrigin: true,
			}
		},
		// Socken RAÄ
		{
			isWms: true,
			label: 'Sockengränser',
			url: 'https://karta.raa.se/geo/arkreg_v1.0/wms',
			layers: "socken",
			TILED: true,
			TILESORIGIN: "-2238400, 5287200",
			ISBASELAYER: false,
			hidden: false,
			maxZoom: 17,
			minZoom: 11,
			options: {
				attribution: '&copy; <a href="https://www.raa.se/en/">Riksankikvarieämbetet</a> Sockenkarta',
				crossOrigin: true,
			}
		},
	],

	createLayers() {
		var ret = {};
		
		for (var i = 0; i<this.tileLayers.length; i++) {
			var newLayer;

			if (this.tileLayers[i].isWms) {
				newLayer = L.tileLayer.wms(this.tileLayers[i].url, {
					layers: this.tileLayers[i].layerName,
					minZoom: this.tileLayers[i].minZoom || 3,
					maxZoom: this.tileLayers[i].maxZoom,
					attribution: this.tileLayers[i].attribution
				});
			}
			else {
				newLayer = L.tileLayer(this.tileLayers[i].url, this.tileLayers[i].options);
			}
			ret[this.tileLayers[i].label] = newLayer;
		}
		return ret;
	},
	createOverlayLayers() {
		var ret = {};	
		if (!!this.overlayTileLayers) {
			for (var i = 0; i<this.overlayTileLayers.length; i++) {
				var newLayer;

				if (this.overlayTileLayers[i].isWms) {
					newLayer = L.tileLayer.wms(this.overlayTileLayers[i].url, {
						layers: this.overlayTileLayers[i].layers,
						minZoom: this.overlayTileLayers[i].minZoom || 3,
						maxZoom: this.overlayTileLayers[i].maxZoom,
						format: 'image/png',
						transparent: true,
						hidden: this.overlayTileLayers[i].hidden,
						TILED: this.overlayTileLayers[i].TILED,
						ISBASELAYER: this.overlayTileLayers[i].ISBASELAYER,
						TILESORIGIN: this.overlayTileLayers[i].TILESORIGIN,
					});
				}
				else {
					newLayer = L.tileLayer(this.overlayTileLayers[i].url, this.overlayTileLayers[i].options);
				}
				ret[this.overlayTileLayers[i].label] = newLayer;
			}
		}
		return ret;
	},

/*
	inSweden(lat, lng) {
		return (turfInside({
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: [lng, lat]
			}
		}, swedenBorder.features[0]));
	},
*/
	getSweref99crs() {
		var crs = new L.Proj.CRS('EPSG:3006',
			'+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
			{
				resolutions: [
					4096, 2048, 1024, 512, 256, 128,64, 32, 16, 8, 4, 2, 1, 0.5
				],
				origin: [-1200000.000000, 8500000.000000 ],
				bounds:  L.bounds( [-1200000.000000, 8500000.000000], [4305696.000000, 2994304.000000])
			}
		);
		return crs;
	}
};