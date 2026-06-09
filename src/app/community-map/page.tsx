"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, MapPin, ShieldAlert, ScanSearch, RefreshCw, Flag } from "lucide-react";
import { t } from "@/lib/translations";
import { COMMUNITY_CATEGORIES } from "@/lib/community-categories";
import { StatCard } from "@/components/ui/stat-card";

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

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? null,
    [reports, selectedReportId]
  );

  useEffect(() => {
    void Promise.all([loadReports(), loadCaptcha()]).finally(() => setLoading(false));
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

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-5 py-6">
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <StatCard icon={<MapPin className="w-4 h-4 text-teal-300" />} label="Нийт тэмдэглэгээ" value={String(reports.length)} />
          <StatCard icon={<ShieldAlert className="w-4 h-4 text-red-400" />} label="Сонгосон радиус" value={`${radiusMeters}м`} />
          <StatCard icon={<ScanSearch className="w-4 h-4 text-sky-400" />} label="Сонгосон цэг" value={draftPoint ? "Бэлэн" : "Сонгоогүй"} />
          <StatCard icon={<AlertTriangle className="w-4 h-4 text-amber-400" />} label="Шалгалт" value={captcha ? "Идэвхтэй" : "Ачаалж байна"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
            <form onSubmit={handleSubmit} className="surface-card rounded-2xl p-5 space-y-4">
              <div>
                <h1 className="text-xl font-black text-slate-50">{t.communityMap}</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Газрын зураг дээр товшоод pin болон area radius тэмдэглэнэ. Текст оруулахгүй, зөвхөн ангилал сонгоно.
                </p>
              </div>

              <Field label="Төрөл">
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={`Радиус: ${radiusMeters}м`}>
                <input
                  type="range"
                  min={50}
                  max={1000}
                  step={25}
                  value={radiusMeters}
                  onChange={(event) => setRadiusMeters(Number(event.target.value))}
                  className="w-full accent-teal-400"
                />
              </Field>

              <Field label="Хүний шалгалт">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                    <span className="text-sm font-semibold text-slate-200">{captcha?.prompt ?? "Ачаалж байна..."}</span>
                    <button
                      type="button"
                      onClick={() => void loadCaptcha()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-300"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
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
                <div className="rounded-xl border border-teal-500/20 bg-teal-500/10 px-3 py-2 text-xs text-teal-300">
                  Pin: {draftPoint.latitude.toFixed(5)}, {draftPoint.longitude.toFixed(5)}
                </div>
              ) : (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                  Газрын зураг дээр товшиж pin сонгоно уу.
                </div>
              )}

              {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div> : null}
              {success ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{success}</div> : null}

              <button
                type="submit"
                disabled={submitting || !captcha}
                className="w-full rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
              >
                {submitting ? "Хадгалж байна..." : "Аноним тэмдэглэгээ хадгалах"}
              </button>
            </form>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-200/90">
              Энэ хуудас нь иргэдийн оруулсан pin-үүдийг илүү нарийвчилсан байдлаар харуулна. Хувийн нэр, утас, хаяг бичихгүй.
            </div>
          </aside>

          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            <div className="surface-card rounded-2xl overflow-hidden border-white/5">
              <div className="relative h-[580px] sm:h-[720px] map-grid">
                <CommunityReportMap
                  reports={reports}
                  draftPoint={draftPoint}
                  draftRadius={radiusMeters}
                  selectedReportId={selectedReportId}
                  onMapClick={setDraftPoint}
                />
                <div className="absolute left-4 top-4 rounded-xl bg-slate-950/80 backdrop-blur px-3 py-2 border border-white/10 shadow-lg">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">Иргэдийн тэмдэглэгээ</p>
                  <p className="text-sm font-bold text-slate-50">Цэг + бүсийн радиус</p>
                  <p className="text-xs text-slate-400">Газрын зураг дээр товшиж цэг болон радиусыг тэмдэглэнэ.</p>
                </div>
              </div>
            </div>

            <div className="surface-card rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Сүүлийн тэмдэглэгээнүүд</h2>
                <span className="text-xs text-slate-500">{loading ? "Ачаалж байна..." : `${reports.length} нийт`}</span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {reports.slice(0, 8).map((report) => {
                  const isActive = report.id === selectedReport?.id;
                  return (
                    <div
                      key={report.id}
                      className={`flex items-start justify-between gap-2 rounded-xl border px-4 py-3 transition-colors ${
                        isActive ? "border-teal-500/40 bg-teal-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedReportId(report.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-sm font-semibold text-slate-100">{report.title}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(report.createdAt).toLocaleString("mn-MN")} · {report.radiusMeters}м
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => void flagReport(report.id)}
                        title="Зохисгүй гэж мэдэгдэх"
                        aria-label="Зохисгүй гэж мэдэгдэх"
                        className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Flag className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  );
}

