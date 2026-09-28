import Polygon from 'ol/geom/Polygon.js';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import proj4 from 'proj4';
import {get as getProjection} from 'ol/proj';
import {register} from 'ol/proj/proj4';
import { getTopLeft } from 'ol/extent';

proj4.defs(
  'EPSG:28992',
  '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs'
);

// De Tile Matrix Set voor het Rijksdriehoekstelsel (Amersfoort / RD New)/ EPSG:28992, met als id 'NetherlandsRDNewQuad', is vastegesteld door Geonovum.
// Zie: https://github.com/Geonovum/praktijkrichtlijn-vector-tiling/blob/master/TileMatrixSetRD.md

const RD_TILE_MATRIX_SET_EXTENT = [-285401.92, 22598.08, 595401.92, 903401.92];

register(proj4);
const RD_PROJECTION = getProjection('EPSG:28992');
RD_PROJECTION.setExtent(RD_TILE_MATRIX_SET_EXTENT);
// In de specificatie van Geonovum zijn 17 zoomniveaus gedefinieerd, 0 (resolutie 3440.640) tot en met 16 (resolutie 0.0525). In deze array hebben we nog 3 resoluties toegevoegd,
// zodat het mogelijk is om nog iets verder in te zoomen. Handig bijvoorbeeld bij de haarscherpe luchtfoto's van tegenwoordig.
const resolutions = [3440.640, 1720.320, 860.160, 430.080, 215.040, 107.520, 53.760, 26.880, 13.440, 6.720, 3.360, 1.680, 0.840, 0.420, 0.210, 0.105, 0.0525, 0.02625, 0.013125, 0.0065625];
const matrixIds = [];
for (let i = 0; i < 20; ++i) {
  matrixIds[i] = 'EPSG:28992:' + i;
}

const RD_WMTS_TILE_GRID = new WMTSTileGrid({
  origin: getTopLeft(RD_TILE_MATRIX_SET_EXTENT),
  resolutions: resolutions,
  matrixIds: matrixIds
});


// Het geldigheidsgebied van RD-coördinaten wordt beschreven in de volgende publicatie:
//   'De geodetische referentiestelsels van Nederland/Geodetic reference frames in the
//   Netherlands' van de NCG Nederlandse Commissie voor Geodesie/Netherlands Geodetic
//   Commission, Delft, maart / March 2005
//   Auteurs: Arnoud de Bruijne, Joop van Buren, Anton Kösters, Hans van der Marel
//
// Dit geldigheidsgebied wordt omsloten door een polygoon met elf hoekpunten
// met x,y-coördinaten in meters in pseudo-RD. De coördinaten  van deze polygoon
// staan in 'Tabel 4. Hoekpunten van het geldigheidsgebied van de RD2000-definitie.'
// op pagina 33 van bovengenoemde publicatie. (Zie ook 'Figuur 18. Geldigheidsgebieden
// van de RD2000-definitie en NLGEO2004.' op pagina 35.)
//
// De polygoon hieronder maakt gebruik van deze coördinaten. Overal in de viewer gaan we
// ervan uit dat de RD-coördinaten niet geldig zijn buiten deze polygoon.
// De polygoon wordt gebruikt in MapInfoControl.js (cursor-coördinaten) en
// LocationPickerControl.js (klik-coördinaten), zodat beide controls exact dezelfde
// grens hanteren.

const RD_VALID_EXTENT = new Polygon([[
  [141000, 629000],
  [100000, 600000],
  [80000, 500000],
  [-7000, 392000],
  [-7000, 336000],
  [101000, 336000],
  [161000, 289000],
  [219000, 289000],
  [300000, 451000],
  [300000, 614000],
  [259000, 629000],
  [141000, 629000]
]]);


export {
  RD_PROJECTION,
  RD_TILE_MATRIX_SET_EXTENT,
  RD_WMTS_TILE_GRID,
  RD_VALID_EXTENT
};