/**
 * ol-layer-control
 *
 * A layer control for OpenLayers: a map button that opens a docked side
 * panel in which the user can switch layers and layer groups on and off.
 *
 * The panel is rendered *next to* the map, never on top of it. By default
 * the control inserts the panel as a sibling of the map's target element
 * and shrinks the map while the panel is open. Pass `panelTarget` to
 * render the panel somewhere else and handle the layout yourself.
 *
 * Layer properties the control understands (set them via layer options or
 * `layer.set(...)`):
 *
 *   title                  string   Text shown in the panel. Layers without
 *                                   a title are not shown.
 *   displayInLayerSwitcher boolean  `false` hides the layer (or group).
 *   type                   'base'   Marks a basemap. A group that contains
 *                                   basemaps is exclusive and gets no
 *                                   checkbox of its own.
 *   exclusive              boolean  On a LayerGroup: children are rendered
 *                                   as radio buttons (only one visible).
 *                                   Right-clicking a group title toggles
 *                                   this (see `exclusiveToggle` option).
 *   combine                boolean  On a LayerGroup: rendered as a single
 *                                   layer instead of a group.
 *   folded                 boolean  On a LayerGroup: start collapsed.
 *
 * Layers (and groups) with a minResolution/maxResolution or minZoom/maxZoom
 * outside the current view are shown dimmed, with a tooltip. So are layers
 * inside a switched-off group. They can still be switched on and off.
 *
 * @module ol-layer-control
 */

import Control from 'ol/control/Control.js';
import LayerGroup from 'ol/layer/Group.js';
import {unByKey} from 'ol/Observable.js';

// The stylesheet ships with the control. Bundlers (Vite, webpack, Parcel,
// Rollup + PostCSS) pick it up from here, so users import only this module.
import './ol-layer-control.css';

/**
 * All user-visible strings. Pass a (partial) object with the same keys as
 * the `i18n` option to translate the UI.
 *
 * @typedef {Object} LayerControlI18n
 * @property {string} buttonTitle   Tooltip / accessible name of the map button.
 * @property {string} panelTitle    Heading of the panel.
 * @property {string} closeTitle    Tooltip of the close button.
 * @property {string} resizeTitle   Tooltip of the resize handle.
 * @property {string} collapseTitle Tooltip of the fold button when a group is expanded.
 * @property {string} expandTitle   Tooltip of the fold button when a group is collapsed.
 * @property {string} exclusiveHint Tooltip of a group title when it can be right-clicked
 *     to switch between exclusive and non-exclusive.
 * @property {string} outOfRangeHint Tooltip of a layer that is not shown at the
 *     current zoom level (outside its min/max resolution or zoom).
 * @property {string} groupOffHint Tooltip of a layer inside a switched-off group.
 *     `{group}` is replaced by the title of that group.
 * @property {string} opacityTitle Tooltip of the opacity button and label of the slider.
 * @property {string} searchToggleTitle Tooltip of the panel title (click shows/hides the search box).
 * @property {string} searchPlaceholder Placeholder text of the search box.
 * @property {string} searchClearTitle Tooltip of the button that clears the search box.
 * @property {string} searchNoResults Message shown when no layer matches the search.
 */

/** @type {LayerControlI18n} */
export const DEFAULT_I18N = Object.freeze({
  buttonTitle: 'Layers',
  panelTitle: 'Layers',
  closeTitle: 'Close layer panel',
  resizeTitle: 'Drag to resize, double-click to reset',
  collapseTitle: 'Collapse group',
  expandTitle: 'Expand group',
  exclusiveHint: 'Right-click to switch between one-at-a-time and multiple layers',
  outOfRangeHint: 'Not shown at the current zoom level',
  groupOffHint: 'Not shown: group "{group}" is switched off',
  opacityTitle: 'Opacity',
  searchToggleTitle: 'Show or hide the search box',
  searchPlaceholder: 'Search layers',
  searchClearTitle: 'Clear search',
  searchNoResults: 'No layers match',
});

/**
 * @typedef {Object} LayerControlOptions
 * @property {HTMLElement|string} [target] Where to render the map button
 *     (standard OpenLayers control option). Default: the map's control container.
 * @property {HTMLElement|string} [panelTarget] Element (or element id) to
 *     render the panel into. When set, the control leaves the map element
 *     alone and the host page is responsible for the layout.
 * @property {'left'|'right'} [side='right'] Side of the map the panel docks to.
 * @property {number} [panelWidth=320] Initial panel width in pixels.
 * @property {number} [minPanelWidth=200] Smallest width the user can resize to.
 * @property {number} [maxPanelWidth=800] Largest width the user can resize to.
 * @property {boolean} [resizable=true] Show a drag handle to resize the panel.
 * @property {boolean} [open=false] Start with the panel open.
 * @property {boolean} [reverse=true] List layers top-most first (rendering order reversed).
 * @property {boolean} [exclusiveToggle=true] Let the user switch a group between
 *     exclusive (radio buttons) and non-exclusive (checkboxes) by right-clicking
 *     its title. Basemap groups are always exclusive.
 * @property {boolean} [opacitySlider=false] Give every layer a button that reveals
 *     an opacity slider.
 * @property {boolean} [search=false] Show the search box from the start. The user
 *     can always show or hide it by clicking the panel title.
 * @property {Partial<LayerControlI18n>} [i18n] Translations, see {@link DEFAULT_I18N}.
 */

const CSS = 'ol-layer-control';

const LAYERS_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M12 3 2 8l10 5 10-5-10-5z"/><path d="m2 12 10 5 10-5"/><path d="m2 16 10 5 10-5"/></svg>';

const CLOSE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
  '<path d="M6 6l12 12M18 6 6 18"/></svg>';

const OPACITY_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>' +
  '<path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>';

const SEARCH_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
  '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

const CHEVRON_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="m9 6 6 6-6 6"/></svg>';

let idCounter = 0;

/**
 * @param {string} tag
 * @param {string} [className]
 * @return {HTMLElement}
 */
function el(tag, className) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  return node;
}

/**
 * Whether a layer's own resolution/zoom limits allow it to be drawn at the
 * view's current resolution. Ignores the layer's `visible` flag.
 *
 * @param {import('ol/layer/Base.js').default} layer
 * @param {number} resolution
 * @param {number} zoom
 * @return {boolean}
 */
function inResolutionRange(layer, resolution, zoom) {
  return (
    resolution >= layer.getMinResolution() &&
    resolution < layer.getMaxResolution() &&
    zoom > layer.getMinZoom() &&
    zoom <= layer.getMaxZoom()
  );
}

/**
 * @param {HTMLElement|string|undefined} target
 * @return {HTMLElement|null}
 */
function resolveElement(target) {
  if (!target) {
    return null;
  }
  return typeof target === 'string' ? document.getElementById(target) : target;
}

/**
 * Layer control: a map button plus a docked, resizable side panel.
 *
 * Observable properties (use `control.on('change:open', ...)` etc.):
 *   - `open`       boolean, whether the panel is shown
 *   - `panelWidth` number, current panel width in pixels
 *
 * @extends {Control}
 */
export default class LayerControl extends Control {
  /**
   * @param {LayerControlOptions} [options]
   */
  constructor(options = {}) {
    const element = el('div', `${CSS} ol-unselectable ol-control`);
    super({element, target: options.target});

    /** @private @type {LayerControlI18n} */
    this.i18n_ = {...DEFAULT_I18N, ...(options.i18n || {})};
    /** @private @type {'left'|'right'} */
    this.side_ = options.side === 'left' ? 'left' : 'right';
    /** @private */
    this.defaultPanelWidth_ = options.panelWidth ?? 320;
    /** @private */
    this.minPanelWidth_ = options.minPanelWidth ?? 200;
    /** @private */
    this.maxPanelWidth_ = options.maxPanelWidth ?? 800;
    /** @private */
    this.resizable_ = options.resizable !== false;
    /** @private */
    this.reverse_ = options.reverse !== false;
    /** @private */
    this.exclusiveToggle_ = options.exclusiveToggle !== false;
    /** @private */
    this.opacitySlider_ = options.opacitySlider === true;
    /** @private @type {HTMLElement|null} */
    this.panelTarget_ = resolveElement(options.panelTarget);

    /** @private @type {HTMLElement|null} The map's target element we shrink. */
    this.hostElement_ = null;
    /** @private @type {{width: string, marginLeft: string}|null} */
    this.hostSavedStyle_ = null;
    /** @private @type {Array<import('ol/events.js').EventsKey>} */
    this.mapListenerKeys_ = [];
    /** @private @type {Array<import('ol/events.js').EventsKey>} */
    this.layerListenerKeys_ = [];
    /** @private */
    this.rebuildScheduled_ = false;
    /** @private */
    this.layoutScheduled_ = false;
    /** @private @type {Array<HTMLButtonElement>} */
    this.foldButtons_ = [];
    /** @private @type {Array<{layer: import('ol/layer/Base.js').default, parent: LayerGroup|null, item: HTMLElement, label: HTMLElement}>} */
    this.entries_ = [];
    /** @private @type {Map<import('ol/layer/Base.js').default, LayerGroup|null>} */
    this.parents_ = new Map();
    /** @private @type {Array<import('ol/events.js').EventsKey>} */
    this.viewListenerKeys_ = [];
    /** @private @type {HTMLElement|null} */
    this.resizer_ = null;

    // --- map button -------------------------------------------------------
    /** @private @type {HTMLButtonElement} */
    this.button_ = /** @type {HTMLButtonElement} */ (el('button'));
    this.button_.type = 'button';
    this.button_.innerHTML = LAYERS_ICON;
    this.button_.addEventListener('click', () => this.toggle());
    element.appendChild(this.button_);

    // --- panel ------------------------------------------------------------
    /** @private @type {HTMLElement} */
    this.panel_ = el('div', `${CSS}-panel ${CSS}-panel--${this.side_}`);
    this.panel_.id = `${CSS}-panel-${++idCounter}`;
    this.panel_.setAttribute('role', 'region');
    this.panel_.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.close();
        this.button_.focus();
      }
    });
    this.button_.setAttribute('aria-controls', this.panel_.id);

    if (this.resizable_) {
      this.resizer_ = el('div', `${CSS}-resizer`);
      this.initResizer_(this.resizer_);
      this.panel_.appendChild(this.resizer_);
    }

    const header = el('div', `${CSS}-header`);
    /** @private @type {HTMLButtonElement} */
    this.titleElement_ = /** @type {HTMLButtonElement} */ (el('button', `${CSS}-title`));
    this.titleElement_.type = 'button';
    this.titleElement_.addEventListener('click', () => this.toggleSearch());
    header.appendChild(this.titleElement_);
    /** @private @type {HTMLButtonElement} */
    this.closeButton_ = /** @type {HTMLButtonElement} */ (el('button', `${CSS}-close`));
    this.closeButton_.type = 'button';
    this.closeButton_.innerHTML = CLOSE_ICON;
    this.closeButton_.addEventListener('click', () => this.close());
    header.appendChild(this.closeButton_);
    this.panel_.appendChild(header);

    // --- search box (hidden until opened) ---------------------------------
    /** @private @type {HTMLElement} */
    this.searchRow_ = el('div', `${CSS}-search`);
    this.searchRow_.id = `${CSS}-search-${++idCounter}`;
    this.searchRow_.insertAdjacentHTML('beforeend', SEARCH_ICON);
    /** @private @type {HTMLInputElement} */
    this.searchInput_ = /** @type {HTMLInputElement} */ (el('input'));
    this.searchInput_.type = 'search';
    this.searchInput_.autocomplete = 'off';
    this.searchInput_.addEventListener('input', () => this.applyFilter_());
    this.searchInput_.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.searchInput_.value) {
        event.stopPropagation();
        this.setFilter('');
      }
    });
    this.searchRow_.appendChild(this.searchInput_);
    /** @private @type {HTMLButtonElement} */
    this.searchClear_ = /** @type {HTMLButtonElement} */ (el('button', `${CSS}-search-clear`));
    this.searchClear_.type = 'button';
    this.searchClear_.innerHTML = CLOSE_ICON;
    this.searchClear_.addEventListener('click', () => {
      this.setFilter('');
      this.searchInput_.focus();
    });
    this.searchRow_.appendChild(this.searchClear_);
    this.titleElement_.setAttribute('aria-controls', this.searchRow_.id);
    this.panel_.appendChild(this.searchRow_);

    const body = el('div', `${CSS}-body`);
    /** @private @type {HTMLElement} */
    this.rootList_ = el('ul', `${CSS}-list`);
    body.appendChild(this.rootList_);
    /** @private @type {HTMLElement} */
    this.noResults_ = el('p', `${CSS}-no-results`);
    this.noResults_.hidden = true;
    body.appendChild(this.noResults_);
    this.panel_.appendChild(body);

    this.applyTexts_();

    this.on('change:open', () => this.applyLayout_());
    this.on('change:panelWidth', () => this.scheduleLayout_());
    this.on('change:searchVisible', () => this.applySearchVisibility_());
    this.set('open', !!options.open, true);
    this.set('searchVisible', options.search === true, true);
    this.applySearchVisibility_();
    this.set('panelWidth', this.clampWidth_(this.defaultPanelWidth_), true);
  }

  // ---------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------

  /** Show the panel. */
  open() {
    this.set('open', true);
  }

  /** Hide the panel. */
  close() {
    this.set('open', false);
  }

  /** Show the panel if hidden, hide it if shown. */
  toggle() {
    this.set('open', !this.get('open'));
  }

  /** @return {boolean} Whether the panel is shown. */
  isOpen() {
    return !!this.get('open');
  }

  /**
   * @param {number} width Panel width in pixels (clamped to min/max).
   */
  setPanelWidth(width) {
    this.set('panelWidth', this.clampWidth_(width));
  }

  /** @return {number} Current panel width in pixels. */
  getPanelWidth() {
    return /** @type {number} */ (this.get('panelWidth'));
  }

  /** @return {HTMLElement} The panel element. */
  getPanelElement() {
    return this.panel_;
  }

  /**
   * Show or hide the search box. Hiding it clears the filter.
   * @param {boolean} [visible=true]
   */
  showSearch(visible = true) {
    this.set('searchVisible', !!visible);
  }

  /** Show the search box if hidden, hide it if shown. */
  toggleSearch() {
    this.showSearch(!this.isSearchVisible());
  }

  /** @return {boolean} Whether the search box is shown. */
  isSearchVisible() {
    return !!this.get('searchVisible');
  }

  /**
   * Filter the layer list by (part of) a title, case-insensitive. Groups
   * stay listed when their title or any of their layers match.
   * @param {string} query Empty string shows everything.
   */
  setFilter(query) {
    this.searchInput_.value = query;
    this.applyFilter_();
  }

  /** @return {string} The current filter text. */
  getFilter() {
    return this.searchInput_.value;
  }

  /**
   * Replace (part of) the UI strings.
   * @param {Partial<LayerControlI18n>} i18n
   */
  setI18n(i18n) {
    this.i18n_ = {...this.i18n_, ...i18n};
    this.applyTexts_();
  }

  /** @return {LayerControlI18n} The strings in use. */
  getI18n() {
    return {...this.i18n_};
  }

  /**
   * Rebuild the layer list from the map. Normally not needed: the control
   * follows layer additions, removals and visibility changes by itself.
   */
  refresh() {
    this.rebuild_();
  }

  /**
   * Make a layer group exclusive (children as radio buttons, at most one
   * visible) or non-exclusive (checkboxes). When switching to exclusive and
   * several children are visible, only the top-most one stays visible.
   *
   * Basemap groups (children with `type: 'base'`) are always exclusive.
   *
   * @param {LayerGroup} group
   * @param {boolean} exclusive
   */
  setExclusive(group, exclusive) {
    if (exclusive) {
      let found = false;
      for (const layer of this.listedChildren_(group)) {
        if (!layer.getVisible()) {
          continue;
        }
        if (found) {
          layer.setVisible(false);
        }
        found = true;
      }
    }
    group.set('exclusive', exclusive);
  }

  /**
   * @param {import('ol/Map.js').default|null} map
   * @override
   */
  setMap(map) {
    if (this.getMap()) {
      this.detach_();
    }
    super.setMap(map);
    if (map) {
      this.mapListenerKeys_.push(
        map.on('change:target', () => this.attachPanel_()),
        map.on('change:layergroup', () => this.scheduleRebuild_()),
        map.on('change:view', () => this.observeView_()),
      );
      this.attachPanel_();
      this.observeView_();
      this.rebuild_();
    }
  }

  /** @private Follow the (possibly new) view's resolution. */
  observeView_() {
    unByKey(this.viewListenerKeys_);
    this.viewListenerKeys_ = [];
    const map = this.getMap();
    const view = map ? map.getView() : null;
    if (view) {
      this.viewListenerKeys_.push(
        view.on('change:resolution', () => this.updateStates_()),
      );
    }
    this.updateStates_();
  }

  /**
   * Dim entries that are outside their resolution/zoom range and explain,
   * in a tooltip, why an entry is not shown on the map (out of range and/or
   * inside a switched-off group).
   * @private
   */
  updateStates_() {
    const map = this.getMap();
    const view = map ? map.getView() : null;
    const resolution = view ? view.getResolution() : undefined;
    const zoom = view ? view.getZoom() : undefined;
    const known = resolution !== undefined && zoom !== undefined;
    for (const entry of this.entries_) {
      const reasons = [];
      const out = known && !inResolutionRange(entry.layer, resolution, zoom);
      entry.item.classList.toggle(`${CSS}-item--out-of-range`, out);
      if (out) {
        reasons.push(this.i18n_.outOfRangeHint);
      }
      for (let group = entry.parent; group; group = this.parents_.get(group) || null) {
        if (!group.getVisible()) {
          reasons.push(this.i18n_.groupOffHint.replace('{group}', String(group.get('title'))));
        }
      }
      if (entry.label.dataset.hint) {
        reasons.push(entry.label.dataset.hint);
      }
      entry.label.title = reasons.join('\n');
    }
  }

  // ---------------------------------------------------------------------
  // Panel placement and layout
  // ---------------------------------------------------------------------

  /** @private */
  attachPanel_() {
    const map = this.getMap();
    const host = map ? map.getTargetElement() : null;

    if (this.panelTarget_) {
      if (this.panel_.parentNode !== this.panelTarget_) {
        this.panelTarget_.appendChild(this.panel_);
      }
    } else if (host && host.parentNode) {
      if (this.hostElement_ && this.hostElement_ !== host) {
        this.restoreHost_();
      }
      if (this.hostElement_ !== host) {
        this.hostElement_ = host;
        this.hostSavedStyle_ = {
          width: host.style.width,
          marginLeft: host.style.marginLeft,
        };
        host.classList.add(`${CSS}-host`);
      }
      if (this.panel_.previousSibling !== host) {
        host.parentNode.insertBefore(this.panel_, host.nextSibling);
      }
    }
    this.applyLayout_();
  }

  /** @private */
  restoreHost_() {
    const host = this.hostElement_;
    if (!host) {
      return;
    }
    if (this.hostSavedStyle_) {
      host.style.width = this.hostSavedStyle_.width;
      host.style.marginLeft = this.hostSavedStyle_.marginLeft;
    }
    host.classList.remove(`${CSS}-host`, `${CSS}-host--open`);
    this.hostElement_ = null;
    this.hostSavedStyle_ = null;
  }

  /** @private */
  detach_() {
    unByKey(this.mapListenerKeys_);
    this.mapListenerKeys_ = [];
    unByKey(this.viewListenerKeys_);
    this.viewListenerKeys_ = [];
    this.clearLayerListeners_();
    this.restoreHost_();
    if (this.panel_.parentNode) {
      this.panel_.parentNode.removeChild(this.panel_);
    }
  }

  /** @private */
  scheduleLayout_() {
    if (this.layoutScheduled_) {
      return;
    }
    this.layoutScheduled_ = true;
    requestAnimationFrame(() => {
      this.layoutScheduled_ = false;
      this.applyLayout_();
    });
  }

  /** @private */
  applyLayout_() {
    const open = this.isOpen();
    const width = this.getPanelWidth();

    this.panel_.classList.toggle(`${CSS}-panel--open`, open);
    this.panel_.style.width = `${width}px`;
    this.button_.setAttribute('aria-expanded', String(open));
    this.element.classList.toggle(`${CSS}--open`, open);

    const host = this.hostElement_;
    if (host && !this.panelTarget_) {
      host.classList.toggle(`${CSS}-host--open`, open);
      if (open) {
        host.style.width = `calc(100% - ${width}px)`;
        host.style.marginLeft = this.side_ === 'left' ? `${width}px` : '';
      } else if (this.hostSavedStyle_) {
        host.style.width = this.hostSavedStyle_.width;
        host.style.marginLeft = this.hostSavedStyle_.marginLeft;
      }
    }

    const map = this.getMap();
    if (map) {
      map.updateSize();
    }
  }

  /**
   * @private
   * @param {number} width
   * @return {number}
   */
  clampWidth_(width) {
    let max = this.maxPanelWidth_;
    const host = this.hostElement_;
    if (host && host.parentElement && !this.panelTarget_) {
      // Always leave some map visible.
      max = Math.min(max, Math.max(this.minPanelWidth_, host.parentElement.clientWidth - 100));
    }
    return Math.round(Math.min(max, Math.max(this.minPanelWidth_, width)));
  }

  /**
   * @private
   * @param {HTMLElement} handle
   */
  initResizer_(handle) {
    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = this.getPanelWidth();
      const direction = this.side_ === 'right' ? -1 : 1;
      handle.setPointerCapture(event.pointerId);
      this.panel_.classList.add(`${CSS}-panel--resizing`);

      const onMove = (moveEvent) => {
        this.setPanelWidth(startWidth + direction * (moveEvent.clientX - startX));
      };
      const onUp = () => {
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        handle.removeEventListener('pointercancel', onUp);
        this.panel_.classList.remove(`${CSS}-panel--resizing`);
        this.applyLayout_();
      };
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
      handle.addEventListener('pointercancel', onUp);
    });
    handle.addEventListener('dblclick', () => this.setPanelWidth(this.defaultPanelWidth_));
  }

  /** @private */
  applyTexts_() {
    const t = this.i18n_;
    this.button_.title = t.buttonTitle;
    this.button_.setAttribute('aria-label', t.buttonTitle);
    this.panel_.setAttribute('aria-label', t.panelTitle);
    this.titleElement_.textContent = t.panelTitle;
    this.titleElement_.title = t.searchToggleTitle;
    this.searchInput_.placeholder = t.searchPlaceholder;
    this.searchInput_.setAttribute('aria-label', t.searchPlaceholder);
    this.searchClear_.title = t.searchClearTitle;
    this.searchClear_.setAttribute('aria-label', t.searchClearTitle);
    this.noResults_.textContent = t.searchNoResults;
    this.closeButton_.title = t.closeTitle;
    this.closeButton_.setAttribute('aria-label', t.closeTitle);
    if (this.resizer_) {
      this.resizer_.title = t.resizeTitle;
    }
    for (const button of this.foldButtons_) {
      this.updateFoldButton_(button);
    }
    for (const label of this.panel_.querySelectorAll(`.${CSS}-label--toggle`)) {
      /** @type {HTMLElement} */ (label).dataset.hint = t.exclusiveHint;
    }
    for (const button of this.panel_.querySelectorAll(`.${CSS}-opacity-toggle`)) {
      /** @type {HTMLElement} */ (button).title = t.opacityTitle;
      button.setAttribute('aria-label', t.opacityTitle);
    }
    for (const range of this.panel_.querySelectorAll(`.${CSS}-opacity input`)) {
      range.setAttribute('aria-label', `${t.opacityTitle}: ${/** @type {HTMLElement} */ (range).dataset.layerTitle}`);
    }
    this.updateStates_();
  }

  // ---------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------

  /** @private */
  applySearchVisibility_() {
    const visible = this.isSearchVisible();
    this.panel_.classList.toggle(`${CSS}-panel--search`, visible);
    this.titleElement_.setAttribute('aria-expanded', String(visible));
    if (visible) {
      if (this.isOpen()) {
        this.searchInput_.focus();
      }
    } else if (this.searchInput_.value) {
      this.setFilter('');
    }
  }

  /** @private Show only entries that match the search text. */
  applyFilter_() {
    const query = this.searchInput_.value.trim().toLowerCase();
    const hiddenClass = `${CSS}-item--hidden`;
    this.panel_.classList.toggle(`${CSS}-panel--filtering`, query !== '');
    this.searchClear_.hidden = query === '';

    if (query === '') {
      for (const entry of this.entries_) {
        entry.item.classList.remove(hiddenClass);
      }
      this.noResults_.hidden = true;
      return;
    }

    /** @type {Set<import('ol/layer/Base.js').default>} */
    const shown = new Set();
    for (const entry of this.entries_) {
      const title = String(entry.layer.get('title')).toLowerCase();
      if (title.includes(query)) {
        // The match itself, and every ancestor so the path to it is visible.
        for (let layer = entry.layer; layer; layer = this.parents_.get(layer) || null) {
          shown.add(layer);
        }
      } else {
        // Inside a matching group: keep all of that group's contents.
        for (let group = entry.parent; group; group = this.parents_.get(group) || null) {
          if (String(group.get('title')).toLowerCase().includes(query)) {
            shown.add(entry.layer);
            break;
          }
        }
      }
    }
    for (const entry of this.entries_) {
      entry.item.classList.toggle(hiddenClass, !shown.has(entry.layer));
    }
    this.noResults_.hidden = shown.size > 0;
  }

  // ---------------------------------------------------------------------
  // Layer tree
  // ---------------------------------------------------------------------

  /** @private */
  clearLayerListeners_() {
    unByKey(this.layerListenerKeys_);
    this.layerListenerKeys_ = [];
  }

  /** @private */
  scheduleRebuild_() {
    if (this.rebuildScheduled_) {
      return;
    }
    this.rebuildScheduled_ = true;
    Promise.resolve().then(() => {
      this.rebuildScheduled_ = false;
      this.rebuild_();
    });
  }

  /** @private */
  rebuild_() {
    this.clearLayerListeners_();
    this.foldButtons_ = [];
    this.entries_ = [];
    this.parents_ = new Map();
    this.rootList_.textContent = '';
    const map = this.getMap();
    if (!map) {
      return;
    }
    this.renderCollection_(map.getLayerGroup().getLayers(), this.rootList_, null, null);
    this.updateStates_();
    this.applyFilter_();
  }

  /**
   * @private
   * @param {import('ol/layer/Base.js').default} layer
   * @param {LayerGroup|null} parent
   * @param {HTMLElement} item
   * @param {HTMLElement} label
   */
  registerEntry_(layer, parent, item, label) {
    this.entries_.push({layer, parent, item, label});
    this.parents_.set(layer, parent);
    this.layerListenerKeys_.push(
      layer.on(
        ['change:minResolution', 'change:maxResolution', 'change:minZoom', 'change:maxZoom'],
        () => this.updateStates_(),
      ),
    );
  }

  /**
   * @private
   * @param {import('ol/Collection.js').default<import('ol/layer/Base.js').default>} collection
   * @param {HTMLElement} list The <ul> to render into.
   * @param {string|null} radioName Non-null when the parent group is exclusive.
   * @param {LayerGroup|null} parent The group that owns the collection.
   */
  renderCollection_(collection, list, radioName, parent) {
    this.layerListenerKeys_.push(
      collection.on(['add', 'remove'], () => this.scheduleRebuild_()),
    );
    const layers = this.listedLayers_(collection);
    for (const layer of layers) {
      if (layer instanceof LayerGroup && !layer.get('combine')) {
        this.renderGroup_(layer, layers, list, radioName, parent);
      } else {
        this.renderLayer_(layer, layers, list, radioName, parent);
      }
    }
  }

  /**
   * The layers of a collection that appear in the panel, in panel order.
   * @private
   * @param {import('ol/Collection.js').default<import('ol/layer/Base.js').default>} collection
   * @return {Array<import('ol/layer/Base.js').default>}
   */
  listedLayers_(collection) {
    const layers = collection.getArray().filter(
      (layer) => layer.get('displayInLayerSwitcher') !== false && layer.get('title'),
    );
    if (this.reverse_) {
      layers.reverse();
    }
    return layers;
  }

  /**
   * @private
   * @param {LayerGroup} group
   * @return {Array<import('ol/layer/Base.js').default>}
   */
  listedChildren_(group) {
    return this.listedLayers_(group.getLayers());
  }

  /**
   * @private
   * @param {import('ol/layer/Base.js').default} layer
   * @param {Array<import('ol/layer/Base.js').default>} siblings Rendered siblings, incl. the layer itself.
   * @param {HTMLElement} list
   * @param {string|null} radioName
   * @param {LayerGroup|null} parent
   */
  renderLayer_(layer, siblings, list, radioName, parent) {
    const item = el('li', `${CSS}-layer`);
    const row = el('div', `${CSS}-row`);
    row.appendChild(el('span', `${CSS}-spacer`));
    const input = this.createInput_(layer, siblings, radioName);
    row.appendChild(input);
    const label = this.createLabel_(layer, input);
    row.appendChild(label);
    item.appendChild(row);
    if (this.opacitySlider_) {
      this.addOpacitySlider_(layer, item, row);
    }
    list.appendChild(item);
    this.registerEntry_(layer, parent, item, label);
  }

  /**
   * Adds an opacity button to the row and a (collapsed) slider row to the item.
   * @private
   * @param {import('ol/layer/Base.js').default} layer
   * @param {HTMLElement} item The <li>.
   * @param {HTMLElement} row The row holding the input and label.
   */
  addOpacitySlider_(layer, item, row) {
    const openClass = `${CSS}-layer--opacity-open`;
    const sliderRow = el('div', `${CSS}-opacity`);
    sliderRow.id = `${CSS}-opacity-${++idCounter}`;

    const button = /** @type {HTMLButtonElement} */ (el('button', `${CSS}-opacity-toggle`));
    button.type = 'button';
    button.innerHTML = OPACITY_ICON;
    button.title = this.i18n_.opacityTitle;
    button.setAttribute('aria-label', this.i18n_.opacityTitle);
    button.setAttribute('aria-controls', sliderRow.id);
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => {
      const open = item.classList.toggle(openClass);
      button.setAttribute('aria-expanded', String(open));
      if (open) {
        range.focus();
      }
    });
    row.appendChild(button);

    const range = /** @type {HTMLInputElement} */ (el('input'));
    range.type = 'range';
    range.min = '0';
    range.max = '1';
    range.step = '0.01';
    range.dataset.layerTitle = String(layer.get('title'));
    range.setAttribute('aria-label', `${this.i18n_.opacityTitle}: ${layer.get('title')}`);
    const value = el('span', `${CSS}-opacity-value`);

    const update = () => {
      const opacity = layer.getOpacity();
      range.value = String(opacity);
      value.textContent = `${Math.round(opacity * 100)}%`;
    };
    update();
    range.addEventListener('input', () => layer.setOpacity(Number(range.value)));
    this.layerListenerKeys_.push(layer.on('change:opacity', update));

    sliderRow.appendChild(range);
    sliderRow.appendChild(value);
    item.appendChild(sliderRow);
  }

  /**
   * @private
   * @param {LayerGroup} group
   * @param {Array<import('ol/layer/Base.js').default>} siblings
   * @param {HTMLElement} list
   * @param {string|null} radioName
   * @param {LayerGroup|null} parent
   */
  renderGroup_(group, siblings, list, radioName, parent) {
    const children = group.getLayers();
    const isBaseGroup = children.getArray().some((layer) => layer.get('type') === 'base');
    const exclusive = isBaseGroup || group.get('exclusive') === true;

    const item = el('li', `${CSS}-group`);
    item.classList.toggle(`${CSS}-group--exclusive`, exclusive);
    item.classList.toggle(`${CSS}-group--folded`, group.get('folded') === true);
    item.classList.toggle(`${CSS}-group--inactive`, !group.getVisible());

    const row = el('div', `${CSS}-row`);
    const childList = el('ul', `${CSS}-list`);
    childList.id = `${CSS}-list-${++idCounter}`;

    const fold = /** @type {HTMLButtonElement} */ (el('button', `${CSS}-fold`));
    fold.type = 'button';
    fold.innerHTML = CHEVRON_ICON;
    fold.setAttribute('aria-controls', childList.id);
    fold.addEventListener('click', () => {
      const folded = !item.classList.contains(`${CSS}-group--folded`);
      item.classList.toggle(`${CSS}-group--folded`, folded);
      group.set('folded', folded);
      this.updateFoldButton_(fold);
    });
    this.foldButtons_.push(fold);
    row.appendChild(fold);

    let input = null;
    if (!isBaseGroup) {
      input = this.createInput_(group, siblings, radioName);
      row.appendChild(input);
    }
    const label = this.createLabel_(group, input);
    if (!isBaseGroup && this.exclusiveToggle_) {
      label.dataset.hint = this.i18n_.exclusiveHint;
      label.classList.add(`${CSS}-label--toggle`);
      label.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        this.setExclusive(group, !exclusive);
      });
    }
    row.appendChild(label);
    item.appendChild(row);
    this.updateFoldButton_(fold);

    this.layerListenerKeys_.push(
      group.on('change:visible', () => {
        item.classList.toggle(`${CSS}-group--inactive`, !group.getVisible());
        this.updateStates_();
      }),
      group.on(['change:layers', 'change:exclusive'], () => this.scheduleRebuild_()),
    );

    this.renderCollection_(children, childList, exclusive ? `${CSS}-radio-${++idCounter}` : null, group);
    item.appendChild(childList);
    list.appendChild(item);
    this.registerEntry_(group, parent, item, label);
  }

  /**
   * @private
   * @param {import('ol/layer/Base.js').default} layer
   * @param {Array<import('ol/layer/Base.js').default>} siblings
   * @param {string|null} radioName
   * @return {HTMLInputElement}
   */
  createInput_(layer, siblings, radioName) {
    const input = /** @type {HTMLInputElement} */ (el('input'));
    input.type = radioName ? 'radio' : 'checkbox';
    input.id = `${CSS}-input-${++idCounter}`;
    if (radioName) {
      input.name = radioName;
    }
    input.checked = layer.getVisible();
    input.addEventListener('change', () => {
      if (radioName) {
        for (const sibling of siblings) {
          sibling.setVisible(sibling === layer);
        }
      } else {
        layer.setVisible(input.checked);
      }
    });
    this.layerListenerKeys_.push(
      layer.on('change:visible', () => {
        input.checked = layer.getVisible();
      }),
    );
    return input;
  }

  /**
   * @private
   * @param {import('ol/layer/Base.js').default} layer
   * @param {HTMLInputElement|null} input
   * @return {HTMLElement}
   */
  createLabel_(layer, input) {
    const label = el(input ? 'label' : 'span', `${CSS}-label`);
    label.textContent = String(layer.get('title'));
    if (input) {
      /** @type {HTMLLabelElement} */ (label).htmlFor = input.id;
    }
    this.layerListenerKeys_.push(
      layer.on('change:title', () => {
        label.textContent = String(layer.get('title'));
      }),
    );
    return label;
  }

  /**
   * @private
   * @param {HTMLButtonElement} button
   */
  updateFoldButton_(button) {
    const item = button.closest(`.${CSS}-group`);
    const folded = !!item && item.classList.contains(`${CSS}-group--folded`);
    const title = folded ? this.i18n_.expandTitle : this.i18n_.collapseTitle;
    button.title = title;
    button.setAttribute('aria-label', title);
    button.setAttribute('aria-expanded', String(!folded));
  }
}

export {LayerControl};
