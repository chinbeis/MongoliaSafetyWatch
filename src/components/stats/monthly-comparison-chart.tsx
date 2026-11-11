"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { t } from "@/lib/translations";

export interface MonthlyComparisonChartProps {
  /** year → cumulative values for months 1..n (null where unavailable). */
  series: Record<string, Array<number | null>>;
  years: number[];
  defaultYear: number;
}

const CURRENT = "#2dd4bf";
const PREVIOUS = "#94a3b8";
const format = (value: number) => value.toLocaleString("mn-MN");

export default function MonthlyComparisonChart({ series, years, defaultYear }: MonthlyComparisonChartProps) {
  const selectable = years.filter((year) => series[String(year - 1)]);
  const [year, setYear] = useState(defaultYear);
  const previousYear = year - 1;

  const data = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        current: series[String(year)]?.[index] ?? null,
        previous: series[String(previousYear)]?.[index] ?? null,
      })),
    [series, year, previousYear]
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-4 text-xs text-slate-300" aria-label={t.statsPage.legend}>
          <li className="inline-flex items-center gap-2">
            <span className="h-0.5 w-5 rounded" style={{ background: CURRENT }} aria-hidden />
            {year}
          </li>
          <li className="inline-flex items-center gap-2">
            <span className="h-0.5 w-5 rounded border-t-2 border-dashed" style={{ borderColor: PREVIOUS }} aria-hidden />
            {previousYear}
          </li>
        </ul>
        <label className="inline-flex items-center gap-2 text-xs text-slate-400">
          {t.mapPage.year}
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {selectable.map((item) => (
              <option key={item} value={item} className="bg-slate-900">
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="h-[300px] w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2a3b" />
            <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={(m) => `${m}`} />
            <YAxis stroke="#64748b" tickLine={false} axisLine={false} width={56} tickFormatter={format} />
            <Tooltip
              cursor={{ stroke: "#475569", strokeWidth: 1 }}
              contentStyle={{ backgroundColor: "#0c121d", borderRadius: 12, border: "1px solid #1f2a3b" }}
              labelStyle={{ color: "#e6edf6" }}
              labelFormatter={(m) => `${m}-р сар хүртэл`}
              formatter={(value, name) => [format(Number(value)), name === "current" ? String(year) : String(previousYear)]}
            />
            <Line
              type="monotone"
              dataKey="previous"
              stroke={PREVIOUS}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="current"
              stroke={CURRENT}
              strokeWidth={2}
              dot={{ r: 3, fill: CURRENT, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <details className="mt-4 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-sm text-slate-300">
        <summary className="cursor-pointer font-semibold text-slate-200">{t.mapPage.table}</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-xs text-slate-400">
            <tr>
              <th className="py-1 font-semibold">{t.statsPage.month}</th>
              <th className="py-1 text-right font-semibold">{year}</th>
              <th className="py-1 text-right font-semibold">{previousYear}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.month} className="border-t border-white/5">
                <td className="py-1">{row.month}-р сар хүртэл</td>
                <td className="mono-data py-1 text-right">{row.current != null ? format(row.current) : "—"}</td>
                <td className="mono-data py-1 text-right">{row.previous != null ? format(row.previous) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
