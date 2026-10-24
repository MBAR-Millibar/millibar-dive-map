# @millibar/dive-map

The Millibar Dive Map: a world map highlighting the countries a diver has dived in. Shared by app.millibar.io (Experience page, Dashboard widget, public profile) and the Dive Map landing app (map.millibar.io), so both draw exactly the same map.

It wraps [jsVectorMap](https://github.com/themustafaomar/jsvectormap) `^1.7.0` and keeps Millibar's fixes:

- French Guiana is split out of France's `FR` shape into its own `GF` region, so picking France no longer lights up South America.
- Countries too small for the world map (Maldives, Malta, most Caribbean and Pacific islands) are drawn as dots (`OFF_MAP_COORDS`).
- The constructor gets `markers: []`. Without it, jsVectorMap puts later dots in the scaled regions group, far from their country.
- Zoom uses the + / − buttons only. Scroll-zoom is off, so scrolling over the map still scrolls the page; once zoomed, drag to pan.
- When a map is first drawn with countries, it zooms in on them (shapes and dots), with some room around them and at most 4× the world view. It happens once, so picking countries afterwards doesn't move the map. Pass `autoFocus: false` to keep the world view, or call `focus()` to zoom in again.
- An optional community layer (`community`, divers per country) tints the community's countries softly under the diver's own, which stay strong on top. See [Community layer](#community-layer).
- jsVectorMap and its world map (about 100 KB) are imported on first use, so pages without a map don't download them.

Plain ESM JavaScript with JSDoc types. There is no build step.

## Install

```bash
npm install https://github.com/MBAR-Millibar/millibar-dive-map/archive/refs/tags/v1.2.0.tar.gz
# or: pnpm add https://github.com/MBAR-Millibar/millibar-dive-map/archive/refs/tags/v1.2.0.tar.gz
```

Pin a tag so a project only changes when you bump it.

**Don't install with `github:MBAR-Millibar/millibar-dive-map#…`.** npm writes that into the lockfile as a `git+ssh://` URL, and deploy servers (Forge) only have a deploy key for their own repo, so `npm ci` fails and no assets get built. The release tarball above is plain HTTPS and needs no key. After installing, check that `package-lock.json` has no `git+ssh`.

`jsvectormap` comes with the package. `react` is an optional peer dependency, needed only for the React component.

## Styles

Import jsVectorMap's stylesheet, then this package's:

```css
@import 'jsvectormap/dist/jsvectormap.css';
@import '@millibar/dive-map/dive-map.css';
```

The map reads three CSS variables from its element (inherited from the `.mbar-dive-map` wrapper):

| Variable | Default (navy ground) | Used for |
| --- | --- | --- |
| `--mbar-dive-map-land` | `rgb(255 255 255 / 0.14)` | Every country |
| `--mbar-dive-map-visited` | `var(--mbar-ocean-400, #4daedb)` | Visited countries and dots |
| `--mbar-dive-map-community` | `rgb(77 174 219 / 0.35)`; `rgb(13 138 197 / 0.25)` under `html:not(.dark)` | Community countries and their (smaller) dots |

`dive-map.css` sets the light community value with `html:not(.dark) .mbar-dive-map`, so to override `--mbar-dive-map-community` in a light theme use a selector at least as specific (for example `html:not(.dark) .my-map`).

The defaults suit a navy background. For a light ground, override them after the import, for example the Millibar panel's light and dark themes:

```css
.mbar-dive-map {
    --mbar-dive-map-land: #dbe3ec;
    --mbar-dive-map-visited: var(--mbar-ocean-500);
}

.dark .mbar-dive-map {
    --mbar-dive-map-land: rgb(255 255 255 / 0.12);
    --mbar-dive-map-visited: var(--mbar-ocean-400);
}
```

The colours are read once, when the map is drawn. `dive-map.css` also styles the zoom buttons (navy, top left) and the tooltip (navy, `font-family: inherit`, `z-index: 50`). The `--mbar-navy-*` and `--mbar-ocean-*` colours come from [`@millibar/tokens`](https://github.com/MBAR-Millibar/millibar-tokens) when it is loaded, with the same values as fallbacks.

Give the wrapper a height (for example `h-48 sm:h-64 w-full`). The map fills it.

## Alpine (app.millibar.io)

```js
import { mbarDiveMap } from '@millibar/dive-map/alpine';

window.mbarDiveMap = mbarDiveMap; // or Alpine.data('mbarDiveMap', mbarDiveMap)
```

```html
<div class="mbar-dive-map h-64 w-full"
    x-data="mbarDiveMap({ selected: ['MT', 'EG'], names: { MT: 'Malta', EG: 'Egypt' }, interactive: false })">
    <div x-ref="canvas" wire:ignore class="h-full w-full"></div>
</div>
```

`selected` may be an entangled Livewire property (`$wire.$entangle('data.dive_countries', true)`). The map repaints when it changes, and with `interactive: true` clicking a country toggles it there. Arrays that arrive as objects (`{0: 'MT'}`) work too.

## React (Next.js)

```jsx
import { DiveMap } from '@millibar/dive-map/react';

<DiveMap
    selected={['MT', 'EG']}
    names={{ MT: 'Malta', EG: 'Egypt' }}
    interactive
    onChange={(codes) => setCountries(codes)}
    className="h-64 w-full"
/>
```

| Prop | Type | |
| --- | --- | --- |
| `selected` | `string[]` | ISO alpha-2 codes to highlight |
| `names` | `Record<string, string>` | Names for the tooltips and dots. Without one, a shape shows the map's English name and a dot shows its code |
| `interactive` | `boolean` | Clicking a country toggles it and calls `onChange` |
| `onChange` | `(codes: string[]) => void` | The new codes after a click |
| `autoFocus` | `boolean` | Zoom in on the countries when the map is first drawn with some (default `true`) |
| `community` | `Record<string, number>` | Divers per country, drawn under the selected ones (see [Community layer](#community-layer)) |
| `communityLabel` | `(count: number) => string` | Tooltip text for a community count (default `` (n) => `${n} divers` ``) |
| `className` | `string` | Added to the `.mbar-dive-map` wrapper |

The file starts with `'use client'` and draws the map in an effect, so it renders an empty box on the server and is safe in the App Router. To keep jsVectorMap out of the server bundle entirely, load it with `next/dynamic`:

```jsx
'use client';
import dynamic from 'next/dynamic';

const DiveMap = dynamic(() => import('@millibar/dive-map/react'), { ssr: false });
```

## Plain JavaScript

```js
import { createDiveMap } from '@millibar/dive-map';

const map = createDiveMap(document.querySelector('#map'), {
    selected: ['MT'],
    names: { MT: 'Malta' },
    interactive: true,
    onChange: (codes) => console.log(codes),
});

map.setSelected(['MT', 'GF']); // repaint
map.setNames({ MT: 'Malte' });
map.setCommunity({ EG: 12 });  // replace the community layer
await map.ready;               // drawn
map.destroy();                 // removes the SVG, zoom buttons and tooltip
```

The element must sit inside `.mbar-dive-map` (or set the two variables on it) and have a size. `setSelected()`, `setNames()` and `setCommunity()` can be called before the map has loaded.

## Community layer

Pass `community`, the number of divers per country (ISO alpha-2), to show where the community dives under the diver's own countries:

```js
const map = createDiveMap(element, {
    selected: ['MT'],
    community: { MT: 40, EG: 128, MV: 9 },
    communityLabel: (n) => `${n} plongeurs`, // default: (n) => `${n} divers`
});

map.setCommunity({ EG: 130, PH: 3 }); // at runtime
```

- Community countries are filled with `--mbar-dive-map-community`. The diver's own `selected` countries keep `--mbar-dive-map-visited` on top, and deselecting one brings its community tint back.
- Countries drawn as dots get a smaller dot (radius 3, against 4) in the community colour, under the diver's own dots. A dot that is also selected is drawn as the diver's.
- The tooltip of a community country reads `<name> · <communityLabel(count)>`, for example "Egypt · 128 divers". Other countries keep their plain name.
- Counts of 0 (or less) are left out. `autoFocus` and `focus()` only look at `selected`, never the community.
- Alpine: `mbarDiveMap({ community: {...}, communityLabel })`. `community` is a property of the component, so the map repaints when it changes (`this.community = {...}`, or an entangled Livewire property). React: the `community` and `communityLabel` props; the map repaints when the codes or counts change, not on every new object.

Without `community`, the map is drawn exactly as in v1.1.0.

## Countries

```js
import { COUNTRY_CODES, isDiveMapCountry } from '@millibar/dive-map/countries';

isDiveMapCountry('mt'); // true
```

`@millibar/dive-map/countries` loads no jsVectorMap and no DOM, so a server or API can validate against the same set the map draws:

- `COUNTRY_CODES`: every ISO alpha-2 code the map can show (249, sorted). It is the world map's regions, plus `GF`, plus the dots.
- `MAP_REGION_CODES`: codes drawn as a shape (from jsVectorMap's world map; its non-ISO `_0` N. Cyprus, `_1` Kosovo and `_2` Somaliland are left out).
- `OFF_MAP_CODES` / `OFF_MAP_COORDS`: codes drawn as a dot, with their approximate `[lat, lng]`.
- `isDiveMapCountry(code)`: whether `code` is in `COUNTRY_CODES`, case-insensitive.

`src/map-regions.js` is generated. After bumping `jsvectormap`, run `npm run regions`, commit, and tag a new version.

## Known limits

- jsVectorMap keeps one global event registry. Destroying a map flushes it, which also detaches the events of any other map on the page. One map per page is safe.
