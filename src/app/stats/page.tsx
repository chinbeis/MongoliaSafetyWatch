"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";
import { Disclaimer } from "@/components/ui/disclaimer";
import { StatCard } from "@/components/ui/stat-card";
import {
  BarChart3,
  TrendingDown,
  Download,
  Info,
  Calendar,
  Activity,
} from "lucide-react";
import { t } from "@/lib/translations";
import {
  getCrimeIndicators,
  getCrimeSnapshot,
  getCrimeYears,
  getIndicatorYearBreakdown,
  getLatestCrimeYear,
  getNationalTotal,
  getNationalTrend,
  getRegionYearCounts,
} from "@/lib/crime-snapshot";

const years = getCrimeYears();
const indicators = getCrimeIndicators();
const snapshot = getCrimeSnapshot();

export default function StatsPage() {
  const [selectedIndicator, setSelectedIndicator] = useState(indicators[0]?.code ?? "");
  const [selectedYear, setSelectedYear] = useState(getLatestCrimeYear());

  const trendData = getNationalTrend(selectedIndicator);
  const indicatorBreakdown = getIndicatorYearBreakdown(selectedYear);
  const regionalData = getRegionYearCounts(selectedYear, selectedIndicator).slice(0, 10);
  const nationalTotal = getNationalTotal(selectedYear, selectedIndicator);
  const previousTotal = getNationalTotal(selectedYear - 1, selectedIndicator);
  const delta = nationalTotal - previousTotal;
  const deltaPercent = previousTotal > 0 ? (delta / previousTotal) * 100 : 0;
  const topRegion = regionalData[0];

  return (
    <div className="min-h-screen pb-12">
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-5 py-10 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/20 bg-teal-500/10 text-teal-300 text-xs font-semibold mb-4 uppercase tracking-wide">
                <Activity className="w-3.5 h-3.5" />
1212.mn-ийн орон нутгийн snapshot
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-50 mb-4">
                {t.stats}
              </h1>

              <p className="text-lg text-slate-400 max-w-3xl leading-relaxed">
                Үндэсний Статистикийн Хорооны `1212.mn` хүснэгтээс нэг удаа татаж хадгалсан
                орон нутгийн snapshot. Энэ хүснэгт нь бүртгэгдсэн гэмт хэргийг үйлдэгдсэн
                байдал, аймаг, нийслэл, сараар өссөн дүнгээр харуулдаг.
              </p>
            </div>

            <a
              href="/data/1212-crime-snapshot.json"
              download
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-teal-500 text-slate-950 hover:bg-teal-400 transition-colors font-semibold self-start lg:self-auto"
            >
              <Download className="w-4 h-4" />
              JSON snapshot татах
            </a>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <FilterCard
              label="Үзүүлэлт"
              value={selectedIndicator}
              onChange={setSelectedIndicator}
              options={indicators.map((indicator) => ({
                value: indicator.code,
                label: indicator.name,
              }))}
            />
            <FilterCard
              label="Он"
              value={String(selectedYear)}
              onChange={(value) => setSelectedYear(Number(value))}
              options={years.map((year) => ({
                value: String(year),
                label: String(year),
              }))}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <StatCard
            label={`${selectedYear} улсын дүн`}
            value={nationalTotal.toLocaleString()}
            hint={indicators.find((indicator) => indicator.code === selectedIndicator)?.name ?? ""}
          />
          <StatCard
            label="Өмнөх жилтэй харьцуулахад"
            value={`${deltaPercent >= 0 ? "+" : ""}${deltaPercent.toFixed(1)}%`}
            hint={`${delta >= 0 ? "+" : ""}${delta.toLocaleString()} өөрчлөлт`}
            icon={<TrendingDown className="w-4 h-4 text-amber-400" />}
          />
          <StatCard
            label="Хамгийн өндөр бүс"
            value={topRegion?.regionName ?? "Мэдээлэл алга"}
            hint={topRegion ? `${topRegion.count.toLocaleString()} тохиолдол` : ""}
            icon={<BarChart3 className="w-4 h-4 text-teal-300" />}
          />
        </div>

        <div className="surface-card rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-teal-500/15 text-teal-300 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-50">Жилийн чиг хандлага</h2>
              <p className="text-sm text-slate-400">
                Сонгосон үзүүлэлтийн улсын хэмжээний 12-р сарын өссөн дүн
              </p>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2a3b" />
                <XAxis dataKey="year" stroke="#64748b" tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} dx={-10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0c121d",
                    borderRadius: "12px",
                    border: "1px solid #1f2a3b",
                    boxShadow: "0 18px 40px -22px rgba(0,0,0,0.9)",
                  }}
                  labelStyle={{ color: "#e6edf6" }}
                  itemStyle={{ color: "#2dd4bf" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2dd4bf"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#2dd4bf", strokeWidth: 2, stroke: "#070b12" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="surface-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-sky-500/15 text-sky-300 flex items-center justify-center">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-50">Үзүүлэлтүүдийн харьцуулалт</h2>
                <p className="text-sm text-slate-400">
                  {selectedYear} оны 12-р сарын өссөн дүн. Эдгээр үзүүлэлтүүд нь хоорондоо давхцаж
                  болно.
                </p>
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={indicatorBreakdown} layout="vertical" margin={{ left: 32 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1f2a3b" />
                  <XAxis type="number" stroke="#64748b" tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={130}
                    stroke="#64748b"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0c121d",
                      borderRadius: "12px",
                      border: "1px solid #1f2a3b",
                    }}
                    labelStyle={{ color: "#e6edf6" }}
                    itemStyle={{ color: "#2dd4bf" }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {indicatorBreakdown.map((entry) => (
                      <Cell key={entry.code} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="surface-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-50">Тэргүүлэх бүсүүд</h2>
                <p className="text-sm text-slate-400">
                  {selectedYear} он, {indicators.find((indicator) => indicator.code === selectedIndicator)?.name}
                </p>
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionalData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2a3b" />
                  <XAxis
                    dataKey="regionName"
                    stroke="#64748b"
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0c121d",
                      borderRadius: "12px",
                      border: "1px solid #1f2a3b",
                    }}
                    labelStyle={{ color: "#e6edf6" }}
                    itemStyle={{ color: "#2dd4bf" }}
                    cursor={{ fill: "rgba(148,163,184,0.08)" }}
                  />
                  <Bar dataKey="count" fill="#2dd4bf" radius={[8, 8, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="surface-card rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-slate-50 mb-4">Эх сурвалж ба snapshot мэдээлэл</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-400">
            <InfoLine label="Хүснэгтийн код" value={snapshot.tableId} />
            <InfoLine label="Эх сурвалж" value={snapshot.source} />
            <InfoLine label="1212.mn шинэчлэлт" value={formatDate(snapshot.updated)} />
          </div>
        </div>

        <div className="max-w-4xl">
          <Disclaimer
            variant="info"
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          />
        </div>

        {/* <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/85 p-5">
          <div className="flex gap-3">
            <Info className="w-4.5 h-4.5 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed text-amber-800">
              Энэ хуудас нь runtime fetch ашиглахгүй. `npm run import:1212` ажиллуулж local
              snapshot-оо шинэчилнэ.
            </p>
          </div>
        </div> */}
      </div>
    </div>
  );
}

function FilterCard({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="surface-card rounded-2xl p-4">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-slate-900">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-200">{value}</p>
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
