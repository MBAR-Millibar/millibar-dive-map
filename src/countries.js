/**
 * The countries the Dive Map can show, as ISO 3166-1 alpha-2 codes. Import
 * this on its own (`@millibar/dive-map/countries`) to validate country codes
 * on a server or in an API: it doesn't load jsVectorMap or touch the DOM.
 */
import { MAP_REGION_CODES } from './map-regions.js';

/**
 * Countries too small to be drawn on jsVectorMap's world map (Maldives,
 * Malta, most Caribbean and Pacific islands…), shown as a dot instead.
 * Approximate [lat, lng] centres.
 *
 * @type {Readonly<Record<string, [number, number]>>}
 */
export const OFF_MAP_COORDS = Object.freeze({
    AD: [42.55, 1.6], AG: [17.08, -61.8], AI: [18.22, -63.06], AQ: [-75, 0], AS: [-14.3, -170.7],
    AW: [12.52, -69.97], AX: [60.2, 19.95], BB: [13.19, -59.54], BH: [26.03, 50.55], BL: [17.9, -62.83],
    BM: [32.32, -64.76], BQ: [12.18, -68.24], BV: [-54.42, 3.36], CC: [-12.16, 96.87], CK: [-21.24, -159.78],
    CV: [16.0, -24.0], CW: [12.17, -68.99], CX: [-10.45, 105.69], DM: [15.41, -61.37], FM: [6.92, 158.16],
    FO: [62.0, -6.79], GD: [12.12, -61.68], GF: [3.93, -53.13], GG: [49.45, -2.58], GI: [36.14, -5.35],
    GP: [16.25, -61.58], GS: [-54.43, -36.59], GU: [13.44, 144.79], HK: [22.32, 114.17], HM: [-53.08, 73.5],
    IM: [54.24, -4.55], IO: [-7.33, 72.42], JE: [49.21, -2.13], KI: [1.87, -157.36], KM: [-11.88, 43.87],
    KN: [17.36, -62.78], KY: [19.31, -81.25], LC: [13.91, -60.98], LI: [47.17, 9.56], MC: [43.74, 7.42],
    MF: [18.07, -63.05], MH: [7.13, 171.18], MO: [22.2, 113.54], MP: [15.1, 145.67], MQ: [14.64, -61.02],
    MS: [16.74, -62.19], MT: [35.94, 14.38], MU: [-20.35, 57.55], MV: [3.2, 73.22], NF: [-29.04, 167.95],
    NR: [-0.52, 166.93], NU: [-19.05, -169.87], PF: [-17.68, -149.41], PM: [46.94, -56.27], PN: [-24.37, -128.32],
    PW: [7.51, 134.58], RE: [-21.12, 55.54], SC: [-4.68, 55.49], SG: [1.35, 103.82], SH: [-15.96, -5.71],
    SJ: [77.55, 23.67], SM: [43.94, 12.46], ST: [0.19, 6.61], SX: [18.04, -63.07], TC: [21.69, -71.8],
    TK: [-9.2, -171.85], TO: [-21.18, -175.2], TV: [-7.11, 177.65], UM: [19.28, 166.65], VA: [41.9, 12.45],
    VC: [13.25, -61.2], VG: [18.42, -64.64], VI: [18.34, -64.9], WF: [-13.77, -177.16], WS: [-13.76, -172.1],
    YT: [-12.83, 45.17],
});

export { MAP_REGION_CODES };

/**
 * Codes shown as a dot rather than a shape.
 *
 * @type {readonly string[]}
 */
export const OFF_MAP_CODES = Object.freeze(Object.keys(OFF_MAP_COORDS).sort());

/**
 * Every code the map can show, as a shape (the world map's regions plus
 * French Guiana, `GF`, split out of France) or as a dot. Sorted.
 *
 * @type {readonly string[]}
 */
export const COUNTRY_CODES = Object.freeze(
    [...new Set([...MAP_REGION_CODES, 'GF', ...OFF_MAP_CODES])].sort(),
);

const known = new Set(COUNTRY_CODES);

/**
 * Whether the map can show this ISO alpha-2 code (case-insensitive).
 *
 * @param {unknown} code
 * @returns {boolean}
 */
export function isDiveMapCountry(code) {
    return typeof code === 'string' && known.has(code.toUpperCase());
}
