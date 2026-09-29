# OpenLayers Layer Control

A layer control for [OpenLayers](https://openlayers.org/): a map button that opens a docked, resizable side panel in which the user switches layers and layer groups on and off.

The panel is rendered **next to** the map, never on top of it. The map shrinks while the panel is open.

## Features

- Map button with an inline SVG icon that opens and closes the panel, in one of five positions that stay clear of the OpenLayers default controls.
- Panel docked to the right (or left) of the map, resizable by dragging its edge. Double-click the edge to reset the width.
- Nested layer groups, with fold/unfold per group.
- Basemaps as radio buttons (only one visible at a time).
- Any other group can be **exclusive** (radio buttons) or **non-exclusive** (checkboxes). Right-click a group title to switch between the two.
- Layers that are not drawn at the current zoom level (because of `minResolution`/`maxResolution` or `minZoom`/`maxZoom`) are greyed out with a tooltip. Layers inside a switched-off group are greyed out too, with a tooltip naming the group.
- Optional opacity slider per layer.
- Optional search box that filters the layer list. Click the panel title to show or hide it.
- Follows the map: layers added, removed or changed in code are reflected in the panel.
- English by default. Every string can be translated.
- Keyboard accessible: real checkboxes, radios and buttons, Escape closes the panel.

## Installation

```bash
npm install ol-layer-control
```

The package requires OpenLayers 10 (`ol` is a peer dependency, so your app provides it). TypeScript declarations are included.

## Usage

```js
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import LayerGroup from 'ol/layer/Group.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import LayerControl from 'ol-layer-control';

const map = new Map({
  target: 'map',
  layers: [
    new LayerGroup({
      properties: { title: 'Basemaps' },
      layers: [
        new TileLayer({
          source: new OSM(),
          properties: { title: 'OpenStreetMap', type: 'base' },
        }),
      ],
    }),
  ],
  view: new View({ center: [0, 0], zoom: 2 }),
});

map.addControl(new LayerControl({ open: true }));
```

Only layers and groups with a `title` appear in the panel. Layers without one, such as helper layers for drawing or highlighting, are left out on purpose. If the panel says "No layers to show", give your layers a title.

You can set layer properties in the `properties` option, as above, or as plain options such as `title: 'OpenStreetMap'`. OpenLayers stores unknown options as properties too, but TypeScript only accepts the `properties` form.

The package is published as ES modules and needs a bundler, such as Vite, webpack, Parcel, or Rollup with a CSS plugin. The control imports its own stylesheet, so the single import above is all you need.

If your setup handles CSS separately, the stylesheet is also available on its own:

```js
import 'ol-layer-control/ol-layer-control.css';
```

### Layer properties

The control reads these properties from layers and groups. Set them as constructor options or with `layer.set(...)`.

| Property                 | On            | Meaning                                                                                  |
| ------------------------ | ------------- | ---------------------------------------------------------------------------------------- |
| `title`                  | layer, group  | Text shown in the panel. Layers without a title are not listed.                          |
| `displayInLayerControl`  | layer, group  | `false` hides the layer or group from the panel.                                         |
| `type: 'base'`           | layer         | Marks a basemap. A group containing basemaps is exclusive and has no checkbox of its own. |
| `exclusive`              | group         | `true` renders the children as radio buttons. Right-clicking the group title toggles it. |
| `combine`                | group         | `true` shows the group as a single layer instead of expanding its children.              |
| `folded`                 | group         | `true` starts the group collapsed. Updated when the user folds or unfolds.               |

```js
const baseMaps = new LayerGroup({
  title: 'Basemaps',
  layers: [
    new TileLayer({ title: 'OpenStreetMap', type: 'base', source: new OSM() }),
    new TileLayer({ title: 'None', type: 'base', visible: false }),
  ],
});

const overlays = new LayerGroup({
  title: 'Administrative areas',
  exclusive: true,
  layers: [municipalities, provinces],
});
```

### Options

| Option            | Type                      | Default   | Description                                                                                          |
| ----------------- | ------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| `open`            | `boolean`                 | `false`   | Start with the panel open.                                                                           |
| `side`            | `'right' \| 'left'`       | `'right'` | Side of the map the panel docks to.                                                                  |
| `buttonPosition`  | `ButtonPosition`          | per side  | Where the map button sits. See [Button position](#button-position). Defaults to `'top-left'` when `side` is `'left'`, otherwise `'right'`. |
| `panelWidth`      | `number`                  | `320`     | Initial panel width in pixels.                                                                       |
| `minPanelWidth`   | `number`                  | `200`     | Smallest width the user can resize to.                                                               |
| `maxPanelWidth`   | `number`                  | `800`     | Largest width the user can resize to. The control also always leaves some map visible.               |
| `resizable`       | `boolean`                 | `true`    | Show the drag handle.                                                                                |
| `reverse`         | `boolean`                 | `true`    | List layers top-most first (the reverse of the map's rendering order).                               |
| `exclusiveToggle` | `boolean`                 | `true`    | Let the user right-click a group title to switch between exclusive and non-exclusive.                |
| `opacitySlider`   | `boolean`                 | `false`   | Give every layer a button that reveals an opacity slider.                                            |
| `search`          | `boolean`                 | `false`   | Show the search box from the start. The user can always show or hide it by clicking the panel title. |
| `panelTarget`     | `HTMLElement \| string`   |           | Render the panel into this element (or element id) instead of next to the map. See [Layout](#layout). |
| `target`          | `HTMLElement \| string`   |           | Standard OpenLayers control option: where to render the map button.                                  |
| `i18n`            | `Partial<LayerControlI18n>` |         | Translations, see [Translating](#translating).                                                       |

### API

| Method                          | Description                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `open()`, `close()`, `toggle()` | Show or hide the panel.                                                              |
| `isOpen()`                      | Whether the panel is shown.                                                          |
| `setPanelWidth(px)`             | Set the panel width (clamped to min/max).                                            |
| `setButtonPosition(position)`, `getButtonPosition()` | Move the map button, or read where it is.                       |
| `getPanelWidth()`               | Current panel width in pixels.                                                       |
| `getPanelElement()`             | The panel element.                                                                   |
| `setExclusive(group, boolean)`  | Make a group exclusive or not. When several children are visible, only the top-most stays visible. |
| `showSearch(boolean)`, `toggleSearch()`, `isSearchVisible()` | Show or hide the search box. Hiding it clears the filter.  |
| `setFilter(text)`, `getFilter()` | Filter the list by (part of) a title.                                               |
| `setI18n(partial)`, `getI18n()` | Replace (part of) the UI strings at runtime.                                         |
| `refresh()`                     | Rebuild the list. Normally not needed; the control follows the map by itself.        |

The control is an OpenLayers `Control`, so `control.on(...)` works. These properties fire `change:` events:

| Property        | Type      | Event                   |
| --------------- | --------- | ----------------------- |
| `open`          | `boolean` | `change:open`           |
| `panelWidth`    | `number`  | `change:panelWidth`     |
| `searchVisible` | `boolean` | `change:searchVisible`  |
| `buttonPosition` | `ButtonPosition` | `change:buttonPosition` |

```js
control.on('change:open', () => console.log('panel open:', control.isOpen()));
```

### Button position

The map button can sit in five places. Each one leaves room for the OpenLayers default control that normally uses that part of the map.

| `buttonPosition` | Where                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `'top-left'`     | Top left, below the Zoom buttons.                                                               |
| `'bottom-left'`  | Bottom left corner.                                                                             |
| `'top-right'`    | Top right corner. This is the Rotate button's spot, see the note below.                         |
| `'right'`        | Top right, below the Rotate button.                                                             |
| `'bottom-right'` | Bottom right, above the Attribution button.                                                     |

The Rotate button only appears when the map is rotated, and it appears in the top-right corner. With `'top-right'` the layer button covers it. That is why the default for a right-side panel is `'right'`, just below it.

```js
new LayerControl({ side: 'right', buttonPosition: 'bottom-right' });
```

The list of valid values is exported as `BUTTON_POSITIONS`. An unknown value logs a warning and falls back to the default for the panel's side.

The offsets assume the default OpenLayers controls. When you add others, such as a ScaleLine at the bottom left, adjust the spacing with `--ol-layer-control-edge` and `--ol-layer-control-gap` (see [Theming](#theming)), or override the position classes `ol-layer-control--top-left`, `ol-layer-control--bottom-left`, `ol-layer-control--top-right`, `ol-layer-control--right` and `ol-layer-control--bottom-right`.

### Translating

Pass any subset of the strings in the `i18n` option, or call `setI18n()` later. The full set, with the English defaults, is exported as `DEFAULT_I18N`.

```js
import LayerControl, { DEFAULT_I18N } from 'ol-layer-control';

new LayerControl({
  i18n: {
    buttonTitle: 'Lagen',
    panelTitle: 'Lagen',
    closeTitle: 'Lagenpaneel sluiten',
    resizeTitle: 'Sleep om de breedte te wijzigen, dubbelklik om te herstellen',
    collapseTitle: 'Groep inklappen',
    expandTitle: 'Groep uitklappen',
    exclusiveHint: 'Rechtsklik om te wisselen tussen één laag tegelijk en meerdere lagen',
    outOfRangeHint: 'Niet zichtbaar op dit zoomniveau',
    groupOffHint: 'Niet zichtbaar: groep "{group}" staat uit',
    opacityTitle: 'Transparantie',
    searchToggleTitle: 'Zoekveld tonen of verbergen',
    searchPlaceholder: 'Lagen zoeken',
    searchClearTitle: 'Zoekopdracht wissen',
    searchNoResults: 'Geen lagen gevonden',
    emptyMessage: 'Geen lagen om te tonen. Alleen lagen en groepen met een titel worden weergegeven.',
  },
});
```

`{group}` in `groupOffHint` is replaced by the title of the switched-off group. Layer and group titles come from the layers themselves and are not translated by the control.

### Theming

All colours and sizes are CSS custom properties. Override them on any ancestor of the panel, for example `:root`:

```css
:root {
  --ol-layer-control-bg: #1e1e1e;
  --ol-layer-control-fg: #eee;
  --ol-layer-control-border: #444;
  --ol-layer-control-hover: rgba(255, 255, 255, 0.08);
  --ol-layer-control-accent: #6ea8ff;
  --ol-layer-control-font: 14px/1.4 system-ui, sans-serif;
  --ol-layer-control-indent: 1.4em;
  --ol-layer-control-shadow: none;
  --ol-layer-control-edge: 0.5em; /* map button distance from the map edge */
  --ol-layer-control-gap: 0.5em;  /* space between the map button and the OpenLayers control it avoids */
}
```

Every element carries a class starting with `ol-layer-control-`, so anything else can be restyled with plain CSS.

### Layout

By default the control inserts the panel as a sibling of the map's target element and, while the panel is open, sets an inline `width: calc(100% - <panel width>)` on the map element (plus a `margin-left` when the panel is on the left). It calls `map.updateSize()` after every change and restores the original inline style when the panel closes.

The panel is absolutely positioned. Vertically it follows the map element: the control gives the panel the map's top and height, and keeps them in sync when the map or its parent changes size. So a header or footer around the map needs no extra markup. Horizontally the panel docks to the left or right edge of the map's parent element.

#### Example: a page with a header

Place the map below the header as usual. The panel starts where the map starts, not at the top of the page:

```html
<body>
  <div id="header">...</div>
  <div id="map"></div>
</body>
```

```css
html, body {
  margin: 0;
  height: 100%;
}
#header {
  height: 70px;
}
#map {
  position: absolute;
  top: 70px; /* the header height */
  bottom: 0;
  width: 100%;
}
```

While the panel is open, the control narrows the map to make room for it.

#### When the map does not span the full width

Because the panel docks to an edge of the map's parent, a map with space beside it (a sidebar, a margin) would get a panel at the parent's edge instead of the map's. Put the map in a wrapper element that:

- is positioned itself (`position: relative`, `absolute` or `fixed`),
- has the size and place you want for map and panel together,
- contains only the map element.

The panel is then inserted inside the wrapper, next to the map.

If your app has its own layout (flexbox, a sidebar component, a framework), pass `panelTarget`. The control then renders the panel into that element and leaves the map element alone.

## Development

The control lives in `src/`: `ol-layer-control.js` and `ol-layer-control.css`. It is published as-is, without a build step.

The `demo/` folder holds an app (Dutch PDOK services in EPSG:28992) used to develop and test the control. It requires Node 20.19 or newer.

```bash
npm install
npm start
```

The demo runs at http://localhost:5173. To create a production build of the demo in `dist/`:

```bash
npm run build
```

The TypeScript declarations in `types/` are generated from the JSDoc comments in `src/`. `npm pack` and `npm publish` generate them automatically. To generate them by hand:

```bash
npm run build:types
```

To see exactly which files a release would contain:

```bash
npm pack --dry-run
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Roadmap

- Legends, using the `legend` property already present on the demo layers.