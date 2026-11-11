#!/usr/bin/env node
/**
 * Importer v2 — official crime statistics from the National Statistics Office
 * (1212.mn, PXWeb API) into a static snapshot bundled with the site.
 *
 *   pnpm import:1212            fetch, validate, write
 *   pnpm import:1212 --check    fetch + validate only (no writes)
 *
 * Writes:
 *   src/data/1212-crime-snapshot.json      compact, imported by the app
 *   public/data/1212-crime-snapshot.json   pretty, for the download button
 *   public/data/*.csv                      the same figures as CSV
 *   .import-summary.md (repo root, gitignored)  human summary for the refresh PR
 *
 * Rules (LAUNCH_PLAN §2.1):
 *   - Dimension codes are always resolved from table metadata. "Сар"/"Он" are
 *     rolling indexes (code 0 = newest) — never hardcode them.
 *   - Publish aimag level nationwide and district level for Ulaanbaatar only.
 *     No soum-level rows.
 *   - Any published count of 1–4 is suppressed (stored as -1, shown as "<5").
 *   - Validate before writing; exit non-zero on failure so the scheduled
 *     refresh never opens a PR with bad data.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK_ONLY = process.argv.includes("--check");

const API_ROOT = "https://data.1212.mn/api/v1/mn/NSO/Society,%20development/Law%20and%20crime";
const TOTALS_FOLDER = `${API_ROOT}/${encodeURIComponent("NUMBER OF RECORDED CRIMES, by region, aimag and the capital, year")}`;

const TABLES = {
  totals: { id: "DT_NSO_2300_003V1", folder: TOTALS_FOLDER, cadence: "monthly" },
  circumstances: { id: "DT_NSO_2300_044V1", folder: API_ROOT, cadence: "monthly" },
  rates: { id: "DT_NSO_2300_034V1", folder: API_ROOT, cadence: "yearly" },
  crimeTypes: { id: "DT_NSO_2300_046V1", folder: API_ROOT, cadence: "yearly" },
};

const NATIONAL = "0";
const CAPITAL = "5";
const AIMAGS = [
  "183", "182", "181", "185", "184",
  "265", "264", "263", "261", "262", "267",
  "342", "345", "344", "348", "346", "343", "341",
  "421", "422", "423",
];
const DISTRICTS = ["51101", "51104", "51107", "51110", "51113", "51116", "51119", "51122", "51125"];
const MAP_REGIONS = [...AIMAGS, CAPITAL];
const YEAR_LIMIT = 8;
const SUPPRESSED = -1;
const SUPPRESS_BELOW = 5;

/** Plain-language explanations shown next to each circumstance indicator. */
const INDICATOR_DESCRIPTIONS = {
  "Гэр бүлийн хүчирхийллийн улмаас": "Гэр бүлийн хүчирхийлэлтэй холбоотойгоор бүртгэгдсэн гэмт хэрэг.",
  "Согтуургаар үйлдэгдсэн": "Үйлдэгч согтууруулах ундаа хэрэглэсэн үедээ үйлдсэн гэмт хэрэг.",
  "Мансуурсан үедээ үйлдсэн": "Үйлдэгч мансууруулах буюу сэтгэцэд нөлөөт бодис хэрэглэсэн үедээ үйлдсэн гэмт хэрэг.",
  "Бүлэглэн үйлдсэн": "Хоёр ба түүнээс дээш хүн хамтран үйлдсэн гэмт хэрэг.",
  "Эмэгтэй хүн оролцсон": "Үйлдэгчдийн дунд эмэгтэй хүн байсан гэмт хэрэг.",
  "Хүүхэд оролцсон": "Үйлдэгчдийн дунд насанд хүрээгүй хүн байсан гэмт хэрэг.",
};

/** Sub-categories in 046V1 that sit under a chapter (verified against the data below). */
const CRIME_TYPE_PARENTS = { "4": "3", "5": "3", "8": "7", "9": "7", "10": "7", "11": "7", "12": "7" };

// ---------------------------------------------------------------- HTTP

async function request(url, init = {}, attempt = 1) {
  try {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(60_000) });
    if (response.status === 429 || response.status >= 500) {
      throw new Error(`HTTP ${response.status}`);
    }
    if (!response.ok) {
      throw Object.assign(new Error(`HTTP ${response.status} for ${url}`), { fatal: true });
    }
    return await response.json();
  } catch (error) {
    if (error.fatal || attempt >= 4) throw error;
    const delay = 1500 * attempt;
    console.warn(`  retry ${attempt} in ${delay} ms: ${error.message}`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return request(url, init, attempt + 1);
  }
}

const tableUrl = (table) => `${table.folder}/${table.id}.px`;

async function getUpdated(table) {
  const listing = await request(`${table.folder}/`);
  const entry = listing.find((item) => item.id === `${table.id}.px`);
  if (!entry?.updated) throw new Error(`${table.id}: not found in folder listing`);
  return entry.updated;
}

// ---------------------------------------------------------------- metadata

function variableByRole(meta, role) {
  const patterns = {
    region: /^Бүс$/,
    month: /^Сар$/,
    year: /^Он$/,
    indicator: /^Үзүүлэлт$/,
    crimeType: /ангилал/i,
  };
  const variable = meta.variables.find((item) => patterns[role].test(String(item.code).trim()));
  if (!variable) {
    throw new Error(`no ${role} dimension in "${meta.title}" (have: ${meta.variables.map((v) => v.code).join(", ")})`);
  }
  return variable;
}

function entries(variable) {
  return variable.values.map((code, index) => ({ code, label: compact(variable.valueTexts[index]) }));
}

function compact(label) {
  return String(label).replace(/\s+/g, " ").trim();
}

/** Month codes for the last YEAR_LIMIT years, plus a per-year index. */
function resolveMonths(variable) {
  const months = entries(variable)
    .map((entry) => {
      const match = entry.label.match(/^(\d{4})-(\d{2})$/);
      return match ? { ...entry, year: Number(match[1]), month: Number(match[2]) } : null;
    })
    .filter(Boolean);
  const years = [...new Set(months.map((m) => m.year))].sort((a, b) => b - a).slice(0, YEAR_LIMIT);
  return months.filter((m) => years.includes(m.year));
}

function resolveYears(variable) {
  return entries(variable)
    .map((entry) => ({ ...entry, year: Number(entry.label) }))
    .filter((entry) => Number.isInteger(entry.year))
    .sort((a, b) => b.year - a.year)
    .slice(0, YEAR_LIMIT);
}

function requireCodes(variable, codes, tableId) {
  const available = new Set(variable.values);
  const missing = codes.filter((code) => !available.has(code));
  if (missing.length > 0) throw new Error(`${tableId}: region codes missing from metadata: ${missing.join(", ")}`);
}

// ---------------------------------------------------------------- data

/** POSTs a PXWeb query and decodes the json-stat2 cube into flat cells. */
async function queryCube(table, selections) {
  const dataset = await request(tableUrl(table), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: selections.map(({ code, values }) => ({ code, selection: { filter: "item", values } })),
      response: { format: "json-stat2" },
    }),
  });

  const dims = dataset.id;
  const sizes = dataset.size;
  const codesByDim = dims.map((dim) =>
    Object.entries(dataset.dimension[dim].category.index)
      .sort((a, b) => a[1] - b[1])
      .map(([code]) => code)
  );

  const cells = [];
  const total = sizes.reduce((a, b) => a * b, 1);
  for (let flat = 0; flat < total; flat += 1) {
    let rest = flat;
    const coords = {};
    for (let d = dims.length - 1; d >= 0; d -= 1) {
      coords[dims[d]] = codesByDim[d][rest % sizes[d]];
      rest = Math.floor(rest / sizes[d]);
    }
    const raw = Array.isArray(dataset.value) ? dataset.value[flat] : dataset.value?.[flat];
    cells.push({ coords, value: raw == null ? null : Number(raw) });
  }
  return { cells, label: dataset.label };
}

function suppress(value) {
  if (value == null || Number.isNaN(value)) return null;
  return value > 0 && value < SUPPRESS_BELOW ? SUPPRESSED : value;
}

// ---------------------------------------------------------------- tables

async function loadTotals(meta) {
  const region = variableByRole(meta, "region");
  const month = variableByRole(meta, "month");
  // 003V1 lists UB districts but publishes no values for them; district
  // figures come from 046V1 (yearly) instead.
  const regions = [NATIONAL, ...MAP_REGIONS];
  requireCodes(region, regions, TABLES.totals.id);
  const months = resolveMonths(month);
  const byCode = new Map(months.map((m) => [m.code, m]));

  const { cells } = await queryCube(TABLES.totals, [
    { code: region.code, values: regions },
    { code: month.code, values: months.map((m) => m.code) },
  ]);

  const series = {}; // region -> year -> [month1..]
  const raw = {}; // unsuppressed, for validation only
  for (const { coords, value } of cells) {
    const m = byCode.get(coords[month.code]);
    const r = coords[region.code];
    if (!m || value == null) continue;
    for (const target of [series, raw]) {
      target[r] ??= {};
      target[r][m.year] ??= [];
    }
    series[r][m.year][m.month - 1] = suppress(value);
    raw[r][m.year][m.month - 1] = value;
  }
  return { series, raw, months, regionLabels: Object.fromEntries(entries(region).map((e) => [e.code, e.label])) };
}

async function loadCircumstances(meta) {
  const indicator = variableByRole(meta, "indicator");
  const region = variableByRole(meta, "region");
  const month = variableByRole(meta, "month");
  const regions = [NATIONAL, ...MAP_REGIONS];
  requireCodes(region, regions, TABLES.circumstances.id);
  const months = resolveMonths(month);
  const byCode = new Map(months.map((m) => [m.code, m]));

  const { cells } = await queryCube(TABLES.circumstances, [
    { code: indicator.code, values: indicator.values },
    { code: region.code, values: regions },
    { code: month.code, values: months.map((m) => m.code) },
  ]);

  const series = {}; // indicator -> region -> year -> [..]
  const raw = {};
  for (const { coords, value } of cells) {
    const m = byCode.get(coords[month.code]);
    if (!m || value == null) continue;
    const i = coords[indicator.code];
    const r = coords[region.code];
    for (const target of [series, raw]) {
      target[i] ??= {};
      target[i][r] ??= {};
      target[i][r][m.year] ??= [];
    }
    series[i][r][m.year][m.month - 1] = suppress(value);
    raw[i][r][m.year][m.month - 1] = value;
  }

  const indicators = entries(indicator).map((entry) => ({
    code: entry.code,
    name: entry.label,
    description: INDICATOR_DESCRIPTIONS[entry.label] ?? "",
  }));
  return { series, raw, indicators, months };
}

async function loadRates(meta) {
  const region = variableByRole(meta, "region");
  const year = variableByRole(meta, "year");
  const regions = [NATIONAL, ...MAP_REGIONS];
  requireCodes(region, regions, TABLES.rates.id);
  const years = resolveYears(year);
  const byCode = new Map(years.map((y) => [y.code, y.year]));

  const { cells } = await queryCube(TABLES.rates, [
    { code: region.code, values: regions },
    { code: year.code, values: years.map((y) => y.code) },
  ]);

  const rates = {};
  for (const { coords, value } of cells) {
    const y = byCode.get(coords[year.code]);
    if (y == null || value == null) continue;
    const r = coords[region.code];
    rates[r] ??= {};
    rates[r][y] = Math.round(value * 10) / 10;
  }
  return { rates, years: years.map((y) => y.year) };
}

async function loadCrimeTypes(meta) {
  const region = variableByRole(meta, "region");
  const type = variableByRole(meta, "crimeType");
  const year = variableByRole(meta, "year");
  // Aimag level nationwide, district level for Ulaanbaatar only — no soums.
  const regions = [NATIONAL, ...MAP_REGIONS, ...DISTRICTS];
  requireCodes(region, regions, TABLES.crimeTypes.id);
  const years = resolveYears(year);
  const byCode = new Map(years.map((y) => [y.code, y.year]));

  const { cells } = await queryCube(TABLES.crimeTypes, [
    { code: region.code, values: regions },
    { code: type.code, values: type.values },
    { code: year.code, values: years.map((y) => y.code) },
  ]);

  const counts = {}; // region -> year -> type -> n
  const raw = {};
  for (const { coords, value } of cells) {
    const y = byCode.get(coords[year.code]);
    if (y == null || value == null) continue;
    const r = coords[region.code];
    const t = coords[type.code];
    for (const target of [counts, raw]) {
      target[r] ??= {};
      target[r][y] ??= {};
    }
    counts[r][y][t] = suppress(value);
    raw[r][y][t] = value;
  }

  const typeEntries = entries(type);
  const totalCode = typeEntries.find((entry) => /Улсын дүн|Бүгд|Нийт/.test(entry.label))?.code;
  if (!totalCode) throw new Error(`${TABLES.crimeTypes.id}: no total row in crime types`);
  const types = typeEntries
    .filter((entry) => entry.code !== totalCode)
    .map((entry) => ({ code: entry.code, name: entry.label, parent: CRIME_TYPE_PARENTS[entry.code] ?? null }));

  return { counts, raw, types, totalCode, years: years.map((y) => y.year) };
}

// ---------------------------------------------------------------- validation

function validate({ totals, circumstances, rates, crimeTypes, previous }) {
  const problems = [];
  const warnings = [];
  const fail = (message) => problems.push(message);
  const warn = (message) => warnings.push(message);

  const latest = totals.months.reduce((a, b) => (a.year * 100 + a.month > b.year * 100 + b.month ? a : b));
  const years = [...new Set(totals.months.map((m) => m.year))];

  let missingCells = 0;
  let expectedCells = 0;

  // `strict`: every month must be present (national rows, the totals table).
  // Otherwise ".." (not available) cells are tolerated and counted.
  const checkCumulative = (label, byYear, strict) => {
    for (const [year, values] of Object.entries(byYear)) {
      const expectedLength = Number(year) === latest.year ? latest.month : 12;
      const present = values.slice(0, expectedLength).filter((v) => v != null).length;
      expectedCells += expectedLength;
      missingCells += expectedLength - present;
      if (strict && present !== expectedLength) fail(`${label} ${year}: ${present} months, expected ${expectedLength}`);
      for (let i = 0; i < values.length; i += 1) {
        if (values[i] != null && values[i] < 0) fail(`${label} ${year}-${i + 1}: negative value`);
        if (i > 0 && values[i] != null && values[i - 1] != null && values[i] < values[i - 1]) {
          // 1212.mn revises figures (cases reclassified or closed), so a
          // cumulative series can legitimately dip. Flag it for the human
          // reviewer; only a large national drop means the data is broken.
          const message = `${label} ${year}: cumulative series decreases at month ${i + 1} (${values[i - 1]} → ${values[i]})`;
          if (label === `totals ${NATIONAL}` && values[i] < values[i - 1] * 0.9) fail(message);
          else warn(message);
        }
      }
    }
  };

  for (const region of [NATIONAL, ...MAP_REGIONS]) {
    const byYear = totals.raw[region];
    if (!byYear) {
      fail(`totals: region ${region} missing`);
      continue;
    }
    for (const year of years) if (!byYear[year]) fail(`totals: region ${region} has no ${year}`);
    checkCumulative(`totals ${region}`, byYear, true);
  }

  for (const indicator of circumstances.indicators) {
    for (const region of [NATIONAL, ...MAP_REGIONS]) {
      const byYear = circumstances.raw[indicator.code]?.[region];
      if (!byYear) {
        fail(`circumstances: ${indicator.code}/${region} missing`);
        continue;
      }
      for (const year of years) if (!byYear[year]) fail(`circumstances: ${indicator.code}/${region} has no ${year}`);
      checkCumulative(`circumstances ${indicator.code}/${region}`, byYear, region === NATIONAL);
    }
  }

  if (expectedCells > 0 && missingCells / expectedCells > 0.15) {
    fail(`${missingCells} of ${expectedCells} monthly cells are not available (> 15%) — source looks broken`);
  } else if (missingCells > 0) {
    warn(`${missingCells} of ${expectedCells} monthly cells are marked ".." (not available) by the source`);
  }

  for (const region of [NATIONAL, ...MAP_REGIONS]) {
    for (const year of rates.years) {
      const value = rates.rates[region]?.[year];
      if (value == null) fail(`rates: ${region}/${year} missing`);
      else if (value < 0) fail(`rates: ${region}/${year} negative`);
    }
  }

  for (const region of [NATIONAL, ...MAP_REGIONS, ...DISTRICTS]) {
    for (const year of crimeTypes.years) {
      const row = crimeTypes.raw[region]?.[year];
      if (!row) {
        fail(`crimeTypes: ${region}/${year} missing`);
        continue;
      }
      const chapters = crimeTypes.types.filter((t) => !t.parent);
      const chapterSum = chapters.reduce((sum, t) => sum + (row[t.code] ?? 0), 0);
      const total = row[crimeTypes.totalCode];
      if (total != null && chapterSum !== total) {
        fail(`crimeTypes: ${region}/${year} chapters sum ${chapterSum} ≠ total ${total}`);
      }
      for (const [child, parent] of Object.entries(CRIME_TYPE_PARENTS)) {
        if ((row[child] ?? 0) > (row[parent] ?? 0)) fail(`crimeTypes: ${region}/${year} type ${child} > parent ${parent}`);
      }
    }
  }

  // District figures must add up to (at most) Ulaanbaatar.
  for (const year of crimeTypes.years) {
    const ub = crimeTypes.raw[CAPITAL]?.[year]?.[crimeTypes.totalCode];
    const districtSum = DISTRICTS.reduce((sum, d) => sum + (crimeTypes.raw[d]?.[year]?.[crimeTypes.totalCode] ?? 0), 0);
    if (ub != null && districtSum > ub) fail(`crimeTypes ${year}: districts ${districtSum} > Ulaanbaatar ${ub}`);
  }

  if (previous?.meta?.dataThrough) {
    const current = `${latest.year}-${String(latest.month).padStart(2, "0")}`;
    if (current < previous.meta.dataThrough) {
      fail(`newest month ${current} is older than the committed snapshot (${previous.meta.dataThrough})`);
    }
  }

  return { problems, warnings };
}

// ---------------------------------------------------------------- geo + output

async function readJsonIfExists(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

async function labelPoints() {
  const points = {};
  for (const file of ["public/geo/mn-aimags.geojson", "public/geo/ub-districts.geojson"]) {
    const geo = await readJsonIfExists(path.join(projectRoot, file));
    if (!geo) throw new Error(`${file} is required (region label points)`);
    for (const feature of geo.features) {
      points[feature.properties.code] = { lat: feature.properties.labelLat, lng: feature.properties.labelLng };
    }
  }
  return points;
}

function csvCell(value) {
  if (value === SUPPRESSED) return "<5";
  if (value == null) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(header, rows) {
  return `﻿${[header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function buildCsvFiles(snapshot) {
  const name = (code) => snapshot.regions[code]?.name ?? code;
  const monthly = [];
  for (const [region, byYear] of Object.entries(snapshot.totals)) {
    for (const [year, values] of Object.entries(byYear)) {
      values.forEach((value, index) => monthly.push([region, name(region), year, index + 1, value]));
    }
  }
  const circumstances = [];
  for (const indicator of snapshot.indicators) {
    for (const [region, byYear] of Object.entries(snapshot.circumstances[indicator.code])) {
      for (const [year, values] of Object.entries(byYear)) {
        values.forEach((value, index) =>
          circumstances.push([indicator.code, indicator.name, region, name(region), year, index + 1, value])
        );
      }
    }
  }
  const rates = [];
  for (const [region, byYear] of Object.entries(snapshot.rates)) {
    for (const [year, value] of Object.entries(byYear)) rates.push([region, name(region), year, value]);
  }
  const typeName = Object.fromEntries(snapshot.crimeTypes.map((t) => [t.code, t.name]));
  const types = [];
  for (const [region, byYear] of Object.entries(snapshot.crimeTypesByYear)) {
    for (const [year, row] of Object.entries(byYear)) {
      for (const [type, value] of Object.entries(row)) {
        types.push([region, name(region), year, type, typeName[type] ?? "Нийт", value]);
      }
    }
  }
  return {
    "registered-crimes-monthly-cumulative.csv": toCsv(
      ["region_code", "region_name", "year", "month", "cumulative_registered_crimes"],
      monthly
    ),
    "crime-circumstances-monthly-cumulative.csv": toCsv(
      ["indicator_code", "indicator_name", "region_code", "region_name", "year", "month", "cumulative_count"],
      circumstances
    ),
    "crime-rate-per-10000-aged-16-plus.csv": toCsv(["region_code", "region_name", "year", "rate_per_10000"], rates),
    "registered-crimes-by-type-yearly.csv": toCsv(
      ["region_code", "region_name", "year", "crime_type_code", "crime_type_name", "registered_crimes"],
      types
    ),
  };
}

function summarise(snapshot, previous, warnings) {
  const { latestYear, latestMonth } = snapshot.meta;
  const current = snapshot.totals[NATIONAL][latestYear][latestMonth - 1];
  const sameMonthLastYear = snapshot.totals[NATIONAL][latestYear - 1]?.[latestMonth - 1];
  const lines = [
    `Data through **${snapshot.meta.dataThrough}** (previous snapshot: ${previous?.meta?.dataThrough ?? "none"}).`,
    "",
    `- Registered crimes, national, Jan–${String(latestMonth).padStart(2, "0")} ${latestYear}: **${current}**` +
      (sameMonthLastYear ? ` (same period ${latestYear - 1}: ${sameMonthLastYear})` : ""),
    `- Ulaanbaatar, same period: ${snapshot.totals[CAPITAL][latestYear][latestMonth - 1]}`,
    `- Latest per-10,000 rate year: ${snapshot.meta.latestRateYear}`,
    `- Latest crime-type year: ${snapshot.meta.latestCrimeTypeYear}`,
    "",
    "Source tables (1212.mn `updated`):",
    ...Object.values(snapshot.meta.sources).map((s) => `- ${s.tableId} — ${s.updated}`),
  ];
  if (warnings.length > 0) {
    lines.push(
      "",
      `<details><summary>${warnings.length} revision warning(s) — cumulative figures that went down (normal for this source; check for anything implausible)</summary>`,
      "",
      ...warnings.map((w) => `- ${w}`),
      "",
      "</details>"
    );
  }
  return `${lines.join("\n")}\n`;
}

// ---------------------------------------------------------------- main

async function main() {
  const snapshotPath = path.join(projectRoot, "src", "data", "1212-crime-snapshot.json");
  const previous = await readJsonIfExists(snapshotPath);

  console.log("Reading metadata…");
  const metas = {};
  const updated = {};
  for (const [key, table] of Object.entries(TABLES)) {
    metas[key] = await request(tableUrl(table));
    updated[key] = await getUpdated(table);
    console.log(`  ${table.id}  updated ${updated[key]}  "${compact(metas[key].title).slice(0, 70)}…"`);
  }

  console.log("Fetching data…");
  const totals = await loadTotals(metas.totals);
  const circumstances = await loadCircumstances(metas.circumstances);
  const rates = await loadRates(metas.rates);
  const crimeTypes = await loadCrimeTypes(metas.crimeTypes);

  console.log("Validating…");
  const { problems, warnings } = validate({ totals, circumstances, rates, crimeTypes, previous });
  if (warnings.length > 0) {
    console.warn(`  ${warnings.length} warning(s) — source revisions, listed in .import-summary.md`);
  }
  if (problems.length > 0) {
    console.error(`\n${problems.length} validation problem(s):`);
    for (const problem of problems.slice(0, 50)) console.error(`  - ${problem}`);
    process.exitCode = 1;
    return;
  }

  const latest = totals.months.reduce((a, b) => (a.year * 100 + a.month > b.year * 100 + b.month ? a : b));
  const pad = (byYear) => {
    for (const year of Object.keys(byYear)) {
      const length = Number(year) === latest.year ? latest.month : 12;
      byYear[year] = Array.from({ length }, (_, i) => byYear[year][i] ?? null);
    }
  };
  Object.values(totals.series).forEach(pad);
  Object.values(circumstances.series).forEach((byRegion) => Object.values(byRegion).forEach(pad));
  const dataThrough = `${latest.year}-${String(latest.month).padStart(2, "0")}`;
  const points = CHECK_ONLY ? {} : await labelPoints();

  const regions = {};
  regions[NATIONAL] = { name: "Улсын дүн", kind: "national" };
  for (const code of AIMAGS) regions[code] = { name: totals.regionLabels[code], kind: "aimag", ...points[code] };
  regions[CAPITAL] = { name: totals.regionLabels[CAPITAL], kind: "capital", ...points[CAPITAL] };
  for (const code of DISTRICTS) regions[code] = { name: totals.regionLabels[code], kind: "district", ...points[code] };
  for (const [code, region] of Object.entries(regions)) {
    if (!CHECK_ONLY && region.kind !== "national" && (region.lat == null || region.lng == null)) {
      throw new Error(`no label point for region ${code} (${region.name}) in public/geo`);
    }
  }

  const source = (key, title) => ({
    tableId: TABLES[key].id,
    title: compact(title),
    updated: updated[key],
    url: `https://data.1212.mn/pxweb/mn/NSO/NSO__Society,%20development__Law%20and%20crime/${TABLES[key].id}.px/`,
    api: tableUrl(TABLES[key]),
  });

  const snapshot = {
    meta: {
      generatedAt: new Date().toISOString(),
      dataThrough,
      latestYear: latest.year,
      latestMonth: latest.month,
      latestRateYear: Math.max(...rates.years),
      latestCrimeTypeYear: Math.max(...crimeTypes.years),
      suppressedBelow: SUPPRESS_BELOW,
      publisher: "Үндэсний статистикийн хороо (1212.mn)",
      sources: {
        totals: source("totals", metas.totals.title),
        circumstances: source("circumstances", metas.circumstances.title),
        rates: source("rates", metas.rates.title),
        crimeTypes: source("crimeTypes", metas.crimeTypes.title),
      },
    },
    regions,
    mapRegions: MAP_REGIONS,
    districts: DISTRICTS,
    indicators: circumstances.indicators,
    crimeTypes: crimeTypes.types,
    totals: totals.series,
    circumstances: circumstances.series,
    rates: rates.rates,
    crimeTypesByYear: Object.fromEntries(
      Object.entries(crimeTypes.counts).map(([region, byYear]) => [
        region,
        Object.fromEntries(
          Object.entries(byYear).map(([year, row]) => {
            const { [crimeTypes.totalCode]: total, ...rest } = row;
            return [year, { total, ...rest }];
          })
        ),
      ])
    ),
  };

  if (CHECK_ONLY) {
    console.log(`OK — data through ${dataThrough} (check only, nothing written).`);
    return;
  }

  const publicDir = path.join(projectRoot, "public", "data");
  await mkdir(path.dirname(snapshotPath), { recursive: true });
  await mkdir(publicDir, { recursive: true });
  await writeFile(snapshotPath, `${JSON.stringify(snapshot)}\n`, "utf8");
  await writeFile(path.join(publicDir, "1212-crime-snapshot.json"), `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  for (const [file, content] of Object.entries(buildCsvFiles(snapshot))) {
    await writeFile(path.join(publicDir, file), content, "utf8");
  }
  await writeFile(path.join(projectRoot, ".import-summary.md"), summarise(snapshot, previous, warnings), "utf8");

  console.log(`Wrote snapshot — data through ${dataThrough}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
