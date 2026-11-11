import type { Metadata } from "next";
import Link from "next/link";
import { Activity, BarChart3, CalendarRange, Download, FileSpreadsheet, Layers, ListOrdered } from "lucide-react";
import { Disclaimer } from "@/components/ui/disclaimer";
import { BarList } from "@/components/ui/bar-list";
import { MonthlyComparisonChart } from "@/components/stats/lazy-charts";
import { RegionRankingTable, type RankingRow } from "@/components/stats/region-ranking-table";
import {
  NATIONAL_CODE,
  TOTAL_MEASURE,
  describeComparison,
  formatCell,
  formatChange,
  formatNumber,
  getCrimeSnapshot,
  getCrimeTypeBreakdown,
  getCrimeTypeTotal,
  getIndicators,
  getLikeForLike,
  getMeta,
  getMonthlySeries,
  getMonthsAvailable,
  getRate,
  getRateYearFor,
  getRegionRows,
  getYears,
} from "@/lib/crime-snapshot";
import { t } from "@/lib/translations";

export const metadata: Metadata = {
  title: t.statsPage.title,
  description: t.statsPage.description,
};

function monthsLabel(year: number) {
  const months = getMonthsAvailable(year);
  return months === 12 ? `${year} он` : `${year} оны 1–${months}-р сар`;
}

export default function StatsPage() {
  const meta = getMeta();
  const year = meta.latestYear;
  const period = monthsLabel(year);
  const rateYear = getRateYearFor(year);
  const nationalRate = getRate(NATIONAL_CODE, rateYear);
  const national = getLikeForLike(TOTAL_MEASURE, NATIONAL_CODE, year);
  const years = getYears();

  const monthlySeries = Object.fromEntries(
    years.map((y) => [String(y), getMonthlySeries(TOTAL_MEASURE, NATIONAL_CODE, y)])
  );

  const indicatorItems = getIndicators().map((indicator) => {
    const comparison = getLikeForLike(indicator.code, NATIONAL_CODE, year);
    return {
      key: indicator.code,
      label: indicator.name,
      value: comparison.current.value,
      display: formatCell(comparison.current),
      hint: `${indicator.description} ${t.mapPage.change}: ${formatChange(comparison.changePercent)} (${describeComparison(comparison)}).`,
    };
  });

  const typeYear = meta.latestCrimeTypeYear;
  const typeTotal = getCrimeTypeTotal(NATIONAL_CODE, typeYear);
  const breakdown = getCrimeTypeBreakdown(NATIONAL_CODE, typeYear);
  const chapters = breakdown
    .filter((row) => row.parent === null && (row.cell.value ?? 0) > 0)
    .sort((a, b) => (b.cell.value ?? 0) - (a.cell.value ?? 0));
  const typeItems = chapters.flatMap((chapter) => [
    { key: chapter.code, label: chapter.name, value: chapter.cell.value, display: formatCell(chapter.cell) },
    ...breakdown
      .filter((row) => row.parent === chapter.code && (row.cell.value ?? 0) > 0)
      .sort((a, b) => (b.cell.value ?? 0) - (a.cell.value ?? 0))
      .map((row) => ({ key: row.code, label: row.name, value: row.cell.value, display: formatCell(row.cell), indent: true })),
  ]);

  const regionRows = getRegionRows(TOTAL_MEASURE, year);
  const ranking: RankingRow[] = regionRows.map((row) => ({
    code: row.code,
    name: row.name,
    rate: row.rate,
    count: row.count.value,
    countDisplay: formatCell(row.count),
    change: row.comparison.changePercent,
    changeDisplay: formatChange(row.comparison.changePercent),
  }));
  const countItems = [...regionRows]
    .sort((a, b) => (b.count.value ?? -1) - (a.count.value ?? -1))
    .map((row) => ({ key: row.code, label: row.name, value: row.count.value, display: formatCell(row.count) }));

  const filePrefix = `catchpred-1212-${meta.dataThrough}`;
  const downloads = [
    { href: "/data/1212-crime-snapshot.json", name: `${filePrefix}.json`, label: t.statsPage.downloadJson },
    { href: "/data/registered-crimes-monthly-cumulative.csv", name: `${filePrefix}-monthly.csv`, label: t.statsPage.csvMonthly },
    { href: "/data/crime-circumstances-monthly-cumulative.csv", name: `${filePrefix}-circumstances.csv`, label: t.statsPage.csvCircumstances },
    { href: "/data/crime-rate-per-10000-aged-16-plus.csv", name: `${filePrefix}-rates.csv`, label: t.statsPage.csvRates },
    { href: "/data/registered-crimes-by-type-yearly.csv", name: `${filePrefix}-types.csv`, label: t.statsPage.csvTypes },
  ];

  const sources = Object.values(getCrimeSnapshot().meta.sources);

  return (
    <div className="min-h-screen pb-12">
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-5 py-10 sm:py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/20 bg-teal-500/10 text-teal-200 text-xs font-semibold mb-4">
            <Activity className="w-3.5 h-3.5" aria-hidden />
            {t.dataAsOf(meta.dataThrough)} · {t.sourceShort}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-50 mb-4">{t.statsPage.title}</h1>
          <p className="text-lg text-slate-400 max-w-3xl leading-relaxed">{t.statsPage.intro}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-8 space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Headline label={t.statsPage.headlineTotal(period)} value={formatCell(national.current)} />
          <Headline
            label={t.statsPage.headlineChange}
            value={formatChange(national.changePercent)}
            hint={`${describeComparison(national)}: ${formatCell(national.previous)}`}
          />
          <Headline
            label={t.statsPage.headlineRate(rateYear)}
            value={nationalRate != null ? formatNumber(nationalRate, 1) : "—"}
            hint={t.mapPage.nationalRate}
          />
        </div>

        <Panel icon={<CalendarRange className="w-5 h-5" />} title={t.statsPage.monthlyTitle} subtitle={t.statsPage.monthlySubtitle}>
          <MonthlyComparisonChart series={monthlySeries} years={years} defaultYear={year} />
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6">
          <Panel
            icon={<Layers className="w-5 h-5" />}
            title={t.statsPage.indicatorsTitle}
            subtitle={t.statsPage.indicatorsSubtitle(period)}
          >
            <BarList items={indicatorItems} ariaLabel={t.statsPage.indicatorsTitle} />
          </Panel>

          <Panel
            icon={<BarChart3 className="w-5 h-5" />}
            title={t.statsPage.typesTitle(typeYear)}
            subtitle={`${t.statsPage.typesSubtitle} Нийт: ${formatCell(typeTotal)}.`}
          >
            <div className="max-h-[560px] overflow-y-auto pr-1">
              <BarList items={typeItems} ariaLabel={t.statsPage.typesTitle(typeYear)} />
            </div>
          </Panel>
        </div>

        <Panel icon={<ListOrdered className="w-5 h-5" />} title={t.statsPage.rankingTitle} subtitle={t.statsPage.rankingSubtitle}>
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <RegionRankingTable rows={ranking} rateYear={rateYear} countLabel={period} />
            </div>
            <div className="lg:col-span-2">
              <h3 className="mb-3 text-sm font-semibold text-slate-300">{t.statsPage.countsTitle(period)}</h3>
              <div className="max-h-[470px] overflow-y-auto pr-1">
                <BarList items={countItems} ariaLabel={t.statsPage.countsTitle(period)} />
              </div>
              <p className="mt-3 text-xs text-slate-400">{t.mapPage.countCaveat}</p>
            </div>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6">
          <Panel icon={<Download className="w-5 h-5" />} title={t.statsPage.downloads}>
            <ul className="grid sm:grid-cols-2 gap-2">
              {downloads.map((file) => (
                <li key={file.href}>
                  <a
                    href={file.href}
                    download={file.name}
                    className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                  >
                    <FileSpreadsheet className="h-4 w-4 shrink-0 text-teal-300" aria-hidden />
                    {file.label}
                  </a>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel icon={<Activity className="w-5 h-5" />} title={t.statsPage.sourcesTitle}>
            <ul className="space-y-2 text-sm text-slate-300">
              {sources.map((source) => (
                <li key={source.tableId}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-300 hover:underline">
                    {source.tableId}
                  </a>{" "}
                  — {source.title}
                </li>
              ))}
            </ul>
            <Link href="/data-sources" className="mt-3 inline-block text-sm font-semibold text-teal-300 hover:underline">
              {t.dataSources} →
            </Link>
          </Panel>
        </div>

        <div className="max-w-4xl">
          <Disclaimer variant="info" className="rounded-2xl border border-white/10 bg-white/5 p-6" />
        </div>
      </div>
    </div>
  );
}

function Headline({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="surface-card rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">{label}</p>
      <p className="mono-data text-3xl font-black text-slate-50">{value}</p>
      {hint ? <p className="text-sm text-slate-400 mt-1">{hint}</p> : null}
    </div>
  );
}

function Panel({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card rounded-2xl p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-teal-500/15 text-teal-300 flex items-center justify-center" aria-hidden>
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-50">{title}</h2>
          {subtitle ? <p className="text-sm text-slate-400 leading-relaxed mt-1">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
