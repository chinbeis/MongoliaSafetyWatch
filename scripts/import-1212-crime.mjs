import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const API_URL =
  "https://data.1212.mn/api/v1/mn/NSO/Society,%20development/Law%20and%20crime/DT_NSO_2300_044V1.px";
const TABLE_ID = "DT_NSO_2300_044V1";

const REGION_COORDINATES = {
  "183": { latitude: 48.9683, longitude: 89.9625 },
  "182": { latitude: 46.3941, longitude: 95.8806 },
  "181": { latitude: 47.7417, longitude: 96.8467 },
  "185": { latitude: 49.9811, longitude: 92.0664 },
  "184": { latitude: 47.9936, longitude: 91.6342 },
  "265": { latitude: 47.4752, longitude: 100.0844 },
  "264": { latitude: 46.1917, longitude: 100.7178 },
  "263": { latitude: 48.8125, longitude: 103.5347 },
  "261": { latitude: 49.6342, longitude: 105.9228 },
  "262": { latitude: 46.2722, longitude: 102.7781 },
  "267": { latitude: 50.2204, longitude: 100.3214 },
  "342": { latitude: 46.4761, longitude: 108.5570 },
  "345": { latitude: 49.4867, longitude: 105.9220 },
  "344": { latitude: 44.8960, longitude: 110.1163 },
  "348": { latitude: 45.7625, longitude: 106.2708 },
  "346": { latitude: 43.5708, longitude: 104.4250 },
  "343": { latitude: 50.1417, longitude: 106.2500 },
  "341": { latitude: 47.7069, longitude: 106.9528 },
  "421": { latitude: 48.0767, longitude: 114.5326 },
  "422": { latitude: 46.1256, longitude: 113.7283 },
  "423": { latitude: 47.3244, longitude: 110.6556 },
  "5": { latitude: 47.8864, longitude: 106.9057 },
};

const REGION_CODES = Object.keys(REGION_COORDINATES);
const YEAR_MONTH_CODES = [
  { year: 2025, monthCode: "1", monthLabel: "2025-12" },
  { year: 2024, monthCode: "13", monthLabel: "2024-12" },
  { year: 2023, monthCode: "25", monthLabel: "2023-12" },
  { year: 2022, monthCode: "37", monthLabel: "2022-12" },
  { year: 2021, monthCode: "49", monthLabel: "2021-12" },
  { year: 2020, monthCode: "61", monthLabel: "2020-12" },
  { year: 2019, monthCode: "73", monthLabel: "2019-12" },
];

async function main() {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: [
        {
          code: "Үзүүлэлт",
          selection: {
            filter: "all",
            values: ["*"],
          },
        },
        {
          code: "Бүс",
          selection: {
            filter: "item",
            values: REGION_CODES,
          },
        },
        {
          code: "Сар",
          selection: {
            filter: "item",
            values: YEAR_MONTH_CODES.map((entry) => entry.monthCode),
          },
        },
      ],
      response: {
        format: "json-stat2",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`1212.mn request failed with ${response.status}`);
  }

  const dataset = await response.json();
  const indicators = getOrderedCategoryEntries(dataset.dimension["Үзүүлэлт"]);
  const regions = getOrderedCategoryEntries(dataset.dimension["Бүс"]);
  const months = getOrderedCategoryEntries(dataset.dimension["Сар"]);
  const monthMeta = new Map(YEAR_MONTH_CODES.map((entry) => [entry.monthCode, entry]));
  const rows = [];

  let cursor = 0;
  for (const indicator of indicators) {
    for (const region of regions) {
      for (const month of months) {
        const count = dataset.value[cursor];
        cursor += 1;

        if (count == null) {
          continue;
        }

        const regionCoordinates = REGION_COORDINATES[region.code];
        const meta = monthMeta.get(month.code);

        if (!regionCoordinates || !meta) {
          continue;
        }

        rows.push({
          year: meta.year,
          month: meta.monthLabel,
          indicatorCode: indicator.code,
          indicatorName: compactLabel(indicator.label),
          regionCode: region.code,
          regionName: compactLabel(region.label),
          count,
          latitude: regionCoordinates.latitude,
          longitude: regionCoordinates.longitude,
        });
      }
    }
  }

  const snapshot = {
    tableId: TABLE_ID,
    title: dataset.label,
    source: dataset.source,
    updated: dataset.updated,
    generatedAt: new Date().toISOString(),
    indicators: indicators.map((indicator) => ({
      code: indicator.code,
      name: compactLabel(indicator.label),
    })),
    rows,
  };

  const sourcePath = path.join(projectRoot, "src", "data");
  const publicPath = path.join(projectRoot, "public", "data");
  await mkdir(sourcePath, { recursive: true });
  await mkdir(publicPath, { recursive: true });

  const output = `${JSON.stringify(snapshot, null, 2)}\n`;
  await writeFile(path.join(sourcePath, "1212-crime-snapshot.json"), output, "utf8");
  await writeFile(path.join(publicPath, "1212-crime-snapshot.json"), output, "utf8");

  console.log(`Wrote ${rows.length} rows from ${TABLE_ID}`);
}

function getOrderedCategoryEntries(dimension) {
  const indexEntries = Object.entries(dimension.category.index).sort((a, b) => a[1] - b[1]);
  return indexEntries.map(([code]) => ({
    code,
    label: dimension.category.label[code],
  }));
}

function compactLabel(label) {
  return String(label).replace(/\s+/g, " ").trim();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
