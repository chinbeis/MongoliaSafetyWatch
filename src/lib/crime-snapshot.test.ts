import { describe, expect, it } from "vitest";
import {
  CAPITAL_CODE,
  NATIONAL_CODE,
  SUPPRESSED,
  TOTAL_MEASURE,
  classIndex,
  compareToNational,
  formatCell,
  formatChange,
  getCrimeSnapshot,
  getCumulative,
  getIndicators,
  getLikeForLike,
  getMapRegions,
  getMeta,
  getMonthsAvailable,
  getRateYearFor,
  getYears,
  isPartialYear,
  quantileBreaks,
} from "./crime-snapshot";

const snapshot = getCrimeSnapshot();
const meta = getMeta();

describe("snapshot shape", () => {
  it("has data through at least 2026-09", () => {
    expect(meta.dataThrough >= "2026-09").toBe(true);
    expect(getMonthsAvailable(meta.latestYear)).toBe(meta.latestMonth);
  });

  it("covers 21 aimags + Ulaanbaatar, each with a label point inside Mongolia", () => {
    const regions = getMapRegions();
    expect(regions).toHaveLength(22);
    expect(regions.map((r) => r.code)).toContain(CAPITAL_CODE);
    for (const region of regions) {
      expect(region.lat).toBeGreaterThan(41);
      expect(region.lat).toBeLessThan(53);
      expect(region.lng).toBeGreaterThan(87);
      expect(region.lng).toBeLessThan(120);
    }
  });

  it("lists years newest first and flags only the newest as partial", () => {
    const years = getYears();
    expect(years[0]).toBe(meta.latestYear);
    expect([...years].sort((a, b) => b - a)).toEqual(years);
    for (const year of years.slice(1)) {
      expect(isPartialYear(year)).toBe(false);
      expect(getMonthsAvailable(year)).toBe(12);
    }
  });
});

describe("small-count suppression", () => {
  function* allCounts() {
    for (const byYear of Object.values(snapshot.totals)) {
      for (const values of Object.values(byYear)) yield* values;
    }
    for (const byRegion of Object.values(snapshot.circumstances)) {
      for (const byYear of Object.values(byRegion)) {
        for (const values of Object.values(byYear)) yield* values;
      }
    }
    for (const byYear of Object.values(snapshot.crimeTypesByYear)) {
      for (const row of Object.values(byYear)) yield* Object.values(row);
    }
  }

  it("publishes no count between 1 and 4", () => {
    for (const value of allCounts()) {
      if (value == null || value === SUPPRESSED) continue;
      expect(value === 0 || value >= 5, `found unsuppressed small count ${value}`).toBe(true);
    }
  });

  it("formats suppressed cells as <5 and missing ones as a dash", () => {
    expect(formatCell({ value: null, suppressed: true })).toBe("<5");
    expect(formatCell({ value: null, suppressed: false })).toBe("—");
  });
});

describe("like-for-like comparison", () => {
  it("compares Ulaanbaatar's newest (partial) year with the same months of the previous year", () => {
    const year = meta.latestYear;
    const month = getMonthsAvailable(year);
    const comparison = getLikeForLike(TOTAL_MEASURE, CAPITAL_CODE, year);

    expect(comparison.month).toBe(month);
    expect(comparison.current.value).toBe(snapshot.totals[CAPITAL_CODE][String(year)][month - 1]);
    // The same month a year earlier — not the previous year's December total.
    expect(comparison.previous.value).toBe(snapshot.totals[CAPITAL_CODE][String(year - 1)][month - 1]);
    if (month < 12) {
      expect(comparison.previous.value).not.toBe(snapshot.totals[CAPITAL_CODE][String(year - 1)][11]);
    }
    const expected = ((comparison.current.value! - comparison.previous.value!) / comparison.previous.value!) * 100;
    expect(comparison.changePercent).toBeCloseTo(expected, 6);
  });

  it("uses full year vs full year for complete years", () => {
    const year = getYears()[1];
    const comparison = getLikeForLike(TOTAL_MEASURE, NATIONAL_CODE, year);
    expect(comparison.month).toBe(12);
    expect(comparison.previous.value).toBe(getCumulative(TOTAL_MEASURE, NATIONAL_CODE, year - 1, 12).value);
  });

  it("returns no change when either side is unavailable", () => {
    const oldest = getYears().at(-1)!;
    expect(getLikeForLike(TOTAL_MEASURE, NATIONAL_CODE, oldest).changePercent).toBeNull();
    expect(formatChange(null)).toBe("—");
  });

  it("works for every circumstance indicator without summing them", () => {
    for (const indicator of getIndicators()) {
      const comparison = getLikeForLike(indicator.code, NATIONAL_CODE, meta.latestYear);
      expect(comparison.current.value).not.toBeNull();
    }
  });
});

describe("rates and classes", () => {
  it("falls back to the newest published rate year for a partial year", () => {
    expect(getRateYearFor(meta.latestYear)).toBe(meta.latestRateYear);
    expect(meta.latestRateYear).toBeLessThanOrEqual(meta.latestYear);
  });

  it("splits values into 5 quantile classes", () => {
    const values = Array.from({ length: 22 }, (_, i) => i * 10);
    const breaks = quantileBreaks(values, 5);
    expect(breaks).toHaveLength(4);
    expect(classIndex(0, breaks)).toBe(0);
    expect(classIndex(210, breaks)).toBe(4);
    const counts = [0, 0, 0, 0, 0];
    for (const value of values) counts[classIndex(value, breaks)] += 1;
    for (const count of counts) expect(count).toBeGreaterThanOrEqual(4);
  });

  it("describes regions relative to the national rate, never as 'risk'", () => {
    expect(compareToNational(120, 100)).toBe("above");
    expect(compareToNational(80, 100)).toBe("below");
    expect(compareToNational(105, 100)).toBe("near");
    expect(compareToNational(null, 100)).toBeNull();
  });
});
