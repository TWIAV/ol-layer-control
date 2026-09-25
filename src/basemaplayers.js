import './style.css';

import LayerGroup from 'ol/layer/Group';
import TileLayer from 'ol/layer/Tile';
import WMTSSource from 'ol/source/WMTS';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';

import { RD_PROJECTION, RD_WMTS_TILE_GRID } from './epsg28992.js';

// BASEMAP GROUP
// Basisregistratie Topografie (BRT)
const brtAchtergrondkaartSource = new WMTSSource({
  url: 'https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0',
  layer: 'standaard',
  matrixSet: 'EPSG:28992', projection: RD_PROJECTION, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: RD_WMTS_TILE_GRID, style: 'default',
  attributions: 'PDOK: <a href="https://www.pdok.nl/introductie/-/article/basisregistratie-topografie-achtergrondkaarten-brt-a-" target="_blank" title="Publieke Dienstverlening Op de Kaart">BRT Achtergrondkaart</a>'
});

const brtAchtergrondkaartLayer = new TileLayer({
  title: 'BRT Achtergrondkaart',
  minResolution: 1.10,
  source: brtAchtergrondkaartSource
});

// brt grayscale layer
const brtAchtergrondkaartGrijsLayer = new TileLayer({
  title: 'BRT Achtergrondkaart (grijs)',
  minResolution: 1.10,
  source: brtAchtergrondkaartSource,
  className: 'ol-layer css-filter-grayscale'
});

// Basisregistratie Grootschalige Topografie (BGT)
const bgtAchtergrondkaartSource = new WMTSSource({
  url: 'https://service.pdok.nl/lv/bgt/wmts/v1_0',
  layer: 'achtergrondvisualisatie',
  matrixSet: 'EPSG:28992', projection: RD_PROJECTION, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: RD_WMTS_TILE_GRID, style: 'default',
  attributions: 'PDOK: <a href="https://www.pdok.nl/introductie/-/article/basisregistratie-grootschalige-topografie-bgt-" target="_blank" title="Publieke Dienstverlening Op de Kaart">BGT Achtergrondkaart</a>'
});

const bgtAchtergrondkaartLayer = new TileLayer({
  title: 'BGT Achtergrondkaart',
  maxResolution: 1.20,
  minResolution: 0.0525, // Don't zoom in to far: the BGT WMTS service doesn't offer tiles all the way down to the finest level (resolutions[19])
  source: bgtAchtergrondkaartSource
});

// bgt grayscale layer
const bgtAchtergrondkaartGrijsLayer = new TileLayer({
  title: 'BGT Achtergrondkaart (grijs)',
  maxResolution: 1.20, // Don't zoom in to far: the BGT WMTS service doesn't offer tiles all the way down to the finest level (resolutions[19])
  minResolution: 0.0525,
  source: bgtAchtergrondkaartSource,
  className: 'ol-layer css-filter-grayscale'
});

// 'Achtergrondkaart': BGT and BRT combined in one layer
const achtergrondkaartLayerGroup = new LayerGroup({
  title: 'Achtergrondkaart',
  visible: false,
  combine: true,
  layers: [bgtAchtergrondkaartLayer, brtAchtergrondkaartLayer],
  type: 'base',
});

// 'Achtergrondkaart (grijs)': BGT (grijs) and BRT (grijs) combined in one layer
const achtergrondkaartGrijsLayerGroup = new LayerGroup({
  title: 'Achtergrondkaart (grijs)',
  visible: false,
  combine: true,
  layers: [bgtAchtergrondkaartGrijsLayer, brtAchtergrondkaartGrijsLayer],
  type: 'base',
});

//OpenTopoMap
const openTopoMapSource = new XYZ({
  url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
  maxZoom: 17,
  crossOrigin: 'Anonymous',
  attributions: 'Map data: &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors | DEM: <a href="http://viewfinderpanoramas.org">SRTM</a>, <a href="https://sonny.4lima.de">Sonny</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/4.0/">CC-BY-SA</a>)'
});

const openTopoMapLayer = new TileLayer({
  title: 'OpenTopoMap',
  type: 'base',
  visible: false,
  source: openTopoMapSource
});

// OpenTopoMap grayscale layer
const openTopoMapGrijsLayer = new TileLayer({
  title: 'OpenTopoMap (grijs)',
  type: 'base',
  visible: true,
  source: openTopoMapSource,
  className: 'ol-layer css-filter-grayscale'
});


// OpenStreetMap
const openStreetMapLayer = new TileLayer({ 
  title: 'OpenStreetMap',
  type: 'base',
  visible: false,
  source: new OSM({
    projection: RD_PROJECTION,
  })
});

// osm grayscale layer
const openStreetMapGrijsLayer = new TileLayer({ 
  title: 'OpenStreetMap (grijs)',
  type: 'base',
  visible: false,
  source: new OSM({
    projection: RD_PROJECTION,
  }),
  className: 'ol-layer css-filter-grayscale'
});

// Luchtfoto's 
const luchtfotoActueelOrtho25cmRGBLayer = new TileLayer({
  title: 'Luchtfoto (actueel / zomer / 25 cm)',
  type: 'base',
  visible: false,
  source: new WMTSSource({
    url: 'https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0',
    layer: 'Actueel_ortho25',
    matrixSet: 'EPSG:28992', projection: RD_PROJECTION, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: RD_WMTS_TILE_GRID, style: 'default',
    attributions: 'PDOK: <a href="https://www.pdok.nl/introductie/-/article/pdok-luchtfoto-rgb-open-" target="_blank" title="Publieke Dienstverlening Op de Kaart">Luchtfoto</a>'
  })
});

const luchtfotoActueelOrthoHRRGBLayer = new TileLayer({
  title: 'Luchtfoto (actueel / winter / 8-5 cm)',
  type: 'base',
  visible: false,
  source: new WMTSSource({
    url: 'https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0',
    layer: 'Actueel_orthoHR',
    matrixSet: 'EPSG:28992', projection: RD_PROJECTION, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: RD_WMTS_TILE_GRID, style: 'default',
    attributions: 'PDOK: <a href="https://www.pdok.nl/introductie/-/article/pdok-luchtfoto-rgb-open-" target="_blank" title="Publieke Dienstverlening Op de Kaart">Luchtfoto</a>'
  })
});

// Lege basiskaart
 const emptyBaseMap = new TileLayer({
  title: 'Geen basiskaart',
  type: 'base',
  visible: false
});

export const baseMapsLayerGroup = new LayerGroup({
  title: 'Basiskaarten',
  folded: false,
  layers: [emptyBaseMap, luchtfotoActueelOrthoHRRGBLayer, luchtfotoActueelOrtho25cmRGBLayer, openStreetMapGrijsLayer, openStreetMapLayer, openTopoMapGrijsLayer, openTopoMapLayer, achtergrondkaartGrijsLayerGroup, achtergrondkaartLayerGroup]
});