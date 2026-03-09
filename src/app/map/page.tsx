"use client";

import { MapWrapper } from "@/components/map/map-wrapper";
import {
  Filter,
  Map as MapIcon,
  Info,
  Calendar,
  Layers,
  CircleDot,
  Flame,
  Building2,
  Activity,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getCrimeIndicators,
  getCrimeSnapshot,
  getCrimeYears,
  getLatestCrimeYear,
  getNationalTotal,
  getRegionTrend,
  getRegionYearCounts,
} from "@/lib/crime-snapshot";

const years = getCrimeYears();
const indicators = getCrimeIndicators();
const snapshot = getCrimeSnapshot();

export default function MapPage() {
  const [selectedYear, setSelectedYear] = useState(getLatestCrimeYear());
  const [selectedIndicator, setSelectedIndicator] = useState(indicators[0]?.code ?? "");
  const [viewMode, setViewMode] = useState<"heat" | "bubble">("heat");
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>("5");

  const mapData = useMemo(() => {
    const regionCounts = getRegionYearCounts(selectedYear, selectedIndicator);
    const maxCount = Math.max(...regionCounts.map((point) => point.count), 1);

    return regionCounts.map((point) => {
      const trendByYear = getRegionTrend(point.regionCode, selectedIndicator);
      const previous = trendByYear.get(selectedYear - 1) ?? 0;
      const delta = point.count - previous;
      const deltaPercent = previous > 0 ? (delta / previous) * 100 : 0;
      const risk = point.count >= maxCount * 0.66 ? "Өндөр" : point.count >= maxCount * 0.33 ? "Дунд" : "Бага";

      return {
        id: point.regionCode,
        name: point.regionName,
        lat: point.latitude,
        lng: point.longitude,
        count: point.count,
        trend: `${deltaPercent >= 0 ? "+" : ""}${deltaPercent.toFixed(1)}%`,
        risk,
      };
    });
  }, [selectedIndicator, selectedYear]);

  const rankedHotspots = useMemo(() => mapData.slice().sort((a, b) => b.count - a.count), [mapData]);

  const ulaanbaatarSpotlight = useMemo(
    () => mapData.find((spot) => spot.id === "5" || spot.name.includes("Улаанбаатар")),
    [mapData]
  );

  const selectedHotspot = useMemo(
    () => mapData.find((spot) => spot.id === selectedHotspotId) ?? ulaanbaatarSpotlight ?? mapData[0],
    [mapData, selectedHotspotId, ulaanbaatarSpotlight]
  );

  const nationalTotal = useMemo(
    () => getNationalTotal(selectedYear, selectedIndicator),
    [selectedIndicator, selectedYear]
  );

  const ulaanbaatarRank = useMemo(() => {
    if (!ulaanbaatarSpotlight) {
      return "-";
    }

    return `#${rankedHotspots.findIndex((spot) => spot.id === ulaanbaatarSpotlight.id) + 1}`;
  }, [rankedHotspots, ulaanbaatarSpotlight]);

  const ulaanbaatarShare = useMemo(() => {
    if (!ulaanbaatarSpotlight || nationalTotal === 0) {
      return "0.0%";
    }

    return `${((ulaanbaatarSpotlight.count / nationalTotal) * 100).toFixed(1)}%`;
  }, [nationalTotal, ulaanbaatarSpotlight]);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  return (
    <div className="h-[calc(100dvh-4rem-2.5rem)] overflow-hidden">
      <div className="mx-auto flex h-full max-w-7xl flex-col px-5 py-4">
        <div className="mb-4 grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Улсын дүн" value={nationalTotal.toLocaleString()} icon={<Flame className="w-4 h-4 text-red-600" />} />
          <MetricCard label="Улаанбаатар" value={ulaanbaatarSpotlight?.count.toLocaleString() ?? "-"} icon={<Building2 className="w-4 h-4 text-amber-600" />} />
          <MetricCard label="Хотын эзлэх хувь" value={ulaanbaatarShare} icon={<Activity className="w-4 h-4 text-teal-600" />} />
          <MetricCard label="УБ байрлал" value={ulaanbaatarRank} icon={<MapIcon className="w-4 h-4 text-sky-600" />} />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="min-h-0 overflow-hidden">
            <div className="flex h-full flex-col gap-4">
              <div className="surface-card shrink-0 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200/70">
                <Filter className="w-4 h-4 text-slate-700" />
                <h2 className="font-semibold text-slate-900">Шүүлтүүр ба давхарга</h2>
              </div>

              <div className="space-y-4">
                <FieldLabel icon={<Calendar className="w-3 h-3" />} text="Он" />
                <select
                  value={String(selectedYear)}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <FieldLabel icon={<Layers className="w-3 h-3" />} text="Үзүүлэлт" />
                <select
                  value={selectedIndicator}
                  onChange={(e) => setSelectedIndicator(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {indicators.map((indicator) => (
                    <option key={indicator.code} value={indicator.code}>
                      {indicator.name}
                    </option>
                  ))}
                </select>

                <FieldLabel icon={<MapIcon className="w-3 h-3" />} text="Дүрслэл" />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setViewMode("heat")}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                      viewMode === "heat" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Heat
                  </button>
                  <button
                    onClick={() => setViewMode("bubble")}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                      viewMode === "bubble" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Bubble
                  </button>
                </div>
              </div>
            </div>

              <div className="surface-card min-h-0 flex-1 rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Халуун цэгийн хүснэгт</h3>
              <div className="space-y-2 h-full overflow-auto pr-1">
                {rankedHotspots.map((spot, index) => {
                    const isActive = spot.id === selectedHotspot?.id;
                    return (
                      <button
                        key={spot.id}
                        onClick={() => setSelectedHotspotId(spot.id)}
                        className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                          isActive
                            ? "border-teal-300 bg-teal-50/80"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{index + 1}. {spot.name}</p>
                            <p className="text-xs text-slate-500">{spot.risk} эрсдэл</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">{spot.count}</p>
                            <p className="text-xs text-teal-700 font-semibold">{spot.trend}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

              <div className="shrink-0 rounded-2xl border border-amber-200 bg-amber-50/85 p-4">
              <div className="flex gap-3">
                <Info className="w-4.5 h-4.5 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-amber-800">
                  Энэ зураглал нь зөвхөн аймаг, нийслэлийн түвшний агрегат snapshot ашиглана.
                  Хувь хүн танигдахуйц мэдээлэл агуулаагүй.
                </p>
              </div>
            </div>
            </div>
          </aside>

          <div className="min-h-0 overflow-hidden">
            <div className="flex h-full flex-col gap-4">
              <div className="surface-card min-h-0 flex-1 rounded-2xl overflow-hidden border-slate-200/90">
                <div className="relative h-full min-h-0 map-grid">
                  <MapWrapper
                    data={mapData}
                    mode={viewMode}
                    selectedPoint={selectedHotspot}
                    spotlightPoint={ulaanbaatarSpotlight}
                  />

                  <div className="absolute left-4 top-4 rounded-xl bg-white/90 backdrop-blur px-3 py-2 border border-slate-200 shadow-sm">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Selected Hotspot</p>
                    <p className="text-sm font-bold text-slate-900">{selectedHotspot?.name ?? "..."}</p>
                    <p className="text-xs text-slate-600">
                      {selectedHotspot ? `${selectedHotspot.count} тохиолдол • ${selectedHotspot.trend}` : "Мэдээлэл алга"}
                    </p>
                  </div>

                  <div className="absolute right-4 top-4 rounded-xl bg-slate-900/90 text-white px-3 py-2.5 border border-slate-700/60">
                    <p className="text-[11px] uppercase tracking-wide text-slate-300">Layer</p>
                    <p className="text-sm font-semibold">{viewMode === "heat" ? "Heat Intensity" : "Bubble Density"}</p>
                  </div>

                  <div className="absolute right-4 bottom-4 rounded-2xl border border-amber-300/70 bg-amber-50/92 px-4 py-3 shadow-sm max-w-[260px]">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-amber-700 mb-1">Ulaanbaatar Focus</p>
                    <p className="text-sm font-semibold text-slate-900">{ulaanbaatarSpotlight?.count.toLocaleString() ?? "-"} тохиолдол</p>
                    <p className="text-xs text-slate-600 mt-1">Хотын цэг байнгын spotlight-тай бөгөөд сонгогдоогүй үед default focus болно.</p>
                  </div>
                </div>
              </div>

              <div className="grid shrink-0 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="surface-card rounded-2xl border-slate-200/90 bg-white/80 px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <CircleDot className="w-4 h-4 text-teal-700" />
                      <p className="text-sm text-slate-600">Сүүлд шинэчлэгдсэн: <strong className="text-slate-900">{formatDate(snapshot.updated)}</strong></p>
                    </div>
                    <p className="text-xs text-slate-500">Эх сурвалж: {snapshot.source} • {snapshot.tableId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <LegendSwatch color="bg-red-600" label="Өндөр" />
                  <LegendSwatch color="bg-amber-500" label="Дунд" />
                  <LegendSwatch color="bg-sky-500" label="Бага" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
      <span className="inline-flex items-center gap-1.5">{icon}{text}</span>
    </label>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/85 px-3 py-2.5 flex items-center justify-center gap-2">
      <span className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-xs font-medium text-slate-700">{label}</span>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="surface-card rounded-2xl px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
        {icon}
      </div>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
