import snapshotJson from "@/data/1212-crime-snapshot.json";

export interface CrimeSnapshotRow {
  year: number;
  month: string;
  indicatorCode: string;
  indicatorName: string;
  regionCode: string;
  regionName: string;
  count: number;
  latitude: number;
  longitude: number;
}

interface CrimeSnapshot {
  tableId: string;
  title: string;
  source: string;
  updated: string;
  generatedAt: string;
  indicators: Array<{ code: string; name: string }>;
  rows: CrimeSnapshotRow[];
}

const snapshot = snapshotJson as CrimeSnapshot;

export function getCrimeSnapshot() {
  return snapshot;
}

export function getCrimeYears() {
  return Array.from(new Set(snapshot.rows.map((row) => row.year))).sort((a, b) => b - a);
}

export function getCrimeIndicators() {
  return snapshot.indicators;
}

export function getLatestCrimeYear() {
  return getCrimeYears()[0];
}

/** "YYYY-MM" the year's figures run through — cumulative data, so a
 *  non-December month means the year is partial (year-to-date). */
export function getYearDataMonth(year: number) {
  const row = snapshot.rows.find((item) => item.year === year);
  return row?.month ?? null;
}

export function isPartialYear(year: number) {
  const month = getYearDataMonth(year);
  return month !== null && !month.endsWith("-12");
}

export function getNationalTrend(indicatorCode: string) {
  return getCrimeYears()
    .slice()
    .sort((a, b) => a - b)
    .map((year) => ({
      year: String(year),
      count: sumRows(
        snapshot.rows.filter((row) => row.year === year && row.indicatorCode === indicatorCode)
      ),
    }));
}

export function getIndicatorYearBreakdown(year: number) {
  return snapshot.indicators.map((indicator, index) => ({
    code: indicator.code,
    name: indicator.name,
    value: sumRows(
      snapshot.rows.filter((row) => row.year === year && row.indicatorCode === indicator.code)
    ),
    color: INDICATOR_COLORS[index % INDICATOR_COLORS.length],
  }));
}

export function getRegionYearCounts(year: number, indicatorCode: string) {
  const grouped = new Map<
    string,
    {
      regionCode: string;
      regionName: string;
      count: number;
      latitude: number;
      longitude: number;
    }
  >();

  for (const row of snapshot.rows) {
    if (row.year !== year || row.indicatorCode !== indicatorCode) {
      continue;
    }

    const current = grouped.get(row.regionCode);
    if (current) {
      current.count += row.count;
      continue;
    }

    grouped.set(row.regionCode, {
      regionCode: row.regionCode,
      regionName: row.regionName,
      count: row.count,
      latitude: row.latitude,
      longitude: row.longitude,
    });
  }

  return Array.from(grouped.values()).sort((a, b) => b.count - a.count);
}

export function getRegionTrend(regionCode: string, indicatorCode: string) {
  const trendByYear = new Map<number, number>();
  for (const row of snapshot.rows) {
    if (row.regionCode !== regionCode || row.indicatorCode !== indicatorCode) {
      continue;
    }

    trendByYear.set(row.year, (trendByYear.get(row.year) ?? 0) + row.count);
  }
  return trendByYear;
}

export function getNationalTotal(year: number, indicatorCode: string) {
  return sumRows(
    snapshot.rows.filter((row) => row.year === year && row.indicatorCode === indicatorCode)
  );
}

function sumRows(rows: CrimeSnapshotRow[]) {
  return rows.reduce((sum, row) => sum + row.count, 0);
}

const INDICATOR_COLORS = [
  "#0f766e",
  "#dc2626",
  "#f59e0b",
  "#2563eb",
  "#7c3aed",
  "#475569",
];
