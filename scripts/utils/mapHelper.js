import L, { divIcon, tileLayer, bounds } from "leaflet";
import { icon as faIcon } from "@fortawesome/fontawesome-svg-core";
import { faLocationDot, faCircle } from "@fortawesome/free-solid-svg-icons";

// helper to turn a FA definition into an HTML string sized & colored
function faSvg(
  definition,
  { color = "#3D84D4", size = 28, extraClasses = "" } = {}
) {
  // Font Awesome returns an SVG string in .html[0]
  const svg = faIcon(definition, { classes: extraClasses }).html[0];

  // Soft white outline (halo) + drop shadow.
  const isPin = definition?.iconName === "location-dot";
  const halo = isPin
    ? "drop-shadow(0 0 1px #fff) drop-shadow(0 0 2px #fff) drop-shadow(0 0 3px #fff) "
    : "";

  // Size via font-size because FA SVGs are 1em by default; color inherits as currentColor
  return `<span class="fa-marker" style="display:inline-block; line-height:1; font-size:${size}px; color:${color}; filter:${halo}drop-shadow(0 2px 3px rgba(0,0,0,.45));">${svg}</span>`;
}

// create a pin-style DivIcon (tip at bottom center)
function makeFaPin({ color = "#3D84D4", size = 28, extraClasses = "" } = {}) {
  const anchorX = Math.round(size / 2);
  const anchorY = Math.round(size * 0.92); // close to the pin tip
  return divIcon({
    html: faSvg(faLocationDot, { color, size, extraClasses }),
    className: "fa-leaflet-marker", // remove default Leaflet divIcon styling via CSS below
    iconSize: [size, size], // clickable area
    iconAnchor: [anchorX, anchorY], // the "tip" of the pin
    popupAnchor: [0, -anchorY + 6], // popup just above the tip
  });
}

// create a round 27x27 marker
function makeFaDot({ color = "#3D84D4", size = 27, extraClasses = "" } = {}) {
  const half = Math.round(size / 2);
  return divIcon({
    html: faSvg(faCircle, { color, size, extraClasses }),
    className: "fa-leaflet-marker",
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -half],
  });
}

export default {
  // Pin markers
  markerIcon: makeFaPin({ color: "#3D84D4", size: 28 }), // default blue
  markerIconHighlighted: makeFaPin({ color: "#0ea5e9", size: 30 }),
  // Round markers
  blueIcon: makeFaDot({ color: "#1d4ed8", size: 27 }),
  redIcon: makeFaDot({ color: "#dc2626", size: 27 }),

  tileLayers: [
    {
      label: "Lantmäteriet topografisk karta",
      url: "https://garm.isof.se/folkeservice/api/lm_epsg3857_proxy/{z}/{y}/{x}.png",
      options: {
        attribution:
          '&copy; <a href="https://www.lantmateriet.se/en/">Lantmäteriet</a>',
        crossOrigin: true,
      },
    },
    {
      label: "Lantmäteriet topografisk karta nedtonad",
      url: "https://garm.isof.se/folkeservice/api/lm_nedtonad_epsg3857_proxy/{z}/{y}/{x}.png",
      options: {
        attribution:
          '&copy; <a href="https://www.lantmateriet.se/en/">Lantmäteriet</a>',
        crossOrigin: true,
      },
    },
    {
      label: "Open Street Map Mapnik",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      options: {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    },
    {
      label: "ESRI World Imagery",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      options: {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      },
    },
    {
      label: "ESRI Gray",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      options: {
        attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
      },
    },
  ],

  overlayTileLayers: [
    // Historiska Ortofoto LM
    {
      isWms: true,
      label: "Lantmäteriet Ortofoto 1960",
      url: "https://garm.isof.se/folkeservice/api/lm_historto_proxy",
      layers: "OI.Histortho_60",
      TILED: true,
      TILESORIGIN: "-2238400, 5287200",
      ISBASELAYER: true,
      hidden: true,
      maxZoom: 17,
      minZoom: 6,
      options: {
        attribution:
          '&copy; <a href="https://www.lantmateriet.se/sv/Kartor-och-geografisk-information/geodataprodukter/produktlista/historiska-ortofoton-visning/">Lantmäteriverket</a> Ortofoto 1960',
        crossOrigin: true,
      },
    },
    // Ortofoto LM
    {
      isWms: true,
      label: "Lantmäteriet Ortofoto",
      url: "https://garm.isof.se/folkeservice/api/lm_orto_proxy",
      layers: "Ortofoto_0.5,Ortofoto_0.4,Ortofoto_0.25,Ortofoto_0.16",
      // layers: "Ortofoto_0.5%2COrtofoto_0.4%2COrtofoto_0.25%2COrtofoto_0.16",
      TILED: true,
      TILESORIGIN: "-2238400, 5287200",
      ISBASELAYER: true,
      hidden: true,
      maxZoom: 17,
      minZoom: 6,
      options: {
        attribution:
          '&copy; <a href="https://www.lantmateriet.se/sv/Kartor-och-geografisk-information/geodataprodukter/produktlista/ortofoto-visning/">Lantmäteriverket</a> Ortofoto',
        crossOrigin: true,
      },
    },
    // Socken RAÄ
    {
      isWms: true,
      label: "Sockengränser",
      url: "https://karta.raa.se/geo/arkreg_v1.0/wms",
      layers: "socken",
      TILED: true,
      TILESORIGIN: "-2238400, 5287200",
      ISBASELAYER: false,
      hidden: false,
      maxZoom: 17,
      minZoom: 11,
      options: {
        attribution:
          '&copy; <a href="https://www.raa.se">Riksankikvarieämbetet</a> Sockenkarta',
        crossOrigin: true,
      },
    },
    // Generalstabskartan Länsstyrelsen
    {
      isWms: true,
      label: "Generalstabskartan",
      url: "https://ext-geodata-raster.lansstyrelsen.se/arcgis/services/RasterNationellt/lst_ext_generalstabskartan/ImageServer/WMSServer",
      layers: "lst_ext_generalstabskartan",
      //TILED: true,
      //TILESORIGIN: '-2238400, 5287200',
      ISBASELAYER: false,
      hidden: true,
      maxZoom: 17,
      minZoom: 3,
      options: {
        attribution:
          '&copy;<a href="https://www.lansstyrelsen.se/">Länsstyrelsen</a> Generalstabskartan',
        crossOrigin: true,
      },
    },
    // Häradsekonomiska kartan Länsstyrelsen
    {
      isWms: true,
      label: "Häradsekonomiska kartan",
      url: "https://ext-geodata-raster.lansstyrelsen.se/arcgis/services/RasterNationellt/lst_ext_haradsekonomiska_kartan_temp/ImageServer/WMSServer",
      layers: "lst_ext_haradsekonomiska_kartan_temp",
      //TILED: true,
      //TILESORIGIN: '-2238400, 5287200',
      ISBASELAYER: false,
      hidden: true,
      maxZoom: 17,
      minZoom: 6,
      options: {
        attribution:
          '&copy;<a href="https://www.lansstyrelsen.se/">Länsstyrelsen</a> Häradsekonomiska kartan',
        crossOrigin: true,
      },
    },
    // Ekonomiska kartan Länsstyrelsen
    {
      isWms: true,
      label: "Ekonomiska kartan",
      url: "https://ext-geodata-raster.lansstyrelsen.se/arcgis/services/RasterNationellt/lst_ext_ekonomiska_kartan/ImageServer/WMSServer",
      layers: "lst_ext_ekonomiska_kartan",
      //TILED: true,
      //TILESORIGIN: '-2238400, 5287200',
      ISBASELAYER: false,
      hidden: true,
      maxZoom: 17,
      minZoom: 3,
      options: {
        attribution:
          '&copy;<a href="https://www.lansstyrelsen.se/">Länsstyrelsen</a> Ekonomiska kartan',
        crossOrigin: true,
      },
    },
  ],

  createLayers() {
    const ret = {};
    for (let i = 0; i < this.tileLayers.length; i++) {
      let newLayer;
      if (this.tileLayers[i].isWms) {
        newLayer = tileLayer.wms(this.tileLayers[i].url, {
          layers: this.tileLayers[i].layerName,
          minZoom: this.tileLayers[i].minZoom || 3,
          maxZoom: this.tileLayers[i].maxZoom,
          attribution: this.tileLayers[i].attribution,
        });
      } else {
        newLayer = tileLayer(
          this.tileLayers[i].url,
          this.tileLayers[i].options
        );
      }
      ret[this.tileLayers[i].label] = newLayer;
    }
    return ret;
  },

  createOverlayLayers() {
    const ret = {};
    if (this.overlayTileLayers) {
      for (let i = 0; i < this.overlayTileLayers.length; i++) {
        let newLayer;
        if (this.overlayTileLayers[i].isWms) {
          newLayer = tileLayer.wms(this.overlayTileLayers[i].url, {
            layers: this.overlayTileLayers[i].layers,
            minZoom: this.overlayTileLayers[i].minZoom || 3,
            maxZoom: this.overlayTileLayers[i].maxZoom,
            format: "image/png",
            transparent: true,
            hidden: this.overlayTileLayers[i].hidden,
            attribution: this.overlayTileLayers[i].options.attribution,
            TILED: this.overlayTileLayers[i].TILED,
            ISBASELAYER: this.overlayTileLayers[i].ISBASELAYER,
            TILESORIGIN: this.overlayTileLayers[i].TILESORIGIN,
          });
        } else {
          newLayer = tileLayer(
            this.overlayTileLayers[i].url,
            this.overlayTileLayers[i].options
          );
        }
        ret[this.overlayTileLayers[i].label] = newLayer;
      }
    }
    return ret;
  },

  getSweref99crs() {
    const crs = new L.Proj.CRS(
      "EPSG:3006",
      "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
      {
        resolutions: [
          4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5,
        ],
        origin: [-1200000.0, 8500000.0],
        bounds: bounds([-1200000.0, 8500000.0], [4305696.0, 2994304.0]),
      }
    );
    return crs;
  },
};
