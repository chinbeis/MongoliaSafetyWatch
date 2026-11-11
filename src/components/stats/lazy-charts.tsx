"use client";

import dynamic from "next/dynamic";

/** Recharts is only downloaded when a chart is on screen. */
export const MonthlyComparisonChart = dynamic(() => import("./monthly-comparison-chart"), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full animate-pulse rounded-xl bg-white/[0.03]" />,
});
