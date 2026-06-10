"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface MonitorPanelProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Collapsible panels start open and remember nothing — pure UI state. */
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  /** Extra node rendered on the right side of the header (badge, count…). */
  trailing?: ReactNode;
  /** When the panel body should scroll, let the caller own the flex sizing. */
  bodyClassName?: string;
}

export function MonitorPanel({
  title,
  icon,
  children,
  className = "",
  collapsible = false,
  defaultCollapsed = false,
  trailing,
  bodyClassName = "",
}: MonitorPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <section className={`monitor-panel rounded-2xl ${className}`}>
      <header className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-3 border-b border-white/5">
        <div className="monitor-panel-header min-w-0">
          {icon}
          <span className="truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {trailing}
          {collapsible ? (
            <button
              type="button"
              onClick={() => setCollapsed((current) => !current)}
              aria-expanded={!collapsed}
              aria-label={collapsed ? `${title} — дэлгэх` : `${title} — хураах`}
              className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${collapsed ? "-rotate-90" : ""}`}
              />
            </button>
          ) : null}
        </div>
      </header>
      {collapsed ? null : <div className={bodyClassName || "p-4"}>{children}</div>}
    </section>
  );
}

/** Header chip: pulsing dot + uppercase label, the "LIVE" marker. */
export function LiveBadge({ label, tone = "emerald" }: { label: string; tone?: "emerald" | "amber" }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
      <span className={`live-dot ${tone === "amber" ? "live-dot--amber" : ""}`} />
      {label}
    </span>
  );
}

/** Local time, ticking each second. suppressHydrationWarning absorbs the server/client drift. */
export function LiveClock({ className = "" }: { className?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`mono-data ${className}`} suppressHydrationWarning>
      {now.toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}
