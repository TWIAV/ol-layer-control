# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). While the version is below 1.0.0, a minor version bump may contain breaking changes.

## [Unreleased]

## [0.2.0] - 2026-09-29

### Changed

- The panel now takes the map element's top and height instead of filling the map's parent from top to bottom. A header or footer around the map no longer needs a wrapper element: the panel starts and ends where the map does, and stays aligned when the map or its parent changes size. Horizontally the panel still docks to the left or right edge of the map's parent.
- The README layout section shows a page with a header, and explains when a wrapper element is still useful: for a map that does not span the full width of its parent.

## [0.1.1] - 2026-09-29

### Added

- A message in the panel when the map has no layers to list, explaining that only layers and groups with a `title` are shown. Translatable through the new `emptyMessage` string.

### Changed

- The README usage example now builds a complete map with a titled basemap inside a titled layer group.

## [0.1.0] - 2026-09-28

First public release.

### Added

- `LayerControl`, an OpenLayers control: a map button that opens a panel docked to the left or right of the map. The map shrinks while the panel is open, so the panel never covers it.
- Five map button positions (`buttonPosition`) that stay clear of the default Zoom, Rotate and Attribution controls. The default follows the panel's side.
- Resizable panel width, with configurable minimum and maximum.
- Layer tree with nested, foldable groups. Basemaps (`type: 'base'`) and groups with `exclusive: true` show radio buttons; other groups show checkboxes.
- Right-click on a group title to switch it between exclusive and non-exclusive (`exclusiveToggle`).
- Greyed-out entries, with a tooltip, for layers outside their resolution or zoom range and for layers inside a switched-off group.
- Optional opacity slider per layer (`opacitySlider`).
- Optional search box that filters the layer tree (`search`), toggled by clicking the panel title.
- `displayInLayerControl: false` hides a layer or group from the panel.
- English UI strings, all replaceable through the `i18n` option or `setI18n()`.
- Theming through CSS custom properties.
- TypeScript declarations generated from the JSDoc.

[Unreleased]: https://github.com/TWIAV/ol-layer-control/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/TWIAV/ol-layer-control/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/TWIAV/ol-layer-control/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/TWIAV/ol-layer-control/releases/tag/v0.1.0
