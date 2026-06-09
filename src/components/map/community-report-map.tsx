"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getCategoryLabel } from "@/lib/community-categories";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/dark";

interface CommunityReportMapPoint {
  id: string;
  title: string;
  category: string;
  areaLabel?: string | null;
  details?: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  createdAt: string;
}

interface CommunityReportMapProps {
  reports: CommunityReportMapPoint[];
  draftPoint?: { latitude: number; longitude: number } | null;
  draftRadius: number;
  selectedReportId?: string | null;
  onMapClick: (point: { latitude: number; longitude: number }) => void;
}

function circleRing(lng: number, lat: number, radiusMeters: number, steps = 64): number[][] {
  const earth = 6378137;
  const lat0 = (lat * Math.PI) / 180;
  const ring: number[][] = [];
  for (let i = 0; i <= steps; i += 1) {
    const theta = (i / steps) * 2 * Math.PI;
    const dLng = ((radiusMeters * Math.cos(theta)) / (earth * Math.cos(lat0))) * (180 / Math.PI);
    const dLat = ((radiusMeters * Math.sin(theta)) / earth) * (180 / Math.PI);
    ring.push([lng + dLng, lat + dLat]);
  }
  return ring;
}

function reportAreas(
  reports: CommunityReportMapPoint[],
  selectedId?: string | null
): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  return {
    type: "FeatureCollection",
    features: reports.map((report) => ({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [circleRing(report.longitude, report.latitude, report.radiusMeters)] },
      properties: { id: report.id, selected: report.id === selectedId ? 1 : 0 },
    })),
  };
}

function reportPoints(
  reports: CommunityReportMapPoint[],
  selectedId?: string | null
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: reports.map((report) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [report.longitude, report.latitude] },
      properties: {
        id: report.id,
        selected: report.id === selectedId ? 1 : 0,
        title: report.title,
        category: getCategoryLabel(report.category) ?? report.category,
        radius: `${report.radiusMeters}м орчим`,
        when: new Date(report.createdAt).toLocaleString("mn-MN"),
      },
    })),
  };
}

function draftArea(
  point: { latitude: number; longitude: number } | null | undefined,
  radius: number
): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  if (!point) return { type: "FeatureCollection", features: [] };
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [circleRing(point.longitude, point.latitude, radius)] },
        properties: {},
      },
    ],
  };
}

function draftPointFc(
  point: { latitude: number; longitude: number } | null | undefined
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  if (!point) return { type: "FeatureCollection", features: [] };
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry: { type: "Point", coordinates: [point.longitude, point.latitude] }, properties: {} }],
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function CommunityReportMap({
  reports,
  draftPoint,
  draftRadius,
  selectedReportId,
  onMapClick,
}: CommunityReportMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: MAP_STYLE,
      center: [106.9173, 47.9188],
      zoom: 10,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    map.on("load", () => {
      map.addSource("report-areas", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("report-points", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("draft-area", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("draft-point", { type: "geojson", data: { type: "FeatureCollection", features: [] } });

      map.addLayer({
        id: "report-areas-fill",
        type: "fill",
        source: "report-areas",
        paint: {
          "fill-color": ["case", ["==", ["get", "selected"], 1], "#fb7185", "#fdba74"],
          "fill-opacity": ["case", ["==", ["get", "selected"], 1], 0.18, 0.1],
        },
      });
      map.addLayer({
        id: "report-areas-line",
        type: "line",
        source: "report-areas",
        paint: {
          "line-color": ["case", ["==", ["get", "selected"], 1], "#f43f5e", "#ea580c"],
          "line-width": ["case", ["==", ["get", "selected"], 1], 2, 1.25],
        },
      });
      map.addLayer({
        id: "report-dots",
        type: "circle",
        source: "report-points",
        paint: {
          "circle-radius": ["case", ["==", ["get", "selected"], 1], 7, 5],
          "circle-color": ["case", ["==", ["get", "selected"], 1], "#f43f5e", "#f97316"],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      map.addLayer({
        id: "draft-area-fill",
        type: "fill",
        source: "draft-area",
        paint: { "fill-color": "#14b8a6", "fill-opacity": 0.12 },
      });
      map.addLayer({
        id: "draft-area-line",
        type: "line",
        source: "draft-area",
        paint: { "line-color": "#2dd4bf", "line-width": 2, "line-dasharray": [2, 1.5] },
      });
      map.addLayer({
        id: "draft-dot",
        type: "circle",
        source: "draft-point",
        paint: {
          "circle-radius": 7,
          "circle-color": "#2dd4bf",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      map.on("click", (event) => {
        const hits = map.queryRenderedFeatures(event.point, { layers: ["report-dots"] });
        if (hits.length > 0) {
          const props = hits[0].properties ?? {};
          const html = `<div style="min-width:200px"><strong>${escapeHtml(String(props.title ?? ""))}</strong><br/>${escapeHtml(String(props.category ?? ""))}<br/>${escapeHtml(String(props.radius ?? ""))}<br/>${escapeHtml(String(props.when ?? ""))}</div>`;
          popupRef.current?.remove();
          popupRef.current = new maplibregl.Popup({ closeButton: true })
            .setLngLat(event.lngLat)
            .setHTML(html)
            .addTo(map);
          return;
        }
        onMapClickRef.current({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
      });

      map.on("mouseenter", "report-dots", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "report-dots", () => {
        map.getCanvas().style.cursor = "";
      });

      setReady(true);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!ready || !map) return;
    (map.getSource("report-areas") as maplibregl.GeoJSONSource | undefined)?.setData(reportAreas(reports, selectedReportId));
    (map.getSource("report-points") as maplibregl.GeoJSONSource | undefined)?.setData(reportPoints(reports, selectedReportId));
  }, [ready, reports, selectedReportId]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!ready || !map) return;
    (map.getSource("draft-area") as maplibregl.GeoJSONSource | undefined)?.setData(draftArea(draftPoint, draftRadius));
    (map.getSource("draft-point") as maplibregl.GeoJSONSource | undefined)?.setData(draftPointFc(draftPoint));
    if (draftPoint) {
      map.flyTo({ center: [draftPoint.longitude, draftPoint.latitude], zoom: Math.max(map.getZoom(), 12), speed: 1, essential: true });
    }
  }, [ready, draftPoint, draftRadius]);

  return <div ref={mapRef} className="h-full w-full" />;
}
