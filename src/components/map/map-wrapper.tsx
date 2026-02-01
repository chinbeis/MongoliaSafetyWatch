"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Lazy load the map component for better performance
const SafetyHeatmapLazy = dynamic(
  () => import('./safety-heatmap').then(mod => ({ default: mod.SafetyHeatmap })),
  {
    ssr: false, // Don't render on server
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-stone-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-600 font-medium">Газрын зургийг ачаалж байна...</p>
        </div>
      </div>
    ),
  }
);

interface HeatmapData {
  lat: number;
  lng: number;
  count: number;
}

interface MapWrapperProps {
  data: HeatmapData[];
}

export function MapWrapper({ data }: MapWrapperProps) {
  return <SafetyHeatmapLazy data={data} />;
}