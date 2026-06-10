"use client";

import { MapWrapper } from "@/components/map/map-wrapper";
import {
  Filter,
  Map as MapIcon,
  Calendar,
  Layers,
  Flame,
  Building2,
  Activity,
  Search,
  Crosshair,
  X,
  ShieldCheck,
  Database,
  ListOrdered,
  PanelLeftClose,
  SlidersHorizontal,
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
  getYearDataMonth,
  isPartialYear,
} from "@/lib/crime-snapshot";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { LiveBadge, LiveClock, MonitorPanel } from "@/components/ui/monitor";

const years = getCrimeYears();
const indicators = getCrimeIndicators();
const snapshot = getCrimeSnapshot();

const ULAANBAATAR_REGION_ID = "5";

export default function MapPage() {
  const [selectedYear, setSelectedYear] = useState(getLatestCrimeYear());
  const [selectedIndicator, setSelectedIndicator] = useState(indicators[0]?.code ?? "");
  const [viewMode, setViewMode] = useState<"heat" | "bubble">("heat");
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>(ULAANBAATAR_REGION_ID);
  const [regionQuery, setRegionQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "error">("idle");
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

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
        deltaPercent,
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
    () => mapData.find((spot) => spot.id === ULAANBAATAR_REGION_ID || spot.name.includes("Улаанбаатар")),
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

  const selectedRank = useMemo(() => {
    if (!selectedHotspot) {
      return 0;
    }
    return rankedHotspots.findIndex((spot) => spot.id === selectedHotspot.id) + 1;
  }, [rankedHotspots, selectedHotspot]);

  const selectedShare = useMemo(() => {
    if (!selectedHotspot || nationalTotal === 0) {
      return 0;
    }
    return (selectedHotspot.count / nationalTotal) * 100;
  }, [nationalTotal, selectedHotspot]);

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
    <div className="monitor-shell relative h-[calc(100dvh-4rem)] overflow-hidden">
      {/* Map fills the whole stage */}
      <div className="absolute inset-0">
        <MapWrapper
          data={mapData}
          mode={viewMode}
          selectedPoint={selectedHotspot}
          spotlightPoint={ulaanbaatarSpotlight}
          userPoint={userLocation}
        />
      </div>

      {/* Edge vignettes so panels read against the map */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-950/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/90 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[420px] bg-gradient-to-r from-slate-950/60 to-transparent lg:block" />

      {/* Top strip: live badge + metric chips */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex flex-wrap items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
        <div className="pointer-events-auto anim-rise flex items-center gap-2">
          <LiveBadge label="Аюулгүйн монитор" />
          <span className="hidden rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 backdrop-blur sm:inline-flex">
            {selectedYear}
            {isPartialYear(selectedYear) ? ` (${getYearDataMonth(selectedYear)})` : ""} ·{" "}
            {indicators.find((item) => item.code === selectedIndicator)?.name ?? ""}
          </span>
        </div>

        <div className="pointer-events-auto flex max-w-full gap-2 overflow-x-auto pb-1">
          <MetricChip
            className="anim-rise anim-d-1"
            label="Улсын дүн"
            value={nationalTotal}
            icon={<Flame className="h-3.5 w-3.5 text-rose-400" />}
          />
          <MetricChip
            className="anim-rise anim-d-2"
            label="Улаанбаатар"
            value={ulaanbaatarSpotlight?.count ?? 0}
            icon={<Building2 className="h-3.5 w-3.5 text-amber-400" />}
          />
          <MetricChip
            className="anim-rise anim-d-3"
            label="Хотын хувь"
            value={nationalTotal > 0 ? ((ulaanbaatarSpotlight?.count ?? 0) / nationalTotal) * 100 : 0}
            format={(value) => `${value.toFixed(1)}%`}
            icon={<Activity className="h-3.5 w-3.5 text-teal-300" />}
          />
          <MetricChip
            className="anim-rise anim-d-4"
            label="Бүс нутаг"
            value={mapData.length}
            icon={<MapIcon className="h-3.5 w-3.5 text-sky-400" />}
          />
        </div>
      </div>

      {/* Left rail: filters + hotspot list */}
      <aside
        className={`absolute bottom-12 left-3 top-[4.5rem] z-30 flex w-[min(20.5rem,calc(100vw-1.5rem))] flex-col gap-3 transition-transform duration-500 sm:left-4 sm:top-16 ${
          mobilePanelOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
        }`}
      >
        <MonitorPanel
          title="Шүүлтүүр"
          icon={<Filter className="h-3.5 w-3.5" />}
          className="anim-slide-left shrink-0"
          collapsible
          trailing={
            <button
              type="button"
              onClick={() => setMobilePanelOpen(false)}
              aria-label="Самбар хаах"
              className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200 lg:hidden"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          }
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <FieldLabel icon={<Calendar className="h-3 w-3" />} text="Он" />
                <select
                  value={String(selectedYear)}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {years.map((year) => (
                    <option key={year} value={year} className="bg-slate-900">
                      {isPartialYear(year) ? `${year} (${getYearDataMonth(year)} байдлаар)` : year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel icon={<MapIcon className="h-3 w-3" />} text="Дүрслэл" />
                <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1">
                  <ModeButton active={viewMode === "heat"} onClick={() => setViewMode("heat")} label="Дулаан" />
                  <ModeButton active={viewMode === "bubble"} onClick={() => setViewMode("bubble")} label="Бөмбөлөг" />
                </div>
              </div>
            </div>

            <div>
              <FieldLabel icon={<Layers className="h-3 w-3" />} text="Үзүүлэлт" />
              <select
                value={selectedIndicator}
                onChange={(e) => setSelectedIndicator(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {indicators.map((indicator) => (
                  <option key={indicator.code} value={indicator.code} className="bg-slate-900">
                    {indicator.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={locateUser}
              disabled={geoStatus === "loading"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-sm font-semibold text-teal-300 transition-all hover:bg-teal-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Crosshair className={`h-4 w-4 ${geoStatus === "loading" ? "animate-spin" : ""}`} />
              {geoStatus === "loading" ? "Байршил тогтоож байна..." : "Миний ойролцоо"}
            </button>

            {geoStatus === "error" ? (
              <p className="text-xs text-rose-400">Байршлыг тогтоож чадсангүй. Хөтчийн зөвшөөрлөө шалгана уу.</p>
            ) : null}

            {nearestRegion ? (
              <div className="anim-rise rounded-xl border border-teal-500/20 bg-teal-500/10 px-3 py-2 text-xs text-teal-300">
                Хамгийн ойр бүс: <strong>{nearestRegion.spot.name}</strong> ·{" "}
                <span className="mono-data">~{nearestRegion.distanceKm.toFixed(0)} км</span>
              </div>
            ) : null}
          </div>
        </MonitorPanel>

        <MonitorPanel
          title="Халуун цэгүүд"
          icon={<ListOrdered className="h-3.5 w-3.5" />}
          className="anim-slide-left anim-d-2 flex min-h-0 flex-1 flex-col"
          bodyClassName="flex min-h-0 flex-1 flex-col p-3"
          trailing={
            <span className="mono-data rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-slate-400">
              {visibleHotspots.length}
            </span>
          }
        >
          <div className="relative shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={regionQuery}
              onChange={(event) => setRegionQuery(event.target.value)}
              placeholder="Бүс хайх..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-9 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {regionQuery ? (
              <button
                type="button"
                onClick={() => setRegionQuery("")}
                aria-label="Хайлт цэвэрлэх"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="mt-2.5 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
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
                    onClick={() => {
                      setSelectedHotspotId(spot.id);
                      setMobilePanelOpen(false);
                    }}
                    className={`group w-full rounded-xl border px-3 py-2 text-left transition-all duration-200 ${
                      isActive
                        ? "border-teal-500/40 bg-teal-500/10"
                        : "border-transparent bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`mono-data w-6 shrink-0 text-right text-xs ${
                            rank <= 3 ? "text-amber-300" : "text-slate-500"
                          }`}
                        >
                          {String(rank).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-100">{spot.name}</p>
                          <p className={`text-[11px] ${riskTextClass(spot.risk)}`}>{spot.risk} эрсдэл</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="mono-data text-sm font-bold text-slate-50">{spot.count.toLocaleString("mn-MN")}</p>
                        <p
                          className={`mono-data text-[11px] font-semibold ${
                            spot.deltaPercent >= 0 ? "text-rose-300" : "text-emerald-300"
                          }`}
                        >
                          {spot.trend}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </MonitorPanel>
      </aside>

      {/* Right rail: selected region detail */}
      <aside className="absolute right-3 top-[4.5rem] z-20 hidden w-72 flex-col gap-3 sm:right-4 sm:top-16 lg:flex">
        <MonitorPanel
          title="Сонгосон бүс"
          icon={<Crosshair className="h-3.5 w-3.5" />}
          className="anim-slide-right"
        >
          <div key={selectedHotspot?.id} className="anim-rise">
            <p className="text-lg font-black leading-tight text-slate-50">{selectedHotspot?.name ?? "…"}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <DetailCell label="Тохиолдол">
                <AnimatedNumber value={selectedHotspot?.count ?? 0} className="mono-data text-xl font-bold text-slate-50" />
              </DetailCell>
              <DetailCell label="Өөрчлөлт">
                <span
                  className={`mono-data text-xl font-bold ${
                    (selectedHotspot?.deltaPercent ?? 0) >= 0 ? "text-rose-300" : "text-emerald-300"
                  }`}
                >
                  {selectedHotspot?.trend ?? "–"}
                </span>
              </DetailCell>
              <DetailCell label="Улсын эзлэх хувь">
                <AnimatedNumber
                  value={selectedShare}
                  format={(value) => `${value.toFixed(1)}%`}
                  className="mono-data text-xl font-bold text-slate-50"
                />
              </DetailCell>
              <DetailCell label="Байр">
                <span className="mono-data text-xl font-bold text-slate-50">#{selectedRank || "–"}</span>
              </DetailCell>
            </div>
            <div
              className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${riskBadgeClass(
                selectedHotspot?.risk ?? ""
              )}`}
            >
              {selectedHotspot?.risk} эрсдэлийн түвшин
            </div>
            {isPartialYear(selectedYear) ? (
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                {selectedYear} он {getYearDataMonth(selectedYear)} хүртэлх өссөн дүн — өмнөх бүтэн
                жилтэй харьцуулсан өөрчлөлт.
              </p>
            ) : null}
          </div>
        </MonitorPanel>

        <MonitorPanel title="Тайлбар" icon={<Layers className="h-3.5 w-3.5" />} className="anim-slide-right anim-d-2">
          <div className="space-y-2">
            <LegendRow color="bg-rose-500" label="Өндөр эрчим" />
            <LegendRow color="bg-amber-400" label="Дунд эрчим" />
            <LegendRow color="bg-sky-400" label="Бага эрчим" />
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-300" />
            <p className="text-[11px] leading-relaxed text-slate-400">
              Зөвхөн аймаг, нийслэлийн түвшний нэгтгэсэн мэдээлэл. Хувь хүн танигдахуйц өгөгдөл байхгүй.
            </p>
          </div>
        </MonitorPanel>
      </aside>

      {/* Mobile: open the filter/list rail */}
      {!mobilePanelOpen ? (
        <button
          type="button"
          onClick={() => setMobilePanelOpen(true)}
          className="anim-rise absolute bottom-14 left-3 z-30 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/85 px-4 py-2.5 text-sm font-semibold text-slate-100 shadow-xl backdrop-blur transition-transform active:scale-95 lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4 text-teal-300" />
          Шүүлтүүр · Жагсаалт
        </button>
      ) : null}

      {/* Bottom status bar */}
      <footer className="absolute inset-x-0 bottom-0 z-30 border-t border-white/5 bg-slate-950/85 backdrop-blur-lg">
        <div className="flex h-10 items-center gap-4 overflow-x-auto px-4 text-[11px] text-slate-400">
          <span className="flex shrink-0 items-center gap-2">
            <span className="live-dot" />
            <LiveClock className="text-slate-200" />
          </span>
          <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
            <Database className="h-3 w-3" />
            {snapshot.source} · <span className="mono-data">{snapshot.tableId}</span>
          </span>
          <span className="shrink-0">
            Шинэчлэгдсэн: <span className="mono-data text-slate-300">{formatDate(snapshot.updated)}</span>
          </span>
          <span className="ml-auto hidden shrink-0 uppercase tracking-[0.16em] text-slate-500 md:block">
            Нэгтгэсэн өгөгдөл · PII байхгүй
          </span>
        </div>
      </footer>
    </div>
  );
}

function FieldLabel({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      <span className="inline-flex items-center gap-1.5">
        {icon}
        {text}
      </span>
    </label>
  );
}

function ModeButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-all duration-200 ${
        active ? "bg-teal-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

function MetricChip({
  label,
  value,
  icon,
  format,
  className = "",
}: {
  label: string;
  value: number;
  icon: ReactNode;
  format?: (value: number) => string;
  className?: string;
}) {
  return (
    <div className={`monitor-panel flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2 ${className}`}>
      {icon}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <AnimatedNumber value={value} format={format} className="mono-data text-base font-bold leading-tight text-slate-50" />
      </div>
    </div>
  );
}

function DetailCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-xs font-medium text-slate-300">{label}</span>
    </div>
  );
}

function riskTextClass(risk: string) {
  if (risk === "Өндөр") return "text-rose-400";
  if (risk === "Дунд") return "text-amber-400";
  return "text-sky-400";
}

function riskBadgeClass(risk: string) {
  if (risk === "Өндөр") return "bg-rose-500/15 text-rose-300";
  if (risk === "Дунд") return "bg-amber-500/15 text-amber-300";
  return "bg-sky-500/15 text-sky-300";
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
