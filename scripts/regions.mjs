// Writes src/map-regions.js: the region codes drawn on jsVectorMap's world
// map, read from the installed jsvectormap. Run `npm run regions` after
// bumping jsvectormap and commit the result.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const source = readFileSync(require.resolve('jsvectormap/dist/maps/world.js'), 'utf8');

let world = null;
vm.runInNewContext(source, { jsVectorMap: { addMap: (name, map) => { world = map; } } });

// Skip the map's non-ISO placeholders (`_0` N. Cyprus, `_1` Kosovo, `_2` Somaliland).
const codes = Object.keys(world.paths).filter((code) => /^[A-Z]{2}$/.test(code)).sort();

const lines = [];
for (let i = 0; i < codes.length; i += 16) {
  lines.push('  ' + codes.slice(i, i + 16).map((code) => `'${code}'`).join(', ') + ',');
}

writeFileSync(new URL('../src/map-regions.js', import.meta.url), `// Generated from jsvectormap's world map by scripts/regions.mjs. Do not edit by hand.

/**
 * ISO 3166-1 alpha-2 codes drawn as a shape on jsVectorMap's world map
 * (before French Guiana is split out of France).
 *
 * @type {readonly string[]}
 */
export const MAP_REGION_CODES = Object.freeze([
${lines.join('\n')}
]);
`);

console.log(`src/map-regions.js: ${codes.length} codes`);
