/**
 * The Dive Map core: a jsVectorMap world map highlighting a set of countries,
 * with no framework attached. The Alpine and React adapters wrap this.
 *
 * jsVectorMap and its world map (~100 KB) are imported on first use, so
 * pages without a map never download them, and importing this module on a
 * server is safe. Colours come from the CSS custom properties
 * --mbar-dive-map-land / --mbar-dive-map-visited (see dive-map.css).
 */
import { OFF_MAP_COORDS } from './countries.js';

/**
 * @typedef {string[] | Record<string, string> | null | undefined} CountrySelection
 *   ISO alpha-2 codes. An object is read by its values, so a Livewire array
 *   that arrives as `{0: 'MT', 1: 'EG'}` works too.
 */

/**
 * @typedef {object} DiveMapOptions
 * @property {CountrySelection} [selected] The countries to highlight.
 * @property {Record<string, string>} [names] Country names by code, for the tooltips and dots.
 * @property {boolean} [interactive] Clicking a country toggles it.
 * @property {(codes: string[]) => void} [onChange] Called with the new codes after a click toggles a country.
 */

/**
 * @typedef {object} DiveMap
 * @property {(selected: CountrySelection) => void} setSelected Highlight these countries instead.
 * @property {(names: Record<string, string>) => void} setNames Replace the country names.
 * @property {() => void} destroy Remove the map and its tooltip.
 * @property {Promise<void>} ready Settles once the map is drawn (or right away after destroy()).
 */

/**
 * The world map draws French Guiana as part of France's `FR` shape, so
 * picking France also lit up a piece of South America (and picking French
 * Guiana only showed a dot). Move that piece into a `GF` region of its own:
 * of FR's sub-paths, it is the one that starts west of the Atlantic.
 *
 * @param {any} world
 */
export function splitFrenchGuiana(world) {
    const france = world?.paths?.FR;

    if (! france || world.paths.GF) {
        return;
    }

    const parts = france.path.match(/M[^M]+/g) ?? [];
    const isSouthAmerica = (part) => parseFloat(part.slice(1)) < 350;
    const guiana = parts.filter(isSouthAmerica);

    if (guiana.length === 0) {
        return;
    }

    france.path = parts.filter((part) => ! isSouthAmerica(part)).join('');
    world.paths.GF = { path: guiana.join(''), name: 'French Guiana' };
}

let libraryPromise = null;

/**
 * Import jsVectorMap and register its world map, once.
 *
 * @returns {Promise<any>} The jsVectorMap constructor.
 */
export function loadLibrary() {
    if (! libraryPromise) {
        libraryPromise = import('jsvectormap').then(async ({ default: jsVectorMap }) => {
            // The bundled map files register themselves on the global.
            window.jsVectorMap = jsVectorMap;

            // The library keeps its map registry private, so adjust the world
            // map as it registers itself.
            const addMap = jsVectorMap.addMap;
            jsVectorMap.addMap = (name, map) => {
                if (name === 'world') {
                    splitFrenchGuiana(map);
                }

                addMap(name, map);
            };

            await import('jsvectormap/dist/maps/world.js');

            return jsVectorMap;
        });

        libraryPromise.catch(() => {
            libraryPromise = null;
        });
    }

    return libraryPromise;
}

/**
 * @param {CountrySelection} selected
 * @returns {string[]}
 */
export function normalizeCodes(selected) {
    const codes = Array.isArray(selected) ? selected : Object.values(selected ?? {});

    return codes.filter((code) => typeof code === 'string');
}

/**
 * Draw the Dive Map into `element`. The map appears once jsVectorMap has
 * loaded; setSelected() and setNames() can be called before that.
 *
 * @param {HTMLElement} element An empty element with a size; it inherits the colour variables.
 * @param {DiveMapOptions} [options]
 * @returns {DiveMap}
 */
export function createDiveMap(element, { selected = [], names = {}, interactive = false, onChange } = {}) {
    let codes = normalizeCodes(selected);
    let countryNames = names ?? {};
    let map = null;
    let destroyed = false;

    const paint = () => {
        if (! map) {
            return;
        }

        map.clearSelectedRegions();
        map.setSelectedRegions(codes.filter((code) => map.regions[code]));

        map.removeMarkers();
        map.addMarkers(codes
            .filter((code) => ! map.regions[code] && OFF_MAP_COORDS[code])
            .map((code) => ({ name: countryNames[code] ?? code, coords: OFF_MAP_COORDS[code] })));
    };

    const toggle = (code) => {
        codes = codes.includes(code)
            ? codes.filter((selectedCode) => selectedCode !== code)
            : [...codes, code];

        paint();
        onChange?.([...codes]);
    };

    const ready = loadLibrary().then((jsVectorMap) => {
        if (destroyed) {
            return;
        }

        const style = getComputedStyle(element);
        const land = style.getPropertyValue('--mbar-dive-map-land').trim() || '#cbd5e1';
        const visited = style.getPropertyValue('--mbar-dive-map-visited').trim() || '#0d8ac5';

        map = new jsVectorMap({
            selector: element,
            map: 'world',
            backgroundColor: 'transparent',
            zoomButtons: true,
            // Zoom with the + / − buttons only, so scrolling the page
            // over the map keeps scrolling the page.
            zoomOnScroll: false,
            // jsVectorMap only creates its own (untransformed) markers
            // group when `markers` is passed here; without it, dots added
            // later by paint() land in the scaled regions group and are
            // drawn far from their country.
            markers: [],
            regionStyle: {
                initial: { fill: land, fillOpacity: 1, stroke: 'none' },
                hover: { fillOpacity: 0.8, cursor: interactive ? 'pointer' : 'default' },
                selected: { fill: visited },
                selectedHover: { fillOpacity: 0.85 },
            },
            markerStyle: {
                initial: { fill: visited, stroke: '#ffffff', strokeWidth: 1, strokeOpacity: 0.9, r: 4 },
                hover: { cursor: 'default', fillOpacity: 0.85 },
            },
            onRegionTooltipShow: (event, tooltip, code) => {
                tooltip.text(countryNames[code] ?? tooltip.text());
            },
            onRegionClick: (event, code) => {
                if (interactive) {
                    toggle(code);
                }
            },
        });

        paint();
    });

    return {
        ready,

        setSelected(selected) {
            codes = normalizeCodes(selected);
            paint();
        },

        setNames(names) {
            countryNames = names ?? {};
            paint();
        },

        destroy() {
            destroyed = true;

            try {
                map?.destroy();
            } catch {
                // jsVectorMap 1.7.0's destroy() can throw while flushing its
                // event registry (a handler registered twice loses its entry);
                // the map is being thrown away either way.
            }

            map = null;
            // jsVectorMap leaves its SVG and zoom buttons behind; clear them
            // so the element can take a new map (React StrictMode remounts).
            element.replaceChildren();
        },
    };
}
