import type { StyleSpecification } from "maplibre-gl";

/**
 * Used when the basemap style (NEXT_PUBLIC_MAP_STYLE_URL) cannot be loaded:
 * the data layers still render on a plain background instead of a blank page.
 */
export const FALLBACK_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#0b1220" } }],
};
