import { describe, expect, it } from "vitest";
import {
  MAX_RADIUS_M,
  MIN_RADIUS_M,
  MONGOLIA_BOUNDS,
  distanceMeters,
  normalizeRadius,
  snapToGrid,
} from "./geo-privacy";

// Deterministic PRNG so failures are reproducible.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function decimals(value: number) {
  const text = String(value);
  return text.includes(".") ? text.split(".")[1].length : 0;
}

// Half-diagonal of a 250 m cell is ~176.8 m; rounding to 4 decimals adds at
// most ~6 m. Anything beyond this means the snapping is broken.
const MAX_DISPLACEMENT_M = 185;

describe("snapToGrid", () => {
  const random = mulberry32(1212);
  const samples = Array.from({ length: 5000 }, () => ({
    lat: MONGOLIA_BOUNDS.minLat + 0.6 + random() * 10.5,
    lng: MONGOLIA_BOUNDS.minLng + 0.8 + random() * 32,
  }));

  it("moves every point by at most half a cell diagonal", () => {
    for (const { lat, lng } of samples) {
      const snapped = snapToGrid(lat, lng);
      expect(distanceMeters(lat, lng, snapped.latitude, snapped.longitude)).toBeLessThanOrEqual(MAX_DISPLACEMENT_M);
    }
  });

  it("never returns more than 4 decimals", () => {
    for (const { lat, lng } of samples) {
      const snapped = snapToGrid(lat, lng);
      expect(decimals(snapped.latitude)).toBeLessThanOrEqual(4);
      expect(decimals(snapped.longitude)).toBeLessThanOrEqual(4);
    }
  });

  it("maps two points in the same cell to identical output", () => {
    for (const { lat, lng } of samples.slice(0, 500)) {
      const a = snapToGrid(lat, lng);
      // Snapping is idempotent, and nudging the snapped centre by a few metres
      // stays inside the same cell.
      expect(snapToGrid(a.latitude, a.longitude)).toEqual(a);
      expect(snapToGrid(a.latitude + 0.0002, a.longitude - 0.0002)).toEqual(a);
    }
  });

  it("separates points that are clearly in different cells", () => {
    const a = snapToGrid(47.9188, 106.9173);
    const b = snapToGrid(47.9188 + 0.01, 106.9173);
    expect(a).not.toEqual(b);
  });
});

describe("normalizeRadius", () => {
  it("clamps and rounds to 50 m steps", () => {
    expect(normalizeRadius(10)).toBe(MIN_RADIUS_M);
    expect(normalizeRadius(5000)).toBe(MAX_RADIUS_M);
    expect(normalizeRadius(512)).toBe(500);
    expect(normalizeRadius(530)).toBe(550);
  });
});
