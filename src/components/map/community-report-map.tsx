"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  REPORT_FADE_AFTER_DAYS,
  getCategoryColor,
  getCategoryLabel,
  type PublicCommunityReport,
} from "@/lib/community-categories";
import { FALLBACK_MAP_STYLE } from "@/lib/map-style";
import { publicEnv } from "@/lib/public-env";
import { ageInDays, formatRelativeAge } from "@/lib/relative-time";
import { t } from "@/lib/translations";

interface CommunityReportMapProps {
  reports: PublicCommunityReport[];
  /** Already snapped to the grid — the map only previews what the server will store. */
  draftPoint?: { latitude: number; longitude: number } | null;
  draftRadius: number;
  selectedReportId?: string | null;
  onMapClick: (point: { latitude: number; longitude: number }) => void;
  onSelectReport: (id: string | null) => void;
  onFlagRequest?: (id: string) => void;
  /** Extra space (px) the floating rails cover, so flyTo lands in view. */
  padding?: { left: number; right: number; bottom: number };
}

const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

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

function reportProperties(report: PublicCommunityReport, selectedId?: string | null) {
  return {
    id: report.id,
    color: getCategoryColor(report.category),
    selected: report.id === selectedId ? 1 : 0,
    faded: ageInDays(report.createdAt) > REPORT_FADE_AFTER_DAYS ? 1 : 0,
  };
}

function reportAreas(reports: PublicCommunityReport[], selectedId?: string | null): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: reports.map((report) => ({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [circleRing(report.longitude, report.latitude, report.radiusMeters)] },
      properties: reportProperties(report, selectedId),
    })),
  };
}

function reportPoints(reports: PublicCommunityReport[], selectedId?: string | null): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: reports.map((report) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [report.longitude, report.latitude] },
      properties: reportProperties(report, selectedId),
    })),
  };
}

/** Popup content built with DOM APIs — no HTML strings, nothing to escape. */
function buildPopup(report: PublicCommunityReport, onFlag?: (id: string) => void) {
  const root = document.createElement("div");
  root.className = "community-popup";

  const heading = document.createElement("div");
  heading.className = "community-popup__heading";
  const swatch = document.createElement("span");
  swatch.className = "community-popup__swatch";
  swatch.style.background = getCategoryColor(report.category);
  const title = document.createElement("strong");
  title.textContent = getCategoryLabel(report.category) ?? t.community.categoryOther;
  heading.append(swatch, title);

  const meta = document.createElement("p");
  meta.className = "community-popup__meta";
  meta.textContent = `${formatRelativeAge(report.createdAt)} · ~${report.radiusMeters} м орчим бүс`;

  root.append(heading, meta);

  if (onFlag) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "community-popup__flag";
    button.textContent = t.community.flagAction;
    button.addEventListener("click", () => onFlag(report.id));
    root.append(button);
  }

  return root;
}

export function CommunityReportMap({
  reports,
  draftPoint,
  draftRadius,
  selectedReportId,
  onMapClick,
  onSelectReport,
  onFlagRequest,
  padding = { left: 0, right: 0, bottom: 0 },
}: CommunityReportMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const callbacksRef = useRef({ onMapClick, onSelectReport, onFlagRequest });
  const paddingRef = useRef(padding);
  const reportsRef = useRef(reports);
  const [ready, setReady] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);

  useEffect(() => {
    callbacksRef.current = { onMapClick, onSelectReport, onFlagRequest };
    paddingRef.current = padding;
    reportsRef.current = reports;
  });

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: publicEnv.mapStyleUrl,
      center: [106.9173, 47.9188],
      zoom: 11,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    const attribution = new maplibregl.AttributionControl({ compact: true });
    map.addControl(attribution, "bottom-right");
    // Start collapsed (the "i" button still expands it). The always-visible
    // <MapAttribution> line carries the attribution, and the expanded box
    // would otherwise become the page's late Largest Contentful Paint.
    map.getContainer().querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");

    // Basemap host unreachable: fall back to a plain style so the data layers
    // still render, and tell the user.
    let usingFallback = false;
    let styleLoaded = false;
    map.once("style.load", () => {
      styleLoaded = true;
    });
    map.on("error", (event) => {
      const message = String((event as { error?: Error }).error?.message ?? "");
      if (!styleLoaded && !usingFallback) {
        usingFallback = true;
        setTilesFailed(true);
        map.setStyle(FALLBACK_MAP_STYLE);
      } else if (/tile|Failed to fetch|NetworkError/i.test(message)) {
        setTilesFailed(true);
      }
    });

    map.on("load", () => {
      map.addSource("report-areas", { type: "geojson", data: EMPTY });
      map.addSource("report-points", { type: "geojson", data: EMPTY });
      map.addSource("draft-area", { type: "geojson", data: EMPTY });
      map.addSource("draft-point", { type: "geojson", data: EMPTY });

      map.addLayer({
        id: "report-areas-fill",
        type: "fill",
        source: "report-areas",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": [
            "case",
            ["==", ["get", "selected"], 1],
            0.24,
            ["==", ["get", "faded"], 1],
            0.05,
            0.12,
          ],
        },
      });
      map.addLayer({
        id: "report-areas-line",
        type: "line",
        source: "report-areas",
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["case", ["==", ["get", "selected"], 1], 2.5, 1.25],
          "line-opacity": ["case", ["==", ["get", "faded"], 1], 0.4, 0.85],
        },
      });
      map.addLayer({
        id: "report-dots",
        type: "circle",
        source: "report-points",
        paint: {
          "circle-radius": ["case", ["==", ["get", "selected"], 1], 8, 6],
          "circle-color": ["get", "color"],
          "circle-opacity": ["case", ["==", ["get", "faded"], 1], 0.45, 1],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": ["case", ["==", ["get", "selected"], 1], 3, 1.5],
          "circle-stroke-opacity": ["case", ["==", ["get", "faded"], 1], 0.5, 1],
        },
      });

      map.addLayer({
        id: "draft-area-fill",
        type: "fill",
        source: "draft-area",
        paint: { "fill-color": "#14b8a6", "fill-opacity": 0.14 },
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
        // Generous hit area for touch: anything within 12 px of a dot.
        const box: [maplibregl.PointLike, maplibregl.PointLike] = [
          [event.point.x - 12, event.point.y - 12],
          [event.point.x + 12, event.point.y + 12],
        ];
        const hits = map.queryRenderedFeatures(box, { layers: ["report-dots"] });
        if (hits.length > 0) {
          callbacksRef.current.onSelectReport(String(hits[0].properties?.id ?? ""));
          return;
        }
        callbacksRef.current.onMapClick({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
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
      popupRef.current?.remove();
      map.remove();
      mapInstanceRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!ready || !map) return;
    (map.getSource("report-areas") as maplibregl.GeoJSONSource | undefined)?.setData(
      reportAreas(reports, selectedReportId)
    );
    (map.getSource("report-points") as maplibregl.GeoJSONSource | undefined)?.setData(
      reportPoints(reports, selectedReportId)
    );
  }, [ready, reports, selectedReportId]);

  // Popup follows the selection (from a map tap or from the feed). Keyed on
  // the selection only, so the 60 s background refresh doesn't move the map.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!ready || !map) return;
    popupRef.current?.remove();
    popupRef.current = null;

    const report = reportsRef.current.find((item) => item.id === selectedReportId);
    if (!report) return;

    const popup = new maplibregl.Popup({ closeButton: true, maxWidth: "260px", offset: 12 })
      .setLngLat([report.longitude, report.latitude])
      .setDOMContent(buildPopup(report, callbacksRef.current.onFlagRequest))
      .addTo(map);
    popup.on("close", () => {
      if (popupRef.current === popup) {
        popupRef.current = null;
        callbacksRef.current.onSelectReport(null);
      }
    });
    popupRef.current = popup;

    const pad = paddingRef.current;
    map.easeTo({
      center: [report.longitude, report.latitude],
      zoom: Math.max(map.getZoom(), 13),
      padding: { top: 80, bottom: 60 + pad.bottom, left: pad.left, right: pad.right },
      duration: 700,
    });
  }, [ready, selectedReportId]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!ready || !map) return;
    const area: GeoJSON.FeatureCollection = draftPoint
      ? {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Polygon", coordinates: [circleRing(draftPoint.longitude, draftPoint.latitude, draftRadius)] },
              properties: {},
            },
          ],
        }
      : EMPTY;
    const point: GeoJSON.FeatureCollection = draftPoint
      ? {
          type: "FeatureCollection",
          features: [
            { type: "Feature", geometry: { type: "Point", coordinates: [draftPoint.longitude, draftPoint.latitude] }, properties: {} },
          ],
        }
      : EMPTY;
    (map.getSource("draft-area") as maplibregl.GeoJSONSource | undefined)?.setData(area);
    (map.getSource("draft-point") as maplibregl.GeoJSONSource | undefined)?.setData(point);
  }, [ready, draftPoint, draftRadius]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapRef}
        className="h-full w-full"
        role="region"
        aria-label={t.community.mapAriaLabel}
      />
      {tilesFailed ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 z-10 mx-auto w-fit max-w-[90%] rounded-xl border border-white/10 bg-slate-950/90 px-4 py-3 text-center text-xs text-slate-300">
          {t.mapTilesUnavailable}
        </div>
      ) : null}
    </div>
  );
}
