import './style.css';
import {Map, View} from 'ol';
import LayerGroup from 'ol/layer/Group.js';
import LayerControl from './ol-layer-control.js';

import { baseMapsLayerGroup } from './basemaplayers.js';
import { bodemvlakkenLayer, kadParcelsLayer, ahnLayer, natura2000Layer, waterschappenLayer, gemeentenLayer, provinciesLayer, nnnLayer } from './wmslayers.js';
import { RD_TILE_MATRIX_SET_EXTENT } from './epsg28992.js';

const baseMaps = baseMapsLayerGroup.getLayers();
const projection = baseMaps.item(1).get('source').getProjection();

const DEFAULT_CENTER = [155000, 463000];
const DEFAULT_ZOOM = 3;
const DEFAULT_BASEMAP_INDEX = 8; // element in baseMapsLayerGroup — see basemaplayers.js
const minZoom = 3;
const maxZoom = 19;

const view = new View({
  minZoom,
  maxZoom,
  projection,
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
  extent: RD_TILE_MATRIX_SET_EXTENT,
});

const backgroundInfoLayerGroup = new LayerGroup({
  title: 'Achtergrondinformatie',
  layers: [bodemvlakkenLayer, ahnLayer, natura2000Layer, nnnLayer],
});

const adminBoundariesLayerGroup = new LayerGroup({
  title: 'Bestuurlijke gebieden',
  exclusive: true, // demo: children rendered as radio buttons
  layers: [waterschappenLayer, provinciesLayer, gemeentenLayer],
});

const map = new Map({
  target: 'map',
  layers: [
    baseMapsLayerGroup,
    backgroundInfoLayerGroup,
    adminBoundariesLayerGroup,
    kadParcelsLayer
  ],
  view,
});

map.addControl(new LayerControl({open: true, opacitySlider: true}));
