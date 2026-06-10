"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/dark";

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
  userPoint?: { lat: number; lng: number } | null;
}

function toFeatureCollection(points: HeatmapData[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const max = Math.max(...points.map((point) => point.count), 1);
  return {
    type: "FeatureCollection",
    features: points.map((point) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [point.lng, point.lat] },
      properties: {
        id: point.id ?? "",
        name: point.name ?? "",
        count: point.count,
        ratio: point.count / max,
      },
    })),
  };
}

function singlePoint(point?: HeatmapData | { lat: number; lng: number } | null): GeoJSON.FeatureCollection<GeoJSON.Point> {
  if (!point) {
    return { type: "FeatureCollection", features: [] };
  }
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry: { type: "Point", coordinates: [point.lng, point.lat] }, properties: {} }],
  };
}

export function SafetyHeatmap({ data, mode, selectedPoint, spotlightPoint, userPoint }: SafetyHeatmapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: MAP_STYLE,
      center: [106.9173, 47.9188],
      zoom: 9,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.getCanvas().style.opacity = "0";
    map.getCanvas().style.transition = "opacity 0.8s ease";
    const revealCanvas = () => {
      map.getCanvas().style.opacity = "1";
    };
    map.once("load", revealCanvas);
    // Safety net: never leave the canvas hidden if "load" is delayed.
    const revealTimer = setTimeout(revealCanvas, 2500);

    map.on("load", () => {
      map.addSource("regions", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("selected", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("spotlight", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("user", { type: "geojson", data: { type: "FeatureCollection", features: [] } });

      map.addLayer({
        id: "regions-heat",
        type: "heatmap",
        source: "regions",
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "ratio"], 0, 0.1, 1, 1],
          "heatmap-intensity": 1.1,
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 5, 28, 12, 60],
          "heatmap-opacity": 0.85,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(37,99,235,0)",
            0.2, "#2563eb",
            0.4, "#22d3ee",
            0.6, "#fde047",
            0.8, "#fb923c",
            1, "#ef4444",
          ],
        },
      });

      map.addLayer({
        id: "regions-bubble",
        type: "circle",
        source: "regions",
        layout: { visibility: "none" },
        paint: {
          "circle-radius": ["+", 6, ["*", ["get", "ratio"], 28]],
          "circle-color": [
            "step",
            ["get", "ratio"],
            "#0ea5e9",
            0.45, "#f59e0b",
            0.7, "#ef4444",
          ],
          "circle-opacity": 0.7,
          "circle-stroke-color": "#070b12",
          "circle-stroke-width": 1,
        },
      });

      map.addLayer({
        id: "spotlight-glow",
        type: "circle",
        source: "spotlight",
        paint: {
          "circle-radius": 26,
          "circle-color": "#f59e0b",
          "circle-opacity": 0.16,
          "circle-stroke-color": "#fbbf24",
          "circle-stroke-width": 1.5,
          "circle-stroke-opacity": 0.7,
        },
      });

      map.addLayer({
        id: "selected-glow",
        type: "circle",
        source: "selected",
        paint: {
          "circle-radius": 22,
          "circle-color": "#2dd4bf",
          "circle-opacity": 0.22,
        },
      });
      map.addLayer({
        id: "selected-dot",
        type: "circle",
        source: "selected",
        paint: {
          "circle-radius": 6,
          "circle-color": "#2dd4bf",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      map.addLayer({
        id: "user-glow",
        type: "circle",
        source: "user",
        paint: {
          "circle-radius": 18,
          "circle-color": "#3b82f6",
          "circle-opacity": 0.2,
        },
      });
      map.addLayer({
        id: "user-dot",
        type: "circle",
        source: "user",
        paint: {
          "circle-radius": 6,
          "circle-color": "#3b82f6",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      setReady(true);
    });

    return () => {
      clearTimeout(revealTimer);
      map.remove();
      mapInstanceRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!ready || !map) return;
    (map.getSource("regions") as maplibregl.GeoJSONSource | undefined)?.setData(toFeatureCollection(data));
    map.setLayoutProperty("regions-heat", "visibility", mode === "heat" ? "visible" : "none");
    map.setLayoutProperty("regions-bubble", "visibility", mode === "bubble" ? "visible" : "none");
  }, [ready, data, mode]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!ready || !map) return;
    (map.getSource("selected") as maplibregl.GeoJSONSource | undefined)?.setData(singlePoint(selectedPoint));
    if (selectedPoint) {
      // The filter rail overlays the left edge on desktop; pad so the
      // selected region lands in the visible part of the stage.
      const railPadding = window.innerWidth >= 1024 ? { left: 340, right: 280 } : { left: 0, right: 0 };
      map.flyTo({
        center: [selectedPoint.lng, selectedPoint.lat],
        zoom: selectedPoint.id === "5" ? 10 : 6.5,
        speed: 1.1,
        padding: { top: 60, bottom: 60, ...railPadding },
        essential: true,
      });
    }
  }, [ready, selectedPoint]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!ready || !map) return;
    (map.getSource("spotlight") as maplibregl.GeoJSONSource | undefined)?.setData(singlePoint(spotlightPoint));
  }, [ready, spotlightPoint]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!ready || !map) return;
    (map.getSource("user") as maplibregl.GeoJSONSource | undefined)?.setData(singlePoint(userPoint));
  }, [ready, userPoint]);

  return <div ref={mapRef} className="h-full w-full" style={{ minHeight: "100%" }} />;
}
