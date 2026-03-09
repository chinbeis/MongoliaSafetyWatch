"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

export function CommunityReportMap({
  reports,
  draftPoint,
  draftRadius,
  selectedReportId,
  onMapClick,
}: CommunityReportMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const reportLayerRef = useRef<L.LayerGroup | null>(null);
  const draftLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [47.9188, 106.9173],
      zoom: 11,
      zoomControl: true,
      scrollWheelZoom: true,
      preferCanvas: true,
      renderer: L.canvas(),
    });

    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (event) => {
      onMapClick({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [onMapClick]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    if (reportLayerRef.current) {
      map.removeLayer(reportLayerRef.current);
    }

    const layer = L.layerGroup();

    reports.forEach((report) => {
      const isSelected = report.id === selectedReportId;

      L.circle([report.latitude, report.longitude], {
        radius: report.radiusMeters,
        color: isSelected ? "#dc2626" : "#ea580c",
        weight: isSelected ? 2 : 1.25,
        fillColor: isSelected ? "#fb7185" : "#fdba74",
        fillOpacity: isSelected ? 0.18 : 0.1,
      }).addTo(layer);

      L.circleMarker([report.latitude, report.longitude], {
        radius: isSelected ? 7 : 5,
        color: "#ffffff",
        weight: 2,
        fillColor: isSelected ? "#dc2626" : "#f97316",
        fillOpacity: 1,
      })
        .bindPopup(
          `<div style="min-width:220px"><strong>${escapeHtml(report.title)}</strong><br/>${escapeHtml(report.areaLabel || "Unnamed area")}<br/>${escapeHtml(report.category)}<br/>${new Date(report.createdAt).toLocaleString("mn-MN")}</div>`
        )
        .addTo(layer);
    });

    layer.addTo(map);
    reportLayerRef.current = layer;
  }, [reports, selectedReportId]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    if (draftLayerRef.current) {
      map.removeLayer(draftLayerRef.current);
    }

    if (!draftPoint) {
      return;
    }

    const layer = L.layerGroup();

    L.circle([draftPoint.latitude, draftPoint.longitude], {
      radius: draftRadius,
      color: "#0f766e",
      weight: 2,
      fillColor: "#14b8a6",
      fillOpacity: 0.12,
      dashArray: "8 6",
    }).addTo(layer);

    L.circleMarker([draftPoint.latitude, draftPoint.longitude], {
      radius: 8,
      color: "#ffffff",
      weight: 2,
      fillColor: "#0f766e",
      fillOpacity: 1,
    }).addTo(layer);

    layer.addTo(map);
    draftLayerRef.current = layer;
    map.flyTo([draftPoint.latitude, draftPoint.longitude], Math.max(map.getZoom(), 13), {
      duration: 0.6,
    });
  }, [draftPoint, draftRadius]);

  return <div ref={mapRef} className="h-full w-full" />;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
