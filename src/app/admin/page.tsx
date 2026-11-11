"use client";

import { useCallback, useEffect, useState } from "react";
import { LogOut, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { getCategoryColor, getCategoryLabel } from "@/lib/community-categories";
import { formatRelativeAge } from "@/lib/relative-time";
import { t } from "@/lib/translations";
import { useBrowserStorage, writeBrowserStorage } from "@/lib/use-browser-storage";

type Status = "pending_review" | "visible" | "removed";

type AdminReport = {
  id: string;
  category: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  flagCount: number;
  status: Status;
  createdAt: string;
};

const TOKEN_KEY = "admin-token";
const TABS: Array<{ value: Status; label: string }> = [
  { value: "pending_review", label: t.admin.tabPending },
  { value: "visible", label: t.admin.tabVisible },
  { value: "removed", label: t.admin.tabRemoved },
];

type ListResult =
  | { ok: true; reports: AdminReport[]; counts: Partial<Record<Status, number>> }
  | { ok: false; unauthorized: boolean; message: string };

async function fetchList(token: string, status: Status): Promise<ListResult> {
  try {
    const response = await fetch(`/api/admin/reports?status=${status}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (response.status === 401 || response.status === 404) {
      return { ok: false, unauthorized: true, message: t.apiErrors.unauthorized };
    }
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      return { ok: false, unauthorized: false, message: body.message ?? t.apiErrors.server_error };
    }
    const data = (await response.json()) as { reports: AdminReport[]; counts: Partial<Record<Status, number>> };
    return { ok: true, ...data };
  } catch {
    return { ok: false, unauthorized: false, message: t.apiErrors.server_error };
  }
}

export default function AdminPage() {
  const storedToken = useBrowserStorage("session", TOKEN_KEY);
  const [memoryToken, setMemoryToken] = useState<string | null>(null);
  const token = storedToken || memoryToken;

  const [tokenInput, setTokenInput] = useState("");
  const [status, setStatus] = useState<Status>("pending_review");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [counts, setCounts] = useState<Partial<Record<Status, number>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signOut = useCallback(() => {
    writeBrowserStorage("session", TOKEN_KEY, null);
    setMemoryToken(null);
    setReports([]);
  }, []);

  const apply = useCallback(
    (result: ListResult) => {
      setLoading(false);
      if (result.ok) {
        setReports(result.reports);
        setCounts(result.counts);
        setError(null);
        return;
      }
      if (result.unauthorized) signOut();
      setError(result.message);
    },
    [signOut],
  );

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    void fetchList(token, status).then(apply);
  }, [token, status, apply]);

  useEffect(() => {
    if (token) void fetchList(token, status).then(apply);
  }, [token, status, apply]);

  async function moderate(id: string, action: "restore" | "remove") {
    if (!token) return;
    setError(null);
    const response = await fetch(`/api/admin/reports/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      setError(body.message ?? t.apiErrors.server_error);
      return;
    }
    load();
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-sm px-5 py-16">
        <h1 className="mb-2 text-2xl font-bold text-slate-50">{t.admin.title}</h1>
        <p className="mb-6 text-sm text-slate-400">{t.admin.tokenHelp}</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = tokenInput.trim();
            if (!value) return;
            writeBrowserStorage("session", TOKEN_KEY, value);
            setMemoryToken(value); // fallback when session storage is blocked
            setTokenInput("");
            setError(null);
          }}
          className="space-y-3"
        >
          <input
            type="password"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            autoComplete="off"
            aria-label={t.admin.tokenLabel}
            placeholder={t.admin.tokenLabel}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            className="min-h-11 w-full rounded-xl bg-teal-500 font-semibold text-slate-950 hover:bg-teal-400"
          >
            {t.admin.signIn}
          </button>
          {error ? (
            <p role="alert" className="text-xs text-amber-300">
              {error}
            </p>
          ) : null}
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-50">{t.admin.title}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
            {t.admin.refresh}
          </button>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {t.admin.signOut}
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={status === tab.value}
            onClick={() => setStatus(tab.value)}
            className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${
              status === tab.value ? "bg-teal-500 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {tab.label} · {counts[tab.value] ?? 0}
          </button>
        ))}
      </div>

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
        >
          {error}
        </p>
      ) : null}

      {reports.length === 0 && !loading ? (
        <p className="surface-card rounded-2xl p-6 text-center text-sm text-slate-400">{t.admin.empty}</p>
      ) : (
        <ul className="space-y-2">
          {reports.map((report) => (
            <li key={report.id} className="surface-card flex flex-wrap items-center gap-4 rounded-2xl p-4">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: getCategoryColor(report.category) }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-100">{getCategoryLabel(report.category) ?? report.category}</p>
                <p className="mono-data text-xs text-slate-400">
                  {formatRelativeAge(report.createdAt)} · ~{report.radiusMeters} м · {report.latitude.toFixed(4)},{" "}
                  {report.longitude.toFixed(4)} · {t.admin.flags}: {report.flagCount}
                </p>
              </div>
              <div className="flex gap-2">
                {report.status !== "visible" ? (
                  <button
                    type="button"
                    onClick={() => void moderate(report.id, "restore")}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/5 px-3 text-sm font-semibold text-teal-200 hover:bg-white/10"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    {t.admin.restore}
                  </button>
                ) : null}
                {report.status !== "removed" ? (
                  <button
                    type="button"
                    onClick={() => void moderate(report.id, "remove")}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/5 px-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    {t.admin.remove}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
