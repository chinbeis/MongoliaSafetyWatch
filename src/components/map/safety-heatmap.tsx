"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "leaflet.heat";

declare module "leaflet" {
  function heatLayer(latlngs: Array<[number, number, number]>, options?: HeatLayerOptions): HeatLayer;

  interface HeatLayer extends L.Layer {
    setLatLngs(latlngs: Array<[number, number, number]>): this;
    addLatLng(latlng: [number, number, number]): this;
    setOptions(options: HeatLayerOptions): this;
  }

  interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }
}

const DefaultIcon = L.Icon.Default.prototype as unknown as {
  _getIconUrl?: string;
  options: L.IconOptions;
};

delete DefaultIcon._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface HeatmapData {
  id?: string;
  name?: string;
  lat: number;
  lng: number;
  count: number;
}

interface SafetyHeatmapProps {
  data: HeatmapData[];
  mode: "heat" | "bubble";
  selectedPoint?: HeatmapData;
  spotlightPoint?: HeatmapData;
}

export function SafetyHeatmap({ data, mode, selectedPoint, spotlightPoint }: SafetyHeatmapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const bubbleLayerRef = useRef<L.LayerGroup | null>(null);
  const selectedLayerRef = useRef<L.LayerGroup | null>(null);
  const spotlightLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [47.9188, 106.9173],
      zoom: 10,
      zoomControl: true,
      scrollWheelZoom: true,
      preferCanvas: true,
      renderer: L.canvas(),
    });

    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
      keepBuffer: 2,
      updateWhenIdle: true,
      updateWhenZooming: false,
    }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !data.length) return;

    const map = mapInstanceRef.current;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (bubbleLayerRef.current) {
      map.removeLayer(bubbleLayerRef.current);
      bubbleLayerRef.current = null;
    }

    const maxCount = Math.max(...data.map((p) => p.count));

    if (mode === "heat") {
      const heatData: Array<[number, number, number]> = data.map((point) => [point.lat, point.lng, point.count / maxCount]);

      const heatLayer = L.heatLayer(heatData, {
        radius: 40,
        blur: 34,
        maxZoom: 15,
        max: 1.0,
        minOpacity: 0.42,
        gradient: {
          0.0: "#2563eb",
          0.25: "#22d3ee",
          0.48: "#fde047",
          0.72: "#fb923c",
          1.0: "#dc2626",
        },
      });

      heatLayer.addTo(map);
      heatLayerRef.current = heatLayer;
    } else {
      const bubbles = L.layerGroup();

      data.forEach((point) => {
        const ratio = point.count / maxCount;
        const radius = 10 + ratio * 26;
        const fillColor = ratio > 0.7 ? "#dc2626" : ratio > 0.45 ? "#f59e0b" : "#0ea5e9";

        L.circleMarker([point.lat, point.lng], {
          radius,
          color: "#0f172a",
          weight: 1,
          fillColor,
          fillOpacity: 0.6,
          opacity: 0.6,
        }).addTo(bubbles);
      });

      bubbles.addTo(map);
      bubbleLayerRef.current = bubbles;
    }
  }, [data, mode]);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPoint) return;

    const map = mapInstanceRef.current;

    if (selectedLayerRef.current) {
      map.removeLayer(selectedLayerRef.current);
    }

    const markerLayer = L.layerGroup();

    L.circle([selectedPoint.lat, selectedPoint.lng], {
      radius: 620,
      color: "#0f766e",
      weight: 2,
      fillColor: "#14b8a6",
      fillOpacity: 0.16,
    }).addTo(markerLayer);

    L.circleMarker([selectedPoint.lat, selectedPoint.lng], {
      radius: 8,
      color: "#ffffff",
      weight: 2,
      fillColor: "#0f766e",
      fillOpacity: 1,
    }).addTo(markerLayer);

    markerLayer.addTo(map);
    selectedLayerRef.current = markerLayer;

    map.flyTo([selectedPoint.lat, selectedPoint.lng], selectedPoint.id === "5" ? 11 : 7, {
      duration: 0.75,
      easeLinearity: 0.25,
    });
  }, [selectedPoint]);

  useEffect(() => {
    if (!mapInstanceRef.current || !spotlightPoint) return;

    const map = mapInstanceRef.current;

    if (spotlightLayerRef.current) {
      map.removeLayer(spotlightLayerRef.current);
    }

    const spotlightLayer = L.layerGroup();

    L.circle([spotlightPoint.lat, spotlightPoint.lng], {
      radius: 1500,
      color: "#f97316",
      weight: 1.5,
      opacity: 0.85,
      fillColor: "#f97316",
      fillOpacity: 0.08,
      dashArray: "8 6",
    }).addTo(spotlightLayer);

    L.circle([spotlightPoint.lat, spotlightPoint.lng], {
      radius: 900,
      color: "#facc15",
      weight: 1,
      opacity: 0.9,
      fillColor: "#facc15",
      fillOpacity: 0.1,
    }).addTo(spotlightLayer);

    spotlightLayer.addTo(map);
    spotlightLayerRef.current = spotlightLayer;
  }, [spotlightPoint]);

  return <div ref={mapRef} className="w-full h-full" style={{ minHeight: "100%" }} />;
}
