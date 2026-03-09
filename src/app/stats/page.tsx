"use client";

import { useState, type ReactNode } from "react";
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
      <div className="border-b border-slate-200/70 bg-white/65 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-5 py-10 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-200 bg-teal-50 text-teal-800 text-xs font-semibold mb-4 uppercase tracking-wide">
                <Activity className="w-3.5 h-3.5" />
                1212.mn Local Snapshot
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mb-4">
                {t.stats}
              </h1>

              <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
                Үндэсний Статистикийн Хорооны `1212.mn` хүснэгтээс нэг удаа татаж хадгалсан
                орон нутгийн snapshot. Энэ хүснэгт нь бүртгэгдсэн гэмт хэргийг үйлдэгдсэн
                байдал, аймаг, нийслэл, сараар өссөн дүнгээр харуулдаг.
              </p>
            </div>

            <a
              href="/data/1212-crime-snapshot.json"
              download
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors font-semibold self-start lg:self-auto"
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
          <StatTile
            label={`${selectedYear} улсын дүн`}
            value={nationalTotal.toLocaleString()}
            hint={indicators.find((indicator) => indicator.code === selectedIndicator)?.name ?? ""}
          />
          <StatTile
            label="Өмнөх жилтэй харьцуулахад"
            value={`${deltaPercent >= 0 ? "+" : ""}${deltaPercent.toFixed(1)}%`}
            hint={`${delta >= 0 ? "+" : ""}${delta.toLocaleString()} өөрчлөлт`}
            icon={<TrendingDown className="w-4 h-4 text-amber-600" />}
          />
          <StatTile
            label="Хамгийн өндөр бүс"
            value={topRegion?.regionName ?? "Мэдээлэл алга"}
            hint={topRegion ? `${topRegion.count.toLocaleString()} тохиолдол` : ""}
            icon={<BarChart3 className="w-4 h-4 text-teal-600" />}
          />
        </div>

        <div className="surface-card rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Жилийн чиг хандлага</h2>
              <p className="text-sm text-slate-500">
                Сонгосон үзүүлэлтийн улсын хэмжээний 12-р сарын өссөн дүн
              </p>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="year" stroke="#94a3b8" tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} dx={-10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 12px 30px -20px rgba(15,23,42,0.4)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#0f766e"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#0f766e", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="surface-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Үзүүлэлтүүдийн харьцуулалт</h2>
                <p className="text-sm text-slate-500">
                  {selectedYear} оны 12-р сарын өссөн дүн. Эдгээр үзүүлэлтүүд нь хоорондоо давхцаж
                  болно.
                </p>
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={indicatorBreakdown} layout="vertical" margin={{ left: 32 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={130}
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                    }}
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
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Тэргүүлэх бүсүүд</h2>
                <p className="text-sm text-slate-500">
                  {selectedYear} он, {indicators.find((indicator) => indicator.code === selectedIndicator)?.name}
                </p>
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionalData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="regionName"
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <Bar dataKey="count" fill="#0f766e" radius={[8, 8, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="surface-card rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Эх сурвалж ба snapshot мэдээлэл</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-600">
            <InfoLine label="Хүснэгтийн код" value={snapshot.tableId} />
            <InfoLine label="Эх сурвалж" value={snapshot.source} />
            <InfoLine label="1212.mn шинэчлэлт" value={formatDate(snapshot.updated)} />
          </div>
        </div>

        <div className="max-w-4xl">
          <Disclaimer
            variant="info"
            className="rounded-2xl border border-slate-200 bg-white/75 p-6"
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
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon?: ReactNode;
}) {
  return (
    <div className="surface-card rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{hint}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
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
