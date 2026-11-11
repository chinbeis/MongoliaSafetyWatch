"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { FALLBACK_MAP_STYLE } from "@/lib/map-style";
import { publicEnv } from "@/lib/public-env";
import { t } from "@/lib/translations";

export interface ChoroplethRegion {
  code: string;
  name: string;
  lat: number;
  lng: number;
  /** Index into `colors`, or null when the region has no rate. */
  rateClass: number | null;
  /** Text for the hover tooltip, already formatted. */
  hoverText: string;
  /** Raw count for bubble mode (null = unavailable/suppressed). */
  count: number | null;
}

export interface ChoroplethDistrict {
  code: string;
  name: string;
  lat: number;
  lng: number;
  count: number | null;
  hoverText: string;
}

interface RegionChoroplethProps {
  regions: ChoroplethRegion[];
  mode: "rate" | "count";
  colors: readonly string[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
  /** When set, Ulaanbaatar's districts are drawn and the map zooms to the city. */
  districts?: ChoroplethDistrict[] | null;
  selectedDistrict?: string | null;
  onSelectDistrict?: (code: string) => void;
  userPoint?: { lat: number; lng: number } | null;
  padding?: { left: number; right: number; top: number; bottom: number };
}

const MONGOLIA_BOUNDS: maplibregl.LngLatBoundsLike = [
  [87.7, 41.55],
  [119.95, 52.15],
];
const UB_BOUNDS: maplibregl.LngLatBoundsLike = [
  [106.55, 47.75],
  [108.45, 48.15],
];
const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
const NO_DATA_COLOR = "#334155";

function points<T extends { code: string; lat: number; lng: number; count: number | null }>(
  items: T[],
  maxCount: number
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: items
      .filter((item) => item.count != null && item.count > 0)
      .map((item) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [item.lng, item.lat] },
        // Area-proportional: radius ∝ √count.
        properties: { code: item.code, size: Math.sqrt((item.count ?? 0) / Math.max(1, maxCount)) },
      })),
  };
}

export function RegionChoropleth({
  regions,
  mode,
  colors,
  selectedCode,
  onSelect,
  districts,
  selectedDistrict,
  onSelectDistrict,
  userPoint,
  padding = { left: 0, right: 0, top: 0, bottom: 0 },
}: RegionChoroplethProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);
  const latest = useRef({ regions, districts, onSelect, onSelectDistrict, padding });
  const [ready, setReady] = useState(false);
  const [geoFailed, setGeoFailed] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);

  useEffect(() => {
    latest.current = { regions, districts, onSelect, onSelectDistrict, padding };
  });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: publicEnv.mapStyleUrl,
      bounds: MONGOLIA_BOUNDS,
      fitBoundsOptions: { padding: 24 },
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    });
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
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

    const hover = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10, className: "region-hover" });
    hoverPopupRef.current = hover;

    map.on("load", async () => {
      let aimags: GeoJSON.FeatureCollection;
      try {
        const response = await fetch("/geo/mn-aimags.geojson");
        if (!response.ok) throw new Error(String(response.status));
        aimags = (await response.json()) as GeoJSON.FeatureCollection;
      } catch {
        setGeoFailed(true);
        return;
      }
      if (!mapRef.current) return;

      map.addSource("aimags", { type: "geojson", data: aimags, promoteId: "code" });
      map.addSource("bubbles", { type: "geojson", data: EMPTY });
      map.addSource("districts", { type: "geojson", data: EMPTY, promoteId: "code" });
      map.addSource("district-bubbles", { type: "geojson", data: EMPTY });
      map.addSource("user", { type: "geojson", data: EMPTY });

      map.addLayer({
        id: "aimag-fill",
        type: "fill",
        source: "aimags",
        paint: {
          "fill-color": ["coalesce", ["feature-state", "color"], NO_DATA_COLOR],
          "fill-opacity": ["coalesce", ["feature-state", "opacity"], 0.85],
        },
      });
      map.addLayer({
        id: "aimag-line",
        type: "line",
        source: "aimags",
        paint: { "line-color": "#0b1220", "line-width": 1 },
      });
      map.addLayer({
        id: "aimag-selected",
        type: "line",
        source: "aimags",
        paint: {
          "line-color": "#f8fafc",
          "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 2.5, 0],
        },
      });
      map.addLayer({
        id: "bubbles",
        type: "circle",
        source: "bubbles",
        paint: {
          "circle-radius": ["+", 3, ["*", ["get", "size"], 34]],
          "circle-color": "#5eead4",
          "circle-opacity": 0.55,
          "circle-stroke-color": "#0b1220",
          "circle-stroke-width": 2,
        },
      });
      map.addLayer({
        id: "district-fill",
        type: "fill",
        source: "districts",
        paint: {
          "fill-color": "#0f766e",
          "fill-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 0.55, 0.25],
        },
      });
      map.addLayer({
        id: "district-line",
        type: "line",
        source: "districts",
        paint: {
          "line-color": "#ccfbf1",
          "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 2.5, 1],
        },
      });
      map.addLayer({
        id: "district-bubbles",
        type: "circle",
        source: "district-bubbles",
        paint: {
          "circle-radius": ["+", 3, ["*", ["get", "size"], 26]],
          "circle-color": "#5eead4",
          "circle-opacity": 0.6,
          "circle-stroke-color": "#0b1220",
          "circle-stroke-width": 2,
        },
      });
      map.addLayer({
        id: "user-dot",
        type: "circle",
        source: "user",
        paint: { "circle-radius": 6, "circle-color": "#38bdf8", "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 },
      });

      map.on("click", "district-fill", (event) => {
        const code = event.features?.[0]?.properties?.code;
        if (code) latest.current.onSelectDistrict?.(String(code));
      });
      map.on("click", "aimag-fill", (event) => {
        if (map.queryRenderedFeatures(event.point, { layers: ["district-fill"] }).length > 0) return;
        const code = event.features?.[0]?.properties?.code;
        if (code) latest.current.onSelect(String(code));
      });

      const showHover = (layer: "aimag-fill" | "district-fill") => (event: maplibregl.MapLayerMouseEvent) => {
        const code = String(event.features?.[0]?.properties?.code ?? "");
        const item =
          layer === "aimag-fill"
            ? latest.current.regions.find((region) => region.code === code)
            : latest.current.districts?.find((district) => district.code === code);
        if (!item) return;
        map.getCanvas().style.cursor = "pointer";
        const content = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = item.name;
        const value = document.createElement("div");
        value.textContent = item.hoverText;
        content.append(title, value);
        hover.setLngLat(event.lngLat).setDOMContent(content).addTo(map);
      };
      const hideHover = () => {
        map.getCanvas().style.cursor = "";
        hover.remove();
      };
      map.on("mousemove", "aimag-fill", showHover("aimag-fill"));
      map.on("mousemove", "district-fill", showHover("district-fill"));
      map.on("mouseleave", "aimag-fill", hideHover);
      map.on("mouseleave", "district-fill", hideHover);

      setReady(true);
    });

    return () => {
      hover.remove();
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  // Region colours and bubbles.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    for (const region of regions) {
      const color = mode === "rate" && region.rateClass != null ? colors[region.rateClass] : NO_DATA_COLOR;
      map.setFeatureState(
        { source: "aimags", id: region.code },
        { color, opacity: mode === "rate" ? 0.85 : 0.35, selected: region.code === selectedCode }
      );
    }
    const maxCount = Math.max(1, ...regions.map((region) => region.count ?? 0));
    (map.getSource("bubbles") as maplibregl.GeoJSONSource).setData(mode === "count" ? points(regions, maxCount) : EMPTY);
  }, [ready, regions, mode, colors, selectedCode]);

  // Ulaanbaatar district drill-down.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    let cancelled = false;
    const source = map.getSource("districts") as maplibregl.GeoJSONSource;
    const bubbleSource = map.getSource("district-bubbles") as maplibregl.GeoJSONSource;

    if (!districts) {
      source.setData(EMPTY);
      bubbleSource.setData(EMPTY);
      return;
    }

    void fetch("/geo/ub-districts.geojson")
      .then((response) => (response.ok ? (response.json() as Promise<GeoJSON.FeatureCollection>) : null))
      .then((geo) => {
        if (cancelled || !geo) return;
        source.setData(geo);
        const maxCount = Math.max(1, ...districts.map((district) => district.count ?? 0));
        bubbleSource.setData(points(districts, maxCount));
        const pad = latest.current.padding;
        map.fitBounds(UB_BOUNDS, {
          padding: { top: 40 + pad.top, bottom: 40 + pad.bottom, left: 30 + pad.left, right: 30 + pad.right },
          duration: 800,
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [ready, districts]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !districts) return;
    for (const district of districts) {
      map.setFeatureState({ source: "districts", id: district.code }, { selected: district.code === selectedDistrict });
    }
  }, [ready, districts, selectedDistrict]);

  // Leaving the drill-down returns to the whole country.
  const drilledDown = Boolean(districts);
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || drilledDown) return;
    const pad = latest.current.padding;
    map.fitBounds(MONGOLIA_BOUNDS, {
      padding: { top: 24 + pad.top, bottom: 24 + pad.bottom, left: 24 + pad.left, right: 24 + pad.right },
      duration: 600,
    });
  }, [ready, drilledDown]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    (map.getSource("user") as maplibregl.GeoJSONSource).setData(
      userPoint
        ? {
            type: "FeatureCollection",
            features: [{ type: "Feature", geometry: { type: "Point", coordinates: [userPoint.lng, userPoint.lat] }, properties: {} }],
          }
        : EMPTY
    );
  }, [ready, userPoint]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" role="region" aria-label={t.mapPage.mapAriaLabel} />
      {geoFailed || tilesFailed ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 z-10 mx-auto w-fit max-w-[90%] rounded-xl border border-white/10 bg-slate-950/90 px-4 py-3 text-center text-xs text-slate-300">
          {geoFailed ? t.mapPage.boundariesUnavailable : t.mapTilesUnavailable}
        </div>
      ) : null}
    </div>
  );
}
