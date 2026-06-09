import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <div className="surface-card rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-50">{value}</p>
      {hint ? <p className="text-sm text-slate-400 mt-1">{hint}</p> : null}
    </div>
  );
}
