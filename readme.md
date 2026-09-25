# OpenLayers Layer Control

A layer control for [OpenLayers](https://openlayers.org/): a map button that opens a docked, resizable side panel in which the user switches layers and layer groups on and off.

The panel is rendered **next to** the map, never on top of it. The map shrinks while the panel is open.

## Features

- Map button with an inline SVG icon that opens and closes the panel.
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

## Usage

```js
import Map from 'ol/Map.js';
import LayerControl from './ol-layer-control.js'; // ships its own CSS

const map = new Map({ /* ... */ });
map.addControl(new LayerControl({ open: true }));
```

The control imports its stylesheet itself, so with a bundler (Vite, webpack, Parcel, Rollup + PostCSS) the single import above is all you need.

### Layer properties

The control reads these properties from layers and groups. Set them as constructor options or with `layer.set(...)`.

| Property                 | On            | Meaning                                                                                  |
| ------------------------ | ------------- | ---------------------------------------------------------------------------------------- |
| `title`                  | layer, group  | Text shown in the panel. Layers without a title are not listed.                          |
| `displayInLayerSwitcher` | layer, group  | `false` hides the layer or group from the panel.                                         |
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

```js
control.on('change:open', () => console.log('panel open:', control.isOpen()));
```

### Translating

Pass any subset of the strings in the `i18n` option, or call `setI18n()` later. The full set, with the English defaults, is exported as `DEFAULT_I18N`.

```js
import LayerControl, { DEFAULT_I18N } from './ol-layer-control.js';

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
}
```

Every element carries a class starting with `ol-layer-control-`, so anything else can be restyled with plain CSS.

### Layout

By default the control inserts the panel as a sibling of the map's target element and, while the panel is open, sets an inline `width: calc(100% - <panel width>)` on the map element (plus a `margin-left` when the panel is on the left). It calls `map.updateSize()` after every change and restores the original inline style when the panel closes.

The panel is absolutely positioned with `top: 0; bottom: 0` against the map's nearest positioned ancestor. This works out of the box when the map fills the page. When the map sits inside a page with other content, give the map's parent element `position: relative` so the panel lines up with the map.

If your app has its own layout (flexbox, a sidebar component, a framework), pass `panelTarget`. The control then renders the panel into that element and leaves the map element alone.

## Development

The repository contains a demo app (Dutch PDOK services in EPSG:28992) used to develop and test the control. It requires Node 18+.

```bash
npm install
npm start
```

The demo runs at http://localhost:5173. The control itself lives in `src/ol-layer-control.js` and `src/ol-layer-control.css`; the rest of `src/` is the demo.

To create a production build of the demo:

```bash
npm run build
```

## Roadmap

- Publish as an npm package with `ol` as a peer dependency and generated type declarations.