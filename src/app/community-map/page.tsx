"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  ShieldAlert,
  RefreshCw,
  Flag,
  Radio,
  PenLine,
  ShieldCheck,
  PanelLeftClose,
  X,
} from "lucide-react";
import { t } from "@/lib/translations";
import { COMMUNITY_CATEGORIES } from "@/lib/community-categories";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { LiveBadge, LiveClock, MonitorPanel } from "@/components/ui/monitor";

const CommunityReportMap = dynamic(
  () => import("@/components/map/community-report-map").then((mod) => ({ default: mod.CommunityReportMap })),
  { ssr: false }
);

type CommunityReport = {
  id: string;
  category: string;
  title: string;
  details?: string | null;
  areaLabel?: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  createdAt: string;
};

type CaptchaChallenge = {
  token: string;
  prompt: string;
};

const categoryOptions = COMMUNITY_CATEGORIES;

export default function CommunityMapPage() {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [draftPoint, setDraftPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radiusMeters, setRadiusMeters] = useState(250);
  const [category, setCategory] = useState<string>(categoryOptions[0].value);
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? null,
    [reports, selectedReportId]
  );

  useEffect(() => {
    void Promise.all([loadReports(), loadCaptcha()]).finally(() => setLoading(false));
  }, []);

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

  async function loadReports() {
    const response = await fetch("/api/community-reports", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load community reports");
    }

    const data = (await response.json()) as CommunityReport[];
    setReports(data);
    setSelectedReportId((current) => current ?? data[0]?.id ?? null);
  }

  async function loadCaptcha() {
    const response = await fetch("/api/community-reports/captcha", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load captcha");
    }

    setCaptcha((await response.json()) as CaptchaChallenge);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!draftPoint) {
      setError("Газрын зураг дээр тодорхой цэг сонгоно уу.");
      return;
    }

    if (!captcha) {
      setError("Captcha ачаалагдаагүй байна.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/community-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          latitude: draftPoint.latitude,
          longitude: draftPoint.longitude,
          radiusMeters,
          captchaToken: captcha.token,
          captchaAnswer: Number(captchaAnswer),
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save report");
      }

      const created = (await response.json()) as CommunityReport;
      setReports((current) => [created, ...current].slice(0, 200));
      setSelectedReportId(created.id);
      setCaptchaAnswer("");
      setDraftPoint(null);
      setRadiusMeters(250);
      setSuccess("Тэмдэглэгээ амжилттай хадгалагдлаа.");
      await loadCaptcha();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Хадгалах үед алдаа гарлаа.");
      await loadCaptcha();
    } finally {
      setSubmitting(false);
    }
  }

  async function flagReport(id: string) {
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/community-reports/${id}/flag`, { method: "POST" });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to flag report");
      }

      const data = (await response.json()) as { hidden?: boolean };
      if (data.hidden) {
        setReports((current) => current.filter((report) => report.id !== id));
        setSelectedReportId((current) => (current === id ? null : current));
      }
      setSuccess("Тэмдэглэгээг хянуулахаар мэдэгдлээ. Баярлалаа.");
    } catch (flagError) {
      setError(flagError instanceof Error ? flagError.message : "Мэдэгдэх үед алдаа гарлаа.");
    }
  }

  const radiusProgress = ((radiusMeters - 50) / (1000 - 50)) * 100;

  return (
    <div className="monitor-shell relative h-[calc(100dvh-4rem)] overflow-hidden">
      {/* Map fills the whole stage */}
      <div className="absolute inset-0">
        <CommunityReportMap
          reports={reports}
          draftPoint={draftPoint}
          draftRadius={radiusMeters}
          selectedReportId={selectedReportId}
          onMapClick={(point) => {
            setDraftPoint(point);
            setMobilePanelOpen(true);
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-950/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/90 to-transparent" />

      {/* Top strip */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex flex-wrap items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
        <div className="pointer-events-auto anim-rise flex items-center gap-2">
          <LiveBadge label={t.communityMap} tone="amber" />
          <span className="hidden rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 backdrop-blur sm:inline-flex">
            Аноним · Бүсийн түвшин
          </span>
        </div>

        <div className="pointer-events-auto flex max-w-full gap-2 overflow-x-auto pb-1">
          <div className="monitor-panel anim-rise anim-d-1 flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2">
            <MapPin className="h-3.5 w-3.5 text-teal-300" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Нийт тэмдэглэгээ</p>
              <AnimatedNumber value={reports.length} className="mono-data text-base font-bold leading-tight text-slate-50" />
            </div>
          </div>
          <div className="monitor-panel anim-rise anim-d-2 flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Сонгосон радиус</p>
              <p className="mono-data text-base font-bold leading-tight text-slate-50">{radiusMeters}м</p>
            </div>
          </div>
        </div>
      </div>

      {/* Left rail: report form */}
      <aside
        className={`absolute bottom-12 left-3 top-[4.5rem] z-30 flex w-[min(20.5rem,calc(100vw-1.5rem))] flex-col transition-transform duration-500 sm:left-4 sm:top-16 ${
          mobilePanelOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
        }`}
      >
        <MonitorPanel
          title="Аноним тэмдэглэгээ"
          icon={<PenLine className="h-3.5 w-3.5" />}
          className="anim-slide-left flex min-h-0 flex-col"
          bodyClassName="min-h-0 overflow-y-auto p-4"
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs leading-relaxed text-slate-400">
              Газрын зураг дээр товшиж цэг сонгоод, бүсийн радиус болон ангилал тэмдэглэнэ. Текст, нэр, хаяг оруулахгүй.
            </p>

            <Field label="Төрөл">
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-900">
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Радиус">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={50}
                  max={1000}
                  step={25}
                  value={radiusMeters}
                  onChange={(event) => setRadiusMeters(Number(event.target.value))}
                  className="range-premium flex-1"
                  style={{ "--range-progress": `${radiusProgress}%` } as React.CSSProperties}
                />
                <span className="mono-data w-14 shrink-0 text-right text-sm font-bold text-teal-300">{radiusMeters}м</span>
              </div>
            </Field>

            <Field label="Хүний шалгалт">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <span className="mono-data text-sm font-semibold text-slate-200">
                    {captcha?.prompt ?? "Ачаалж байна..."}
                  </span>
                  <button
                    type="button"
                    onClick={() => void loadCaptcha()}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-300 transition-colors hover:text-teal-200"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Дахин
                  </button>
                </div>
                <input
                  value={captchaAnswer}
                  onChange={(event) => setCaptchaAnswer(event.target.value)}
                  inputMode="numeric"
                  placeholder="Хариу"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </Field>

            {draftPoint ? (
              <div className="anim-rise flex items-center justify-between gap-2 rounded-xl border border-teal-500/20 bg-teal-500/10 px-3 py-2 text-xs text-teal-300">
                <span className="mono-data">
                  {draftPoint.latitude.toFixed(5)}, {draftPoint.longitude.toFixed(5)}
                </span>
                <button
                  type="button"
                  onClick={() => setDraftPoint(null)}
                  aria-label="Цэг арилгах"
                  className="rounded p-0.5 transition-colors hover:text-teal-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                Газрын зураг дээр товшиж pin сонгоно уу.
              </div>
            )}

            {error ? (
              <div className="anim-rise rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="anim-rise rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting || !captcha}
              className="w-full rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-teal-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
            >
              {submitting ? "Хадгалж байна..." : "Аноним тэмдэглэгээ хадгалах"}
            </button>

            <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-300" />
              <p className="text-[11px] leading-relaxed text-slate-400">
                Тэмдэглэгээ бүрэн аноним. Хувийн нэр, утас, хаяг хадгалагдахгүй.
              </p>
            </div>
          </form>
        </MonitorPanel>
      </aside>

      {/* Right rail: live feed */}
      <aside className="absolute bottom-12 right-3 top-[4.5rem] z-20 hidden w-72 flex-col sm:right-4 sm:top-16 lg:flex">
        <MonitorPanel
          title="Шууд урсгал"
          icon={<Radio className="h-3.5 w-3.5" />}
          className="anim-slide-right flex min-h-0 max-h-full flex-col"
          bodyClassName="flex min-h-0 flex-1 flex-col p-3"
          trailing={
            <span className="mono-data rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-slate-400">
              {loading ? "…" : reports.length}
            </span>
          }
        >
          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
            {loading ? (
              <FeedSkeleton />
            ) : reports.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-center text-xs text-slate-400">
                Одоогоор тэмдэглэгээ алга. Эхний pin-г та үлдээгээрэй.
              </p>
            ) : (
              reports.slice(0, 30).map((report, index) => {
                const isActive = report.id === selectedReport?.id;
                return (
                  <div
                    key={report.id}
                    className={`anim-rise group flex items-start justify-between gap-2 rounded-xl border px-3 py-2 transition-all duration-200 ${
                      isActive
                        ? "border-teal-500/40 bg-teal-500/10"
                        : "border-transparent bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.07]"
                    }`}
                    style={index < 6 ? { animationDelay: `${index * 0.05}s` } : undefined}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedReportId(report.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-semibold text-slate-100">{report.title}</p>
                      <p className="mono-data mt-0.5 text-[11px] text-slate-500">
                        {formatFeedTime(report.createdAt)} · {report.radiusMeters}м
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => void flagReport(report.id)}
                      title="Зохисгүй гэж мэдэгдэх"
                      aria-label="Зохисгүй гэж мэдэгдэх"
                      className="shrink-0 rounded-lg p-1.5 text-slate-600 opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </MonitorPanel>
      </aside>

      {/* Mobile: open form rail */}
      {!mobilePanelOpen ? (
        <button
          type="button"
          onClick={() => setMobilePanelOpen(true)}
          className="anim-rise absolute bottom-14 left-3 z-30 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/85 px-4 py-2.5 text-sm font-semibold text-slate-100 shadow-xl backdrop-blur transition-transform active:scale-95 lg:hidden"
        >
          <PenLine className="h-4 w-4 text-teal-300" />
          Тэмдэглэгээ үлдээх
        </button>
      ) : null}

      {/* Bottom status bar */}
      <footer className="absolute inset-x-0 bottom-0 z-30 border-t border-white/5 bg-slate-950/85 backdrop-blur-lg">
        <div className="flex h-10 items-center gap-4 overflow-x-auto px-4 text-[11px] text-slate-400">
          <span className="flex shrink-0 items-center gap-2">
            <span className="live-dot live-dot--amber" />
            <LiveClock className="text-slate-200" />
          </span>
          <span className="shrink-0">
            Иргэдийн оруулсан · <span className="mono-data text-slate-300">{reports.length}</span> тэмдэглэгээ
          </span>
          <span className="ml-auto hidden shrink-0 uppercase tracking-[0.16em] text-slate-500 md:block">
            Аноним · PII хадгалагдахгүй
          </span>
        </div>
      </footer>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="rounded-xl bg-white/[0.03] px-3 py-2">
          <div className="skeleton-line h-3.5 w-3/4" />
          <div className="skeleton-line mt-1.5 h-2.5 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function formatFeedTime(value: string) {
  const created = new Date(value);
  const diffMs = Date.now() - created.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Дөнгөж сая";
  if (diffMinutes < 60) return `${diffMinutes} мин өмнө`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} цаг өмнө`;
  return created.toLocaleDateString("mn-MN", { month: "2-digit", day: "2-digit" });
}
