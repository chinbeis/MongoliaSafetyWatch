"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Database,
  Filter,
  Info,
  Layers,
  ListOrdered,
  Loader2,
  Map as MapIcon,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  CAPITAL_CODE,
  NATIONAL_CODE,
  NATIONAL_COMPARISON_LABEL,
  RATE_COLORS,
  TOTAL_MEASURE,
  classIndex,
  compareToNational,
  describeComparison,
  formatCell,
  formatChange,
  formatNumber,
  getCrimeTypeBreakdown,
  getCrimeTypeTotal,
  getDistricts,
  getLikeForLike,
  getMeasures,
  getMeta,
  getMonthsAvailable,
  getRate,
  getRateYearFor,
  getRegionRows,
  getYears,
  isPartialYear,
  quantileBreaks,
} from "@/lib/crime-snapshot";
import { distanceMeters } from "@/lib/geo-privacy";
import { t } from "@/lib/translations";
import { useMediaQuery } from "@/lib/use-media-query";
import { MonitorPanel } from "@/components/ui/monitor";
import type { ChoroplethDistrict, ChoroplethRegion } from "@/components/map/region-choropleth";

const RegionChoropleth = dynamic(
  () => import("@/components/map/region-choropleth").then((mod) => ({ default: mod.RegionChoropleth })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-950/40">
        <Loader2 className="h-8 w-8 animate-spin text-teal-300" aria-hidden />
      </div>
    ),
  }
);

const meta = getMeta();
const years = getYears();
const measures = getMeasures();
const districts = getDistricts();

function yearLabel(year: number) {
  return isPartialYear(year) ? `${year} (1–${getMonthsAvailable(year)}-р сар)` : String(year);
}

export default function MapPage() {
  const [year, setYear] = useState(meta.latestYear);
  const [measure, setMeasure] = useState(TOTAL_MEASURE);
  const [mode, setMode] = useState<"rate" | "count">("rate");
  const [selectedCode, setSelectedCode] = useState(CAPITAL_CODE);
  const [query, setQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "error">("idle");
  const [drillDown, setDrillDown] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ open: boolean; tab: "regions" | "detail" }>({ open: false, tab: "regions" });
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // The rate is only published for total registered crime.
  const effectiveMeasure = mode === "rate" ? TOTAL_MEASURE : measure;
  const measureInfo = measures.find((item) => item.code === effectiveMeasure) ?? measures[0];
  const rateYear = getRateYearFor(year);
  const nationalRate = getRate(NATIONAL_CODE, rateYear);
  const national = useMemo(() => getLikeForLike(effectiveMeasure, NATIONAL_CODE, year), [effectiveMeasure, year]);

  const rows = useMemo(() => getRegionRows(effectiveMeasure, year), [effectiveMeasure, year]);
  const breaks = useMemo(
    () => quantileBreaks(rows.map((row) => row.rate).filter((rate): rate is number => rate != null)),
    [rows]
  );

  const choroplethRegions = useMemo<ChoroplethRegion[]>(
    () =>
      rows.map((row) => ({
        code: row.code,
        name: row.name,
        lat: row.lat,
        lng: row.lng,
        rateClass: row.rate != null ? classIndex(row.rate, breaks) : null,
        count: row.count.value,
        hoverText:
          mode === "rate"
            ? row.rate != null
              ? `${formatNumber(row.rate, 1)} · ${t.mapPage.ratePer10k}`
              : t.mapPage.noData
            : `${formatCell(row.count)} · ${t.mapPage.registered.toLowerCase()}`,
      })),
    [rows, breaks, mode]
  );

  const sortedRows = useMemo(() => {
    const key = (row: (typeof rows)[number]) => (mode === "rate" ? row.rate : row.count.value) ?? -Infinity;
    const needle = query.trim().toLowerCase();
    return rows
      .filter((row) => !needle || row.name.toLowerCase().includes(needle))
      .sort((a, b) => key(b) - key(a));
  }, [rows, mode, query]);

  const selected = rows.find((row) => row.code === selectedCode) ?? rows[0];
  const selectedComparison = compareToNational(selected.rate, nationalRate);

  const crimeTypeYear = Math.min(year, meta.latestCrimeTypeYear);
  const districtData = useMemo<ChoroplethDistrict[] | null>(() => {
    if (!drillDown) return null;
    return districts.map((district) => {
      const total = getCrimeTypeTotal(district.code, crimeTypeYear);
      return { ...district, count: total.value, hoverText: `${formatCell(total)} · ${crimeTypeYear} он` };
    });
  }, [drillDown, crimeTypeYear]);

  const breakdownCode = drillDown && selectedDistrict ? selectedDistrict : selected.code;
  // The React Compiler memoises this; no manual useMemo needed.
  const topTypes = getCrimeTypeBreakdown(breakdownCode, crimeTypeYear)
    .filter((row) => row.parent === null && (row.cell.value ?? 0) > 0)
    .sort((a, b) => (b.cell.value ?? 0) - (a.cell.value ?? 0))
    .slice(0, 5);

  const nearest = useMemo(() => {
    if (!userLocation) return null;
    let best: (typeof rows)[number] | null = null;
    let bestDistance = Infinity;
    for (const row of rows) {
      const distance = distanceMeters(userLocation.lat, userLocation.lng, row.lat, row.lng);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = row;
      }
    }
    return best;
  }, [rows, userLocation]);

  function selectRegion(code: string) {
    setSelectedCode(code);
    if (code !== CAPITAL_CODE) {
      setDrillDown(false);
      setSelectedDistrict(null);
    }
    if (!isDesktop) setSheet({ open: true, tab: "detail" });
  }

  function locateUser() {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Used only in this browser tab to pick the closest region.
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(point);
        setGeoStatus("idle");
        let bestCode: string | null = null;
        let bestDistance = Infinity;
        for (const row of rows) {
          const distance = distanceMeters(point.lat, point.lng, row.lat, row.lng);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestCode = row.code;
          }
        }
        if (bestCode) selectRegion(bestCode);
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 }
    );
  }

  const rails = isDesktop ? { left: 352, right: 320, top: 64, bottom: 40 } : { left: 0, right: 0, top: 120, bottom: 56 };
  const dataAsOf = t.dataAsOf(meta.dataThrough);

  return (
    <div className="monitor-shell relative h-[calc(100dvh-4rem)] overflow-hidden">
      <div className="absolute inset-x-0 top-0 bottom-14 lg:bottom-10">
        <RegionChoropleth
          regions={choroplethRegions}
          mode={mode}
          colors={RATE_COLORS}
          selectedCode={selected.code}
          onSelect={selectRegion}
          districts={districtData}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={(code) => {
            setSelectedDistrict(code);
            if (!isDesktop) setSheet({ open: true, tab: "detail" });
          }}
          userPoint={userLocation}
          padding={rails}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-slate-950/80 to-transparent" />

      {/* Top strip: provenance + national figures */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex flex-col gap-2 sm:inset-x-4 lg:left-[22.5rem] lg:right-[21rem]">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <span className="monitor-panel inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
            <Database className="h-3.5 w-3.5 text-teal-300" aria-hidden />
            {t.officialData}
          </span>
          <span className="monitor-panel inline-flex items-center rounded-full px-3 py-1 text-[11px] text-slate-300">
            {dataAsOf}
          </span>
        </div>
        <div className="pointer-events-auto -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <MetricChip
            label={`Улсын дүн · ${yearLabel(year)}`}
            value={formatCell(national.current)}
            hint={measureInfo.isTotal ? undefined : measureInfo.name}
          />
          <MetricChip
            label={t.mapPage.change}
            value={formatChange(national.changePercent)}
            hint={describeComparison(national)}
          />
          <MetricChip
            label={`${t.mapPage.nationalRate} · ${rateYear}`}
            value={nationalRate != null ? formatNumber(nationalRate, 1) : "—"}
            hint={t.mapPage.ratePer10k}
          />
        </div>
      </div>

      {isDesktop ? (
        <>
          <aside className="absolute bottom-14 left-4 top-4 z-30 flex w-[20.5rem] flex-col gap-3">
            <MonitorPanel
              title={t.mapPage.filters}
              icon={<Filter className="h-3.5 w-3.5" />}
              className="anim-slide-left shrink-0"
              collapsible
            >
              {renderFilters()}
            </MonitorPanel>
            <MonitorPanel
              title={t.mapPage.regions}
              icon={<ListOrdered className="h-3.5 w-3.5" />}
              className="anim-slide-left anim-d-2 flex min-h-0 flex-1 flex-col"
              bodyClassName="flex min-h-0 flex-1 flex-col p-3"
            >
              {renderRegionList()}
            </MonitorPanel>
          </aside>

          <aside className="absolute bottom-14 right-4 top-4 z-20 flex w-[19rem] flex-col gap-3 overflow-y-auto">
            <MonitorPanel
              title={t.mapPage.selectedRegion}
              icon={<Crosshair className="h-3.5 w-3.5" />}
              className="anim-slide-right shrink-0"
            >
              {renderDetail()}
            </MonitorPanel>
            <MonitorPanel
              title={t.mapPage.legend}
              icon={<Layers className="h-3.5 w-3.5" />}
              className="anim-slide-right anim-d-2 shrink-0"
            >
              {renderLegend()}
            </MonitorPanel>
          </aside>
        </>
      ) : (
        <section
          className={`absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-2xl border-t border-white/10 bg-slate-950/95 backdrop-blur-lg transition-[max-height] duration-300 ${
            sheet.open ? "max-h-[72dvh]" : "max-h-14"
          }`}
          aria-label={t.map}
        >
          <div className="flex h-14 shrink-0 items-center gap-1 px-2" role="tablist">
            <SheetTab
              active={sheet.tab === "regions"}
              onClick={() => setSheet({ open: true, tab: "regions" })}
              icon={<ListOrdered className="h-4 w-4" />}
              label={t.mapPage.tabRegions}
            />
            <SheetTab
              active={sheet.tab === "detail"}
              onClick={() => setSheet({ open: true, tab: "detail" })}
              icon={<Crosshair className="h-4 w-4" />}
              label={selected.name}
            />
            <button
              type="button"
              onClick={() => setSheet((current) => ({ ...current, open: !current.open }))}
              aria-label={sheet.open ? t.community.closePanel : t.community.openPanel}
              aria-expanded={sheet.open}
              className="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-300 hover:bg-white/5"
            >
              {sheet.open ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </button>
          </div>
          {sheet.open ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto border-t border-white/5 p-4 pb-6" role="tabpanel">
              {sheet.tab === "regions" ? (
                <>
                  {renderFilters()}
                  {renderRegionList()}
                </>
              ) : (
                <>
                  {renderDetail()}
                  {renderLegend()}
                </>
              )}
            </div>
          ) : null}
        </section>
      )}

      <footer className="absolute inset-x-0 bottom-0 z-30 hidden border-t border-white/5 bg-slate-950/85 backdrop-blur-lg lg:block">
        <div className="flex h-10 items-center gap-4 overflow-x-auto px-4 text-[11px] text-slate-400">
          <span className="shrink-0">{dataAsOf}</span>
          <span className="flex shrink-0 items-center gap-1.5">
            <Database className="h-3 w-3" aria-hidden />
            {t.sourceShort} ·{" "}
            <span className="mono-data">
              {meta.sources.totals.tableId}, {meta.sources.rates.tableId}
            </span>
          </span>
          <span className="ml-auto hidden shrink-0 uppercase tracking-[0.14em] text-slate-500 md:block">
            {t.aggregatedNoPii}
          </span>
        </div>
      </footer>
    </div>
  );

  // ------------------------------------------------------------ panels
  // Called as functions (not mounted as components) so both layouts share state.

  function renderFilters() {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <FieldLabel icon={<Calendar className="h-3 w-3" />} text={t.mapPage.year} />
            <select
              value={String(year)}
              onChange={(event) => setYear(Number(event.target.value))}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {years.map((item) => (
                <option key={item} value={item} className="bg-slate-900">
                  {yearLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <div>
            <FieldLabel icon={<MapIcon className="h-3 w-3" />} text={t.mapPage.display} />
            <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1" role="group" aria-label={t.mapPage.display}>
              <ModeButton active={mode === "rate"} onClick={() => setMode("rate")} label={t.mapPage.modeRate} />
              <ModeButton active={mode === "count"} onClick={() => setMode("count")} label={t.mapPage.modeCount} />
            </div>
          </div>
        </div>

        <label className="block">
          <FieldLabel icon={<Layers className="h-3 w-3" />} text={t.mapPage.measure} />
          <select
            value={effectiveMeasure}
            onChange={(event) => setMeasure(event.target.value)}
            disabled={mode === "rate"}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-70"
          >
            {measures.map((item) => (
              <option key={item.code} value={item.code} className="bg-slate-900">
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <p className="text-[11px] leading-relaxed text-slate-400">
          {mode === "rate" ? t.mapPage.rateOnlyTotal : t.mapPage.countCaveat}
        </p>
        {!measureInfo.isTotal ? (
          <p className="text-[11px] leading-relaxed text-slate-400">{measureInfo.description}</p>
        ) : null}

        <button
          type="button"
          onClick={locateUser}
          disabled={geoStatus === "loading"}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 text-sm font-semibold text-teal-200 hover:bg-teal-500/20 disabled:opacity-60"
        >
          <Crosshair className={`h-4 w-4 ${geoStatus === "loading" ? "animate-spin" : ""}`} aria-hidden />
          {geoStatus === "loading" ? t.mapPage.locating : t.mapPage.nearMe}
        </button>
        <p className="text-[11px] leading-relaxed text-slate-500">{t.mapPage.locationPrivate}</p>
        {geoStatus === "error" ? <p className="text-xs text-amber-300">{t.mapPage.locationFailed}</p> : null}
        {nearest ? (
          <p className="rounded-xl border border-teal-500/20 bg-teal-500/10 px-3 py-2 text-xs text-teal-200">
            {t.mapPage.nearestRegion}: <strong>{nearest.name}</strong>
          </p>
        ) : null}
      </div>
    );
  }

  function renderRegionList() {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.mapPage.searchRegion}
            aria-label={t.mapPage.searchRegion}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-11 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t.mapPage.clearSearch}
              className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center text-slate-400 hover:text-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <ul className="mt-2.5 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {sortedRows.length === 0 ? (
            <li className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-center text-xs text-slate-400">
              {t.mapPage.noRegionMatch(query)}
            </li>
          ) : (
            sortedRows.map((row) => {
              const active = row.code === selected.code;
              const comparison = compareToNational(row.rate, nationalRate);
              return (
                <li key={row.code}>
                  <button
                    type="button"
                    onClick={() => selectRegion(row.code)}
                    aria-current={active ? "true" : undefined}
                    className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-colors ${
                      active ? "border-teal-500/40 bg-teal-500/10" : "border-transparent bg-white/[0.03] hover:bg-white/[0.07]"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-100">{row.name}</span>
                      <span className="block text-[11px] text-slate-400">
                        {mode === "rate"
                          ? comparison
                            ? NATIONAL_COMPARISON_LABEL[comparison]
                            : t.mapPage.noData
                          : `${formatChange(row.comparison.changePercent)} · ${t.likeForLike}`}
                      </span>
                    </span>
                    <span className="mono-data shrink-0 text-right text-sm font-bold text-slate-50">
                      {mode === "rate" ? (row.rate != null ? formatNumber(row.rate, 1) : "—") : formatCell(row.count)}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    );
  }

  function renderDetail() {
    return (
      <div key={selected.code} className="anim-rise space-y-3">
        <p className="text-lg font-black leading-tight text-slate-50">{selected.name}</p>
        <div className="grid grid-cols-2 gap-2">
          <DetailCell label={`${t.mapPage.ratePer10k} · ${rateYear}`}>
            <span className="mono-data text-xl font-bold text-slate-50">
              {selected.rate != null ? formatNumber(selected.rate, 1) : "—"}
            </span>
          </DetailCell>
          <DetailCell label={`${t.mapPage.nationalRate} · ${rateYear}`}>
            <span className="mono-data text-xl font-bold text-slate-300">
              {nationalRate != null ? formatNumber(nationalRate, 1) : "—"}
            </span>
          </DetailCell>
          <DetailCell label={`${t.mapPage.registered} · ${yearLabel(year)}`}>
            <span className="mono-data text-xl font-bold text-slate-50">{formatCell(selected.count)}</span>
          </DetailCell>
          <DetailCell label={t.mapPage.change}>
            <span className="mono-data text-xl font-bold text-slate-50">
              {formatChange(selected.comparison.changePercent)}
            </span>
          </DetailCell>
        </div>
        {selectedComparison ? (
          <p className="inline-flex rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-200">
            {NATIONAL_COMPARISON_LABEL[selectedComparison]}
          </p>
        ) : null}
        <p className="text-[11px] leading-relaxed text-slate-400">
          {t.mapPage.rateNote(rateYear)}. {measureInfo.isTotal ? "" : `${measureInfo.name} — `}
          {t.mapPage.change}: {describeComparison(selected.comparison)}.
        </p>

        {selected.code === CAPITAL_CODE ? (
          <div className="space-y-2 rounded-xl border border-white/5 bg-white/[0.03] p-3">
            <button
              type="button"
              onClick={() => {
                setDrillDown((current) => !current);
                setSelectedDistrict(null);
              }}
              aria-pressed={drillDown}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-500/15 px-3 text-sm font-semibold text-teal-200 hover:bg-teal-500/25"
            >
              {drillDown ? <ArrowLeft className="h-4 w-4" aria-hidden /> : <Building2 className="h-4 w-4" aria-hidden />}
              {drillDown ? t.mapPage.districtClose : t.mapPage.districtDrill}
            </button>
            {drillDown && districtData ? (
              <>
                <p className="text-[11px] text-slate-400">{t.mapPage.districtsTitle(crimeTypeYear)}</p>
                <ul className="space-y-1">
                  {[...districtData]
                    .sort((a, b) => (b.count ?? -1) - (a.count ?? -1))
                    .map((district) => (
                      <li key={district.code}>
                        <button
                          type="button"
                          onClick={() => setSelectedDistrict(district.code)}
                          aria-current={district.code === selectedDistrict ? "true" : undefined}
                          className={`flex min-h-10 w-full items-center justify-between rounded-lg px-2.5 text-left text-sm ${
                            district.code === selectedDistrict ? "bg-teal-500/15 text-teal-100" : "text-slate-200 hover:bg-white/5"
                          }`}
                        >
                          {district.name}
                          <span className="mono-data text-slate-300">
                            {district.count != null ? formatNumber(district.count) : "—"}
                          </span>
                        </button>
                      </li>
                    ))}
                </ul>
                <p className="text-[11px] leading-relaxed text-slate-500">{t.mapPage.districtNote}</p>
              </>
            ) : null}
          </div>
        ) : null}

        {topTypes.length > 0 ? (
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {t.mapPage.topTypes} · {crimeTypeYear} ·{" "}
              {drillDown && selectedDistrict
                ? districts.find((d) => d.code === selectedDistrict)?.name
                : selected.name}
            </p>
            <ul className="space-y-1 text-xs text-slate-300">
              {topTypes.map((type) => (
                <li key={type.code} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">{type.name}</span>
                  <span className="mono-data shrink-0 text-slate-100">{formatCell(type.cell)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  function renderLegend() {
    const ranges = RATE_COLORS.map((color, index) => {
      const low = index === 0 ? null : breaks[index - 1];
      const high = index < breaks.length ? breaks[index] : null;
      const label =
        low == null ? `< ${formatNumber(high ?? 0, 1)}` : high == null ? `≥ ${formatNumber(low, 1)}` : `${formatNumber(low, 1)} – ${formatNumber(high, 1)}`;
      return { color, label };
    });
    return (
      <div className="space-y-3">
        {mode === "rate" ? (
          <>
            <p className="text-[11px] text-slate-400">{t.mapPage.legendRate(rateYear)}</p>
            <ul className="space-y-1.5">
              {ranges.map((range) => (
                <li key={range.color} className="flex items-center gap-2.5 text-xs text-slate-200">
                  <span className="h-3 w-5 rounded-sm" style={{ background: range.color }} aria-hidden />
                  <span className="mono-data">{range.label}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-xs text-slate-300">{t.mapPage.legendCount}</p>
        )}

        <details className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5 text-xs text-slate-300">
          <summary className="cursor-pointer font-semibold text-slate-200">{t.mapPage.table}</summary>
          <table className="mt-2 w-full text-left">
            <thead className="text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-1 font-semibold">{t.mapPage.regions}</th>
                <th className="py-1 text-right font-semibold">{rateYear}</th>
                <th className="py-1 text-right font-semibold">{t.mapPage.registered}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.code} className="border-t border-white/5">
                  <td className="py-1">{row.name}</td>
                  <td className="mono-data py-1 text-right">{row.rate != null ? formatNumber(row.rate, 1) : "—"}</td>
                  <td className="mono-data py-1 text-right">{formatCell(row.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>

        <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-300" aria-hidden />
          <p className="text-[11px] leading-relaxed text-slate-400">{t.mapPage.privacyNote}</p>
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" aria-hidden />
          <p className="text-[11px] leading-relaxed text-slate-400">
            {t.dataAsOf(meta.dataThrough)} · {t.sourceShort}
          </p>
        </div>
      </div>
    );
  }
}

function FieldLabel({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      <span className="inline-flex items-center gap-1.5">
        {icon}
        {text}
      </span>
    </span>
  );
}

function ModeButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-9 rounded-lg px-2 text-xs font-semibold transition-colors ${
        active ? "bg-teal-500 text-slate-950" : "text-slate-300 hover:text-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

function MetricChip({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="monitor-panel shrink-0 rounded-xl px-3.5 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mono-data text-base font-bold leading-tight text-slate-50">{value}</p>
      {hint ? <p className="max-w-[14rem] truncate text-[10px] text-slate-400">{hint}</p> : null}
    </div>
  );
}

function DetailCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function SheetTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex min-h-11 min-w-0 items-center gap-1.5 rounded-xl px-2.5 text-[13px] font-semibold ${
        active ? "bg-teal-500/15 text-teal-200" : "text-slate-300 hover:bg-white/5"
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
