"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { t } from "@/lib/translations";

export interface RankingRow {
  code: string;
  name: string;
  rate: number | null;
  count: number | null;
  countDisplay: string;
  change: number | null;
  changeDisplay: string;
}

type SortKey = "name" | "rate" | "count" | "change";

export function RegionRankingTable({ rows, rateYear, countLabel }: { rows: RankingRow[]; rateYear: number; countLabel: string }) {
  const [sort, setSort] = useState<{ key: SortKey; descending: boolean }>({ key: "rate", descending: true });
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = rows.filter((row) => !needle || row.name.toLowerCase().includes(needle));
    const value = (row: RankingRow) => (sort.key === "name" ? row.name : row[sort.key]);
    return filtered.sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const order = typeof av === "string" ? av.localeCompare(String(bv), "mn") : (av as number) - (bv as number);
      return sort.descending ? -order : order;
    });
  }, [rows, sort, query]);

  function header(key: SortKey, label: string, alignRight = false) {
    const active = sort.key === key;
    return (
      <th
        scope="col"
        aria-sort={active ? (sort.descending ? "descending" : "ascending") : "none"}
        className={`py-2 font-semibold ${alignRight ? "pr-3 text-right" : ""}`}
      >
        <button
          type="button"
          onClick={() => setSort((current) => ({ key, descending: current.key === key ? !current.descending : key !== "name" }))}
          className="inline-flex min-h-11 items-center gap-1 uppercase hover:text-slate-100"
        >
          {label}
          {active ? sort.descending ? <ArrowDown className="h-3 w-3" aria-hidden /> : <ArrowUp className="h-3 w-3" aria-hidden /> : null}
        </button>
      </th>
    );
  }

  return (
    <div>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.mapPage.searchRegion}
          aria-label={t.mapPage.searchRegion}
          className="min-h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      <div className="max-h-[420px] overflow-auto rounded-xl border border-white/5">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{t.statsPage.rankingCaption(rateYear)}</caption>
          <thead className="sticky top-0 bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th scope="col" className="w-10 py-2 pl-3 font-semibold">#</th>
              {header("name", t.mapPage.regions)}
              {header("rate", `${t.mapPage.ratePer10k} (${rateYear})`, true)}
              {header("count", countLabel, true)}
              {header("change", t.mapPage.change, true)}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <tr key={row.code} className="border-t border-white/5">
                <td className="mono-data py-2 pl-3 text-slate-500">{index + 1}</td>
                <th scope="row" className="py-2 pr-2 font-medium text-slate-100">{row.name}</th>
                <td className="mono-data py-2 pr-3 text-right text-slate-100">
                  {row.rate != null ? row.rate.toLocaleString("mn-MN", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—"}
                </td>
                <td className="mono-data py-2 pr-3 text-right text-slate-300">{row.countDisplay}</td>
                <td className="mono-data py-2 pr-3 text-right text-slate-300">{row.changeDisplay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
