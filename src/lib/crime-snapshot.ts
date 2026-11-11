import snapshotJson from "@/data/1212-crime-snapshot.json";

/**
 * Read-only access to the official statistics snapshot produced by
 * scripts/import-1212-crime.mjs. Every number shown on /, /map and /stats
 * comes through here.
 *
 * Honesty rules encoded in this module:
 * - The newest year is usually partial (year-to-date). Year-over-year change
 *   is always "like for like": Jan–M of this year vs Jan–M of last year.
 * - The six circumstance indicators overlap (one case can be in several), so
 *   nothing here sums across them or presents one as "total crime".
 * - Raw counts scale with population; comparisons between regions use the
 *   published rate per 10 000 residents aged 16+.
 * - Counts of 1–4 are suppressed at import time (stored as -1, shown "<5").
 */

export const SUPPRESSED = -1;
export const TOTAL_MEASURE = "total";
export const NATIONAL_CODE = "0";
export const CAPITAL_CODE = "5";

type MonthlySeries = Record<string, Record<string, Array<number | null>>>; // region → year → months

export interface SnapshotSource {
  tableId: string;
  title: string;
  updated: string;
  url: string;
  api: string;
}

export interface SnapshotRegion {
  name: string;
  kind: "national" | "aimag" | "capital" | "district";
  lat?: number;
  lng?: number;
}

export interface CrimeSnapshot {
  meta: {
    generatedAt: string;
    dataThrough: string;
    latestYear: number;
    latestMonth: number;
    latestRateYear: number;
    latestCrimeTypeYear: number;
    suppressedBelow: number;
    publisher: string;
    sources: Record<"totals" | "circumstances" | "rates" | "crimeTypes", SnapshotSource>;
  };
  regions: Record<string, SnapshotRegion>;
  mapRegions: string[];
  districts: string[];
  indicators: Array<{ code: string; name: string; description: string }>;
  crimeTypes: Array<{ code: string; name: string; parent: string | null }>;
  totals: MonthlySeries;
  circumstances: Record<string, MonthlySeries>;
  rates: Record<string, Record<string, number>>;
  crimeTypesByYear: Record<string, Record<string, Record<string, number | null>>>;
}

const snapshot = snapshotJson as unknown as CrimeSnapshot;

export function getCrimeSnapshot() {
  return snapshot;
}

export function getMeta() {
  return snapshot.meta;
}

/** "YYYY-MM" of the newest month in the snapshot. */
export function getDataThrough() {
  return snapshot.meta.dataThrough;
}

// ------------------------------------------------------------------ cells

export interface Cell {
  /** null when not available or suppressed. */
  value: number | null;
  suppressed: boolean;
}

function toCell(raw: number | null | undefined): Cell {
  if (raw === SUPPRESSED) return { value: null, suppressed: true };
  if (raw == null) return { value: null, suppressed: false };
  return { value: raw, suppressed: false };
}

/** "1 234", "<5" or "—". */
export function formatCell(cell: Cell) {
  if (cell.suppressed) return "<5";
  if (cell.value == null) return "—";
  return formatNumber(cell.value);
}

export function formatNumber(value: number, fractionDigits = 0) {
  return value.toLocaleString("mn-MN", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
}

/** "2026-09" → "2026 оны 9-р сар". */
export function formatMonthLabel(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  return `${year} оны ${month}-р сар`;
}

// ------------------------------------------------------------------ years

export function getYears(): number[] {
  return Object.keys(snapshot.totals[NATIONAL_CODE])
    .map(Number)
    .sort((a, b) => b - a);
}

export function getLatestYear() {
  return snapshot.meta.latestYear;
}

/** Number of months of data for a year (12 for a complete year). */
export function getMonthsAvailable(year: number) {
  return snapshot.totals[NATIONAL_CODE][String(year)]?.length ?? 0;
}

/** "YYYY-MM" the year's cumulative figures run through. */
export function getYearDataMonth(year: number) {
  const months = getMonthsAvailable(year);
  return months > 0 ? `${year}-${String(months).padStart(2, "0")}` : null;
}

export function isPartialYear(year: number) {
  const months = getMonthsAvailable(year);
  return months > 0 && months < 12;
}

// ------------------------------------------------------------------ measures

export interface Measure {
  code: string;
  name: string;
  description: string;
  isTotal: boolean;
}

export function getMeasures(): Measure[] {
  return [
    {
      code: TOTAL_MEASURE,
      name: "Нийт бүртгэгдсэн гэмт хэрэг",
      description: "Цагдаагийн байгууллагад бүртгэгдсэн бүх гэмт хэрэг.",
      isTotal: true,
    },
    ...snapshot.indicators.map((indicator) => ({ ...indicator, isTotal: false })),
  ];
}

export function getIndicators() {
  return snapshot.indicators;
}

function seriesFor(measure: string): MonthlySeries | undefined {
  return measure === TOTAL_MEASURE ? snapshot.totals : snapshot.circumstances[measure];
}

/** Cumulative count for Jan..`month` of `year` (defaults to the year's latest month). */
export function getCumulative(measure: string, region: string, year: number, month?: number): Cell {
  const values = seriesFor(measure)?.[region]?.[String(year)];
  if (!values) return toCell(null);
  const index = (month ?? values.length) - 1;
  return toCell(values[index]);
}

/** Cumulative month-by-month values for a year (null where unavailable/suppressed). */
export function getMonthlySeries(measure: string, region: string, year: number): Array<number | null> {
  const values = seriesFor(measure)?.[region]?.[String(year)] ?? [];
  return values.map((value) => (value === SUPPRESSED ? null : value));
}

export interface LikeForLike {
  year: number;
  /** Months compared: Jan..month. */
  month: number;
  current: Cell;
  previous: Cell;
  /** Percentage change, null when either side is unavailable or zero. */
  changePercent: number | null;
}

/**
 * Jan–M of `year` vs Jan–M of `year - 1`, where M is the newest month available
 * for `year`. For a complete year this is simply full year vs full year.
 */
export function getLikeForLike(measure: string, region: string, year: number): LikeForLike {
  const month = getMonthsAvailable(year);
  const current = getCumulative(measure, region, year, month);
  const previous = month > 0 ? getCumulative(measure, region, year - 1, month) : toCell(null);
  const changePercent =
    current.value != null && previous.value != null && previous.value > 0
      ? ((current.value - previous.value) / previous.value) * 100
      : null;
  return { year, month, current, previous, changePercent };
}

/** "өмнөх оны мөн үетэй харьцуулахад" label for a comparison. */
export function describeComparison(comparison: LikeForLike) {
  if (comparison.month === 12) return `${comparison.year - 1} онтой харьцуулахад`;
  return `${comparison.year - 1} оны 1–${comparison.month}-р сартай харьцуулахад`;
}

export function formatChange(changePercent: number | null) {
  if (changePercent == null) return "—";
  const rounded = Math.round(changePercent * 10) / 10;
  if (rounded === 0) return "0%";
  return `${rounded > 0 ? "+" : "−"}${formatNumber(Math.abs(rounded), 1)}%`;
}

// ------------------------------------------------------------------ regions

export interface RegionInfo {
  code: string;
  name: string;
  kind: SnapshotRegion["kind"];
  lat: number;
  lng: number;
}

function regionInfo(code: string): RegionInfo {
  const region = snapshot.regions[code];
  return { code, name: region.name, kind: region.kind, lat: region.lat ?? 0, lng: region.lng ?? 0 };
}

/** 21 aimags + Ulaanbaatar. */
export function getMapRegions(): RegionInfo[] {
  return snapshot.mapRegions.map(regionInfo);
}

export function getDistricts(): RegionInfo[] {
  return snapshot.districts.map(regionInfo);
}

export function getRegionName(code: string) {
  return snapshot.regions[code]?.name ?? code;
}

// ------------------------------------------------------------------ rates

export function getRateYears(): number[] {
  return Object.keys(snapshot.rates[NATIONAL_CODE] ?? {})
    .map(Number)
    .sort((a, b) => b - a);
}

/**
 * Rates are published yearly, for complete years only. For a partial year
 * (or any year without a rate) the newest earlier rate year is used — callers
 * must label which year the rate refers to.
 */
export function getRateYearFor(year: number) {
  return getRateYears().find((rateYear) => rateYear <= year) ?? getRateYears()[0];
}

export function getRate(region: string, rateYear: number): number | null {
  return snapshot.rates[region]?.[String(rateYear)] ?? null;
}

export type NationalComparison = "above" | "below" | "near";

/** Within ±10 % of the national rate counts as "near". */
export function compareToNational(rate: number | null, nationalRate: number | null): NationalComparison | null {
  if (rate == null || nationalRate == null || nationalRate === 0) return null;
  const ratio = rate / nationalRate;
  if (ratio > 1.1) return "above";
  if (ratio < 0.9) return "below";
  return "near";
}

export const NATIONAL_COMPARISON_LABEL: Record<NationalComparison, string> = {
  above: "Улсын дунджаас дээгүүр",
  below: "Улсын дунджаас доогуур",
  near: "Улсын дундажтай ойролцоо",
};

/**
 * Quantile class breaks for a choropleth: returns `classes - 1` thresholds.
 * A value v falls in class i where breaks[i-1] <= v < breaks[i].
 */
export function quantileBreaks(values: number[], classes = 5): number[] {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return [];
  const breaks: number[] = [];
  for (let i = 1; i < classes; i += 1) {
    const position = (sorted.length - 1) * (i / classes);
    const lower = Math.floor(position);
    const fraction = position - lower;
    const value = sorted[lower] + (sorted[Math.min(lower + 1, sorted.length - 1)] - sorted[lower]) * fraction;
    breaks.push(Math.round(value * 10) / 10);
  }
  return breaks;
}

export function classIndex(value: number, breaks: number[]) {
  let index = 0;
  while (index < breaks.length && value >= breaks[index]) index += 1;
  return index;
}

/** Teal sequential ramp (Tailwind teal 800→100), validated as an ordinal ramp on the dark map surface. */
export const RATE_COLORS = ["#115e59", "#0f766e", "#14b8a6", "#5eead4", "#ccfbf1"] as const;

// ------------------------------------------------------------------ crime types

export interface CrimeTypeRow {
  code: string;
  name: string;
  parent: string | null;
  cell: Cell;
}

export function getCrimeTypeYears(): number[] {
  return Object.keys(snapshot.crimeTypesByYear[NATIONAL_CODE] ?? {})
    .map(Number)
    .sort((a, b) => b - a);
}

export function getCrimeTypeTotal(region: string, year: number): Cell {
  return toCell(snapshot.crimeTypesByYear[region]?.[String(year)]?.total);
}

/** Chapters of the Criminal Code (top level) with their sub-types. */
export function getCrimeTypeBreakdown(region: string, year: number): CrimeTypeRow[] {
  const row = snapshot.crimeTypesByYear[region]?.[String(year)] ?? {};
  return snapshot.crimeTypes.map((type) => ({ ...type, cell: toCell(row[type.code]) }));
}

// ------------------------------------------------------------------ rankings

export interface RegionYearRow extends RegionInfo {
  count: Cell;
  rate: number | null;
  rateYear: number;
  comparison: LikeForLike;
}

/** One row per map region for a measure and year, in fixed geographic order. */
export function getRegionRows(measure: string, year: number): RegionYearRow[] {
  const rateYear = getRateYearFor(year);
  return getMapRegions().map((region) => ({
    ...region,
    count: getCumulative(measure, region.code, year),
    rate: getRate(region.code, rateYear),
    rateYear,
    comparison: getLikeForLike(measure, region.code, year),
  }));
}
