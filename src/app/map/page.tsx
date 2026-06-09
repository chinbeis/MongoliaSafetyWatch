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
  Search,
  Crosshair,
  X,
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
  const [regionQuery, setRegionQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "error">("idle");

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

  const visibleHotspots = useMemo(() => {
    const query = regionQuery.trim().toLowerCase();
    if (!query) {
      return rankedHotspots;
    }
    return rankedHotspots.filter((spot) => spot.name.toLowerCase().includes(query));
  }, [rankedHotspots, regionQuery]);

  const nearestRegion = useMemo(() => {
    if (!userLocation) {
      return null;
    }
    let nearest: (typeof mapData)[number] | null = null;
    let bestKm = Infinity;
    for (const spot of mapData) {
      const km = haversineKm(userLocation.lat, userLocation.lng, spot.lat, spot.lng);
      if (km < bestKm) {
        bestKm = km;
        nearest = spot;
      }
    }
    return nearest ? { spot: nearest, distanceKm: bestKm } : null;
  }, [mapData, userLocation]);

  function locateUser() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(location);
        setGeoStatus("idle");
        let nearestId: string | null = null;
        let bestKm = Infinity;
        for (const spot of mapData) {
          const km = haversineKm(location.lat, location.lng, spot.lat, spot.lng);
          if (km < bestKm) {
            bestKm = km;
            nearestId = spot.id;
          }
        }
        if (nearestId) {
          setSelectedHotspotId(nearestId);
        }
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }

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
          <MetricCard label="Улсын дүн" value={nationalTotal.toLocaleString()} icon={<Flame className="w-4 h-4 text-red-400" />} />
          <MetricCard label="Улаанбаатар" value={ulaanbaatarSpotlight?.count.toLocaleString() ?? "-"} icon={<Building2 className="w-4 h-4 text-amber-400" />} />
          <MetricCard label="Хотын эзлэх хувь" value={ulaanbaatarShare} icon={<Activity className="w-4 h-4 text-teal-300" />} />
          <MetricCard label="УБ байрлал" value={ulaanbaatarRank} icon={<MapIcon className="w-4 h-4 text-sky-400" />} />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="min-h-0 overflow-hidden">
            <div className="flex h-full flex-col gap-4">
              <div className="surface-card shrink-0 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
                <Filter className="w-4 h-4 text-slate-300" />
                <h2 className="font-semibold text-slate-50">Шүүлтүүр ба давхарга</h2>
              </div>

              <div className="space-y-4">
                <FieldLabel icon={<Calendar className="w-3 h-3" />} text="Он" />
                <select
                  value={String(selectedYear)}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {years.map((year) => (
                    <option key={year} value={year} className="bg-slate-900">
                      {year}
                    </option>
                  ))}
                </select>

                <FieldLabel icon={<Layers className="w-3 h-3" />} text="Үзүүлэлт" />
                <select
                  value={selectedIndicator}
                  onChange={(e) => setSelectedIndicator(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {indicators.map((indicator) => (
                    <option key={indicator.code} value={indicator.code} className="bg-slate-900">
                      {indicator.name}
                    </option>
                  ))}
                </select>

                <FieldLabel icon={<MapIcon className="w-3 h-3" />} text="Дүрслэл" />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setViewMode("heat")}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                      viewMode === "heat" ? "bg-teal-500 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    Дулаан
                  </button>
                  <button
                    onClick={() => setViewMode("bubble")}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                      viewMode === "bubble" ? "bg-teal-500 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    Бөмбөлөг
                  </button>
                </div>
              </div>
            </div>

              <div className="surface-card flex min-h-0 flex-1 flex-col rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 shrink-0">Халуун цэгийн хүснэгт</h3>

              <div className="shrink-0 space-y-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={regionQuery}
                    onChange={(event) => setRegionQuery(event.target.value)}
                    placeholder="Бүс хайх..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-9 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {regionQuery ? (
                    <button
                      type="button"
                      onClick={() => setRegionQuery("")}
                      aria-label="Хайлт цэвэрлэх"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={locateUser}
                  disabled={geoStatus === "loading"}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-sm font-semibold text-teal-300 transition-colors hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Crosshair className="h-4 w-4" />
                  {geoStatus === "loading" ? "Байршил тогтоож байна..." : "Миний ойролцоо"}
                </button>

                {geoStatus === "error" ? (
                  <p className="text-xs text-red-400">Байршлыг тогтоож чадсангүй. Хөтчийн зөвшөөрлөө шалгана уу.</p>
                ) : null}

                {nearestRegion ? (
                  <div className="rounded-xl border border-teal-500/20 bg-teal-500/10 px-3 py-2 text-xs text-teal-300">
                    Хамгийн ойр бүс: <strong>{nearestRegion.spot.name}</strong> · ~{nearestRegion.distanceKm.toFixed(0)} км
                  </div>
                ) : null}
              </div>

              <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-auto pr-1">
                {visibleHotspots.length === 0 ? (
                  <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-center text-xs text-slate-400">
                    “{regionQuery}” гэсэн бүс олдсонгүй.
                  </p>
                ) : (
                  visibleHotspots.map((spot) => {
                    const rank = rankedHotspots.findIndex((item) => item.id === spot.id) + 1;
                    const isActive = spot.id === selectedHotspot?.id;
                    return (
                      <button
                        key={spot.id}
                        onClick={() => setSelectedHotspotId(spot.id)}
                        className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                          isActive
                            ? "border-teal-500/40 bg-teal-500/10"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-100">{rank}. {spot.name}</p>
                            <p className="text-xs text-slate-400">{spot.risk} эрсдэл</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-50">{spot.count}</p>
                            <p className="text-xs text-teal-300 font-semibold">{spot.trend}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

              <div className="shrink-0 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="flex gap-3">
                <Info className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-amber-200/90">
                  Энэ зураглал нь зөвхөн аймаг, нийслэлийн түвшний агрегат snapshot ашиглана.
                  Хувь хүн танигдахуйц мэдээлэл агуулаагүй.
                </p>
              </div>
            </div>
            </div>
          </aside>

          <div className="min-h-0 overflow-hidden">
            <div className="flex h-full flex-col gap-4">
              <div className="surface-card min-h-0 flex-1 rounded-2xl overflow-hidden border-white/5">
                <div className="relative h-full min-h-0 map-grid">
                  <MapWrapper
                    data={mapData}
                    mode={viewMode}
                    selectedPoint={selectedHotspot}
                    spotlightPoint={ulaanbaatarSpotlight}
                    userPoint={userLocation}
                  />

                  <div className="absolute left-4 top-4 rounded-xl bg-slate-950/80 backdrop-blur px-3 py-2 border border-white/10 shadow-lg">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">Сонгосон бүс</p>
                    <p className="text-sm font-bold text-slate-50">{selectedHotspot?.name ?? "..."}</p>
                    <p className="text-xs text-slate-400">
                      {selectedHotspot ? `${selectedHotspot.count} тохиолдол • ${selectedHotspot.trend}` : "Мэдээлэл алга"}
                    </p>
                  </div>

                  <div className="absolute right-4 top-4 rounded-xl bg-slate-950/80 backdrop-blur text-white px-3 py-2.5 border border-white/10">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Давхарга</p>
                    <p className="text-sm font-semibold">{viewMode === "heat" ? "Дулааны эрчим" : "Бөмбөлгийн нягтрал"}</p>
                  </div>

                  <div className="absolute right-4 bottom-4 rounded-2xl border border-amber-500/30 bg-slate-950/80 backdrop-blur px-4 py-3 shadow-lg max-w-[260px]">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300 mb-1">Улаанбаатарын анхаарал</p>
                    <p className="text-sm font-semibold text-slate-50">{ulaanbaatarSpotlight?.count.toLocaleString() ?? "-"} тохиолдол</p>
                    <p className="text-xs text-slate-400 mt-1">Хотын цэг байнгын spotlight-тай бөгөөд сонгогдоогүй үед default focus болно.</p>
                  </div>
                </div>
              </div>

              <div className="grid shrink-0 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="surface-card rounded-2xl border-white/5 px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <CircleDot className="w-4 h-4 text-teal-300" />
                      <p className="text-sm text-slate-400">Сүүлд шинэчлэгдсэн: <strong className="text-slate-100">{formatDate(snapshot.updated)}</strong></p>
                    </div>
                    <p className="text-xs text-slate-500">Эх сурвалж: {snapshot.source} • {snapshot.tableId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <LegendSwatch color="bg-red-500" label="Өндөр" />
                  <LegendSwatch color="bg-amber-400" label="Дунд" />
                  <LegendSwatch color="bg-sky-400" label="Бага" />
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
    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
      <span className="inline-flex items-center gap-1.5">{icon}{text}</span>
    </label>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 flex items-center justify-center gap-2">
      <span className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-xs font-medium text-slate-300">{label}</span>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="surface-card rounded-2xl px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
        {icon}
      </div>
      <p className="mt-1 text-2xl font-black text-slate-50">{value}</p>
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

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
