import { describe, expect, it } from "vitest";
import {
  getCrimeIndicators,
  getCrimeYears,
  getLatestCrimeYear,
  getNationalTotal,
  getRegionYearCounts,
  getYearDataMonth,
  isPartialYear,
} from "./crime-snapshot";

describe("crime snapshot helpers", () => {
  it("lists years newest first", () => {
    const years = getCrimeYears();
    expect(years.length).toBeGreaterThan(1);
    expect([...years].sort((a, b) => b - a)).toEqual(years);
    expect(getLatestCrimeYear()).toBe(years[0]);
  });

  it("labels complete years as December and flags partial years", () => {
    const years = getCrimeYears();
    const fullYear = years[1];
    expect(getYearDataMonth(fullYear)).toBe(`${fullYear}-12`);
    expect(isPartialYear(fullYear)).toBe(false);
    const latestMonth = getYearDataMonth(years[0]);
    expect(isPartialYear(years[0])).toBe(!latestMonth?.endsWith("-12"));
  });

  it("covers 22 regions (21 aimags + Ulaanbaatar) per indicator-year", () => {
    const indicator = getCrimeIndicators()[0].code;
    const regions = getRegionYearCounts(getCrimeYears()[1], indicator);
    expect(regions).toHaveLength(22);
  });

  it("national total equals the sum of regions", () => {
    const indicator = getCrimeIndicators()[0].code;
    const year = getCrimeYears()[1];
    const sum = getRegionYearCounts(year, indicator).reduce((acc, row) => acc + row.count, 0);
    expect(getNationalTotal(year, indicator)).toBe(sum);
  });
});
