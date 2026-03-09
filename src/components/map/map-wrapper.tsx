"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const SafetyHeatmapLazy = dynamic(
  () => import("./safety-heatmap").then((mod) => ({ default: mod.SafetyHeatmap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-600 font-medium">Газрын зургийг ачаалж байна...</p>
        </div>
      </div>
    ),
  }
);

interface HeatmapData {
  id?: string;
  name?: string;
  lat: number;
  lng: number;
  count: number;
  trend?: string;
  risk?: string;
}

interface MapWrapperProps {
  data: HeatmapData[];
  mode: "heat" | "bubble";
  selectedPoint?: HeatmapData;
  spotlightPoint?: HeatmapData;
}

export function MapWrapper({ data, mode, selectedPoint, spotlightPoint }: MapWrapperProps) {
  return <SafetyHeatmapLazy data={data} mode={mode} selectedPoint={selectedPoint} spotlightPoint={spotlightPoint} />;
}
