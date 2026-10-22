/**
 * Alpine adapter for the Dive Map:
 *
 *   <div class="mbar-dive-map" x-data="mbarDiveMap({ selected: [...], names: {...}, interactive: false })">
 *       <div x-ref="canvas" wire:ignore></div>
 *   </div>
 *
 * `selected` may be an entangled Livewire property: the map repaints when it
 * changes, and with `interactive: true` clicking a country toggles it there.
 * Register it with `window.mbarDiveMap = mbarDiveMap` or `Alpine.data('mbarDiveMap', mbarDiveMap)`.
 */
import { createDiveMap, normalizeCodes } from './core.js';

/**
 * @param {import('./core.js').DiveMapOptions} [options]
 */
export function mbarDiveMap({ selected = [], names = {}, interactive = false } = {}) {
    return {
        selected,
        map: null,

        init() {
            this.map = createDiveMap(this.$refs.canvas, {
                selected: this.selected,
                names,
                interactive,
                onChange: (codes) => {
                    this.selected = codes;
                },
            });

            this.$watch('selected', () => this.map?.setSelected(this.codes()));

            return this.map.ready;
        },

        destroy() {
            this.map?.destroy();
            this.map = null;
        },

        codes() {
            return normalizeCodes(this.selected);
        },
    };
}

export default mbarDiveMap;
