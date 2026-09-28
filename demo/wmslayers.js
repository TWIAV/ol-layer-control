import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';

// ---------------------------------------------------------------------
// Custom popup content for FeatureInfoControl (src/FeatureInfoControl.js).
//
// Each function takes the ol/Feature GetFeatureInfo returned and returns
// an HTML string — that's the entire interface. A layer that has no
// renderContent of its own (see `.set('identify', ...)` below, on each
// layer) automatically gets a generic attribute-table popup instead, so
// adding a *new* WMS or vector layer to the identify system doesn't
// require a custom renderer up front — only add one once you actually
// want tailored content instead of the raw fields.
//
// Field names below come from each service's own GetFeatureInfo response
// (INFO_FORMAT=application/json) — verified against this project's own
// prior working implementation of this exact popup content, not guessed.
// If a PDOK service ever renames a field, check the browser's Network tab
// on a click and update the field name(s) here; nothing else needs to
// change.
// ---------------------------------------------------------------------

function haacaFormat(num, size) {
  let s = Math.floor(num).toString();
  while (s.length < size) s = '0' + s;
  return s;
}

/** hectare/are/centiare — the traditional Dutch way of expressing a cadastral parcel's surface area. */
function formatHaAaCa(m2) {
  const padded = haacaFormat(m2, 5);
  const ha = Number(padded.slice(0, padded.length - 4));
  const a = Number(padded.slice(padded.length - 4, padded.length - 2));
  const ca = Number(padded.slice(padded.length - 2));
  return `${ha} ha ${a} a ${ca} ca`;
}

function renderKadastraal(feature) {
  const gemeente = feature.get('kadastraleGemeenteWaarde') ?? '–';
  const gemeenteCode = feature.get('AKRKadastraleGemeenteCodeWaarde') ?? '';
  const sectie = feature.get('sectie') ?? '';
  const perceel = feature.get('perceelnummer') ?? '–';
  const m2 = parseFloat(feature.get('kadastraleGrootteWaarde'));
  const oppervlakte = isNaN(m2) ? '–' : `${formatHaAaCa(m2)} (${new Intl.NumberFormat('nl-NL').format(m2)} m²)`;

  return (
    '<p class="pop-head">Kadastrale gegevens</p>' +
    '<ul class="pop-list">' +
    `<li><span class="pop-lbl">Kadastrale gemeente</span><span class="pop-val">${gemeente}</span></li>` +
    `<li><span class="pop-lbl">Perceelnummer</span><span class="pop-val">${gemeenteCode} ${sectie} ${perceel}</span></li>` +
    `<li><span class="pop-lbl">Oppervlakte</span><span class="pop-val">${oppervlakte}</span></li>` +
    '</ul>'
  );
}

function renderAhn(feature) {
  // The raster value field is "value_list" on this PDOK service, with a
  // couple of fallbacks in case that ever differs by request/version.
  const raw = feature.get('value_list') ?? feature.get('GRAY_INDEX') ?? feature.get('value');
  const hoogte = raw != null ? `${parseFloat(raw).toFixed(2)} m` : '–';

  return (
    '<p class="pop-head">Actueel Hoogtebestand Nederland (AHN)</p>' +
    '<ul class="pop-list">' +
    `<li><span class="pop-lbl">Hoogte</span><span class="pop-val">${hoogte} t.o.v. NAP</span></li>` +
    '</ul>'
  );
}

function renderBodemkaart(feature) {
  const code = feature.get('normal_soilprofile_code') ?? feature.get('soilUnit') ?? '–';
  const naam = feature.get('normal_soilprofile_name') ?? feature.get('soilName') ?? '';
  const bodemtype = naam ? `${code} – ${naam}` : code;

  return (
    '<p class="pop-head">Bodemkaart (BRO)</p>' +
    '<ul class="pop-list">' +
    `<li><span class="pop-lbl">Bodemtype</span><span class="pop-val">${bodemtype}</span></li>` +
    '</ul>'
  );
}

function renderNatura2000(feature) {
  const gebied = feature.get('naamN2K') ?? feature.get('name') ?? '–';
  const bescherming = feature.get('beschermin') ?? feature.get('bescherming') ?? '–';

  return (
    '<p class="pop-head">Natura 2000</p>' +
    '<ul class="pop-list">' +
    `<li><span class="pop-lbl">Gebied</span><span class="pop-val">${gebied}</span></li>` +
    `<li><span class="pop-lbl">Bescherming</span><span class="pop-val">${bescherming}</span></li>` +
    '</ul>'
  );
}

// Actueel Hoogtebestand Nederland (AHN)
const ahnUrlWms = 'https://service.pdok.nl/rws/ahn/wms/v1_0';

const ahnSource = new TileWMS({
  url: ahnUrlWms,
  params: {'LAYERS': 'dtm_05m', 'TILED': true},
  serverType: 'geoserver',
  crossOrigin: 'anonymous',
  attributions: '<a href="https://www.pdok.nl/introductie/-/article/actueel-hoogtebestand-nederland-ahn" target="_blank" title="Publieke Dienstverlening Op de Kaart"> | Actueel Hoogtebestand Nederland (AHN)</a>'
});

const ahnLayer = new TileLayer({
  title: 'Actueel Hoogtebestand Nederland (AHN)',
  source: ahnSource,
  visible: false,
});
ahnLayer.set('identify', {
  label: 'AHN',
  // color: '#5ec8a0', // per-layer highlight colour override — currently unused, all layers share FeatureInfoControl's defaultHighlightColor instead
  renderContent: renderAhn,
});
// PDOK's WMS services generally don't implement the GetLegendGraphic
// *operation* (a dynamic request), despite each still advertising a
// real, static, pre-rendered legend PNG per style in their own
// GetCapabilities response — so `legend.url` below is set explicitly for
// every layer in this file, pointing at that static PNG, rather than
// relying on LayerControl.js's own generic `source.getLegendUrl()`
// fallback (kept there for any WMS service that *does* implement the
// operation). This exact URL is AHN's own advertised LegendURL.
ahnLayer.set('legend', {
  url: 'https://service.pdok.nl/rws/actueel-hoogtebestand-nederland/wms/v1_0?language=dut&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=dtm_05m&format=image/png&STYLE=default',
});

// Kadastrale kaart - Basisregistratie Kadaster (BRK)
const kadUrlWms = 'https://service.pdok.nl/kadaster/kadastralekaart/wms/v5_0';

const kadParcelsSource = new TileWMS({
  url: kadUrlWms,
  params: {'LAYERS': 'Perceel', 'TILED': true},
  serverType: 'geoserver',
  crossOrigin: 'anonymous',
  attributions: '<a href="https://www.pdok.nl/introductie/-/article/kadastrale-kaart" target="_blank" title="Publieke Dienstverlening Op de Kaart"> | Kadastrale percelen (BRK)</a>'
});

const kadParcelsLayer = new TileLayer({
  title: 'Kadastrale percelen',
  source: kadParcelsSource,
  visible: false,
  maxResolution: 1.20
});
kadParcelsLayer.set('identify', {
  label: 'Kadastrale percelen',
  // color: '#8b9aab', // per-layer highlight colour override — currently unused, all layers share FeatureInfoControl's defaultHighlightColor instead
  renderContent: renderKadastraal,
});
// Static LegendURL for the "Perceel" layer's default ("standaard") style
// — see the note on ahnLayer's own `legend` above.
kadParcelsLayer.set('legend', {
  url: 'https://service.pdok.nl/kadaster/kadastralekaart/wms/v5_0/legend/Perceel/standaard:perceel.png',
});

// Bodemkaart - Basisregistratie Ondergrond (BRO)
const bodemvlakkenUrlWms = 'https://service.pdok.nl/bzk/bro-bodemkaart/wms/v1_0';

const bodemvlakkenSource = new TileWMS({
  url: bodemvlakkenUrlWms,
  params: {'LAYERS': 'soilarea', 'TILED': true},
  serverType: 'geoserver',
  crossOrigin: 'anonymous',
  attributions: '<a href="https://www.pdok.nl/introductie/-/article/bro-bodemkaart-sgm-" target="_blank" title="Publieke Dienstverlening Op de Kaart"> | Bodemkaart (BRO)</a>'
});

const bodemvlakkenLayer = new TileLayer({
  title: 'Bodemkaart',
  source: bodemvlakkenSource,
  visible: false,
});
bodemvlakkenLayer.set('identify', {
  label: 'Bodemkaart',
  // color: '#c98a4b', // per-layer highlight colour override — currently unused, all layers share FeatureInfoControl's defaultHighlightColor instead
  renderContent: renderBodemkaart,
});
// Static LegendURL for the "soilarea" layer's own style — see the note
// on ahnLayer's own `legend` above.
bodemvlakkenLayer.set('legend', {
  url: 'https://service.pdok.nl/tno/bro-bodemkaart/wms/v1_0/legend/soilarea/soilslope.png',
});

// Natura2000
const natura2000UrlWms = 'https://service.pdok.nl/rvo/natura2000/wms/v1_0';

const natura2000Source = new TileWMS({
  url: natura2000UrlWms,
  params: {'LAYERS': 'natura2000', 'TILED': true},
  serverType: 'geoserver',
  crossOrigin: 'anonymous',
  attributions: '<a href="https://www.pdok.nl/introductie/-/article/natura-2000" target="_blank" title="Publieke Dienstverlening Op de Kaart"> | Natura 2000</a>'
});

const natura2000Layer = new TileLayer({
  title: 'Natura 2000',
  source: natura2000Source,
  visible: false,
});
natura2000Layer.set('identify', {
  label: 'Natura 2000',
  // color: '#3f9142', // per-layer highlight colour override — currently unused, all layers share FeatureInfoControl's defaultHighlightColor instead
  renderContent: renderNatura2000,
});
// Static LegendURL for the default/first style, "natura2000:lnv_natura2000".
natura2000Layer.set('legend', {
  url: 'https://service.pdok.nl/rvo/natura2000/wms/v1_0/legend/natura2000/natura2000:lnv_natura2000.png',
});

// Bestuurlijke gebieden
const bestuurlijkeGebiedenUrlWms = 'https://service.pdok.nl/kadaster/brk-bestuurlijke-gebieden/wms/v1_0';

// Gemeenten
const gemeentenSource = new TileWMS({
  url: bestuurlijkeGebiedenUrlWms,
  params: {'LAYERS': 'Gemeentegebied', 'TILED': true},
  serverType: 'geoserver',
  crossOrigin: 'anonymous',
  attributions: '<a href="https://www.pdok.nl/introductie/-/article/bestuurlijke-gebieden" target="_blank" title="Publieke Dienstverlening Op de Kaart"> | Gemeenten</a>'
});

const gemeentenLayer = new TileLayer({
  title: 'Gemeenten',
  source: gemeentenSource,
  visible: true,
});

// Custom popup content for FeatureInfoControl (src/FeatureInfoControl.js) —
function renderGemeente(feature) {
  const naam = feature.get('naam') || 'Onbekende gemeente';

  return '<p class="pop-head">Gemeente</p>' + `<p><b>${naam}</b></p>`;
}

gemeentenLayer.set('identify', {
  label: 'Gemeente',
  renderContent: renderGemeente,
});
// Static LegendURL for the default style, "Gemeentegebied".
gemeentenLayer.set('legend', {
  url: 'https://service.pdok.nl/kadaster/brk-bestuurlijke-gebieden/wms/v1_0/legend/Gemeentegebied/Gemeentegebied.png',
});

// Provincies
const provinciesSource = new TileWMS({
  url: bestuurlijkeGebiedenUrlWms,
  params: {'LAYERS': 'Provinciegebied', 'TILED': true},
  serverType: 'geoserver',
  crossOrigin: 'anonymous',
  attributions: '<a href="https://www.pdok.nl/introductie/-/article/bestuurlijke-gebieden" target="_blank" title="Publieke Dienstverlening Op de Kaart"> | Provincies</a>'
});

const provinciesLayer = new TileLayer({
  title: 'Provincies',
  source: provinciesSource,
  visible: false,
});

// Custom popup content for FeatureInfoControl (src/FeatureInfoControl.js) —
function renderProvincie(feature) {
  const naam = feature.get('naam') || 'Onbekende provincie';

  return '<p class="pop-head">Provincie</p>' + `<p><b>${naam}</b></p>`;
}

provinciesLayer.set('identify', {
  label: 'Provincie',
  renderContent: renderProvincie,
});
// Static LegendURL for the default style, "Provinciegebied".
provinciesLayer.set('legend', {
  url: 'https://service.pdok.nl/kadaster/brk-bestuurlijke-gebieden/wms/v1_0/legend/Provinciegebied/Provinciegebied.png',
});

// Waterschappen
const waterschappenUrlWms = 'https://service.pdok.nl/hwh/waterschappen-administratieve-eenheden/wms/v1_0';

const waterschappenSource = new TileWMS({
  url: waterschappenUrlWms,
  params: {'LAYERS': 'AU.AdministrativeUnit', 'TILED': true, 'STYLES': 'AU.AdministrativeUnit.Alternative'},
  serverType: 'geoserver',
  crossOrigin: 'anonymous',
  attributions: '<a href="https://www.pdok.nl/introductie/-/article/waterschappen-administratieve-eenheden-inspire-geharmoniseerd-" target="_blank" title="Publieke Dienstverlening Op de Kaart"> | Waterschappen</a>'
});

const waterschappenLayer = new TileLayer({
  title: 'Waterschappen',
  source: waterschappenSource,
  visible: false,
});

// Custom popup content for FeatureInfoControl (src/FeatureInfoControl.js) —
function renderWaterschap(feature) {
  const naam = feature.get('name') || 'Onbekend waterschap';

  return '<p class="pop-head">Waterschap</p>' + `<p><b>${naam}</b></p>`;
}

waterschappenLayer.set('identify', {
  label: 'Waterschap',
  renderContent: renderWaterschap,
});
// Static LegendURL for the alternative style, "AU.AdministrativeUnit.Alternative".
waterschappenLayer.set('legend', {
  url: 'https://service.pdok.nl/hwh/waterschappen-administratieve-eenheden/wms/v1_0/legend/AU.AdministrativeUnit/AU.AdministrativeUnit.Alternative.png',
});

// Natuurnetwerk Nederland
const nnnUrlWms = 'https://ogc-geoservices.bij12.nl/geoserver/IMNa_IKN/natuur_netwerk_nederland/ows'

const nnnSource = new TileWMS({
  url: nnnUrlWms,
  params: {'LAYERS': 'natuur_netwerk_nederland', 'TILED': true},
  serverType: 'geoserver',
  crossOrigin: 'anonymous',
  attributions: '<a href="https://www.bij12.nl/onderwerp/natuurinformatie/applicaties-en-databanken/informatiekaart-natuur-ikn/" target="_blank" title="InformatieKaart Natuur (IKN)"> | Natuurnetwerk Nederland (BIJ12)</a>'
});

const nnnLayer = new TileLayer({
  title: 'Natuurnetwerk Nederland (NNN)',
  source: nnnSource,
  visible: false,
});

// Custom popup content for FeatureInfoControl (src/FeatureInfoControl.js) —
function renderNnn(feature) {
  const bronhouder = feature.get('bronhouder_desc') || '-';
  const beleidsbron = feature.get('beleid_bron_naam') || '-';
  const beleidsdatum = feature.get('beleid_bron_datum_txt') || '-';
  const beleidsurl = feature.get('beleid_bron_url') || '-';

  const beleidHtml = beleidsurl
    ? `<a target="_blank" rel="noopener" href="${beleidsurl}">${beleidsbron} (${beleidsdatum})</a>`
    : beleidsbron;

  return '<p class="pop-head">Natuurnetwerk Nederland</p>' + `<p><b>${bronhouder}</b> heeft voor Natuurnetwerk Nederland beleid vastgesteld in ${beleidHtml}</p>`;
}

nnnLayer.set('identify', {
  label: 'Natuurnetwerk Nederland',
  renderContent: renderNnn,
});

nnnLayer.set('legend', {
  url: 'https://ogc-geoservices.bij12.nl/geoserver/IMNa_IKN/natuur_netwerk_nederland/ows?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image%2Fpng&width=20&height=20&layer=natuur_netwerk_nederland',
});

export { bodemvlakkenLayer, kadParcelsLayer, ahnLayer, natura2000Layer, waterschappenLayer, gemeentenLayer, provinciesLayer, nnnLayer };
