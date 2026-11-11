/**
 * Location privacy for community pins.
 *
 * Every stored pin is snapped to the centre of a fixed ~250 m grid cell and
 * its radius is clamped to 250–2000 m, so "exact location" is structurally
 * impossible rather than a UI convention. The server applies this on write
 * (and again on read, as defence in depth); the client uses the same functions
 * only to preview the snapped circle.
 *
 * Keep in sync with drizzle/0007_community_report_privacy.sql, which applies
 * the same formula to rows created before snapping existed.
 */

export const GRID_CELL_METERS = 250;
export const MIN_RADIUS_M = 250;
export const MAX_RADIUS_M = 2000;
export const DEFAULT_RADIUS_M = 500;
export const RADIUS_STEP_M = 50;
export const COORDINATE_DECIMALS = 4;

/** Generous bounding box around Mongolia. */
export const MONGOLIA_BOUNDS = { minLat: 41, maxLat: 53, minLng: 87, maxLng: 120 } as const;

const METERS_PER_DEGREE_LAT = 111_320;

function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Snap a point to the centre of its grid cell. Rows of the grid are
 * `cellMeters` tall in latitude; each row's longitude step is computed from
 * the row's *centre* latitude, so every point inside a cell maps to exactly
 * the same output.
 */
export function snapToGrid(lat: number, lng: number, cellMeters = GRID_CELL_METERS) {
  const latStep = cellMeters / METERS_PER_DEGREE_LAT;
  const snappedLat = (Math.floor(lat / latStep) + 0.5) * latStep;

  const lngStep = cellMeters / (METERS_PER_DEGREE_LAT * Math.cos((snappedLat * Math.PI) / 180));
  const snappedLng = (Math.floor(lng / lngStep) + 0.5) * lngStep;

  return {
    latitude: roundTo(snappedLat, COORDINATE_DECIMALS),
    longitude: roundTo(snappedLng, COORDINATE_DECIMALS),
  };
}

/** Round to the nearest 50 m and clamp into [MIN_RADIUS_M, MAX_RADIUS_M]. */
export function normalizeRadius(radiusMeters: number) {
  const rounded = Math.round(radiusMeters / RADIUS_STEP_M) * RADIUS_STEP_M;
  return Math.min(MAX_RADIUS_M, Math.max(MIN_RADIUS_M, rounded));
}

export function isInsideMongoliaBounds(lat: number, lng: number) {
  return (
    lat >= MONGOLIA_BOUNDS.minLat &&
    lat <= MONGOLIA_BOUNDS.maxLat &&
    lng >= MONGOLIA_BOUNDS.minLng &&
    lng <= MONGOLIA_BOUNDS.maxLng
  );
}

/** Great-circle distance in metres. */
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
