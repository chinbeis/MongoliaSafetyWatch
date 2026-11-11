"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Flag,
  Info,
  List,
  MapPin,
  PenLine,
  Phone,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { t, type ApiErrorCode } from "@/lib/translations";
import {
  COMMUNITY_CATEGORIES,
  REPORT_FADE_AFTER_DAYS,
  getCategoryColor,
  getCategoryLabel,
  type CommunityCategory,
  type PublicCommunityReport,
} from "@/lib/community-categories";
import { DEFAULT_RADIUS_M, MAX_RADIUS_M, MIN_RADIUS_M, RADIUS_STEP_M, snapToGrid } from "@/lib/geo-privacy";
import { ageInDays, formatRelativeAge } from "@/lib/relative-time";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { LiveBadge, MonitorPanel } from "@/components/ui/monitor";
import { MapAttribution } from "@/components/map/map-attribution";
import { TurnstileWidget } from "@/components/community/turnstile-widget";
import { useMediaQuery } from "@/lib/use-media-query";
import { useBrowserStorage, writeBrowserStorage } from "@/lib/use-browser-storage";

const CommunityReportMap = dynamic(
  () => import("@/components/map/community-report-map").then((mod) => ({ default: mod.CommunityReportMap })),
  { ssr: false },
);

type Challenge =
  | { readonly: true }
  | { readonly: false; mode: "turnstile"; siteKey: string }
  | { readonly: false; mode: "math"; token: string; prompt: string };

type ApiErrorBody = { error?: ApiErrorCode; message?: string };

const REFRESH_INTERVAL_MS = 60_000;
const EXPLAINER_STORAGE_KEY = "community-map-explainer-v1";

async function fetchReports(): Promise<PublicCommunityReport[] | null> {
  try {
    const response = await fetch("/api/community-reports");
    if (!response.ok) return null;
    return ((await response.json()) as { reports: PublicCommunityReport[] }).reports;
  } catch {
    return null;
  }
}

async function fetchChallenge(): Promise<Challenge | null> {
  try {
    const response = await fetch("/api/community-reports/challenge", { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as Challenge;
  } catch {
    return null;
  }
}

async function readError(response: Response) {
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
  return body.message ?? t.apiErrors.server_error;
}

export default function CommunityMapPage() {
  const [reports, setReports] = useState<PublicCommunityReport[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<CommunityCategory>>(
    () => new Set(COMMUNITY_CATEGORIES.map((category) => category.value)),
  );

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [challengeFailed, setChallengeFailed] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const [rawPoint, setRawPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radiusMeters, setRadiusMeters] = useState(DEFAULT_RADIUS_M);
  const [category, setCategory] = useState<CommunityCategory>(COMMUNITY_CATEGORIES[0].value);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const [sheet, setSheet] = useState<{ open: boolean; tab: "create" | "feed" }>({ open: false, tab: "create" });
  const [flagTargetId, setFlagTargetId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // Only one layout is mounted at a time, so the human-check widget exists once.
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // The server snaps to the same grid; previewing it here keeps the UI honest.
  const draftPoint = useMemo(() => (rawPoint ? snapToGrid(rawPoint.latitude, rawPoint.longitude) : null), [rawPoint]);

  const visibleReports = useMemo(
    () => reports.filter((report) => activeCategories.has(report.category)),
    [reports, activeCategories],
  );

  const applyReports = useCallback((data: PublicCommunityReport[] | null) => {
    if (!data) {
      setLoadState((current) => (current === "ready" ? "ready" : "error"));
      return;
    }
    setReports((current) => {
      // Keep pins this visitor just created even if the CDN copy is older.
      const fresh = new Map(data.map((report) => [report.id, report]));
      for (const report of current) {
        if (!fresh.has(report.id) && ageInDays(report.createdAt) < 1 / 24) {
          fresh.set(report.id, report);
        }
      }
      return Array.from(fresh.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
    setLoadState("ready");
  }, []);

  const applyChallenge = useCallback((data: Challenge | null) => {
    if (!data) {
      setChallengeFailed(true);
      return;
    }
    setChallenge(data);
    setChallengeFailed(false);
    setCaptchaAnswer("");
  }, []);

  const loadReports = useCallback(() => fetchReports().then(applyReports), [applyReports]);
  const loadChallenge = useCallback(() => fetchChallenge().then(applyChallenge), [applyChallenge]);

  useEffect(() => {
    void fetchReports().then(applyReports);
    void fetchChallenge().then(applyChallenge);
  }, [applyReports, applyChallenge]);

  // Refresh every 60 s while the tab is visible, and on returning to it.
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void loadReports();
    }, REFRESH_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadReports();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadReports]);

  const explainerSeen = useBrowserStorage("local", EXPLAINER_STORAGE_KEY);
  const [explainerDismissed, setExplainerDismissed] = useState(false);
  const explainerOpen = explainerSeen === null && !explainerDismissed;

  function dismissExplainer() {
    setExplainerDismissed(true);
    writeBrowserStorage("local", EXPLAINER_STORAGE_KEY, "1");
  }

  function toggleCategory(value: CommunityCategory) {
    setActiveCategories((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next.size === 0 ? new Set(COMMUNITY_CATEGORIES.map((c) => c.value)) : next;
    });
  }

  const readonly = challenge?.readonly === true;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if (!rawPoint) {
      setNotice({ tone: "error", text: t.community.selectAreaFirst });
      return;
    }
    if (!challenge || challenge.readonly) return;

    const human =
      challenge.mode === "turnstile"
        ? { turnstileToken: turnstileToken ?? undefined }
        : { captchaToken: challenge.token, captchaAnswer: Number.parseInt(captchaAnswer, 10) };

    setSubmitting(true);
    try {
      const response = await fetch("/api/community-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          latitude: rawPoint.latitude,
          longitude: rawPoint.longitude,
          radiusMeters,
          ...human,
        }),
      });

      if (!response.ok) {
        setNotice({ tone: "error", text: await readError(response) });
        return;
      }

      const { report } = (await response.json()) as { report: PublicCommunityReport };
      setReports((current) => [report, ...current.filter((item) => item.id !== report.id)]);
      setActiveCategories((current) => new Set(current).add(report.category));
      setSelectedReportId(report.id);
      setRawPoint(null);
      setRadiusMeters(DEFAULT_RADIUS_M);
      setNotice({ tone: "success", text: t.community.saved });
    } catch {
      setNotice({ tone: "error", text: t.apiErrors.server_error });
    } finally {
      setSubmitting(false);
      // Every check is single-use: fetch a fresh one whatever happened.
      setTurnstileToken(null);
      setTurnstileResetKey((key) => key + 1);
      if (challenge.mode === "math") void loadChallenge();
    }
  }

  const removeReport = useCallback((id: string) => {
    setReports((current) => current.filter((report) => report.id !== id));
    setSelectedReportId((current) => (current === id ? null : current));
  }, []);

  const rails = isDesktop ? { left: 352, right: 312, bottom: 0 } : { left: 0, right: 0, bottom: 0 };

  return (
    <div className="monitor-shell relative h-[calc(100dvh-4rem)] overflow-hidden">
      {/* Map stage. On small screens it stops above the collapsed bottom sheet. */}
      <div className="absolute inset-x-0 top-0 bottom-14 lg:bottom-10">
        <CommunityReportMap
          reports={visibleReports}
          draftPoint={draftPoint}
          draftRadius={radiusMeters}
          selectedReportId={selectedReportId}
          onMapClick={(point) => {
            if (readonly) return;
            setRawPoint(point);
            setNotice(null);
            setSheet({ open: true, tab: "create" });
          }}
          onSelectReport={setSelectedReportId}
          onFlagRequest={readonly ? undefined : setFlagTargetId}
          padding={rails}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-slate-950/80 to-transparent" />
      <MapAttribution className="absolute bottom-[3.75rem] left-3 z-20 max-w-[70%] lg:bottom-12 lg:left-[22.5rem]" />

      {/* Top strip: badge, count, category filters, and the emergency notice */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex flex-col gap-2 sm:inset-x-4 sm:top-4 lg:left-[22.5rem] lg:right-[20.5rem]">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <LiveBadge label={t.community.pageBadge} tone="amber" />
          <span className="monitor-panel inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] text-slate-300">
            <MapPin className="h-3.5 w-3.5 text-teal-300" aria-hidden />
            {t.community.total}: <AnimatedNumber value={reports.length} className="mono-data font-bold text-slate-50" />
          </span>
        </div>

        <div
          className="pointer-events-auto -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
          role="group"
          aria-label={t.community.legend}
        >
          {COMMUNITY_CATEGORIES.map((item) => {
            const active = activeCategories.has(item.value);
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => toggleCategory(item.value)}
                aria-pressed={active}
                className={`monitor-panel inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full px-3 text-xs font-semibold transition-opacity ${
                  active ? "text-slate-100" : "text-slate-400 opacity-60"
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} aria-hidden />
                {item.label}
              </button>
            );
          })}
        </div>

        <Link
          href="/report"
          className="pointer-events-auto flex w-fit max-w-full items-center gap-2 rounded-xl border border-amber-400/20 bg-slate-950/85 px-3 py-2 text-xs text-amber-100 backdrop-blur hover:border-amber-300/40"
        >
          <Phone className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden />
          <span className="sm:hidden">{t.community.notReportingShort}</span>
          <span className="hidden sm:inline">{t.community.notReportingChannel}</span>
          <span className="shrink-0 font-semibold text-amber-300 underline underline-offset-2">
            {t.community.officialChannels}
          </span>
        </Link>
      </div>

      {isDesktop ? (
        <>
          {/* Desktop: left rail form */}
          <aside className="absolute bottom-14 left-4 top-4 z-30 flex w-[20.5rem] flex-col">
            <MonitorPanel
              title={t.community.formTitle}
              icon={<PenLine className="h-3.5 w-3.5" />}
              className="anim-slide-left flex min-h-0 flex-col"
              bodyClassName="min-h-0 overflow-y-auto p-4"
            >
              {renderReportForm()}
            </MonitorPanel>
          </aside>

          {/* Desktop: right rail feed */}
          <aside className="absolute bottom-14 right-4 top-4 z-20 flex w-72 flex-col">
            <MonitorPanel
              title={t.community.feedTitle}
              icon={<List className="h-3.5 w-3.5" />}
              className="anim-slide-right flex min-h-0 max-h-full flex-col"
              bodyClassName="flex min-h-0 flex-1 flex-col p-3"
              trailing={
                <span className="mono-data rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-slate-400">
                  {loadState === "loading" ? "…" : visibleReports.length}
                </span>
              }
            >
              {renderFeed()}
            </MonitorPanel>
          </aside>
        </>
      ) : (
        /* Mobile: bottom sheet with two tabs */
        <section
          className={`absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-2xl border-t border-white/10 bg-slate-950/95 backdrop-blur-lg transition-[max-height] duration-300 ${
            sheet.open ? "max-h-[70dvh]" : "max-h-14"
          }`}
          aria-label={t.community.pageBadge}
        >
          <div className="flex h-14 shrink-0 items-center gap-1 px-2">
            <div className="flex min-w-0 items-center gap-1" role="tablist">
              <SheetTab
                active={sheet.tab === "create"}
                onClick={() => setSheet({ open: true, tab: "create" })}
                icon={<PenLine className="h-4 w-4" />}
                label={t.community.tabCreate}
              />
              <SheetTab
                active={sheet.tab === "feed"}
                onClick={() => setSheet({ open: true, tab: "feed" })}
                icon={<List className="h-4 w-4" />}
                label={t.community.tabFeed}
                count={visibleReports.length}
              />
            </div>
            <button
              type="button"
              onClick={() => setSheet((current) => ({ ...current, open: !current.open }))}
              aria-label={sheet.open ? t.community.closePanel : t.community.openPanel}
              aria-expanded={sheet.open}
              className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-300 hover:bg-white/5"
            >
              {sheet.open ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </button>
          </div>
          {sheet.open ? (
            <div className="min-h-0 flex-1 overflow-y-auto border-t border-white/5 p-4 pb-6" role="tabpanel">
              {sheet.tab === "create" ? renderReportForm() : renderFeed(() => setSheet((s) => ({ ...s, open: false })))}
            </div>
          ) : null}
        </section>
      )}

      {/* Desktop status bar */}
      <footer className="absolute inset-x-0 bottom-0 z-30 hidden border-t border-white/5 bg-slate-950/85 backdrop-blur-lg lg:block">
        <div className="flex h-10 items-center gap-4 overflow-x-auto px-4 text-[11px] text-slate-400">
          <span className="flex shrink-0 items-center gap-2">
            <span className="live-dot live-dot--amber" />
            {t.community.statusBar}
          </span>
          <span className="ml-auto hidden shrink-0 text-slate-400 md:block">{t.community.areaPrivacyNote}</span>
        </div>
      </footer>

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 bottom-20 z-40 flex justify-center px-4 lg:bottom-16"
      >
        {toast ? (
          <p className="anim-rise rounded-xl border border-emerald-500/20 bg-slate-950/95 px-4 py-2.5 text-sm text-emerald-200 shadow-xl">
            {toast}
          </p>
        ) : null}
      </div>

      {explainerOpen ? <Explainer onClose={dismissExplainer} /> : null}

      {flagTargetId ? (
        <FlagDialog
          reportId={flagTargetId}
          challenge={challenge}
          onClose={() => setFlagTargetId(null)}
          onDone={(hidden) => {
            if (hidden) removeReport(flagTargetId);
            setFlagTargetId(null);
            setToast(t.community.flagSent);
            window.setTimeout(() => setToast(null), 5000);
          }}
        />
      ) : null}
    </div>
  );

  // Rendered in both the desktop rail and the mobile sheet. Called as plain
  // functions (not mounted as components) so inputs keep focus across renders.
  function renderReportForm() {
    if (readonly) {
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-xs leading-relaxed text-sky-200">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {t.community.readonlyNotice}
          </div>
          {renderNotice()}
        </div>
      );
    }

    const radiusProgress = ((radiusMeters - MIN_RADIUS_M) / (MAX_RADIUS_M - MIN_RADIUS_M)) * 100;

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs leading-relaxed text-slate-400">{t.community.formIntro}</p>

        {draftPoint ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-teal-500/20 bg-teal-500/10 px-3 py-2 text-xs text-teal-200">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {t.community.areaSelected}
            </span>
            <button
              type="button"
              onClick={() => setRawPoint(null)}
              aria-label={t.community.clearArea}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
            {t.community.areaHint}
          </div>
        )}

        <label className="block">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {t.community.category}
          </span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as CommunityCategory)}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {COMMUNITY_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-900">
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {t.community.radius}
          </span>
          <span className="flex items-center gap-3">
            <input
              type="range"
              min={MIN_RADIUS_M}
              max={MAX_RADIUS_M}
              step={RADIUS_STEP_M}
              value={radiusMeters}
              onChange={(event) => setRadiusMeters(Number(event.target.value))}
              className="range-premium h-11 flex-1"
              style={{ "--range-progress": `${radiusProgress}%` } as React.CSSProperties}
            />
            <span className="mono-data w-16 shrink-0 text-right text-sm font-bold text-teal-300">{radiusMeters} м</span>
          </span>
        </label>

        <fieldset>
          <legend className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {t.community.humanCheck}
          </legend>
          {challengeFailed ? (
            <p className="text-xs text-amber-300">{t.community.humanCheckUnavailable}</p>
          ) : !challenge || challenge.readonly ? (
            <p className="text-xs text-slate-400">{t.community.humanCheckLoading}</p>
          ) : challenge.mode === "turnstile" ? (
            <TurnstileWidget
              siteKey={challenge.siteKey}
              action="community-create"
              resetKey={turnstileResetKey}
              onToken={setTurnstileToken}
              onError={() => setChallengeFailed(true)}
            />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="mono-data text-sm font-semibold text-slate-200">{challenge.prompt}</span>
                <button
                  type="button"
                  onClick={() => void loadChallenge()}
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-teal-300 hover:bg-white/5"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  {t.community.humanCheckRefresh}
                </button>
              </div>
              <input
                value={captchaAnswer}
                onChange={(event) => setCaptchaAnswer(event.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                autoComplete="off"
                aria-label={t.community.humanCheckAnswer}
                placeholder={t.community.humanCheckAnswer}
                className="min-h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}
        </fieldset>

        {renderNotice()}

        <button
          type="submit"
          disabled={
            submitting ||
            !challenge ||
            challenge.readonly ||
            (challenge.mode === "turnstile" && !turnstileToken) ||
            (challenge.mode === "math" && !captchaAnswer)
          }
          className="min-h-11 w-full rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-teal-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {submitting ? t.community.submitting : t.community.submit}
        </button>

        <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-300" aria-hidden />
          <p className="text-[11px] leading-relaxed text-slate-400">
            {t.community.anonymityNote} {t.community.areaPrivacyNote}
          </p>
        </div>
      </form>
    );
  }

  function renderNotice() {
    if (!notice) return null;
    return (
      <div
        role={notice.tone === "error" ? "alert" : "status"}
        className={`rounded-xl border px-3 py-2 text-xs ${
          notice.tone === "error"
            ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
        }`}
      >
        {notice.text}
      </div>
    );
  }

  function renderFeed(onPick?: () => void) {
    if (loadState === "loading") return <FeedSkeleton />;
    if (loadState === "error") {
      return (
        <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-center text-xs text-amber-200">
          <AlertTriangle className="mx-auto h-5 w-5" aria-hidden />
          <p>{t.community.loadFailed}</p>
          <button
            type="button"
            onClick={() => {
              setLoadState("loading");
              void loadReports();
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-4 font-semibold text-slate-100 hover:bg-white/15"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            {t.community.retry}
          </button>
        </div>
      );
    }
    if (visibleReports.length === 0) {
      return (
        <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-center text-xs text-slate-400">
          {reports.length === 0 ? t.community.feedEmpty : t.community.feedFilteredEmpty}
        </p>
      );
    }
    return (
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {visibleReports.slice(0, 60).map((report) => {
          const active = report.id === selectedReportId;
          const faded = ageInDays(report.createdAt) > REPORT_FADE_AFTER_DAYS;
          return (
            <li
              key={report.id}
              className={`flex items-center gap-1 rounded-xl border transition-colors ${
                active
                  ? "border-teal-500/40 bg-teal-500/10"
                  : "border-transparent bg-white/[0.03] hover:bg-white/[0.07]"
              } ${faded ? "opacity-60" : ""}`}
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedReportId(report.id);
                  onPick?.();
                }}
                className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: getCategoryColor(report.category) }}
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-100">
                    {getCategoryLabel(report.category)}
                  </span>
                  <span className="mono-data block text-[11px] text-slate-400">
                    {formatRelativeAge(report.createdAt)} · ~{report.radiusMeters} м
                  </span>
                </span>
              </button>
              {!readonly ? (
                <button
                  type="button"
                  onClick={() => setFlagTargetId(report.id)}
                  aria-label={t.community.flagAction}
                  title={t.community.flagAction}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-slate-100 focus-visible:text-slate-100"
                >
                  <Flag className="h-4 w-4" />
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    );
  }
}

function SheetTab({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 text-[13px] font-semibold ${
        active ? "bg-teal-500/15 text-teal-200" : "text-slate-300 hover:bg-white/5"
      }`}
    >
      {icon}
      {label}
      {count !== undefined ? (
        <span className="mono-data rounded-md bg-white/10 px-1.5 text-[11px] text-slate-300">{count}</span>
      ) : null}
    </button>
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

function Explainer({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-explainer-title"
        className="monitor-panel w-full max-w-md rounded-2xl p-5"
      >
        <h2 id="community-explainer-title" className="mb-3 text-lg font-bold text-slate-50">
          {t.community.explainerTitle}
        </h2>
        <ul className="mb-5 space-y-2 text-sm leading-relaxed text-slate-300">
          {t.community.explainerPoints.map((point) => (
            <li key={point} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" aria-hidden />
              {point}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="min-h-11 w-full rounded-xl bg-teal-500 px-4 font-semibold text-slate-950 hover:bg-teal-400"
        >
          {t.community.explainerDismiss}
        </button>
      </div>
    </div>
  );
}

function FlagDialog({
  reportId,
  challenge,
  onClose,
  onDone,
}: {
  reportId: string;
  challenge: Challenge | null;
  onClose: () => void;
  onDone: (hidden: boolean) => void;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsTurnstile = challenge && !challenge.readonly && challenge.mode === "turnstile";

  async function send() {
    setSending(true);
    setError(null);
    try {
      const response = await fetch(`/api/community-reports/${reportId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(needsTurnstile ? { turnstileToken: token ?? undefined } : {}),
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      const data = (await response.json()) as { hidden?: boolean };
      onDone(Boolean(data.hidden));
    } catch {
      setError(t.apiErrors.server_error);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="flag-dialog-title"
        className="monitor-panel w-full max-w-sm rounded-2xl p-5"
      >
        <h2 id="flag-dialog-title" className="mb-2 text-base font-bold text-slate-50">
          {t.community.flagTitle}
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-slate-400">{t.community.flagBody}</p>
        {needsTurnstile ? (
          <div className="mb-4">
            <TurnstileWidget siteKey={challenge.siteKey} action="community-flag" onToken={setToken} />
          </div>
        ) : null}
        {error ? (
          <p
            role="alert"
            className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
          >
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-xl border border-white/10 bg-white/5 font-semibold text-slate-200 hover:bg-white/10"
          >
            {t.community.flagCancel}
          </button>
          <button
            type="button"
            onClick={() => void send()}
            disabled={sending || Boolean(needsTurnstile && !token)}
            className="min-h-11 flex-1 rounded-xl bg-teal-500 font-semibold text-slate-950 hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {t.community.flagConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
